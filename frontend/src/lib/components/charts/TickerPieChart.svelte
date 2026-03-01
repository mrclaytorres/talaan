<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { TradePosition } from '$lib/types/trade.js';
	import { buildTickerDistribution } from '$lib/utils/chart-data.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';

	Chart.register(...registerables);

	interface Props {
		trades: TradePosition[];
	}

	let { trades }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const PALETTE = [
		'#14b8a6', // teal (accent)
		'#8b5cf6', // violet
		'#f59e0b', // amber
		'#ef4444', // red
		'#3b82f6', // blue
		'#ec4899', // pink
		'#22c55e', // green
		'#f97316', // orange
		'#a1a1aa', // zinc (Other)
	];

	function renderChart() {
		if (!canvas) return;
		if (chart) chart.destroy();

		const data = buildTickerDistribution(trades, 8);
		const isDark = themeStore.current === 'dark';

		if (data.length === 0) {
			chart = null;
			return;
		}

		chart = new Chart(canvas, {
			type: 'doughnut',
			data: {
				labels: data.map((d) => d.ticker),
				datasets: [
					{
						data: data.map((d) => d.count),
						backgroundColor: data.map((_, i) => PALETTE[i % PALETTE.length]),
						borderColor: isDark ? '#18181b' : '#ffffff',
						borderWidth: 2,
						hoverOffset: 6,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '60%',
				plugins: {
					legend: {
						position: 'right',
						labels: {
							color: isDark ? '#a1a1aa' : '#52525b',
							font: { size: 11, family: 'Inter' },
							padding: 10,
							usePointStyle: true,
							pointStyleWidth: 8,
							generateLabels: (chart) => {
								const dataset = chart.data.datasets[0];
								return (chart.data.labels as string[]).map((label, i) => ({
									text: `${label} — ${dataset.data[i]}`,
									fillStyle: (dataset.backgroundColor as string[])[i],
									strokeStyle: 'transparent',
									hidden: false,
									index: i,
									pointStyle: 'circle' as const,
								}));
							},
						},
					},
					tooltip: {
						backgroundColor: isDark ? '#27272a' : '#fff',
						titleColor: isDark ? '#fafafa' : '#18181b',
						bodyColor: isDark ? '#a1a1aa' : '#52525b',
						borderColor: isDark ? '#3f3f46' : '#e4e4e7',
						borderWidth: 1,
						padding: 10,
						callbacks: {
							label: (ctx) => {
								const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
								const pct = Math.round(((ctx.parsed as number) / total) * 100);
								return ` ${ctx.label}: ${ctx.parsed} trades (${pct}%)`;
							},
						},
					},
				},
			},
		});
	}

	onMount(() => {
		renderChart();
	});

	onDestroy(() => {
		if (chart) chart.destroy();
	});

	$effect(() => {
		void trades;
		void themeStore.current;
		renderChart();
	});
</script>

<div class="chart-container">
	<div class="chart-header">
		<span class="chart-title">Ticker Distribution</span>
		<span class="chart-sub">{trades.length} total trades</span>
	</div>
	<div class="chart-body">
		{#if trades.length === 0}
			<div class="empty">No trades to display</div>
		{:else}
			<canvas bind:this={canvas}></canvas>
		{/if}
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
	}

	.chart-title {
		font-size: 14px;
		font-weight: 600;
	}

	.chart-sub {
		font-size: 12px;
		color: var(--text-muted);
	}

	.chart-body {
		height: 260px;
		position: relative;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
		font-size: 13px;
	}
</style>
