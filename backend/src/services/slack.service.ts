import { IncomingWebhook } from '@slack/webhook';
import { Email } from '../types/email';

export class SlackService {
  private webhook: IncomingWebhook;

  constructor(webhookUrl: string) {
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  async notifyNewInterestedEmail(email: Email): Promise<void> {
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 New Interested Lead!',
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
            text: `*Summary:*\n${email.aiSummary || 'No summary available'}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Received at: ${email.date.toLocaleString()}`
            }
          ]
        }
      ]
    };

    await this.webhook.send(message);
  }
} 