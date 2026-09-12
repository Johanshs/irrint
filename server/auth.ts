import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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

export const SESSION_DURATION_MS = 30 * 60 * 1000;

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

interface SignedSessionPayload {
  sub: string;
  exp: number;
  name: string;
  email: string;
}

interface SignedDemoOptions {
  email: string;
  password: string;
  secret: string;
  durationMs?: number;
  clock?: () => number;
}

/** Issues isolated, stateless demo sessions that remain valid after a service restart. */
export class SignedDemoSessionAuth implements SessionAuth {
  private readonly clock: () => number;
  private readonly durationMs: number;

  constructor(private readonly options: SignedDemoOptions) {
    if (Buffer.byteLength(options.secret) < 32)
      throw new Error('IRRINT_SESSION_SECRET precisa ter ao menos 32 bytes.');
    this.clock = options.clock ?? Date.now;
    this.durationMs = options.durationMs ?? SESSION_DURATION_MS;
  }

  login(input: SessionLogin): SessionInfo | null {
    const value = sessionLoginSchema.parse(input);
    if (
      value.email.toLowerCase() !== this.options.email.toLowerCase() ||
      !this.matches(value.password, this.options.password)
    )
      return null;
    const expiresAt = this.clock() + this.durationMs;
    const user = {
      id: `demo-${expiresAt.toString(36)}-${randomBytes(6).toString('hex')}`,
      name: 'Visitante da demonstração',
      email: this.options.email,
    };
    const payload: SignedSessionPayload = {
      sub: user.id,
      exp: expiresAt,
      name: user.name,
      email: user.email,
    };
    return { token: this.sign(payload), expiresAt, user };
  }

  resolve(token: string): SessionUser | null {
    const [encoded, suppliedSignature, extra] = token.split('.');
    if (!encoded || !suppliedSignature || extra) return null;
    const expectedSignature = this.signature(encoded);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    try {
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as Partial<SignedSessionPayload>;
      if (
        typeof payload.sub !== 'string' ||
        !/^demo-[a-z0-9]+-[a-f0-9]{12}$/.test(payload.sub) ||
        typeof payload.exp !== 'number' ||
        payload.exp <= this.clock() ||
        typeof payload.name !== 'string' ||
        typeof payload.email !== 'string'
      )
        return null;
      return { id: payload.sub, name: payload.name, email: payload.email };
    } catch {
      return null;
    }
  }

  private sign(payload: SignedSessionPayload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(encoded: string) {
    return createHmac('sha256', this.options.secret).update(encoded).digest('base64url');
  }

  private matches(supplied: string, expected: string) {
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}

export function demoOwnerExpiresAt(ownerId: string) {
  const match = /^demo-([a-z0-9]+)-[a-f0-9]{12}$/.exec(ownerId);
  if (!match) return null;
  const value = Number.parseInt(match[1], 36);
  return Number.isSafeInteger(value) ? value : null;
}
