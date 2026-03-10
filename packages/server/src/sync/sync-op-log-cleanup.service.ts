import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SYNC_OP_LOG_RETENTION_DAYS } from '../common/config';

@Injectable()
export class SyncOpLogCleanupService implements OnModuleInit {
  private readonly logger = new Logger(SyncOpLogCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.cleanup('startup');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCleanup() {
    await this.cleanup('cron');
  }

  private async cleanup(trigger: string) {
    const cutoff = new Date(
      Date.now() - SYNC_OP_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
    );
    const client = await this.prisma.getClient();
    const deleted = await client.syncOpLog.deleteMany({
      where: { createdAt: { lt: cutoff } }
    });
    if (deleted.count > 0) {
      this.logger.log(
        `Cleaned ${deleted.count} sync op logs older than ${SYNC_OP_LOG_RETENTION_DAYS} days (${trigger})`
      );
    }
  }
}
