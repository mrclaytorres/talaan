import type { CollectionBeforeChangeHook } from 'payload';

export const validateTradeBeforeChange: CollectionBeforeChangeHook = ({
	data,
	operation,
}) => {
	if (!data) return data;

	const entryPrice = data.entryPrice as number | undefined;
	const stopLoss = data.stopLoss as number | undefined;
	const takeProfit = data.takeProfit as number | undefined;
	const exitPrice = data.exitPrice as number | undefined;
	const status = data.status as 'open' | 'closed' | undefined;
	const direction = data.direction as 'long' | 'short' | undefined;

	// Reject negative prices
	const priceFields = { entryPrice, stopLoss, takeProfit, exitPrice };
	for (const [field, value] of Object.entries(priceFields)) {
		if (value !== undefined && value !== null && value <= 0) {
			throw new Error(`${field} must be greater than 0`);
		}
	}

	// Reject stopLoss === entryPrice (division by zero in R:R)
	if (
		entryPrice !== undefined &&
		stopLoss !== undefined &&
		stopLoss === entryPrice
	) {
		throw new Error(
			'Stop loss cannot equal entry price (risk would be zero)',
		);
	}

	// Require exitPrice when status is "closed"
	if (status === 'closed' && (exitPrice === undefined || exitPrice === null)) {
		throw new Error('Exit price is required when closing a trade');
	}

	// Warn on direction/price mismatch (add validation message)
	if (
		operation === 'create' &&
		direction &&
		entryPrice !== undefined &&
		stopLoss !== undefined &&
		takeProfit !== undefined
	) {
		if (direction === 'long') {
			if (stopLoss > entryPrice) {
				data._warnings = [
					...(data._warnings || []),
					'Stop loss is above entry price for a long position',
				];
			}
			if (takeProfit < entryPrice) {
				data._warnings = [
					...(data._warnings || []),
					'Take profit is below entry price for a long position',
				];
			}
		} else if (direction === 'short') {
			if (stopLoss < entryPrice) {
				data._warnings = [
					...(data._warnings || []),
					'Stop loss is below entry price for a short position',
				];
			}
			if (takeProfit > entryPrice) {
				data._warnings = [
					...(data._warnings || []),
					'Take profit is above entry price for a short position',
				];
			}
		}
	}

	return data;
};
