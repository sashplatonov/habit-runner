import { Body, Controller, Delete, Get, HttpCode, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard, type RequestWithUser } from '../auth/auth.guard';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.notificationService.getVapidPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() subscription: PushSubscriptionJSON
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    await this.notificationService.subscribe(userId, subscription);
    return { success: true };
  }

  @Delete('unsubscribe')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.notificationService.unsubscribe(body.endpoint);
  }
}
