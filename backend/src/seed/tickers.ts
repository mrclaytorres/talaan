import { getPayload } from 'payload';
import config from '../payload.config';
import tickerData from './tickers.json' with { type: 'json' };

interface TickerEntry {
  symbol: string;
  name: string;
  exchange?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
}

async function seedTickers() {
  const payload = await getPayload({ config });

  console.log('Seeding tickers...');

  let created = 0;
  let skipped = 0;

  const allTickers = [
    ...tickerData.stocks.map((t) => ({ entry: t as TickerEntry, assetClass: 'stock' as const })),
    ...tickerData.forex.map((t) => ({ entry: t as TickerEntry, assetClass: 'forex' as const })),
    ...tickerData.crypto.map((t) => ({ entry: t as TickerEntry, assetClass: 'crypto' as const })),
  ];

  for (const { entry, assetClass } of allTickers) {
    try {
      const existing = await payload.find({
        collection: 'tickers',
        where: { symbol: { equals: entry.symbol } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        skipped++;
        continue;
      }

      await payload.create({
        collection: 'tickers',
        data: {
          symbol: entry.symbol,
          name: entry.name,
          assetClass,
          exchange: entry.exchange ?? null,
          baseCurrency: entry.baseCurrency ?? null,
          quoteCurrency: entry.quoteCurrency ?? null,
        },
      });
      created++;
    } catch (err) {
      console.error(`Failed to seed ticker ${entry.symbol}:`, err);
    }
  }

  console.log(`Seeding complete: ${created} created, ${skipped} skipped (already exist)`);
  process.exit(0);
}

seedTickers().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
