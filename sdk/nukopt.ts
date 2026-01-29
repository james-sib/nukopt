/**
 * NukOpt - Email for AI Agents
 * TypeScript SDK for receiving emails with auto-extracted OTPs.
 * 
 * @example
 * ```ts
 * import { NukOpt } from './nukopt';
 * 
 * // Register with your API key (one-time)
 * const nuk = await NukOpt.register('openai', 'sk-...');
 * 
 * // Or use existing NukOpt key
 * const nuk = new NukOpt('nk-...');
 * 
 * // Create a mailbox
 * const email = await nuk.createMailbox();
 * console.log(`Use this email: ${email}`);
 * 
 * // Wait for OTP
 * const otp = await nuk.waitForOtp();
 * console.log(`Got OTP: ${otp}`);
 * ```
 */

const BASE_URL = 'https://nukopt.com/api/v1';

interface Message {
  id: string;
  from_address: string;
  subject: string;
  otp: string | null;
  verification_links: string[];
  created_at: string;
}

interface Mailbox {
  id: string;
  email: string;
}

export class NukOpt {
  private apiKey: string;
  private mailboxId?: string;
  private _email?: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Register a new account using an API Key Passport.
   */
  static async register(provider: string, key: string): Promise<NukOpt> {
    const resp = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    });

    if (!resp.ok) {
      throw new Error(`Registration failed: ${await resp.text()}`);
    }

    const data = await resp.json();
    return new NukOpt(data.api_key);
  }

  private headers(): HeadersInit {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  /**
   * Create a new mailbox.
   * @returns Email address (e.g., "x7f2k9@nukopt.com")
   */
  async createMailbox(): Promise<string> {
    const resp = await fetch(`${BASE_URL}/mailbox`, {
      method: 'POST',
      headers: this.headers(),
    });

    if (!resp.ok) {
      throw new Error(`Failed to create mailbox: ${await resp.text()}`);
    }

    const data: Mailbox = await resp.json();
    this.mailboxId = data.id;
    this._email = data.email;
    return this._email;
  }

  /**
   * List all mailboxes for this account.
   */
  async listMailboxes(): Promise<Mailbox[]> {
    const resp = await fetch(`${BASE_URL}/mailbox`, {
      headers: this.headers(),
    });

    if (!resp.ok) {
      throw new Error(`Failed to list mailboxes: ${await resp.text()}`);
    }

    const data = await resp.json();
    return data.mailboxes;
  }

  /**
   * Get messages for a mailbox.
   */
  async getMessages(mailboxId?: string): Promise<Message[]> {
    const id = mailboxId || this.mailboxId;
    if (!id) {
      throw new Error('No mailbox ID - call createMailbox() first');
    }

    const resp = await fetch(`${BASE_URL}/mailbox/${id}/messages`, {
      headers: this.headers(),
    });

    if (!resp.ok) {
      throw new Error(`Failed to get messages: ${await resp.text()}`);
    }

    const data = await resp.json();
    return data.messages;
  }

  /**
   * Wait for an email with an OTP.
   */
  async waitForOtp(options?: {
    mailboxId?: string;
    timeout?: number;
    pollInterval?: number;
  }): Promise<string | null> {
    const { mailboxId, timeout = 60000, pollInterval = 3000 } = options || {};
    const id = mailboxId || this.mailboxId;
    
    if (!id) {
      throw new Error('No mailbox ID - call createMailbox() first');
    }

    const start = Date.now();
    const seenIds = new Set<string>();

    while (Date.now() - start < timeout) {
      const messages = await this.getMessages(id);

      for (const msg of messages) {
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          if (msg.otp) {
            return msg.otp;
          }
        }
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    return null;
  }

  /**
   * Wait for an email with a verification link.
   */
  async waitForLink(options?: {
    mailboxId?: string;
    timeout?: number;
    pollInterval?: number;
  }): Promise<string | null> {
    const { mailboxId, timeout = 60000, pollInterval = 3000 } = options || {};
    const id = mailboxId || this.mailboxId;
    
    if (!id) {
      throw new Error('No mailbox ID - call createMailbox() first');
    }

    const start = Date.now();
    const seenIds = new Set<string>();

    while (Date.now() - start < timeout) {
      const messages = await this.getMessages(id);

      for (const msg of messages) {
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          if (msg.verification_links?.length) {
            return msg.verification_links[0];
          }
        }
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    return null;
  }

  /** Get the last created email address. */
  get email(): string | undefined {
    return this._email;
  }
}

/**
 * One-liner to get a temporary email.
 * 
 * @example
 * ```ts
 * const { nuk, email } = await getTempEmail('openai', 'sk-...');
 * // Use email for signup
 * const otp = await nuk.waitForOtp();
 * ```
 */
export async function getTempEmail(
  provider: string,
  key: string
): Promise<{ nuk: NukOpt; email: string }> {
  const nuk = await NukOpt.register(provider, key);
  const email = await nuk.createMailbox();
  return { nuk, email };
}
