import { describe, it, expect } from 'vitest';
import {
	isHtmlContent,
	plainTextToHtml,
	formatRRRatio,
} from '$lib/utils/formatters.js';

describe('isHtmlContent', () => {
	it('detects paragraph tags', () => {
		expect(isHtmlContent('<p>Hello</p>')).toBe(true);
	});

	it('detects inline formatting tags', () => {
		expect(isHtmlContent('<strong>bold</strong>')).toBe(true);
		expect(isHtmlContent('text with <em>emphasis</em>')).toBe(true);
	});

	it('detects self-closing tags', () => {
		expect(isHtmlContent('<br/>')).toBe(true);
		expect(isHtmlContent('<img src="test.png"/>')).toBe(true);
	});

	it('returns false for plain text', () => {
		expect(isHtmlContent('Hello world')).toBe(false);
		expect(isHtmlContent('No tags here')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isHtmlContent('')).toBe(false);
	});

	it('returns false for text with angle brackets that are not tags', () => {
		expect(isHtmlContent('5 < 10')).toBe(false);
	});
});

describe('plainTextToHtml', () => {
	it('wraps single line in <p> tags', () => {
		expect(plainTextToHtml('Hello')).toBe('<p>Hello</p>');
	});

	it('converts double newlines to separate paragraphs', () => {
		const result = plainTextToHtml('Line 1\n\nLine 2');
		expect(result).toBe('<p>Line 1</p><p>Line 2</p>');
	});

	it('converts single newlines to <br> within a paragraph', () => {
		const result = plainTextToHtml('Line 1\nLine 2');
		expect(result).toBe('<p>Line 1<br>Line 2</p>');
	});

	it('escapes HTML special characters', () => {
		const result = plainTextToHtml('Price < $100 & "cheap"');
		expect(result).toContain('&lt;');
		expect(result).toContain('&amp;');
		expect(result).not.toContain('<$');
	});
});

describe('formatRRRatio negative values', () => {
	it('formats negative R:R with minus sign and R suffix', () => {
		const result = formatRRRatio(-1);
		expect(result).toBe('−1.0R');
	});

	it('formats large negative R:R', () => {
		const result = formatRRRatio(-2.5);
		expect(result).toBe('−2.5R');
	});

	it('formats positive R:R in 1:X format', () => {
		expect(formatRRRatio(3)).toBe('1:3.0');
	});

	it('formats zero R:R as 1:0', () => {
		expect(formatRRRatio(0)).toBe('1:0');
	});

	it('formats null R:R as dash', () => {
		expect(formatRRRatio(null)).toBe('—');
	});
});
