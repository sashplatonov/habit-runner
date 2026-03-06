import { Body, Controller, Get, Post, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  OAuthCallbackQuery,
  OAuthStartQuery,
  RefreshRequest
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body.email);
  }

  @Get('google/start')
  @Redirect()
  startGoogle(@Query() query: OAuthStartQuery) {
    return { url: this.authService.createOAuthAuthorizationUrl(query.returnTo) };
  }

  @Get('google/callback')
  @Redirect()
  async googleCallback(@Query() query: OAuthCallbackQuery) {
    return { url: await this.authService.handleOAuthCallback(query.code, query.state) };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: RefreshRequest) {
    await this.authService.revokeToken(body.refreshToken);
    return { success: true };
  }
}
