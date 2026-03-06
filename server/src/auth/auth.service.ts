import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_TTL_SECONDS,
  API_PUBLIC_URL,
  AUTH_SECRET,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  OAUTH_DEFAULT_RETURN_TO,
  REFRESH_TOKEN_EXPIRES_DAYS
} from '../config';

interface AuthPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

interface OAuthStartPayload {
  returnTo: string;
  expiresAt: number;
}

interface OAuthIdTokenPayload {
  email?: string;
  sub: string;
  aud: string;
  iss: string;
  exp: number;
}

interface OAuthTokens {
  id_token?: string;
}

type SessionUser = {
  id: string;
  email: string;
};

@Injectable()
export class AuthService {
  private readonly secret = AUTH_SECRET;
  private readonly accessTokenExpiry = ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'];
  private readonly accessTokenTtlSeconds = ACCESS_TOKEN_TTL_SECONDS;
  private readonly refreshTokenDays = REFRESH_TOKEN_EXPIRES_DAYS;
  private readonly oauthStates = new Map<string, OAuthStartPayload>();

  constructor(private readonly prisma: PrismaService) {}

  async login(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }
    return this.issueTokenPair(user);
  }

  createOAuthAuthorizationUrl(returnTo?: string): string {
    this.ensureGoogleConfig();
    const state = randomBytes(16).toString('hex');
    this.oauthStates.set(state, {
      returnTo: this.normalizeReturnTo(returnTo),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_OAUTH_CLIENT_ID);
    url.searchParams.set('redirect_uri', this.getOAuthCallbackUrl());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'select_account');
    return url.toString();
  }

  async handleOAuthCallback(code: string, state: string): Promise<string> {
    const statePayload = this.consumeOAuthState(state);
    const tokenSet = await this.exchangeOAuthCode(code);
    const idToken = tokenSet.id_token;
    if (!idToken) {
      throw new UnauthorizedException('Google OAuth response does not include id_token');
    }

    const claims = await this.verifyGoogleIdToken(idToken);
    const user = await this.getOrCreateOAuthUser(claims);
    const session = await this.issueTokenPair(user);

    const redirect = new URL('/auth/callback', statePayload.returnTo);
    redirect.searchParams.set('accessToken', session.accessToken);
    redirect.searchParams.set('refreshToken', session.refreshToken);
    redirect.searchParams.set('expiresIn', String(session.expiresIn));
    redirect.searchParams.set('email', user.email);
    return redirect.toString();
  }

  async refreshToken(token: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token }
    });
    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }
    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    const accessToken = this.createAccessToken(user);
    return {
      accessToken,
      refreshToken: record.token,
      expiresIn: this.accessTokenTtlSeconds,
      tokenType: 'Bearer'
    };
  }

  verifyAccessToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, this.secret) as AuthPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private createAccessToken(user: SessionUser): string {
    return jwt.sign(
      { sub: user.id, email: user.email },
      this.secret,
      {
        expiresIn: this.accessTokenExpiry
      }
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenDays);
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });
    return token;
  }

  private async issueTokenPair(user: SessionUser) {
    const accessToken = this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds,
      tokenType: 'Bearer'
    };
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true }
    });
  }

  private ensureGoogleConfig(): void {
    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }
  }

  private normalizeReturnTo(returnTo?: string): string {
    if (!returnTo) return OAUTH_DEFAULT_RETURN_TO;
    try {
      const parsed = new URL(returnTo);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return OAUTH_DEFAULT_RETURN_TO;
      }
      return parsed.origin;
    } catch {
      return OAUTH_DEFAULT_RETURN_TO;
    }
  }

  private getOAuthCallbackUrl(): string {
    return `${API_PUBLIC_URL}/auth/google/callback`;
  }

  private consumeOAuthState(state: string): OAuthStartPayload {
    const payload = this.oauthStates.get(state);
    this.oauthStates.delete(state);

    if (!payload || payload.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    return payload;
  }

  private async exchangeOAuthCode(code: string): Promise<OAuthTokens> {
    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: this.getOAuthCallbackUrl(),
      grant_type: 'authorization_code'
    });
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!response.ok) {
      throw new UnauthorizedException('Failed to exchange Google OAuth code');
    }
    return (await response.json()) as OAuthTokens;
  }

  private async verifyGoogleIdToken(token: string): Promise<OAuthIdTokenPayload> {
    const verifier = new URL('https://oauth2.googleapis.com/tokeninfo');
    verifier.searchParams.set('id_token', token);
    const response = await fetch(verifier.toString());
    if (!response.ok) {
      throw new UnauthorizedException('Google id_token validation failed');
    }
    const data = (await response.json()) as {
      aud?: string;
      iss?: string;
      exp?: string;
      sub?: string;
      email?: string;
    };

    if (!data.sub || !data.aud || !data.iss || !data.exp) {
      throw new UnauthorizedException('Google id_token claims are incomplete');
    }

    if (data.aud !== GOOGLE_OAUTH_CLIENT_ID) {
      throw new UnauthorizedException('Google id_token audience mismatch');
    }
    if (data.iss !== 'https://accounts.google.com' && data.iss !== 'accounts.google.com') {
      throw new UnauthorizedException('Google id_token issuer mismatch');
    }

    const expiresAt = Number(data.exp);
    if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Google id_token expired');
    }

    return {
      sub: data.sub,
      email: data.email,
      aud: data.aud,
      iss: data.iss,
      exp: expiresAt
    };
  }

  private async getOrCreateOAuthUser(claims: OAuthIdTokenPayload): Promise<SessionUser> {
    const email = claims.email ?? `google-${claims.sub}@oauth.habbit-runner.local`;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        email
      },
      select: {
        id: true,
        email: true
      }
    });
  }
}
