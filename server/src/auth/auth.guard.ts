import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  header(name: string): string | undefined;
  res?: {
    setHeader(name: string, value: string): void;
  };
  user?: {
    id: string;
    email?: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request.headers.authorization);
    if (token) {
      const payload = this.authService.verifyAccessToken(token);
      request.user = { id: payload.sub, email: payload.email };
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }

  private extractToken(header?: string | string[]): string | null {
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) return null;
    const [scheme, token] = value.split(' ');
    if (scheme?.toLowerCase() !== 'bearer') return null;
    return token?.trim() ?? null;
  }
}
