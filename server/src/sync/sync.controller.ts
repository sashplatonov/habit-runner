import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RequestWithUser, AuthGuard } from '../auth/auth.guard';
import { DEFAULT_USER_ID } from '../config';
import { SyncService } from './sync.service';
import { PullResponseDto } from './dto/pull-response.dto';
import { PushRequestDto } from './dto/push-request.dto';

@UseGuards(AuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pull(
    @Req() req: RequestWithUser,
    @Query('since') since?: string
  ): Promise<PullResponseDto> {
    const userId = req.user?.id ?? DEFAULT_USER_ID;
    return this.syncService.pull(userId, since);
  }

  @Post('push')
  async push(
    @Req() req: RequestWithUser,
    @Body() body: PushRequestDto
  ): Promise<ReturnType<SyncService['push']>> {
    const userId = req.user?.id ?? DEFAULT_USER_ID;
    return this.syncService.push(userId, body.ops);
  }
}
