import type { PayloadHandler, Where } from 'payload';

interface DailyPnLRow {
  date: string;
  amount: number;
  percent: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

interface MonthlyPnLRow {
  month: string;
  amount: number;
  percent: number;
  tradingDays: number;
}

interface DashboardSummary {
  totalPnl: number;
  totalClosedTrades: number;
  wins: number;
  losses: number;
  todayAmount: number;
  todayPercent: number;
  todayCount: number;
}

interface TickerDistributionRow {
  ticker: string;
  count: number;
}

export const dashboardStats: PayloadHandler = async (req) => {
  const payload = req.payload;
  const url = new URL(req.url ?? '', 'http://localhost');
  const accountId = url.searchParams.get('accountId');

  const where: Where = { status: { equals: 'closed' }, pnlAmount: { not_equals: null } };
  if (accountId) {
    where.account = { equals: accountId };
  }

  const trades = await payload.find({
    collection: 'trade-positions',
    where,
    limit: 10000,
    sort: 'date',
    depth: 0,
  });

  const today = new Date().toISOString().slice(0, 10);

  // Single-pass aggregation
  const dailyMap = new Map<string, DailyPnLRow>();
  const tickerMap = new Map<string, number>();
  let totalPnl = 0;
  let wins = 0;
  let losses = 0;
  let todayAmount = 0;
  let todayPercent = 0;
  let todayCount = 0;

  for (const t of trades.docs) {
    const pnl = t.pnlAmount as number;
    const pnlPct = (t.pnlPercent as number) ?? 0;
    const dateKey = (t.date as string).slice(0, 10);

    // Summary
    totalPnl += pnl;
    if (pnl > 0) wins++;
    else if (pnl < 0) losses++;

    if (dateKey === today) {
      todayAmount += pnl;
      todayPercent += pnlPct;
      todayCount++;
    }

    // Daily
    const existing = dailyMap.get(dateKey);
    if (existing) {
      existing.amount += pnl;
      existing.percent += pnlPct;
      existing.tradeCount++;
      if (pnl > 0) existing.wins++;
      else if (pnl < 0) existing.losses++;
    } else {
      dailyMap.set(dateKey, {
        date: dateKey,
        amount: pnl,
        percent: pnlPct,
        tradeCount: 1,
        wins: pnl > 0 ? 1 : 0,
        losses: pnl < 0 ? 1 : 0,
      });
    }

    // Ticker
    const ticker = t.tickerSymbol as string;
    tickerMap.set(ticker, (tickerMap.get(ticker) ?? 0) + 1);
  }

  // Daily PnL sorted by date
  const dailyPnL = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Monthly PnL from daily
  const monthlyMap = new Map<string, MonthlyPnLRow>();
  for (const day of dailyPnL) {
    const monthKey = day.date.slice(0, 7);
    const existing = monthlyMap.get(monthKey);
    if (existing) {
      existing.amount += day.amount;
      existing.percent += day.percent;
      existing.tradingDays++;
    } else {
      monthlyMap.set(monthKey, {
        month: monthKey,
        amount: day.amount,
        percent: day.percent,
        tradingDays: 1,
      });
    }
  }
  const monthlyPnL = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  // Ticker distribution (top 8 + Other)
  const sortedTickers = [...tickerMap.entries()]
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count);
  let tickerDistribution: TickerDistributionRow[];
  if (sortedTickers.length <= 8) {
    tickerDistribution = sortedTickers;
  } else {
    tickerDistribution = sortedTickers.slice(0, 7);
    const otherCount = sortedTickers.slice(7).reduce((sum, t) => sum + t.count, 0);
    tickerDistribution.push({ ticker: 'Other', count: otherCount });
  }

  const summary: DashboardSummary = {
    totalPnl,
    totalClosedTrades: trades.docs.length,
    wins,
    losses,
    todayAmount,
    todayPercent,
    todayCount,
  };

  return Response.json({ dailyPnL, monthlyPnL, summary, tickerDistribution });
};
