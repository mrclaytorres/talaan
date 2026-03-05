/**
 * Format a number as currency.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

/**
 * Format a number as percentage.
 */
export function formatPercent(value: number): string {
	const sign = value > 0 ? '+' : '';
	return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a date string using the user's timezone.
 */
export function formatDate(
	date: string | Date,
	timezone: string = 'UTC',
	style: 'short' | 'medium' | 'long' = 'medium',
): string {
	const d = typeof date === 'string' ? new Date(date) : date;

	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
	};

	switch (style) {
		case 'short':
			options.month = '2-digit';
			options.day = '2-digit';
			options.year = '2-digit';
			break;
		case 'medium':
			options.month = 'short';
			options.day = 'numeric';
			options.year = 'numeric';
			break;
		case 'long':
			options.month = 'long';
			options.day = 'numeric';
			options.year = 'numeric';
			options.weekday = 'short';
			break;
	}

	return new Intl.DateTimeFormat(undefined, options).format(d);
}

/**
 * Format R:R ratio as "1:X" display string.
 */
export function formatRRRatio(ratio: number | null): string {
	if (ratio === null) return '—';
	if (ratio === 0) return '1:0';
	if (ratio < 0) return `−${Math.abs(ratio).toFixed(1)}R`;
	return `1:${ratio.toFixed(1)}`;
}

/**
 * Format a price preserving the exact stored value.
 * No artificial rounding — displays whatever precision the user entered.
 */
export function formatPrice(price: number): string {
	return price.toString();
}

/**
 * Detect whether a string contains HTML tags.
 */
export function isHtmlContent(str: string): boolean {
	return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Convert plain text (newline-separated) to simple HTML paragraphs.
 */
export function plainTextToHtml(text: string): string {
	return text
		.split(/\n\n+/)
		.map((block) => {
			const escaped = block
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/\n/g, '<br>');
			return `<p>${escaped}</p>`;
		})
		.join('');
}
