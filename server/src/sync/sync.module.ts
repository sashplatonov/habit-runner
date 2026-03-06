import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, MetricsModule, AuthModule],
  controllers: [SyncController],
  providers: [SyncService]
})
export class SyncModule {}
