import type { TradePosition } from '$lib/types/index.js';

export interface DailyPnL {
	amount: number;
	percent: number;
	tradeCount: number;
}

export interface MonthlyPnL {
	amount: number;
	percent: number;
	tradingDays: number;
}

export interface YearlyPnL {
	amount: number;
	percent: number;
	tradingMonths: number;
}

/**
 * Aggregate closed trades into daily P&L keyed by ISO date (YYYY-MM-DD).
 */
export function aggregateDailyPnL(
	trades: TradePosition[],
	timezone: string = 'UTC',
): Map<string, DailyPnL> {
	const map = new Map<string, DailyPnL>();

	for (const trade of trades) {
		if (trade.status !== 'closed' || trade.pnlAmount === null) continue;

		const d = new Date(trade.date);
		const dateKey = d.toLocaleDateString('en-CA', { timeZone: timezone });

		const existing = map.get(dateKey) ?? { amount: 0, percent: 0, tradeCount: 0 };
		existing.amount += trade.pnlAmount;
		existing.percent += trade.pnlPercent ?? 0;
		existing.tradeCount += 1;
		map.set(dateKey, existing);
	}

	return map;
}

/**
 * Aggregate daily P&L into monthly P&L keyed by "YYYY-MM".
 */
export function aggregateMonthlyPnL(
	dailyMap: Map<string, DailyPnL>,
): Map<string, MonthlyPnL> {
	const map = new Map<string, MonthlyPnL>();

	for (const [dateKey, daily] of dailyMap) {
		const monthKey = dateKey.substring(0, 7);
		const existing = map.get(monthKey) ?? { amount: 0, percent: 0, tradingDays: 0 };
		existing.amount += daily.amount;
		existing.percent += daily.percent;
		existing.tradingDays += 1;
		map.set(monthKey, existing);
	}

	return map;
}

/**
 * Aggregate monthly P&L into yearly P&L keyed by "YYYY".
 */
export function aggregateYearlyPnL(
	monthlyMap: Map<string, MonthlyPnL>,
): Map<string, YearlyPnL> {
	const map = new Map<string, YearlyPnL>();

	for (const [monthKey, monthly] of monthlyMap) {
		const yearKey = monthKey.substring(0, 4);
		const existing = map.get(yearKey) ?? { amount: 0, percent: 0, tradingMonths: 0 };
		existing.amount += monthly.amount;
		existing.percent += monthly.percent;
		existing.tradingMonths += 1;
		map.set(yearKey, existing);
	}

	return map;
}
