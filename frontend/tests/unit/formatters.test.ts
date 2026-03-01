import { describe, it, expect } from 'vitest';
import {
	formatCurrency,
	formatPercent,
	formatRRRatio,
	formatPrice,
} from '$lib/utils/formatters.js';

describe('formatCurrency', () => {
	it('formats USD amounts', () => {
		const result = formatCurrency(1234.56, 'USD');
		expect(result).toContain('1,234.56');
	});

	it('formats negative amounts', () => {
		const result = formatCurrency(-500, 'USD');
		expect(result).toContain('500.00');
	});
});

describe('formatPercent', () => {
	it('formats positive percentage with + sign', () => {
		expect(formatPercent(10.5)).toBe('+10.50%');
	});

	it('formats negative percentage', () => {
		expect(formatPercent(-5.25)).toBe('-5.25%');
	});

	it('formats zero percentage', () => {
		expect(formatPercent(0)).toBe('0.00%');
	});
});

describe('formatRRRatio', () => {
	it('formats ratio as 1:X', () => {
		expect(formatRRRatio(3)).toBe('1:3.0');
	});

	it('formats null ratio as dash', () => {
		expect(formatRRRatio(null)).toBe('—');
	});

	it('formats zero ratio', () => {
		expect(formatRRRatio(0)).toBe('1:0');
	});
});

describe('formatPrice', () => {
	it('formats prices above $1 with 2 decimals', () => {
		expect(formatPrice(150.5)).toBe('150.50');
	});

	it('formats sub-dollar prices with more precision', () => {
		const result = formatPrice(0.00123);
		expect(result).toBe('0.00123000');
	});
});
