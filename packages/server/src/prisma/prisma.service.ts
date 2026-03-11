import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { DATABASE_URL, DEFAULT_DB_SCHEMA } from '../common/config';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool = new Pool({ connectionString: DATABASE_URL });
  private client: PrismaClient | null = null;
  private readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initialize();
  }

  async getClient(): Promise<PrismaClient> {
    await this.initPromise;
    if (!this.client) {
      throw new Error('Prisma client is not initialized');
    }
    return this.client;
  }

  private async initialize(): Promise<void> {
    await this.ensureSchemaExists(DEFAULT_DB_SCHEMA);
    const adapter = new PrismaPg({ connectionString: DATABASE_URL }, { schema: DEFAULT_DB_SCHEMA });
    const client = new PrismaClient({ adapter });
    try {
      await client.$connect();
    } catch (error) {
      this.logger.error(`Prisma client failed to connect for schema "${DEFAULT_DB_SCHEMA}"`, error);
      throw error;
    }
    this.client = client;
  }

  private async ensureSchemaExists(schema: string): Promise<void> {
    const cleaned = schema.replace(/"/g, '');
    await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${cleaned}"`);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
    }
    await this.pool.end();
  }
}
