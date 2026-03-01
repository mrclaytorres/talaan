import type { PayloadHandler, Where } from 'payload';

export const exportCSV: PayloadHandler = async (req) => {
  const payload = req.payload;
  const url = new URL(req.url ?? '', 'http://localhost');
  const accountId = url.searchParams.get('accountId');

  const where: Where = accountId ? { account: { equals: accountId } } : {};

  const trades = await payload.find({
    collection: 'trade-positions',
    where,
    limit: 10000,
    sort: '-date',
  });

  // Get accounts for name lookup
  const accounts = await payload.find({ collection: 'trading-accounts', limit: 1000 });
  const accountMap = new Map(accounts.docs.map((a) => [a.id, a.name]));

  const headers = [
    'account_name', 'date', 'ticker', 'direction',
    'entry_price', 'stop_loss', 'take_profit', 'position_size',
    'exit_price', 'status', 'rr_ratio', 'pnl_amount', 'pnl_percent', 'notes',
  ];

  const rows = trades.docs.map((t) => {
    const accountName = typeof t.account === 'object' && t.account !== null
      ? (t.account.name ?? '')
      : (accountMap.get(t.account as number) ?? '');

    return [
      escapeCSV(accountName as string),
      t.date ?? '',
      t.tickerSymbol ?? '',
      t.direction ?? '',
      t.entryPrice ?? '',
      t.stopLoss ?? '',
      t.takeProfit ?? '',
      t.positionSize ?? '',
      t.exitPrice ?? '',
      t.status ?? '',
      t.rrRatio ?? '',
      t.pnlAmount ?? '',
      t.pnlPercent ?? '',
      escapeCSV((t.notes as string) ?? ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="trading-journal-trades.csv"',
    },
  });
};

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
