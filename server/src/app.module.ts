import { Module } from '@nestjs/common';
import { SyncModule } from './sync/sync.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [PrismaModule, AuthModule, MetricsModule, SyncModule]
})
export class AppModule {}
