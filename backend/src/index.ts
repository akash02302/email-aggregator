import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ImapService } from './services/imap.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { AIService } from './services/ai.service';
import { NotificationService } from './services/notification.service';
import { EmailAccount } from './types/email';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Initialize services
const elasticsearchService = new ElasticsearchService(process.env.ELASTICSEARCH_URL);
const aiService = new AIService(process.env.GOOGLE_AI_API_KEY!);
const notificationService = new NotificationService(
  process.env.SLACK_WEBHOOK_URL || '',
  process.env.EXTERNAL_WEBHOOK_URL || ''
);

// Configure email accounts
const emailAccounts: EmailAccount[] = [
  {
    id: 'account1',
    email: process.env.EMAIL1!,
    host: process.env.IMAP_HOST1!,
    port: parseInt(process.env.IMAP_PORT1!, 10),
    user: process.env.IMAP_USER1!,
    password: process.env.IMAP_PASSWORD1!,
    tls: true
  },
  {
    id: 'account2',
    email: process.env.EMAIL2!,
    host: process.env.IMAP_HOST2!,
    port: parseInt(process.env.IMAP_PORT2!, 10),
    user: process.env.IMAP_USER2!,
    password: process.env.IMAP_PASSWORD2!,
    tls: true
  }
];

// Initialize IMAP connections
const imapServices = emailAccounts.map(account => new ImapService(account));

// Initialize Elasticsearch
elasticsearchService.initialize().catch(console.error);

// Define folders to fetch
const folders = [
  'INBOX',
  '[Gmail]/Sent Mail',
  '[Gmail]/Drafts',
  '[Gmail]/Spam'
];

// Function to handle email categorization and notifications
async function handleEmailCategorization(email: any) {
  try {
    const category = await aiService.categorizeEmail(email);
    email.category = category;
    console.log('Email categorized:', { from: email.from, category });

    // Send notifications if the email is categorized as Interested
    if (category === 'Interested') {
      await notificationService.notifyInterestedEmail(email);
    }
  } catch (aiError) {
    console.log('AI categorization failed, using fallback:', { from: email.from });
    // Fallback categorization based on folder and subject
    if (email.folder === 'SPAM') {
      email.category = 'Spam';
    } else if (email.folder === 'SENT') {
      email.category = 'Out of Office'; // Using existing category as fallback
    } else {
      // Simple rule-based categorization
      const subject = email.subject.toLowerCase();
      if (subject.includes('job') || subject.includes('career') || subject.includes('opportunity')) {
        email.category = 'Interested';
      } else if (subject.includes('meeting') || subject.includes('interview')) {
        email.category = 'Meeting Booked';
      } else if (subject.includes('newsletter') || subject.includes('subscription')) {
        email.category = 'Not Interested';
      } else {
        email.category = 'Spam';
      }
    }
  }
}

// Update the email processing logic in both places
const processEmailBatch = async (batch: any[]) => {
  await Promise.all(batch.map(async (email) => {
    try {
      await handleEmailCategorization(email);
      await elasticsearchService.indexEmail(email);
      console.log('Email indexed:', { from: email.from, category: email.category });
    } catch (error) {
      console.error('Error processing email:', { from: email.from, error });
    }
  }));
};

// Connect IMAP services and fetch emails from all folders
imapServices.forEach(service => {
  service.connect()
    .then(async () => {
      console.log(`Connected to IMAP for ${service.getAccountEmail()}`);
      
      // Fetch emails from each folder
      for (const folder of folders) {
        try {
          console.log(`Fetching emails from ${folder} for ${service.getAccountEmail()}`);
          const emails = await service.fetchNewEmails({ days: 90, folder });
          
          // Map Gmail folders to our simplified folder names
          const mappedEmails = emails.map(email => ({
            ...email,
            folder: folder === '[Gmail]/Sent Mail' ? 'SENT' :
                    folder === '[Gmail]/Drafts' ? 'DRAFT' :
                    folder === '[Gmail]/Spam' ? 'SPAM' :
                    'INBOX'
          }));

          // Process emails in batches
          const batchSize = 10;
          for (let i = 0; i < mappedEmails.length; i += batchSize) {
            const batch = mappedEmails.slice(i, i + batchSize);
            
            // Process each email in the batch
            await processEmailBatch(batch);
          }
          
          console.log(`Processed ${mappedEmails.length} emails from ${folder} for ${service.getAccountEmail()}`);
        } catch (error) {
          console.error(`Error fetching emails from ${folder} for ${service.getAccountEmail()}:`, error);
        }
      }
    })
    .catch(error => {
      console.error(`Failed to connect to IMAP for ${service.getAccountEmail()}:`, error);
    });
});

// API Routes
app.get('/api/emails', async (_req: Request, res: Response) => {
  try {
    const { query, accountId, folder, category } = _req.query;
    const emails = await elasticsearchService.searchEmails({
      query: query as string,
      accountId: accountId as string,
      folder: folder as string,
      category: category as string
    });
    return res.json(emails);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search emails' });
  }
});

app.post('/api/emails/:emailId/category', async (_req: Request, res: Response) => {
  try {
    const { emailId } = _req.params;
    const { accountId, category } = _req.body;
    await elasticsearchService.updateEmailCategory(emailId, accountId, category);

    // If category is updated to Interested, trigger notifications
    if (category === 'Interested') {
      const emails = await elasticsearchService.searchEmails({ accountId, id: emailId });
      if (emails.length > 0) {
        await notificationService.notifyInterestedEmail(emails[0]);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ error: 'Failed to update email category' });
  }
});

app.post('/api/emails/:emailId/suggest-reply', async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { accountId, context } = req.body;
    const emails = await elasticsearchService.searchEmails({ accountId, id: emailId });
    if (emails.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    const suggestedReply = await aiService.generateReply(emails[0], context);
    res.json({ reply: suggestedReply });
  } catch (error) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ error: 'Failed to generate reply suggestion' });
  }
});

// Add new endpoint to manually trigger email fetch
app.post('/api/fetch-emails', async (req: Request, res: Response) => {
  try {
    let totalEmails = 0;
    for (const service of imapServices) {
      for (const folder of folders) {
        try {
          console.log(`Fetching emails from ${folder} for ${service.getAccountEmail()}`);
          const emails = await service.fetchNewEmails({ days: 90, folder });
          
          // Map Gmail folders to our simplified folder names
          const mappedEmails = emails.map(email => ({
            ...email,
            folder: folder === '[Gmail]/Sent Mail' ? 'SENT' :
                    folder === '[Gmail]/Drafts' ? 'DRAFT' :
                    folder === '[Gmail]/Spam' ? 'SPAM' :
                    'INBOX'
          }));
          
          // Process emails in batches
          const batchSize = 10;
          for (let i = 0; i < mappedEmails.length; i += batchSize) {
            const batch = mappedEmails.slice(i, i + batchSize);
            
            // Process each email in the batch
            await processEmailBatch(batch);
          }
          
          totalEmails += mappedEmails.length;
        } catch (error) {
          console.error(`Error fetching emails from ${folder} for ${service.getAccountEmail()}:`, error);
        }
      }
    }
    res.json({ success: true, emailsIndexed: totalEmails });
  } catch (error) {
    console.error('Fetch emails error:', error);
    res.status(500).json({ error: 'Failed to fetch and index emails' });
  }
});

// Add test endpoint for webhook integrations
app.post('/api/test-webhooks', async (req: Request, res: Response) => {
  try {
    const testEmail = {
      id: 'test-123',
      accountId: 'test-account',
      subject: 'Test Email',
      from: 'test@example.com',
      to: ['recipient@example.com'],
      date: new Date(),
      folder: 'INBOX'
    };
    await notificationService.notifyInterestedEmail(testEmail);
    return res.json({ success: true });
  } catch (error) {
    console.error('Test webhook error:', error);
    return res.status(500).json({ error: 'Failed to test webhooks' });
  }
});

// Add health check endpoint
app.get('/health', (_, res: Response) => {
  return res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 