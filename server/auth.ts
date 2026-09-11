import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  sessionLoginSchema,
  type SessionInfo,
  type SessionLogin,
  type SessionUser,
} from '../shared/contracts.ts';

export interface SessionAuth {
  login(input: SessionLogin): SessionInfo | null;
  resolve(token: string): SessionUser | null;
}

interface DemoAccount extends SessionUser {
  password: string;
}

interface ActiveSession {
  user: SessionUser;
  expiresAt: number;
}

const SESSION_DURATION_MS = 30 * 60 * 1000;

export class LocalSessionAuth implements SessionAuth {
  private readonly sessions = new Map<string, ActiveSession>();

  constructor(
    private readonly accounts: DemoAccount[],
    private readonly clock: () => number = Date.now,
  ) {}

  login(input: SessionLogin): SessionInfo | null {
    const value = sessionLoginSchema.parse(input);
    const account = this.accounts.find(
      (candidate) => candidate.email.toLowerCase() === value.email.toLowerCase(),
    );
    if (!account || !this.matches(value.password, account.password)) return null;
    const token = randomBytes(32).toString('hex');
    const expiresAt = this.clock() + SESSION_DURATION_MS;
    const user = { id: account.id, name: account.name, email: account.email };
    this.sessions.set(token, { user, expiresAt });
    return { token, expiresAt, user };
  }

  resolve(token: string): SessionUser | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt <= this.clock()) {
      this.sessions.delete(token);
      return null;
    }
    return session.user;
  }

  private matches(supplied: string, expected: string) {
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
