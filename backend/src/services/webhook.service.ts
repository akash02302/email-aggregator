import axios from 'axios';
import { Email } from '../types/email';

export class WebhookService {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async notifyNewInterestedEmail(email: Email): Promise<void> {
    const payload = {
      event: 'new_interested_lead',
      data: {
        id: email.id,
        accountId: email.accountId,
        from: email.from,
        subject: email.subject,
        date: email.date,
        category: email.category,
        summary: email.aiSummary
      }
    };

    try {
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
      throw error;
    }
  }
} 