import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { promisify } from 'util';
import { Email, EmailAccount } from '../types/email';
import { EventEmitter } from 'events';

export class ImapService extends EventEmitter {
  private connection: any;
  private account: EmailAccount;

  constructor(account: EmailAccount) {
    super();
    this.account = account;
  }

  getAccountEmail(): string {
    return this.account.email;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection = new Imap({
        user: this.account.user,
        password: this.account.password,
        host: this.account.host,
        port: this.account.port,
        tls: this.account.tls,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.connection.once('ready', () => {
        console.log(`Connected to IMAP server for ${this.account.email}`);
        this.connection.getBoxes((err: Error, boxes: any) => {
          if (err) {
            console.error(`Error getting folders for ${this.account.email}:`, err);
          } else {
            console.log(`Available folders for ${this.account.email}:`, Object.keys(boxes));
          }
        });
        this.setupIdleMode();
        resolve();
      });

      this.connection.once('error', (err: Error) => {
        console.error(`IMAP connection error for ${this.account.email}:`, err);
        reject(err);
      });

      this.connection.connect();
    });
  }

  private setupIdleMode(): void {
    this.connection.on('mail', () => {
      console.log('New email received');
      this.fetchNewEmails().catch(err => 
        console.error('Error fetching new emails:', err)
      );
    });
  }

  async fetchNewEmails(options?: { days?: number; folder?: string } | undefined): Promise<Email[]> {
    const days = options?.days ?? 90;
    const folder = options?.folder ?? 'INBOX';
    
    return new Promise((resolve, reject) => {
      const emails: Email[] = [];

      this.connection.openBox(folder, false, (err: Error, box: any) => {
        if (err) {
          if (err.message.includes('No such mailbox')) {
            console.log(`Folder ${folder} does not exist for ${this.account.email}, available folders will be logged on connection`);
            resolve([]);
            return;
          }
          reject(err);
          return;
        }

        console.log(`Successfully opened folder ${folder} for ${this.account.email}`);
        const searchCriteria = ['ALL'];
        
        this.connection.search(searchCriteria, (searchErr: Error, results: number[]) => {
          if (searchErr) {
            reject(searchErr);
            return;
          }

          console.log(`Found ${results.length} emails in ${folder} for ${this.account.email}`);

          if (!results.length) {
            resolve(emails);
            return;
          }

          const maxEmails = 200;
          const emailsToFetch = results.slice(-maxEmails);
          console.log(`Fetching exactly ${maxEmails} emails from ${folder} for ${this.account.email}`);

          const fetch = this.connection.fetch(emailsToFetch, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
          });

          let processedCount = 0;

          fetch.on('message', (msg: any) => {
            if (processedCount >= maxEmails) {
              return;
            }

            const email: Partial<Email> = {
              accountId: this.account.id,
              folder: folder
            };

            msg.on('body', (stream: any, info: any) => {
              let buffer = '';
              stream.on('data', (chunk: any) => {
                buffer += chunk.toString('utf8');
              });

              stream.once('end', async () => {
                if (info.which === 'TEXT') {
                  const parsed = await simpleParser(buffer);
                  email.textBody = parsed.text || '';
                  email.htmlBody = typeof parsed.html === 'string' ? parsed.html : '';
                } else {
                  const parsed = await simpleParser(buffer);
                  email.subject = parsed.subject || '';
                  email.from = typeof parsed.from?.text === 'string' ? parsed.from.text : '';
                  email.to = Array.isArray(parsed.to) 
                    ? parsed.to.map(addr => typeof addr.text === 'string' ? addr.text : '').filter(Boolean)
                    : parsed.to?.text ? [parsed.to.text] : [];
                  email.date = parsed.date || new Date();
                }
              });
            });

            msg.once('attributes', (attrs: any) => {
              email.id = attrs.uid;
              email.flags = attrs.flags;
            });

            msg.once('end', () => {
              if (email.id && email.subject && processedCount < maxEmails) {
                emails.push(email as Email);
                processedCount++;
              }
            });
          });

          fetch.once('error', (fetchErr: Error) => {
            reject(fetchErr);
          });

          fetch.once('end', () => {
            resolve(emails.slice(0, maxEmails));
          });
        });
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.end();
    }
  }
} 