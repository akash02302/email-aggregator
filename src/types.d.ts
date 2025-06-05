declare module 'imap' {
  export class Connection {
    constructor(config: any);
    connect(): void;
    end(): void;
    openBox(mailboxName: string, readOnly: boolean, callback: (err: Error, box: any) => void): void;
    search(criteria: any[], callback: (err: Error, results: number[]) => void): void;
    fetch(results: number[], options: any): any;
    on(event: string, callback: (...args: any[]) => void): void;
    once(event: string, callback: (...args: any[]) => void): void;
  }
}

declare module 'mailparser' {
  export function simpleParser(source: string | Buffer): Promise<{
    text?: string;
    html?: string;
    subject?: string;
    from?: { text?: string };
    to?: { text?: string } | Array<{ text?: string }>;
    date?: Date;
  }>;
}

declare module 'express' {
  import { Request, Response } from 'express';
  export { Request, Response };
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: any): RequestHandler;
  export = cors;
} 