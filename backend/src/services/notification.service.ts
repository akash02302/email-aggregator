import axios from 'axios';
import { Email } from '../types/email';

export class NotificationService {
  private slackWebhookUrl: string;
  private externalWebhookUrl: string;

  constructor(slackWebhookUrl: string, externalWebhookUrl: string) {
    this.slackWebhookUrl = slackWebhookUrl;
    this.externalWebhookUrl = externalWebhookUrl;
  }

  async sendSlackNotification(email: Email): Promise<void> {
    try {
      if (!this.slackWebhookUrl) {
        console.warn('Slack webhook URL not configured');
        return;
      }

      const message = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email Received!',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from}`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${email.textBody?.substring(0, 150)}...`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📅 Received: ${new Date(email.date).toLocaleString()}`
              }
            ]
          }
        ]
      };

      await axios.post(this.slackWebhookUrl, message);
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }

  async triggerWebhook(email: Email): Promise<void> {
    try {
      if (!this.externalWebhookUrl) {
        console.warn('External webhook URL not configured');
        return;
      }

      const payload = {
        event: 'new_interested_email',
        email: {
          id: email.id,
          accountId: email.accountId,
          from: email.from,
          subject: email.subject,
          date: email.date,
          category: email.category,
          preview: email.textBody?.substring(0, 200)
        },
        timestamp: new Date().toISOString()
      };

      await axios.post(this.externalWebhookUrl, payload);
      console.log('External webhook triggered successfully');
    } catch (error) {
      console.error('Error triggering external webhook:', error);
    }
  }

  async notifyInterestedEmail(email: Email): Promise<void> {
    await Promise.all([
      this.sendSlackNotification(email),
      this.triggerWebhook(email)
    ]);
  }
} 