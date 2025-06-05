export type EmailCategory = 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface Email {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date;
  textBody?: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  category?: EmailCategory;
  aiSummary?: string;
  suggestedReply?: string;
  flags?: string[];
  headers?: Record<string, string>;
}

export interface EmailAccount {
  id: string;
  email: string;
  name?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
} 