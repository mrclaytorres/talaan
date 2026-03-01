import type { TradeDirection } from '$lib/types/index.js';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export interface PriceValidationResult {
	valid: boolean;
	warnings: string[];
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Validate password strength.
 * Min 8 chars, 1 uppercase, 1 number, 1 special char.
 */
export function validatePassword(password: string): ValidationResult {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push('Password must be at least 8 characters');
	}
	if (!/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}
	if (!/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		errors.push('Password must contain at least one special character');
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Validate that a price value is positive.
 */
export function validatePrice(value: number): boolean {
	return typeof value === 'number' && isFinite(value) && value > 0;
}

/**
 * Validate price relationships for a trade.
 * Returns warnings (soft checks) for direction mismatches.
 */
export function validatePriceRelationship(
	direction: TradeDirection,
	entryPrice: number,
	stopLoss: number,
	takeProfit: number | null,
): PriceValidationResult {
	const warnings: string[] = [];

	if (stopLoss === entryPrice) {
		return {
			valid: false,
			warnings: ['Stop loss cannot equal entry price (risk would be zero)'],
		};
	}

	if (direction === 'long') {
		if (stopLoss > entryPrice) {
			warnings.push(
				'Stop loss is above entry price for a long position — this may be incorrect',
			);
		}
		if (takeProfit !== null && takeProfit < entryPrice) {
			warnings.push(
				'Take profit is below entry price for a long position — this may be incorrect',
			);
		}
	} else {
		if (stopLoss < entryPrice) {
			warnings.push(
				'Stop loss is below entry price for a short position — this may be incorrect',
			);
		}
		if (takeProfit !== null && takeProfit > entryPrice) {
			warnings.push(
				'Take profit is above entry price for a short position — this may be incorrect',
			);
		}
	}

	return { valid: true, warnings };
}

/**
 * Validate image MIME type.
 */
export function validateMimeType(type: string): boolean {
	return ALLOWED_IMAGE_TYPES.includes(type);
}
