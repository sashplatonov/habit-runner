import 'dotenv/config';

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://habbit:password@localhost:5432/habbit_runner'
  }
};
