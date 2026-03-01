import { describe, it, expect } from 'vitest';
import { calculateRealizedRR } from '$lib/utils/calculations.js';

describe('calculateRealizedRR', () => {
	it('returns positive R:R for winning long trade', () => {
		// Entry 150, SL 145, Exit 165 → risk 5, move +15 → 3.0
		expect(calculateRealizedRR('long', 150, 145, 165)).toBe(3);
	});

	it('returns negative R:R for stopped-out long trade', () => {
		// Entry 150, SL 145, Exit 145 → risk 5, move -5 → -1.0
		expect(calculateRealizedRR('long', 150, 145, 145)).toBe(-1);
	});

	it('returns positive R:R for winning short trade', () => {
		// Entry 100, SL 110, Exit 80 → risk 10, move +20 → 2.0
		expect(calculateRealizedRR('short', 100, 110, 80)).toBe(2);
	});

	it('returns negative R:R for stopped-out short trade', () => {
		// Entry 1871.1, SL 1887.17, Exit 1887.17 → risk 16.07, move -16.07 → -1.0
		const result = calculateRealizedRR('short', 1871.1, 1887.17, 1887.17);
		expect(result).toBeCloseTo(-1, 1);
	});

	it('returns null when risk is zero (SL equals entry)', () => {
		expect(calculateRealizedRR('long', 100, 100, 110)).toBeNull();
	});

	it('returns zero when exit equals entry (breakeven)', () => {
		expect(calculateRealizedRR('long', 100, 95, 100)).toBe(0);
	});

	it('returns partial negative for partial loss on long', () => {
		// Entry 100, SL 90, Exit 95 → risk 10, move -5 → -0.5
		expect(calculateRealizedRR('long', 100, 90, 95)).toBe(-0.5);
	});

	it('returns partial positive for partial win on short', () => {
		// Entry 100, SL 110, Exit 95 → risk 10, move +5 → 0.5
		expect(calculateRealizedRR('short', 100, 110, 95)).toBe(0.5);
	});

	it('handles large R:R multiplier', () => {
		// Entry 100, SL 99, Exit 110 → risk 1, move +10 → 10.0
		expect(calculateRealizedRR('long', 100, 99, 110)).toBe(10);
	});
});
