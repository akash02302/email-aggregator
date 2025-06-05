import { Client } from '@elastic/elasticsearch';
import { Email } from '../types/email';

interface SearchFilters {
  accountId?: string;
  folder?: string;
  category?: string;
  from?: string;
  to?: string;
  startDate?: Date;
  endDate?: Date;
  id?: string;
  query?: string;
}

export class ElasticsearchService {
  private client: Client;
  private readonly indexName = 'emails';

  constructor(node: string = 'http://localhost:9200') {
    this.client = new Client({ node });
  }

  async initialize(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        console.log('Creating emails index...');
        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              accountId: { type: 'keyword' },
              folder: { type: 'keyword' },
              subject: { type: 'text' },
              from: { type: 'keyword' },
              to: { type: 'keyword' },
              date: { type: 'date' },
              textBody: { type: 'text' },
              htmlBody: { type: 'text' },
              category: { type: 'keyword' },
              aiSummary: { type: 'text' },
              suggestedReply: { type: 'text' },
              flags: { type: 'keyword' }
            }
          }
        });
        console.log('Emails index created successfully');
      }
    } catch (error) {
      console.error('Error initializing Elasticsearch:', error);
      throw error;
    }
  }

  async indexEmail(email: Email): Promise<void> {
    try {
      const document = {
        ...email,
        attachments: undefined, // Don't store attachments in Elasticsearch
        category: email.category || 'Uncategorized' // Set default category if AI categorization failed
      };

      await this.client.index({
        index: this.indexName,
        id: `${email.accountId}-${email.id}`,
        document
      });
      console.log(`Successfully indexed email ${email.id} from account ${email.accountId}`);
    } catch (error) {
      console.error(`Error indexing email ${email.id} from account ${email.accountId}:`, error);
      throw error;
    }
  }

  async searchEmails(filters: SearchFilters = {}): Promise<Email[]> {
    const must: any[] = [];
    const filter: any[] = [];

    // Add query if provided
    if (filters.query) {
      must.push({
        multi_match: {
          query: filters.query,
          fields: ['subject', 'textBody', 'from', 'to']
        }
      });
    }

    // Add folder filter if provided
    if (filters.folder) {
      filter.push({
        term: {
          folder: filters.folder
        }
      });
    }

    // Add category filter if provided
    if (filters.category) {
      filter.push({
        term: {
          category: filters.category
        }
      });
    }

    // Add account filter if provided
    if (filters.accountId) {
      filter.push({
        term: {
          accountId: filters.accountId
        }
      });
    }

    // Add date range if provided
    if (filters.startDate || filters.endDate) {
      const range: any = {
        date: {}
      };
      if (filters.startDate) range.date.gte = filters.startDate;
      if (filters.endDate) range.date.lte = filters.endDate;
      filter.push({ range });
    }

    const query = {
      bool: {
        must,
        filter
      }
    };

    console.log('Elasticsearch query:', JSON.stringify(query, null, 2));

    const { hits } = await this.client.search({
      index: this.indexName,
      body: {
        query,
        sort: [{ date: 'desc' }],
        size: 500
      }
    });

    const totalHits = typeof hits.total === 'number' ? hits.total : hits.total?.value ?? 0;
    console.log(`Found ${totalHits} emails matching filters:`, filters);

    return hits.hits.map((hit: any) => hit._source as Email);
  }

  async updateEmailCategory(emailId: string, accountId: string, category: string): Promise<void> {
    await this.client.update({
      index: this.indexName,
      id: `${accountId}-${emailId}`,
      doc: {
        category
      }
    });
  }

  async updateEmailAISummary(emailId: string, accountId: string, aiSummary: string, suggestedReply?: string): Promise<void> {
    await this.client.update({
      index: this.indexName,
      id: `${accountId}-${emailId}`,
      doc: {
        aiSummary,
        suggestedReply
      }
    });
  }
} 