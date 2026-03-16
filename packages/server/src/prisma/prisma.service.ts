import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { DATABASE_URL, DEFAULT_DB_SCHEMA } from '../common/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool = new Pool({ connectionString: DATABASE_URL });
  private readonly initPromise: Promise<void>;

  constructor() {
    const adapter = new PrismaPg({ connectionString: DATABASE_URL }, { schema: DEFAULT_DB_SCHEMA });
    super({ adapter });
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.ensureSchemaExists(DEFAULT_DB_SCHEMA);
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(`Prisma client failed to connect for schema "${DEFAULT_DB_SCHEMA}"`, error);
      throw error;
    }
  }

  private async ensureSchemaExists(schema: string): Promise<void> {
    const cleaned = schema.replace(/"/g, '');
    await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${cleaned}"`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
