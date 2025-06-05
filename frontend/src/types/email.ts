export type EmailCategory = 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';

export interface Email {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string;
  textBody?: string;
  htmlBody?: string;
  category?: EmailCategory;
  aiSummary?: string;
  suggestedReply?: string;
  flags?: string[];
} 