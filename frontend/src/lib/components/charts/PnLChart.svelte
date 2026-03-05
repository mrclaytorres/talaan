<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { DailyPnLRow } from '$lib/services/types.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';

	Chart.register(...registerables);

	interface Props {
		dailyData: DailyPnLRow[];
	}

	let { dailyData }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;
	let mode = $state<'pnl' | 'winloss'>('pnl');

	type TimePreset = 'daily' | 'weekly' | 'monthly' | 'yearly';
	let timePreset = $state<TimePreset>('weekly');

	function getThemeColors() {
		const isDark = themeStore.current === 'dark';
		return {
			positive: isDark ? '#34d399' : '#059669',
			negative: isDark ? '#f87171' : '#dc2626',
			gridColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(228, 228, 231, 0.8)',
			textColor: isDark ? '#a1a1aa' : '#71717a',
			bgPositive: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
			bgNegative: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.1)',
		};
	}

	/** Get ISO week Monday key (YYYY-Www) for a date string */
	function getWeekKey(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		const monday = new Date(d);
		monday.setDate(diff);
		const month = monday.toLocaleString(undefined, { month: 'short' });
		return `${month} ${monday.getDate()}`;
	}

	interface AggregatedPoint {
		label: string;
		amount: number;
		wins: number;
		losses: number;
	}

	function aggregateByPreset(data: DailyPnLRow[], preset: TimePreset): AggregatedPoint[] {
		if (preset === 'daily') {
			return data.map((d) => ({
				label: d.date.slice(5),
				amount: d.amount,
				wins: d.wins,
				losses: d.losses,
			}));
		}

		const map = new Map<string, AggregatedPoint>();

		for (const row of data) {
			let key: string;
			if (preset === 'weekly') {
				key = getWeekKey(row.date);
			} else if (preset === 'monthly') {
				const dt = new Date(row.date + 'T12:00:00');
				key = `${dt.toLocaleString(undefined, { month: 'short' })} ${dt.getFullYear().toString().slice(2)}`;
			} else {
				key = row.date.slice(0, 4);
			}

			const existing = map.get(key);
			if (existing) {
				existing.amount += row.amount;
				existing.wins += row.wins;
				existing.losses += row.losses;
			} else {
				map.set(key, { label: key, amount: row.amount, wins: row.wins, losses: row.losses });
			}
		}

		return [...map.values()];
	}

	function renderChart() {
		if (!canvas) return;
		if (chart) chart.destroy();

		const colors = getThemeColors();
		const aggregated = aggregateByPreset(dailyData, timePreset);

		if (mode === 'pnl') {
			let cumulative = 0;
			const labels: string[] = [];
			const values: number[] = [];
			for (const point of aggregated) {
				cumulative += point.amount;
				labels.push(point.label);
				values.push(cumulative);
			}

			chart = new Chart(canvas, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Cumulative P&L',
							data: values,
							borderColor: values.length > 0 && values[values.length - 1] >= 0
								? colors.positive
								: colors.negative,
							backgroundColor: values.length > 0 && values[values.length - 1] >= 0
								? colors.bgPositive
								: colors.bgNegative,
							fill: true,
							tension: 0.3,
							pointRadius: 3,
							pointHoverRadius: 5,
							borderWidth: 2,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { intersect: false, mode: 'index' },
					plugins: {
						legend: { display: false },
						tooltip: {
							backgroundColor: themeStore.current === 'dark' ? '#27272a' : '#fff',
							titleColor: themeStore.current === 'dark' ? '#fafafa' : '#18181b',
							bodyColor: themeStore.current === 'dark' ? '#a1a1aa' : '#52525b',
							borderColor: themeStore.current === 'dark' ? '#3f3f46' : '#e4e4e7',
							borderWidth: 1,
							padding: 10,
							callbacks: {
								label: (ctx) => `$${ctx.parsed.y?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}`,
							},
						},
					},
					scales: {
						x: {
							grid: { color: colors.gridColor },
							ticks: { color: colors.textColor, font: { size: 10 } },
						},
						y: {
							grid: { color: colors.gridColor },
							ticks: {
								color: colors.textColor,
								font: { size: 10 },
								callback: (v) => `$${Number(v).toLocaleString()}`,
							},
						},
					},
				},
			});
		} else {
			const labels = aggregated.map((d) => d.label);

			chart = new Chart(canvas, {
				type: 'bar',
				data: {
					labels,
					datasets: [
						{
							label: 'Wins',
							data: aggregated.map((d) => d.wins),
							backgroundColor: colors.positive,
							borderRadius: 4,
						},
						{
							label: 'Losses',
							data: aggregated.map((d) => d.losses),
							backgroundColor: colors.negative,
							borderRadius: 4,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							labels: { color: colors.textColor, font: { size: 11 } },
						},
						tooltip: {
							backgroundColor: themeStore.current === 'dark' ? '#27272a' : '#fff',
							titleColor: themeStore.current === 'dark' ? '#fafafa' : '#18181b',
							bodyColor: themeStore.current === 'dark' ? '#a1a1aa' : '#52525b',
							borderColor: themeStore.current === 'dark' ? '#3f3f46' : '#e4e4e7',
							borderWidth: 1,
							padding: 10,
						},
					},
					scales: {
						x: {
							grid: { color: colors.gridColor },
							ticks: { color: colors.textColor, font: { size: 10 } },
						},
						y: {
							grid: { color: colors.gridColor },
							ticks: {
								color: colors.textColor,
								font: { size: 10 },
								stepSize: 1,
							},
							beginAtZero: true,
						},
					},
				},
			});
		}
	}

	onMount(() => {
		renderChart();
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	$effect(() => {
		void dailyData;
		void mode;
		void timePreset;
		void themeStore.current;
		renderChart();
	});
</script>

<div class="chart-container">
	<div class="chart-header">
		<span class="chart-title">{mode === 'pnl' ? 'P&L Over Time' : 'Wins vs Losses'}</span>
		<div class="chart-controls">
			<div class="chart-toggle">
				<button class="toggle-btn" class:active={timePreset === 'daily'} onclick={() => (timePreset = 'daily')}>D</button>
				<button class="toggle-btn" class:active={timePreset === 'weekly'} onclick={() => (timePreset = 'weekly')}>W</button>
				<button class="toggle-btn" class:active={timePreset === 'monthly'} onclick={() => (timePreset = 'monthly')}>M</button>
				<button class="toggle-btn" class:active={timePreset === 'yearly'} onclick={() => (timePreset = 'yearly')}>Y</button>
			</div>
			<div class="chart-toggle">
				<button class="toggle-btn" class:active={mode === 'pnl'} onclick={() => (mode = 'pnl')}>P&L</button>
				<button class="toggle-btn" class:active={mode === 'winloss'} onclick={() => (mode = 'winloss')}>W/L</button>
			</div>
		</div>
	</div>
	<div class="chart-body">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
	.chart-container {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 16px;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chart-title {
		font-size: 14px;
		font-weight: 600;
	}

	.chart-controls {
		display: flex;
		gap: 6px;
	}

	.chart-toggle {
		display: inline-flex;
		background: var(--bg-elevated);
		border-radius: var(--radius-sm);
		padding: 2px;
		gap: 2px;
	}

	.toggle-btn {
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
		background: transparent;
		font-family: var(--font-sans);
	}

	.toggle-btn:hover {
		color: var(--text-secondary);
	}

	.toggle-btn.active {
		background: var(--bg-surface);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}

	.chart-body {
		height: 260px;
		position: relative;
	}
</style>
