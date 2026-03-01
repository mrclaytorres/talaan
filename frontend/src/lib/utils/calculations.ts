import type { TradeDirection } from '$lib/types/index.js';

/**
 * Calculate Risk-to-Reward ratio.
 * Returns null if stopLoss === entryPrice (division by zero).
 * Returns 0 if takeProfit === entryPrice (zero reward).
 */
export function calculateRRRatio(
	entryPrice: number,
	stopLoss: number,
	takeProfit: number,
): number | null {
	const risk = Math.abs(entryPrice - stopLoss);
	if (risk === 0) return null;

	const reward = Math.abs(takeProfit - entryPrice);
	return reward / risk;
}

/**
 * Calculate the realized R:R for a closed trade.
 * Positive when profitable, negative when stopped out / losing.
 * Returns null if risk is zero.
 */
export function calculateRealizedRR(
	direction: TradeDirection,
	entryPrice: number,
	stopLoss: number,
	exitPrice: number,
): number | null {
	const risk = Math.abs(entryPrice - stopLoss);
	if (risk === 0) return null;

	const actualMove =
		direction === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;

	return actualMove / risk;
}

/**
 * Calculate P&L for a closed trade.
 * Returns amount and percentage.
 */
export function calculatePnL(
	direction: TradeDirection,
	entryPrice: number,
	exitPrice: number,
	positionSize: number | null,
): { amount: number | null; percent: number } {
	const priceDiff =
		direction === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;

	const percent = (priceDiff / entryPrice) * 100;

	if (positionSize === null || positionSize === 0) {
		return { amount: null, percent };
	}

	const amount = priceDiff * positionSize;
	return { amount, percent };
}

/**
 * Infer trade direction from entry and stop loss prices.
 * entry > stopLoss → long
 * entry < stopLoss → short
 */
export function inferDirection(
	entryPrice: number,
	stopLoss: number,
): TradeDirection {
	return entryPrice > stopLoss ? 'long' : 'short';
}
