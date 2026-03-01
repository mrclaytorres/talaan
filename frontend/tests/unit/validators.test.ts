import { describe, it, expect } from 'vitest';
import {
	validatePassword,
	validatePrice,
	validatePriceRelationship,
	validateMimeType,
} from '$lib/utils/validators.js';

describe('validatePassword', () => {
	it('accepts a strong password', () => {
		const result = validatePassword('MyPass1!');
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('rejects short password', () => {
		const result = validatePassword('Ab1!');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain('Password must be at least 8 characters');
	});

	it('rejects password without uppercase', () => {
		const result = validatePassword('mypass1!');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Password must contain at least one uppercase letter',
		);
	});

	it('rejects password without number', () => {
		const result = validatePassword('MyPasswd!');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Password must contain at least one number',
		);
	});

	it('rejects password without special character', () => {
		const result = validatePassword('MyPasswd1');
		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'Password must contain at least one special character',
		);
	});

	it('returns multiple errors for very weak password', () => {
		const result = validatePassword('abc');
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThanOrEqual(3);
	});
});

describe('validatePrice', () => {
	it('accepts positive numbers', () => {
		expect(validatePrice(100)).toBe(true);
		expect(validatePrice(0.001)).toBe(true);
	});

	it('rejects zero', () => {
		expect(validatePrice(0)).toBe(false);
	});

	it('rejects negative numbers', () => {
		expect(validatePrice(-10)).toBe(false);
	});

	it('rejects NaN and Infinity', () => {
		expect(validatePrice(NaN)).toBe(false);
		expect(validatePrice(Infinity)).toBe(false);
	});
});

describe('validatePriceRelationship', () => {
	it('passes for valid long position', () => {
		const result = validatePriceRelationship('long', 150, 145, 165);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('passes for valid short position', () => {
		const result = validatePriceRelationship('short', 100, 110, 80);
		expect(result.valid).toBe(true);
		expect(result.warnings).toHaveLength(0);
	});

	it('rejects when stopLoss equals entry', () => {
		const result = validatePriceRelationship('long', 100, 100, 110);
		expect(result.valid).toBe(false);
	});

	it('warns on long position with SL above entry', () => {
		const result = validatePriceRelationship('long', 100, 110, 120);
		expect(result.valid).toBe(true);
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it('warns on short position with SL below entry', () => {
		const result = validatePriceRelationship('short', 100, 90, 80);
		expect(result.valid).toBe(true);
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});

describe('validateMimeType', () => {
	it('accepts valid image types', () => {
		expect(validateMimeType('image/png')).toBe(true);
		expect(validateMimeType('image/jpeg')).toBe(true);
		expect(validateMimeType('image/webp')).toBe(true);
		expect(validateMimeType('image/gif')).toBe(true);
	});

	it('rejects invalid types', () => {
		expect(validateMimeType('application/pdf')).toBe(false);
		expect(validateMimeType('text/plain')).toBe(false);
	});
});
