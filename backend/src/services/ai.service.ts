import { GoogleGenerativeAI } from '@google/generative-ai';
import { Email, EmailCategory } from '../types/email';

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      console.warn('No API key provided for AI service. Using fallback categorization.');
    }
  }

  private defaultCategorization(email: Email): EmailCategory {
    const subject = email.subject.toLowerCase();
    const body = (email.textBody || email.htmlBody || '').toLowerCase();
    const from = email.from.toLowerCase();

    // Check for Out of Office first
    if (
      subject.includes('out of office') ||
      subject.includes('ooo') ||
      subject.includes('automatic reply') ||
      subject.includes('vacation') ||
      body.includes('i am out of office') ||
      body.includes('i will be out of the office') ||
      body.includes('automatic reply') ||
      body.includes('vacation response')
    ) {
      return 'Out of Office';
    }

    // Check for Meeting Booked
    if (
      subject.includes('meeting') ||
      subject.includes('interview') ||
      subject.includes('appointment') ||
      subject.includes('scheduled') ||
      subject.includes('calendar invite') ||
      body.includes('meeting link') ||
      body.includes('zoom link') ||
      body.includes('google meet') ||
      body.includes('teams meeting') ||
      body.includes('confirmed for')
    ) {
      return 'Meeting Booked';
    }

    // Check for Interested
    if (
      subject.includes('interested') ||
      subject.includes('following up') ||
      subject.includes('next steps') ||
      subject.includes('opportunity') ||
      subject.includes('job') ||
      subject.includes('career') ||
      subject.includes('position') ||
      body.includes('would like to learn more') ||
      body.includes('please provide more information') ||
      body.includes('interested in') ||
      body.includes('looking forward to')
    ) {
      return 'Interested';
    }

    // Check for Not Interested
    if (
      subject.includes('not interested') ||
      subject.includes('unsubscribe') ||
      subject.includes('remove me') ||
      subject.includes('no thanks') ||
      subject.includes('newsletter') ||
      subject.includes('subscription') ||
      body.includes('not interested') ||
      body.includes('please remove') ||
      body.includes('unsubscribe') ||
      body.includes('do not contact') ||
      body.includes('opt out')
    ) {
      return 'Not Interested';
    }

    // Check for Spam
    if (
      email.folder === 'SPAM' ||
      subject.includes('win') ||
      subject.includes('congratulation') ||
      subject.includes('lottery') ||
      subject.includes('prize') ||
      subject.includes('urgent') ||
      subject.includes('bitcoin') ||
      subject.includes('crypto') ||
      from.includes('noreply') ||
      from.includes('marketing') ||
      body.includes('click here') ||
      body.includes('limited time') ||
      body.includes('act now') ||
      body.includes('special offer')
    ) {
      return 'Spam';
    }

    // If no clear category is found, make an educated guess based on the email's folder
    switch (email.folder) {
      case 'SENT':
        return 'Out of Office'; // Assuming sent emails are mostly responses
      case 'SPAM':
        return 'Spam';
      case 'DRAFT':
        return 'Interested'; // Drafts are usually for emails we're interested in
      default:
        // For INBOX, try to make one final guess based on length and content
        if (body.length > 1000 || subject.length > 100) {
          return 'Not Interested'; // Long emails are often newsletters or promotional
        }
        return 'Interested'; // Default to Interested for short, direct communications
    }
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    try {
      // If no API key or model, return default category
      if (!this.model) {
        console.warn('No AI model available. Using default categorization.');
        return this.defaultCategorization(email);
      }

      const prompt = `
        Analyze this email and categorize it into one of these categories: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.
        
        Email Subject: ${email.subject}
        From: ${email.from}
        Content: ${email.textBody || email.htmlBody}
        
        Rules for categorization:
        - Interested: Shows positive interest in product/service, asks for more information, or wants to continue discussion
        - Meeting Booked: Confirms a meeting, contains meeting details, or accepts calendar invite
        - Not Interested: Clearly declines offer, shows no interest, or wants to end communication
        - Spam: Unsolicited promotional content, suspicious links, or irrelevant mass mailings
        - Out of Office: Automatic replies indicating absence, vacation, or unavailability
        
        Respond with ONLY ONE of these exact category names, nothing else.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // Validate that the response is one of our categories
      const validCategories: EmailCategory[] = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
      if (validCategories.includes(response as EmailCategory)) {
        return response as EmailCategory;
      }
      
      return this.defaultCategorization(email);
    } catch (error) {
      console.error('Error categorizing email:', error);
      return this.defaultCategorization(email);
    }
  }

  async generateReply(email: Email, context: string = ''): Promise<string> {
    if (!this.model) {
      throw new Error('AI model not initialized');
    }

    const prompt = `
      Generate a professional email reply to the following email.
      Use the provided context for customization if available.

      Original Email:
      From: ${email.from}
      Subject: ${email.subject}
      Content: ${email.textBody || email.htmlBody}

      Additional Context: ${context}

      Rules for the reply:
      1. Keep it professional and courteous
      2. Address the main points of the original email
      3. Include a proper greeting and signature
      4. Keep the tone consistent with the context
      5. Be concise but complete

      Generate the reply:
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text().trim();
  }
} 