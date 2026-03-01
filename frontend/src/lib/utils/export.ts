import type { DataService } from '$lib/services/types.js';
import type { ExportData, ExportAccount, ExportTrade, ExportImage } from '$lib/types/index.js';
import { EXPORT_VERSION } from '$lib/types/index.js';

/**
 * Export all data as JSON via the DataService interface.
 */
export async function exportJSON(ds: DataService): Promise<Blob> {
	const user = await ds.getUser();
	const accounts = await ds.getAccounts();

	const exportAccounts: ExportAccount[] = [];

	for (const account of accounts) {
		const result = await ds.getTrades({ accountId: account.id, limit: 10000 });
		const exportTrades: ExportTrade[] = [];

		for (const trade of result.docs) {
			const images = await ds.getTradeImages(trade.id);
			const exportImages: ExportImage[] = [];

			for (const img of images) {
				let base64Data = '';
				if (img.url) {
					try {
						const imgRes = await fetch(img.url);
						const blob = await imgRes.blob();
						base64Data = await blobToBase64(blob);
					} catch {
						// Skip image if fetch fails
					}
				}
				exportImages.push({
					fileName: img.fileName,
					mimeType: img.mimeType,
					data: base64Data,
				});
			}

			exportTrades.push({
				id: trade.id,
				date: trade.date,
				tickerSymbol: trade.tickerSymbol,
				direction: trade.direction,
				entryPrice: trade.entryPrice,
				stopLoss: trade.stopLoss,
				takeProfit: trade.takeProfit,
				positionSize: trade.positionSize,
				exitPrice: trade.exitPrice,
				status: trade.status,
				rrRatio: trade.rrRatio ?? 0,
				pnlAmount: trade.pnlAmount,
				pnlPercent: trade.pnlPercent,
				notes: trade.notes,
				images: exportImages,
			});
		}

		exportAccounts.push({
			id: account.id,
			name: account.name,
			description: account.description,
			currency: account.currency,
			startingCapital: account.startingCapital ?? 0,
			trades: exportTrades,
		});
	}

	const exportData: ExportData = {
		version: EXPORT_VERSION,
		exportedAt: new Date().toISOString(),
		user: {
			displayName: user?.displayName ?? '',
			timezone: user?.timezone ?? 'UTC',
		},
		accounts: exportAccounts,
	};

	return new Blob([JSON.stringify(exportData, null, 2)], {
		type: 'application/json',
	});
}

/**
 * Export trades as CSV via the DataService interface.
 */
export async function exportCSV(ds: DataService, accountId?: string): Promise<Blob> {
	const accounts = await ds.getAccounts();
	const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

	const filters: Record<string, unknown> = { limit: 10000 };
	if (accountId) filters.accountId = accountId;

	const result = await ds.getTrades(filters);

	const headers = [
		'account_name', 'date', 'ticker', 'direction',
		'entry_price', 'stop_loss', 'take_profit', 'position_size',
		'exit_price', 'status', 'rr_ratio', 'pnl_amount', 'pnl_percent', 'notes',
	];

	const rows = result.docs.map((t) => [
		escapeCSV(accountMap.get(t.account) ?? ''),
		t.date,
		t.tickerSymbol,
		t.direction,
		String(t.entryPrice),
		String(t.stopLoss),
		String(t.takeProfit),
		t.positionSize != null ? String(t.positionSize) : '',
		t.exitPrice != null ? String(t.exitPrice) : '',
		t.status,
		t.rrRatio != null ? String(t.rrRatio) : '',
		t.pnlAmount != null ? String(t.pnlAmount) : '',
		t.pnlPercent != null ? String(t.pnlPercent) : '',
		escapeCSV(t.notes ?? ''),
	].join(','));

	const csv = [headers.join(','), ...rows].join('\n');
	return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

/**
 * Import JSON backup via the DataService interface.
 * Validates the full import file before deleting existing data to prevent data loss.
 */
export async function importJSON(
	ds: DataService,
	file: File,
): Promise<{ accounts: number; trades: number }> {
	const text = await file.text();
	let data: ExportData;

	try {
		data = JSON.parse(text) as ExportData;
	} catch {
		throw new Error('Invalid JSON file');
	}

	if (!validateExportVersion(data)) {
		throw new Error('Unsupported export version');
	}

	// Validate import data structure BEFORE deleting anything
	if (!data.accounts || !Array.isArray(data.accounts)) {
		throw new Error('Invalid export format: missing accounts');
	}
	for (const account of data.accounts) {
		if (!account.name || !account.currency) {
			throw new Error(
				`Invalid account data: "${account.name || 'unnamed'}" missing required fields`,
			);
		}
		if (!Array.isArray(account.trades)) {
			throw new Error(`Invalid account data: "${account.name}" has invalid trades`);
		}
		for (const trade of account.trades) {
			if (!trade.date || !trade.tickerSymbol || !trade.entryPrice || !trade.stopLoss) {
				throw new Error(
					`Invalid trade in account "${account.name}": missing required fields (date, ticker, entry, stopLoss)`,
				);
			}
		}
	}

	// Validation passed — now safe to delete existing data
	const existingAccounts = await ds.getAccounts();
	for (const account of existingAccounts) {
		const trades = await ds.getTrades({ accountId: account.id, limit: 10000 });
		for (const trade of trades.docs) {
			await ds.deleteTrade(trade.id);
		}
		await ds.deleteAccount(account.id);
	}

	// Update user profile
	const user = await ds.getUser();
	if (user && data.user) {
		await ds.updateUser(user.id, {
			displayName: data.user.displayName,
			timezone: data.user.timezone,
		});
	}

	let importedAccounts = 0;
	let importedTrades = 0;

	for (const accountData of data.accounts) {
		const account = await ds.createAccount({
			user: user?.id ?? '',
			name: accountData.name,
			description: accountData.description ?? undefined,
			currency: accountData.currency,
			startingCapital: accountData.startingCapital ?? 0,
		});
		importedAccounts++;

		for (const tradeData of accountData.trades) {
			const createdTrade = await ds.createTrade({
				account: account.id,
				date: tradeData.date,
				tickerSymbol: tradeData.tickerSymbol,
				direction: tradeData.direction,
				entryPrice: tradeData.entryPrice,
				stopLoss: tradeData.stopLoss,
				takeProfit: tradeData.takeProfit,
				positionSize: tradeData.positionSize ?? undefined,
				exitPrice: tradeData.exitPrice ?? undefined,
				status: tradeData.status,
				rrRatio: tradeData.rrRatio,
				pnlAmount: tradeData.pnlAmount ?? undefined,
				pnlPercent: tradeData.pnlPercent ?? undefined,
				notes: tradeData.notes ?? undefined,
			});
			importedTrades++;

			// Restore images from base64 data
			for (const imgData of tradeData.images) {
				if (imgData.data) {
					try {
						const binary = atob(imgData.data);
						const bytes = new Uint8Array(binary.length);
						for (let i = 0; i < binary.length; i++) {
							bytes[i] = binary.charCodeAt(i);
						}
						const imgFile = new File([bytes], imgData.fileName, {
							type: imgData.mimeType,
						});
						await ds.uploadImage(createdTrade.id, imgFile);
					} catch {
						// Skip image if restore fails
					}
				}
			}
		}
	}

	return { accounts: importedAccounts, trades: importedTrades };
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Validate export data version compatibility.
 */
export function validateExportVersion(data: ExportData): boolean {
	if (!data.version) return false;
	return data.version.startsWith('1.');
}

function escapeCSV(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result as string;
			resolve(result.split(',')[1] ?? '');
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
