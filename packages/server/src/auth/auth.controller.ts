import {
  BadRequestException,
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
import {
  LoginRequest,
  OAuthStartQuery,
  RefreshRequest,
  UpdateThemeRequest
} from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import type { RequestWithUser } from './auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('login')
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Get('google/start')
  @Redirect()
  async startGoogle(@Query() query: OAuthStartQuery) {
    return { url: await this.authService.createOAuthAuthorizationUrl(query.returnTo) };
  }

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Get('google/callback')
  @Redirect()
  async googleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing OAuth callback parameters');
    }
    return { url: await this.authService.handleOAuthCallback(code, state) };
  }

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('refresh')
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('logout')
  async logout(@Body() body: RefreshRequest) {
    await this.authService.revokeToken(body.refreshToken);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Get('theme')
  async getTheme(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}

    const theme = await this.authService.getUserTheme(userId);
    return { theme };
  }

  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Put('theme')
  async updateTheme(@Req() req: RequestWithUser, @Body() body: UpdateThemeRequest) {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}

    const theme = await this.authService.updateUserTheme(userId, body.theme);
    return { theme };
  }
}
