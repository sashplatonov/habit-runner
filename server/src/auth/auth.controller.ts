import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  OAuthCallbackQuery,
  OAuthStartQuery,
  RefreshRequest,
  UpdateThemeRequest
} from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import type { RequestWithUser } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body.email);
  }

  @Get('google/start')
  @Redirect()
  async startGoogle(@Query() query: OAuthStartQuery) {
    return { url: await this.authService.createOAuthAuthorizationUrl(query.returnTo) };
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

  @UseGuards(AuthGuard)
  @Get('theme')
  async getTheme(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}

    const theme = await this.authService.getUserTheme(userId);
    return { theme };
  }

  @UseGuards(AuthGuard)
  @Put('theme')
  async updateTheme(@Req() req: RequestWithUser, @Body() body: UpdateThemeRequest) {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}

    const theme = await this.authService.updateUserTheme(userId, body.theme);
    return { theme };
  }
}
