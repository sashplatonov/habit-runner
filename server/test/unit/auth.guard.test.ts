import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../../src/auth/auth.guard';

function createExecutionContextMock(
  authorization: string | undefined,
  authService: { verifyAccessToken: (token: string) => { sub: string; email: string } }
) {
  const request: {
    headers: { authorization: string | undefined };
    header(name: string): string | undefined;
    user?: { id: string; email?: string };
  } = {
    headers: {
      authorization
    },
    header(name: string) {
      const value = this.headers[name as 'authorization'];
      return Array.isArray(value) ? value[0] : value;
    }
  };

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as never,
    authService
  };
}

describe('AuthGuard', () => {
  it('accepts valid bearer token and sets user on request', async () => {
    const authService = {
      verifyAccessToken(token: string) {
        expect(token).toBe('valid-token');
        return { sub: 'user-1', email: 'u1@example.com' };
      }
    };
    const { context, request } = createExecutionContextMock(
      'Bearer valid-token',
      authService
    );
    const guard = new AuthGuard(authService as never);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'u1@example.com' });
  });

  it('rejects request without bearer token', async () => {
    const guard = new AuthGuard(
      {
        verifyAccessToken() {
          throw new Error('must not be called');
        }
      } as never
    );
    const { context } = createExecutionContextMock(undefined, {
      verifyAccessToken: () => ({ sub: 'x', email: 'x@example.com' })
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });
});
