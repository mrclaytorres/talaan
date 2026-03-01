import type { PayloadHandler } from 'payload';

export const exportJSON: PayloadHandler = async (req) => {
  const payload = req.payload;

  // Fetch user
  const users = await payload.find({ collection: 'users', limit: 1 });
  const user = users.docs[0];

  // Fetch all accounts
  const accounts = await payload.find({ collection: 'trading-accounts', limit: 1000 });

  // Build export data
  const exportAccounts = [];

  for (const account of accounts.docs) {
    const trades = await payload.find({
      collection: 'trade-positions',
      where: { account: { equals: account.id } },
      limit: 10000,
    });

    const exportTrades = [];
    for (const trade of trades.docs) {
      const images = await payload.find({
        collection: 'trade-images',
        where: { trade: { equals: trade.id } },
        limit: 100,
      });

      const exportImages = [];
      for (const img of images.docs) {
        // We can't easily read files here, so include metadata only
        exportImages.push({
          fileName: img.filename ?? '',
          mimeType: img.mimeType ?? '',
          data: '', // base64 would require file reading
        });
      }

      exportTrades.push({
        id: trade.id,
        date: trade.date,
        tickerSymbol: trade.tickerSymbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        positionSize: trade.positionSize ?? null,
        exitPrice: trade.exitPrice ?? null,
        status: trade.status,
        rrRatio: trade.rrRatio ?? 0,
        pnlAmount: trade.pnlAmount ?? null,
        pnlPercent: trade.pnlPercent ?? null,
        notes: trade.notes ?? null,
        images: exportImages,
      });
    }

    exportAccounts.push({
      id: account.id,
      name: account.name,
      description: account.description ?? null,
      currency: account.currency,
      startingCapital: account.startingCapital ?? 0,
      trades: exportTrades,
    });
  }

  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user: {
      displayName: user?.displayName ?? '',
      timezone: user?.timezone ?? 'UTC',
    },
    accounts: exportAccounts,
  };

  return Response.json(exportData, {
    headers: {
      'Content-Disposition': 'attachment; filename="trading-journal-backup.json"',
    },
  });
};
