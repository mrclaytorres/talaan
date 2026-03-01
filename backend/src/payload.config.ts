import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';
import { Users } from './collections/Users';
import { TradePositions } from './collections/TradePositions';
import { TradeImages } from './collections/TradeImages';
import { TradingAccounts } from './collections/TradingAccounts';
import { Tickers } from './collections/Tickers';
import { exportJSON } from './endpoints/export-json';
import { exportCSV } from './endpoints/export-csv';
import { importJSON } from './endpoints/import-json';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, TradePositions, TradeImages, TradingAccounts, Tickers],
  endpoints: [
    {
      path: '/export/json',
      method: 'get',
      handler: exportJSON,
    },
    {
      path: '/export/csv',
      method: 'get',
      handler: exportCSV,
    },
    {
      path: '/import/json',
      method: 'post',
      handler: importJSON,
    },
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: [
    'http://localhost:5173',
    'http://localhost:4173',
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ],
  upload: {
    limits: {
      fileSize: 10_000_000, // 10MB
    },
  },
});
