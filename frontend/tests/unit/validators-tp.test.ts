import { describe, it, expect } from 'vitest';
import { validatePriceRelationship } from '$lib/utils/validators.js';

describe('validatePriceRelationship with nullable TP', () => {
	it('accepts null take profit without warnings for long', () => {
		const result = validatePriceRelationship('long', 100, 95, null);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('accepts null take profit without warnings for short', () => {
		const result = validatePriceRelationship('short', 1871.1, 1887.17, null);
		expect(result.valid).toBe(true);
		expect(result.warnings.some((w) => w.includes('above entry'))).toBe(false);
	});

	it('still validates non-null TP below entry for long', () => {
		const result = validatePriceRelationship('long', 100, 95, 90);
		expect(result.warnings.some((w) => w.includes('below entry'))).toBe(true);
	});

	it('still validates non-null TP above entry for short', () => {
		const result = validatePriceRelationship('short', 100, 110, 105);
		expect(result.warnings.some((w) => w.includes('above entry'))).toBe(true);
	});

	it('passes valid long: SL below entry, TP above entry', () => {
		const result = validatePriceRelationship('long', 100, 95, 110);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('passes valid short: SL above entry, TP below entry', () => {
		const result = validatePriceRelationship('short', 100, 110, 85);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('returns invalid when SL equals entry', () => {
		const result = validatePriceRelationship('long', 100, 100, 110);
		expect(result.valid).toBe(false);
		expect(result.warnings.some((w) => w.includes('cannot equal'))).toBe(true);
	});

	it('warns when long SL is above entry', () => {
		const result = validatePriceRelationship('long', 100, 105, 110);
		expect(result.warnings.some((w) => w.includes('above entry price for a long'))).toBe(true);
	});

	it('warns when short SL is below entry', () => {
		const result = validatePriceRelationship('short', 100, 95, 85);
		expect(result.warnings.some((w) => w.includes('below entry price for a short'))).toBe(true);
	});
});
