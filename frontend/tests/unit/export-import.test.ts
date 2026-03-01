import { describe, it, expect } from 'vitest';
import { validateExportVersion } from '$lib/utils/export.js';
import type { ExportData } from '$lib/types/index.js';

describe('validateExportVersion', () => {
	it('accepts version 1.0.0', () => {
		expect(validateExportVersion({ version: '1.0.0' } as ExportData)).toBe(true);
	});

	it('accepts version 1.2.3', () => {
		expect(validateExportVersion({ version: '1.2.3' } as ExportData)).toBe(true);
	});

	it('accepts version 1.99.0', () => {
		expect(validateExportVersion({ version: '1.99.0' } as ExportData)).toBe(true);
	});

	it('rejects version 2.0.0', () => {
		expect(validateExportVersion({ version: '2.0.0' } as ExportData)).toBe(false);
	});

	it('rejects version 0.1.0', () => {
		expect(validateExportVersion({ version: '0.1.0' } as ExportData)).toBe(false);
	});

	it('rejects missing version', () => {
		expect(validateExportVersion({} as ExportData)).toBe(false);
	});

	it('rejects empty version string', () => {
		expect(validateExportVersion({ version: '' } as ExportData)).toBe(false);
	});
});
