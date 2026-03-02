<script lang="ts">
	import { goto } from '$app/navigation';
	import type { TradePosition } from '$lib/types/index.js';
	import { formatDate, formatPrice, formatCurrency, formatPercent } from '$lib/utils/formatters.js';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	interface Props {
		open: boolean;
		date: string;
		trades: TradePosition[];
		onclose: () => void;
	}

	let { open = $bindable(false), date, trades, onclose }: Props = $props();

	function handleAddTrade() {
		onclose();
		goto(`/trades/new?date=${date}`);
	}

	const totalPnL = $derived(() => {
		let amount = 0;
		let percent = 0;
		for (const t of trades) {
			amount += t.pnlAmount ?? 0;
			percent += t.pnlPercent ?? 0;
		}
		return { amount, percent };
	});
</script>

<Modal
	bind:open
	title="Trades on {formatDate(date)}"
	confirmLabel="Add Trade"
	cancelLabel="Close"
	onconfirm={handleAddTrade}
	oncancel={onclose}
>
	{#if trades.length === 0}
		<p class="no-trades">No trades on this day.</p>
	{:else}
		<div class="trade-list">
			{#each trades as trade (trade.id)}
				<div class="trade-row">
					<div class="trade-info">
						<a href="/trades/{trade.id}" class="trade-ticker">{trade.tickerSymbol}</a>
						<Badge variant={trade.direction === 'long' ? 'success' : 'danger'}>
							{trade.direction === 'long' ? 'L' : 'S'}
						</Badge>
						<span class="trade-prices">
							{formatPrice(trade.entryPrice)} &rarr; {trade.exitPrice ? formatPrice(trade.exitPrice) : '—'}
						</span>
					</div>
					<div class="trade-pnl" class:positive={trade.pnlAmount !== null && trade.pnlAmount >= 0} class:negative={trade.pnlAmount !== null && trade.pnlAmount < 0}>
						{#if trade.pnlAmount !== null}
							<span>{formatCurrency(trade.pnlAmount)}</span>
							<span class="pnl-percent">{formatPercent(trade.pnlPercent ?? 0)}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="total-row" class:positive={totalPnL().amount >= 0} class:negative={totalPnL().amount < 0}>
			<span class="total-label">Daily Total</span>
			<span class="total-value">
				{formatCurrency(totalPnL().amount)} ({formatPercent(totalPnL().percent)})
			</span>
		</div>
	{/if}
</Modal>

<style>
	.trade-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.trade-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border: 1px solid var(--color-border, #f3f4f6);
		border-radius: 0.375rem;
	}

	.trade-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.trade-ticker {
		font-weight: 600;
		color: var(--color-primary, #2563eb);
		text-decoration: none;
	}

	.trade-ticker:hover {
		text-decoration: underline;
	}

	.trade-prices {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		font-family: monospace;
	}

	.trade-pnl {
		text-align: right;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.pnl-percent {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.8;
	}

	.positive {
		color: var(--positive-text, #059669);
	}

	.negative {
		color: var(--negative-text, #dc2626);
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0.5rem;
		margin-top: 0.75rem;
		border-top: 2px solid var(--color-border, #e5e7eb);
		font-weight: 700;
		font-size: 0.9375rem;
	}

	.total-label {
		color: var(--color-text-muted, #6b7280);
	}

	.no-trades {
		color: var(--color-text-muted, #6b7280);
		text-align: center;
		padding: 1rem;
	}
</style>
