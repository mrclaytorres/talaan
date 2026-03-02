<script lang="ts">
	import type { TradePosition, CreateTradeData, TradeDirection } from '$lib/types/index.js';
	import { calculateRRRatio, inferDirection } from '$lib/utils/calculations.js';
	import { validatePrice, validatePriceRelationship } from '$lib/utils/validators.js';
	import { getDataService } from '$lib/services/index.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import RRBadge from './RRBadge.svelte';
	import TickerSearch from './TickerSearch.svelte';

	interface Props {
		trade?: TradePosition;
		accountId: string;
		startingCapital?: number;
		initialDate?: string;
		onsubmit: (data: CreateTradeData) => Promise<void>;
		oncancel: () => void;
	}

	let { trade, accountId, startingCapital = 0, initialDate, onsubmit, oncancel }: Props = $props();

	let loading = $state(false);
	let errors = $state<Record<string, string>>({});
	let warnings = $state<string[]>([]);

	// Form fields
	let date = $state(trade?.date?.split('T')[0] ?? initialDate ?? new Date().toISOString().split('T')[0]);
	let tickerSymbol = $state(trade?.tickerSymbol ?? '');
	let direction = $state<TradeDirection>(trade?.direction ?? 'long');
	let entryPrice = $state<number | string>(trade?.entryPrice ?? '');
	let stopLoss = $state<number | string>(trade?.stopLoss ?? '');
	let takeProfit = $state<number | string>(trade?.takeProfit ?? '');
	let positionSize = $state<number | string>(trade?.positionSize ?? '');
	let exitPrice = $state<number | string>(trade?.exitPrice ?? '');
	let pnlAmount = $state<number | string>(trade?.pnlAmount ?? '');
	let pnlPercent = $state<number | string>(trade?.pnlPercent ?? '');
	// True after the user manually types in the P&L % field; cleared when they type in P&L Amount.
	let pnlPercentManual = $state(false);
	let status = $state(trade?.status ?? 'open');
	let notes = $state(trade?.notes ?? '');

	const directionOptions = [
		{ value: 'long', label: 'Long' },
		{ value: 'short', label: 'Short' },
	];

	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'closed', label: 'Closed' },
	];

	// Live R:R calculation
	const liveRR = $derived(() => {
		const e = Number(entryPrice);
		const sl = Number(stopLoss);
		const tp = Number(takeProfit);
		if (e > 0 && sl > 0 && tp > 0) {
			return calculateRRRatio(e, sl, tp);
		}
		return null;
	});

	// Auto-infer direction when entry/SL change
	$effect(() => {
		const e = Number(entryPrice);
		const sl = Number(stopLoss);
		if (e > 0 && sl > 0 && e !== sl && !trade) {
			direction = inferDirection(e, sl);
		}
	});

	// Update warnings on price changes
	$effect(() => {
		const e = Number(entryPrice);
		const sl = Number(stopLoss);
		const tp = Number(takeProfit);
		if (e > 0 && sl > 0) {
			const result = validatePriceRelationship(direction, e, sl, tp || null);
			warnings = result.warnings;
		} else {
			warnings = [];
		}
	});

	// Recalculate P&L % = (amount / startingCapital) × 100.
	// Reads amount from the DOM event so the value is always current (no Svelte
	// reactivity timing issues — $effect wrote to pnlPercent which interacted with
	// bind:value in ways that corrupted pnlAmount on save).
	function calcPnlPercent(e: Event) {
		pnlPercentManual = false;
		if (startingCapital <= 0) return;
		const amount = (e.target as HTMLInputElement).valueAsNumber;
		if (isNaN(amount)) return;
		pnlPercent = Math.round(((amount / startingCapital) * 100) * 100) / 100;
	}

	function isEmptyHtml(html: string): boolean {
		if (!html) return true;
		const stripped = html.replace(/<[^>]*>/g, '').trim();
		return stripped.length === 0;
	}

	async function handleNoteImageUpload(file: File): Promise<string> {
		if (!trade) throw new Error('Save the trade first to upload images');
		const ds = getDataService();
		const image = await ds.uploadImage(trade.id, file);
		return image.url ?? image.sizes?.medium?.url ?? image.filePath;
	}

	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!date) newErrors.date = 'Date is required';
		if (!tickerSymbol.trim()) newErrors.tickerSymbol = 'Ticker is required';
		if (!validatePrice(Number(entryPrice))) newErrors.entryPrice = 'Invalid price';
		if (!validatePrice(Number(stopLoss))) newErrors.stopLoss = 'Invalid price';
		if (takeProfit !== '' && !validatePrice(Number(takeProfit))) {
			newErrors.takeProfit = 'Invalid price';
		} else if (status !== 'closed' && !takeProfit) {
			newErrors.takeProfit = 'Required for open trades';
		}

		if (Number(stopLoss) === Number(entryPrice)) {
			newErrors.stopLoss = 'Cannot equal entry price';
		}

		if (positionSize && !validatePrice(Number(positionSize))) {
			newErrors.positionSize = 'Must be greater than 0';
		}

		if (status === 'closed' && !validatePrice(Number(exitPrice))) {
			newErrors.exitPrice = 'Required when closing a trade';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!validate()) return;

		loading = true;
		try {
			await onsubmit({
				account: accountId,
				date,
				tickerSymbol: tickerSymbol.trim().toUpperCase(),
				direction,
				entryPrice: Number(entryPrice),
				stopLoss: Number(stopLoss),
				takeProfit: takeProfit ? Number(takeProfit) : Number(stopLoss),
				positionSize: positionSize ? Number(positionSize) : undefined,
				exitPrice: exitPrice ? Number(exitPrice) : undefined,
				status,
				pnlAmount: pnlAmount !== '' ? Number(pnlAmount) : undefined,
				pnlPercent: pnlPercent !== '' ? Number(pnlPercent) : undefined,
				notes: isEmptyHtml(notes) ? undefined : notes,
			});
		} finally {
			loading = false;
		}
	}
</script>

<form class="trade-form" onsubmit={handleSubmit}>
	<div class="form-grid">
		<Input type="date" label="Date" bind:value={date} error={errors.date} required />
		<TickerSearch bind:value={tickerSymbol} onchange={(s) => (tickerSymbol = s)} error={errors.tickerSymbol} />
	</div>

	<div class="form-grid">
		<Select label="Direction" bind:value={direction} options={directionOptions} />
		<Select label="Status" bind:value={status} options={statusOptions} />
	</div>

	<div class="form-grid form-grid-3">
		<Input type="number" label="Entry Price" bind:value={entryPrice} step="any" error={errors.entryPrice} required />
		<Input type="number" label="Stop Loss" bind:value={stopLoss} step="any" error={errors.stopLoss} required />
		<Input type="number" label="Take Profit" bind:value={takeProfit} step="any" error={errors.takeProfit} required={status !== 'closed'} placeholder={status === 'closed' ? 'Optional' : ''} />
	</div>

	<div class="rr-display">
		<span class="rr-label">Risk:Reward</span>
		<RRBadge ratio={liveRR()} />
	</div>

	{#if warnings.length > 0}
		<div class="warnings" role="alert">
			{#each warnings as warning}
				<p class="warning-text">⚠ {warning}</p>
			{/each}
		</div>
	{/if}

	<div class="form-grid">
		<Input type="number" label="Position Size" bind:value={positionSize} step="any" error={errors.positionSize} placeholder="Optional" />
		{#if status === 'closed'}
			<Input type="number" label="Exit Price" bind:value={exitPrice} step="any" error={errors.exitPrice} required />
		{/if}
	</div>

	<div class="form-grid">
		<Input type="number" label="P&L Amount ($)" bind:value={pnlAmount} step="any" placeholder="Optional" oninput={calcPnlPercent} />
		<Input type="number" label="P&L (%)" bind:value={pnlPercent} step="any" placeholder="Auto from P&L ÷ capital" oninput={() => { pnlPercentManual = true; }} />
	</div>

	<div class="notes-field">
		<span class="notes-label">Notes</span>
		<RichTextEditor
			content={notes}
			placeholder="Trade rationale, lessons learned..."
			onchange={(html) => (notes = html)}
			uploadImage={trade ? handleNoteImageUpload : undefined}
		/>
	</div>

	<div class="form-actions">
		<Button variant="secondary" onclick={oncancel}>Cancel</Button>
		<Button type="submit" {loading}>
			{trade ? 'Save Changes' : 'Add Trade'}
		</Button>
	</div>
</form>

<style>
	.trade-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-grid-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}

	@media (max-width: 640px) {
		.form-grid-3 {
			grid-template-columns: 1fr;
		}
	}

	.rr-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-page, #f9fafb);
		border-radius: 0.5rem;
	}

	.rr-label {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.warnings {
		padding: 0.75rem;
		background-color: #fef3c7;
		border: 1px solid #fcd34d;
		border-radius: 0.5rem;
	}

	.warning-text {
		margin: 0;
		font-size: 0.875rem;
		color: #92400e;
	}

	.notes-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text, #374151);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
