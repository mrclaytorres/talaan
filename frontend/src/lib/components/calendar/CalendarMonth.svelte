<script lang="ts">
	import type { DailyPnL } from '$lib/utils/pnl.js';
	import { formatCurrency, formatPercent } from '$lib/utils/formatters.js';
	import DayCell from './DayCell.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		year: number;
		month: number;
		dailyPnL: Map<string, DailyPnL>;
		ondayclick?: (date: string) => void;
		onprev?: () => void;
		onnext?: () => void;
	}

	let { year, month, dailyPnL, ondayclick, onprev, onnext }: Props = $props();

	const monthName = $derived(
		new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
	);

	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const calendarDays = $derived(() => {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		// Get day of week (0=Sun) => convert to Mon=0
		let startDow = firstDay.getDay() - 1;
		if (startDow < 0) startDow = 6;

		const days: { date: string; isCurrentMonth: boolean }[] = [];

		// Previous month padding
		for (let i = startDow - 1; i >= 0; i--) {
			const d = new Date(year, month, -i);
			days.push({ date: formatDateKey(d), isCurrentMonth: false });
		}

		// Current month
		for (let d = 1; d <= lastDay.getDate(); d++) {
			const dt = new Date(year, month, d);
			days.push({ date: formatDateKey(dt), isCurrentMonth: true });
		}

		// Next month padding to fill grid
		const remaining = 7 - (days.length % 7);
		if (remaining < 7) {
			for (let d = 1; d <= remaining; d++) {
				const dt = new Date(year, month + 1, d);
				days.push({ date: formatDateKey(dt), isCurrentMonth: false });
			}
		}

		return days;
	});

	const weekRows = $derived(() => {
		const days = calendarDays();
		const rows: { date: string; isCurrentMonth: boolean }[][] = [];
		for (let i = 0; i < days.length; i += 7) {
			rows.push(days.slice(i, i + 7));
		}
		return rows;
	});

	function weekTotal(week: { date: string; isCurrentMonth: boolean }[]): { amount: number; percent: number; tradeCount: number } {
		let amount = 0;
		let percent = 0;
		let tradeCount = 0;
		for (const day of week) {
			const pnl = dailyPnL.get(day.date);
			if (pnl) {
				amount += pnl.amount;
				percent += pnl.percent;
				tradeCount += pnl.tradeCount;
			}
		}
		return { amount, percent, tradeCount };
	}

	const monthTotal = $derived(() => {
		let amount = 0;
		let percent = 0;
		for (const [key, pnl] of dailyPnL) {
			if (key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
				amount += pnl.amount;
				percent += pnl.percent;
			}
		}
		return { amount, percent };
	});

	function formatDateKey(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}
</script>

<div class="calendar-month">
	<div class="month-header">
		<Button variant="secondary" size="sm" onclick={onprev}>&larr;</Button>
		<h2 class="month-title">{monthName}</h2>
		<Button variant="secondary" size="sm" onclick={onnext}>&rarr;</Button>
	</div>

	<div class="weekday-header">
		{#each weekDays as day}
			<span class="weekday">{day}</span>
		{/each}
		<span class="weekday week-total-header">Total</span>
	</div>

	<div class="days-grid">
		{#each weekRows() as week, weekIdx}
			{#each week as day (day.date)}
				<DayCell
					date={day.date}
					pnl={dailyPnL.get(day.date) ?? null}
					isCurrentMonth={day.isCurrentMonth}
					onclick={ondayclick}
				/>
			{/each}
			{@const wt = weekTotal(week)}
			<div
				class="week-total-cell"
				class:positive={wt.amount > 0}
				class:negative={wt.amount < 0}
				class:neutral={wt.amount === 0}
			>
				{#if wt.amount !== 0}
					<span class="week-total-amount">{formatCurrency(wt.amount)}</span>
					<span class="week-total-percent">{formatPercent(wt.percent)}</span>
				{/if}
				{#if wt.tradeCount > 0}
					<span class="week-total-trades">{wt.tradeCount} trade{wt.tradeCount === 1 ? '' : 's'}</span>
				{/if}
			</div>
		{/each}
	</div>

	<div class="month-summary" class:positive={monthTotal().amount > 0} class:negative={monthTotal().amount < 0}>
		<span class="summary-label">Monthly Total:</span>
		<span class="summary-value">
			{formatCurrency(monthTotal().amount)} ({formatPercent(monthTotal().percent)})
		</span>
	</div>
</div>

<style>
	.calendar-month {
		background: var(--color-bg, #ffffff);
		border: none;
		border-radius: 0.75rem;
		padding: 1rem;
	}

	.month-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.month-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.weekday-header {
		display: grid;
		grid-template-columns: repeat(7, 1fr) auto;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}

	.weekday {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		padding: 0.25rem;
	}

	.week-total-header {
		min-width: 4rem;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr) auto;
		gap: 0.25rem;
	}

	.week-total-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		min-height: 4.5rem;
		min-width: 4rem;
		border: 1px solid var(--color-border, #f3f4f6);
		border-radius: 0.375rem;
		background: var(--color-bg-muted, #f9fafb);
		font-size: 0.75rem;
	}

	.week-total-cell.positive {
		background-color: var(--positive-bg);
		border-color: var(--positive, #34d399);
	}

	.week-total-cell.negative {
		background-color: var(--negative-bg);
		border-color: var(--negative, #f87171);
	}

	.week-total-amount {
		font-weight: 700;
		font-size: 0.625rem;
		line-height: 1.2;
	}

	.week-total-cell.positive .week-total-amount {
		color: var(--positive-text, #059669);
	}

	.week-total-cell.negative .week-total-amount {
		color: var(--negative-text, #dc2626);
	}

	.week-total-percent {
		font-size: 0.5625rem;
		color: var(--text-secondary, #52525b);
	}

	.week-total-trades {
		font-size: 0.5625rem;
		color: var(--color-text-muted, #6b7280);
		margin-top: 0.125rem;
	}

	@media (max-width: 640px) {
		.calendar-month {
			padding: 0;
		}

		.weekday-header {
			grid-template-columns: repeat(7, 1fr);
		}

		.days-grid {
			grid-template-columns: repeat(7, 1fr);
		}

		.week-total-header,
		.week-total-cell {
			display: none;
		}
	}

	.month-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		padding: 0.75rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.month-summary.positive {
		color: var(--positive-text, #059669);
	}

	.month-summary.negative {
		color: var(--negative-text, #dc2626);
	}

	.summary-label {
		color: var(--color-text-muted, #6b7280);
		font-weight: 500;
	}
</style>
