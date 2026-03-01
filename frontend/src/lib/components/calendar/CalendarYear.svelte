<script lang="ts">
	import type { MonthlyPnL } from '$lib/utils/pnl.js';
	import { formatCurrency, formatPercent } from '$lib/utils/formatters.js';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		year: number;
		monthlyPnL: Map<string, MonthlyPnL>;
		onmonthclick?: (year: number, month: number) => void;
		onprev?: () => void;
		onnext?: () => void;
	}

	let { year, monthlyPnL, onmonthclick, onprev, onnext }: Props = $props();

	const months = $derived(() => {
		return Array.from({ length: 12 }, (_, i) => {
			const key = `${year}-${String(i + 1).padStart(2, '0')}`;
			const name = new Date(year, i, 1).toLocaleString(undefined, { month: 'short' });
			const pnl = monthlyPnL.get(key) ?? null;
			return { index: i, name, key, pnl };
		});
	});

	const yearTotal = $derived(() => {
		let amount = 0;
		let percent = 0;
		for (const [key, pnl] of monthlyPnL) {
			if (key.startsWith(`${year}-`)) {
				amount += pnl.amount;
				percent += pnl.percent;
			}
		}
		return { amount, percent };
	});

	function getPnlClass(amount: number): string {
		if (amount > 0) return 'positive';
		if (amount < 0) return 'negative';
		return '';
	}
</script>

<div class="calendar-year">
	<div class="year-header">
		<Button variant="secondary" size="sm" onclick={onprev}>&larr;</Button>
		<h2 class="year-title">{year}</h2>
		<Button variant="secondary" size="sm" onclick={onnext}>&rarr;</Button>
	</div>

	<div class="months-grid">
		{#each months() as m (m.key)}
			<button
				class="month-card {m.pnl ? getPnlClass(m.pnl.amount) : ''}"
				class:has-data={m.pnl !== null}
				onclick={() => onmonthclick?.(year, m.index)}
				type="button"
			>
				<span class="month-name">{m.name}</span>
				{#if m.pnl}
					<span class="month-pnl">{formatCurrency(m.pnl.amount)}</span>
					<span class="month-percent">{formatPercent(m.pnl.percent)}</span>
					<span class="month-days">{m.pnl.tradingDays} day{m.pnl.tradingDays === 1 ? '' : 's'}</span>
				{:else}
					<span class="month-empty">No trades</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="year-summary" class:positive={yearTotal().amount > 0} class:negative={yearTotal().amount < 0}>
		<span class="summary-label">Year Total:</span>
		<span class="summary-value">
			{formatCurrency(yearTotal().amount)} ({formatPercent(yearTotal().percent)})
		</span>
	</div>
</div>

<style>
	.calendar-year {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.year-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.year-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}

	.months-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.months-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.month-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 0.5rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5rem;
		background: var(--color-bg-page, #f9fafb);
		cursor: pointer;
		transition: transform 0.1s;
	}

	.month-card:hover {
		transform: scale(1.02);
	}

	.month-card.positive {
		background-color: var(--positive-bg);
		border-color: var(--positive, #34d399);
	}

	.month-card.negative {
		background-color: var(--negative-bg);
		border-color: var(--negative, #f87171);
	}

	.month-name {
		font-weight: 600;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
		color: var(--text-primary, #18181b);
	}

	.month-pnl {
		font-weight: 700;
		font-size: 0.8125rem;
	}

	.positive .month-pnl {
		color: var(--positive-text, #059669);
	}

	.negative .month-pnl {
		color: var(--negative-text, #dc2626);
	}

	.month-percent {
		font-size: 0.6875rem;
		color: var(--text-secondary, #52525b);
	}

	.month-days {
		font-size: 0.625rem;
		color: var(--color-text-muted, #6b7280);
		margin-top: 0.125rem;
	}

	.month-empty {
		font-size: 0.6875rem;
		color: var(--color-text-muted, #9ca3af);
	}

	.year-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		padding: 0.75rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.year-summary.positive {
		color: var(--positive-text, #059669);
	}

	.year-summary.negative {
		color: var(--negative-text, #dc2626);
	}

	.summary-label {
		color: var(--color-text-muted, #6b7280);
		font-weight: 500;
	}
</style>
