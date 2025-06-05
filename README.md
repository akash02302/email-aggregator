# Email Management System

A modern email management system that fetches, categorizes, and indexes emails using AI and Elasticsearch.

## Features

- Multi-account email fetching via IMAP
- AI-powered email categorization with intelligent fallback system:
  - Primary: Uses Google's Gemini Pro AI model for accurate categorization
  - Fallback: Advanced rule-based categorization when AI is unavailable or fails:
    - Analyzes subject, body, and sender patterns
    - Considers email folder context and content length
    - Uses extensive keyword matching for each category:
      - Interested: Job opportunities, follow-ups, information requests
      - Meeting Booked: Calendar invites, meeting links, scheduling
      - Not Interested: Unsubscribe requests, opt-outs, rejections
      - Spam: Promotional content, suspicious patterns, mass mailings
      - Out of Office: Vacation notices, automatic replies
- Full-text search capabilities
- Email categorization and filtering
- AI-generated email reply suggestions
- Real-time email indexing
- Support for multiple email folders (Inbox, Sent, Draft, Spam)
- Automated notifications:
  - Slack notifications for "Interested" emails
  - Webhook integration for external automation
  - Real-time triggers on both AI categorization and manual updates

## Prerequisites

- Node.js (v14 or higher)
- Elasticsearch (v7 or higher)
- Gmail accounts with IMAP access enabled
- Google AI API key for email categorization
- Slack Webhook URL (for notifications)
- External Webhook URL (for automation)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd email-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=4000
ELASTICSEARCH_URL=http://localhost:9200
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Webhook Configuration
SLACK_WEBHOOK_URL=your_slack_webhook_url
EXTERNAL_WEBHOOK_URL=your_webhook_site_url

# Email Account 1
EMAIL1=your_email@gmail.com
IMAP_HOST1=imap.gmail.com
IMAP_PORT1=993
IMAP_USER1=your_email@gmail.com
IMAP_PASSWORD1=your_app_specific_password

# Email Account 2
EMAIL2=another_email@gmail.com
IMAP_HOST2=imap.gmail.com
IMAP_PORT2=993
IMAP_USER2=another_email@gmail.com
IMAP_PASSWORD2=your_app_specific_password
```

4. Configure Webhooks:
   - Create a Slack app and get the webhook URL from Slack's Incoming Webhooks feature
   - Get a webhook URL from webhook.site for testing external integrations
   - Add both URLs to your `.env` file

5. Start Elasticsearch:
Make sure Elasticsearch is running on http://localhost:9200

6. Start the application:
```bash
npm run dev
```

## API Endpoints

- `GET /api/emails` - Search and filter emails
- `POST /api/emails/:emailId/category` - Update email category
- `POST /api/emails/:emailId/suggest-reply` - Get AI-suggested reply
- `POST /api/fetch-emails` - Manually trigger email fetching

## Webhook Integration

The system sends notifications in the following scenarios:

1. **Slack Notifications**:
   - Triggered when an email is categorized as "Interested"
   - Includes email sender, subject, and preview
   - Uses Slack's Block Kit for rich formatting
   - Real-time delivery for immediate attention

2. **External Webhook**:
   - Triggered simultaneously with Slack notifications
   - Sends detailed JSON payload including:
     - Email metadata (ID, sender, subject)
     - Category information
     - Timestamp
     - Preview of content
   - Useful for external automation workflows

## Architecture

The system consists of several key components:

- **IMAP Service**: Handles email fetching from multiple accounts
- **Elasticsearch Service**: Manages email indexing and search functionality
- **AI Service**: Provides email categorization and reply suggestions
- **Express Server**: Handles HTTP requests and API endpoints

## Security Considerations

- Use app-specific passwords for Gmail accounts
- Keep the .env file secure and never commit it to version control
- Ensure Elasticsearch is properly secured in production
- Implement proper authentication for API endpoints in production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 