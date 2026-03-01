import { describe, it, expect } from 'vitest';
import {
	calculateRRRatio,
	calculatePnL,
	inferDirection,
} from '$lib/utils/calculations.js';

describe('calculateRRRatio', () => {
	it('calculates correct R:R for long position', () => {
		// Entry 150, SL 145, TP 165 → risk 5, reward 15 → 3.0
		expect(calculateRRRatio(150, 145, 165)).toBe(3);
	});

	it('calculates correct R:R for short position', () => {
		// Entry 100, SL 110, TP 80 → risk 10, reward 20 → 2.0
		expect(calculateRRRatio(100, 110, 80)).toBe(2);
	});

	it('returns null when stopLoss equals entry (division by zero)', () => {
		expect(calculateRRRatio(100, 100, 110)).toBeNull();
	});

	it('returns 0 when takeProfit equals entry (zero reward)', () => {
		expect(calculateRRRatio(100, 95, 100)).toBe(0);
	});

	it('calculates R:R for forex-style prices', () => {
		// Entry 1.1000, SL 1.0950, TP 1.1200
		const result = calculateRRRatio(1.1, 1.095, 1.12);
		expect(result).toBeCloseTo(4, 1);
	});
});

describe('calculatePnL', () => {
	it('calculates P&L for winning long trade', () => {
		const result = calculatePnL('long', 150, 165, 10);
		expect(result.amount).toBe(150); // (165-150) * 10
		expect(result.percent).toBeCloseTo(10, 1); // (15/150)*100
	});

	it('calculates P&L for losing long trade', () => {
		const result = calculatePnL('long', 150, 140, 10);
		expect(result.amount).toBe(-100); // (140-150) * 10
		expect(result.percent).toBeCloseTo(-6.67, 1);
	});

	it('calculates P&L for winning short trade', () => {
		const result = calculatePnL('short', 100, 80, 10);
		expect(result.amount).toBe(200); // (100-80) * 10
		expect(result.percent).toBe(20);
	});

	it('calculates P&L for losing short trade', () => {
		const result = calculatePnL('short', 100, 110, 10);
		expect(result.amount).toBe(-100); // (100-110) * 10
		expect(result.percent).toBe(-10);
	});

	it('returns null amount when positionSize is null', () => {
		const result = calculatePnL('long', 100, 110, null);
		expect(result.amount).toBeNull();
		expect(result.percent).toBe(10);
	});

	it('calculates zero P&L when exit equals entry', () => {
		const result = calculatePnL('long', 100, 100, 10);
		expect(result.amount).toBe(0);
		expect(result.percent).toBe(0);
	});
});

describe('inferDirection', () => {
	it('infers long when entry > stopLoss', () => {
		expect(inferDirection(150, 145)).toBe('long');
	});

	it('infers short when entry < stopLoss', () => {
		expect(inferDirection(100, 110)).toBe('short');
	});
});
