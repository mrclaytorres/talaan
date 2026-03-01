import type { PayloadHandler } from 'payload';

export const importJSON: PayloadHandler = async (req) => {
  const payload = req.payload;

  let body: Record<string, unknown>;
  try {
    body = await req.json?.() as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const data = body as {
    version?: string;
    user?: { displayName?: string; timezone?: string };
    accounts?: Array<{
      name: string;
      description?: string;
      currency: string;
      startingCapital?: number;
      trades?: Array<{
        date: string;
        tickerSymbol: string;
        direction: 'long' | 'short';
        entryPrice: number;
        stopLoss: number;
        takeProfit: number;
        positionSize?: number;
        exitPrice?: number;
        status: 'open' | 'closed';
        rrRatio?: number;
        pnlAmount?: number;
        pnlPercent?: number;
        notes?: string;
      }>;
    }>;
  };

  if (!data.version || !data.version.startsWith('1.')) {
    return Response.json({ error: 'Unsupported export version' }, { status: 400 });
  }

  try {
    // Delete existing trades and accounts
    const existingTrades = await payload.find({ collection: 'trade-positions', limit: 10000 });
    for (const trade of existingTrades.docs) {
      await payload.delete({ collection: 'trade-positions', id: trade.id });
    }

    const existingAccounts = await payload.find({ collection: 'trading-accounts', limit: 1000 });
    for (const account of existingAccounts.docs) {
      await payload.delete({ collection: 'trading-accounts', id: account.id });
    }

    // Update user profile
    if (data.user) {
      const users = await payload.find({ collection: 'users', limit: 1 });
      if (users.docs.length > 0) {
        await payload.update({
          collection: 'users',
          id: users.docs[0].id,
          data: {
            displayName: data.user.displayName ?? 'User',
            timezone: data.user.timezone ?? 'UTC',
          },
        });
      }
    }

    let importedAccounts = 0;
    let importedTrades = 0;

    // Restore accounts and trades
    for (const accountData of data.accounts ?? []) {
      const users = await payload.find({ collection: 'users', limit: 1 });
      const userId = users.docs[0]?.id;

      const account = await payload.create({
        collection: 'trading-accounts',
        data: {
          user: userId,
          name: accountData.name,
          description: accountData.description ?? undefined,
          currency: accountData.currency,
          startingCapital: accountData.startingCapital ?? 0,
        },
      });
      importedAccounts++;

      for (const tradeData of accountData.trades ?? []) {
        await payload.create({
          collection: 'trade-positions',
          data: {
            account: account.id,
            date: tradeData.date,
            tickerSymbol: tradeData.tickerSymbol,
            direction: tradeData.direction,
            entryPrice: tradeData.entryPrice,
            stopLoss: tradeData.stopLoss,
            takeProfit: tradeData.takeProfit,
            positionSize: tradeData.positionSize ?? undefined,
            exitPrice: tradeData.exitPrice ?? undefined,
            status: tradeData.status ?? 'open',
            rrRatio: tradeData.rrRatio ?? undefined,
            pnlAmount: tradeData.pnlAmount ?? undefined,
            pnlPercent: tradeData.pnlPercent ?? undefined,
            notes: tradeData.notes ?? undefined,
          },
        });
        importedTrades++;
      }
    }

    return Response.json({
      success: true,
      imported: { accounts: importedAccounts, trades: importedTrades },
    });
  } catch (err) {
    console.error('Import failed:', err);
    return Response.json(
      { error: 'Import failed: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 },
    );
  }
};
