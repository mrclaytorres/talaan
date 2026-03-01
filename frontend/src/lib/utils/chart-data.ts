import type { TradePosition } from '$lib/types/trade.js';

export interface PnLTimeSeriesPoint {
	date: string;
	cumulative: number;
	daily: number;
}

export interface WinLossDataPoint {
	label: string;
	wins: number;
	losses: number;
}

export interface TickerDistributionEntry {
	ticker: string;
	count: number;
}

/**
 * Build a cumulative P&L time series from closed trades.
 * Returns data sorted by date, suitable for a line chart.
 */
export function buildPnLTimeSeries(
	trades: TradePosition[],
	dateRange?: { start: string; end: string },
): PnLTimeSeriesPoint[] {
	const closed = trades.filter(
		(t) =>
			t.status === 'closed' &&
			t.pnlAmount !== null &&
			(!dateRange || (t.date >= dateRange.start && t.date <= dateRange.end)),
	);

	// Group P&L by date
	const dailyMap = new Map<string, number>();
	for (const t of closed) {
		const date = t.date.slice(0, 10);
		dailyMap.set(date, (dailyMap.get(date) ?? 0) + (t.pnlAmount ?? 0));
	}

	// Sort by date
	const sortedDates = [...dailyMap.keys()].sort();

	let cumulative = 0;
	return sortedDates.map((date) => {
		const daily = dailyMap.get(date)!;
		cumulative += daily;
		return { date, cumulative, daily };
	});
}

/**
 * Build win/loss counts grouped by week.
 * Returns data suitable for a grouped bar chart.
 */
export function buildWinLossData(
	trades: TradePosition[],
	dateRange?: { start: string; end: string },
): WinLossDataPoint[] {
	const closed = trades.filter(
		(t) =>
			t.status === 'closed' &&
			t.pnlAmount !== null &&
			(!dateRange || (t.date >= dateRange.start && t.date <= dateRange.end)),
	);

	// Group by actual trade date
	const dayMap = new Map<string, { label: string; wins: number; losses: number }>();

	for (const t of closed) {
		const key = t.date.slice(0, 10); // "YYYY-MM-DD" — sortable
		const d = new Date(key + 'T12:00:00');
		const label = `${d.toLocaleString(undefined, { month: 'short' })} ${d.getDate()}`;

		if (!dayMap.has(key)) {
			dayMap.set(key, { label, wins: 0, losses: 0 });
		}
		const entry = dayMap.get(key)!;
		if ((t.pnlAmount ?? 0) >= 0) {
			entry.wins++;
		} else {
			entry.losses++;
		}
	}

	// Sort by date key (chronological)
	const sortedDays = [...dayMap.keys()].sort();
	return sortedDays.map((key) => {
		const { label, wins, losses } = dayMap.get(key)!;
		return { label, wins, losses };
	});
}

/**
 * Build ticker distribution data for a pie chart.
 * Groups smallest tickers into "Other" if more than maxSlices.
 */
export function buildTickerDistribution(
	trades: TradePosition[],
	maxSlices: number = 8,
): TickerDistributionEntry[] {
	const countMap = new Map<string, number>();

	for (const t of trades) {
		countMap.set(t.tickerSymbol, (countMap.get(t.tickerSymbol) ?? 0) + 1);
	}

	// Sort descending by count
	const sorted = [...countMap.entries()]
		.map(([ticker, count]) => ({ ticker, count }))
		.sort((a, b) => b.count - a.count);

	if (sorted.length <= maxSlices) {
		return sorted;
	}

	const top = sorted.slice(0, maxSlices - 1);
	const otherCount = sorted
		.slice(maxSlices - 1)
		.reduce((sum, e) => sum + e.count, 0);
	top.push({ ticker: 'Other', count: otherCount });

	return top;
}

/** Get the Monday of the week for a given date. */
function getWeekMonday(d: Date): Date {
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	const monday = new Date(d);
	monday.setDate(diff);
	return monday;
}

/** Get a short week label like "Feb 3" from a Monday date. */
function getWeekLabel(monday: Date): string {
	const month = monday.toLocaleString(undefined, { month: 'short' });
	return `${month} ${monday.getDate()}`;
}
