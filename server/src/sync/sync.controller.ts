import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { RequestWithUser} from '../auth/auth.guard';
import { AuthGuard } from '../auth/auth.guard';
import { SyncService } from './sync.service';
import type { PullResponseDto } from './dto/pull-response.dto';
import type { PushRequestDto } from './dto/push-request.dto';

@UseGuards(AuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pull(
    @Req() req: RequestWithUser,
    @Query('since') since?: string
  ): Promise<PullResponseDto> {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}
    const traceId = this.getTraceId(req);
    req.res?.setHeader('x-trace-id', traceId);
    return this.syncService.pull(userId, since, traceId);
  }

  @Post('push')
  async push(
    @Req() req: RequestWithUser,
    @Body() body: PushRequestDto
  ): Promise<ReturnType<SyncService['push']>> {
    const userId = req.user?.id;
    if (!userId) {throw new UnauthorizedException('Authentication required');}
    const traceId = this.getTraceId(req);
    req.res?.setHeader('x-trace-id', traceId);
    return this.syncService.push(userId, body.ops, traceId);
  }

  private getTraceId(req: RequestWithUser): string {
    const traceIdHeader = req.header('x-trace-id');
    return traceIdHeader && traceIdHeader.trim().length > 0
      ? traceIdHeader.trim()
      : randomUUID();
  }
}
