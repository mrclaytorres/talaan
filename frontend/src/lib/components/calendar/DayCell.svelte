<script lang="ts">
	import type { DailyPnL } from '$lib/utils/pnl.js';
	import { formatCurrency, formatPercent } from '$lib/utils/formatters.js';

	interface Props {
		date: string;
		pnl: DailyPnL | null;
		isCurrentMonth: boolean;
		onclick?: (date: string) => void;
	}

	let { date, pnl, isCurrentMonth, onclick }: Props = $props();

	const dayNumber = $derived(new Date(date + 'T12:00:00').getDate());

	const cellClass = $derived(() => {
		if (!pnl || !isCurrentMonth) return 'neutral';
		if (pnl.amount > 0) return 'positive';
		if (pnl.amount < 0) return 'negative';
		return 'neutral';
	});

	function handleClick() {
		if (isCurrentMonth && onclick) {
			onclick(date);
		}
	}
</script>

<button
	class="day-cell {cellClass()}"
	class:dimmed={!isCurrentMonth}
	class:has-trades={pnl !== null && pnl.tradeCount > 0}
	class:empty-day={isCurrentMonth && (!pnl || pnl.tradeCount === 0)}
	onclick={handleClick}
	disabled={!isCurrentMonth}
	type="button"
	aria-label="{date}: {pnl ? formatCurrency(pnl.amount) : 'No trades — click to add'}"
>
	<span class="day-number">{dayNumber}</span>
	{#if pnl && isCurrentMonth}
		<span class="day-pnl">{formatCurrency(pnl.amount)}</span>
		<span class="day-percent">{formatPercent(pnl.percent)}</span>
		<span class="day-count">{pnl.tradeCount} trade{pnl.tradeCount !== 1 ? 's' : ''}</span>
	{:else if isCurrentMonth}
		<span class="add-hint">+</span>
	{/if}
</button>

<style>
	.day-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 0.25rem;
		min-height: 4.5rem;
		border: 1px solid var(--color-border, #f3f4f6);
		border-radius: 0.375rem;
		background: var(--color-bg, #ffffff);
		cursor: default;
		font-size: 0.75rem;
		transition: background-color 0.15s;
	}

	.day-cell.has-trades {
		cursor: pointer;
	}

	.day-cell.has-trades:hover {
		opacity: 0.85;
	}

	.day-cell.empty-day {
		cursor: pointer;
	}

	.day-cell.empty-day:hover {
		background: var(--color-hover, #f3f4f6);
		border-color: var(--color-primary, #2563eb);
	}

	.add-hint {
		font-size: 1rem;
		color: var(--color-border, #d1d5db);
		margin-top: auto;
		margin-bottom: auto;
		line-height: 1;
	}

	.day-cell.empty-day:hover .add-hint {
		color: var(--color-primary, #2563eb);
	}

	.day-cell.positive {
		background-color: var(--positive-bg);
		border-color: var(--positive, #34d399);
	}

	.day-cell.negative {
		background-color: var(--negative-bg);
		border-color: var(--negative, #f87171);
	}

	.day-cell.dimmed {
		opacity: 0.4;
	}

	.day-number {
		font-weight: 600;
		font-size: 0.75rem;
		color: var(--text-primary, #374151);
		margin-bottom: 0.125rem;
	}

	.day-pnl {
		font-weight: 600;
		font-size: 0.625rem;
		line-height: 1.2;
	}

	.positive .day-pnl {
		color: var(--positive-text, #059669);
	}

	.negative .day-pnl {
		color: var(--negative-text, #dc2626);
	}

	.day-percent {
		font-size: 0.5625rem;
		color: var(--text-secondary, #52525b);
	}

	.day-count {
		font-size: 0.5rem;
		color: var(--text-muted, #71717a);
		margin-top: 0.0625rem;
	}
</style>
