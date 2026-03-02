<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { getDataService } from '$lib/services/index.js';
	import { formatDate, formatPrice, formatCurrency, formatPercent, formatRRRatio } from '$lib/utils/formatters.js';
	import type { TradeImage } from '$lib/types/index.js';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import RRBadge from '$lib/components/trade/RRBadge.svelte';
	import ImageAttachment from '$lib/components/trade/ImageAttachment.svelte';
	import RichTextDisplay from '$lib/components/ui/RichTextDisplay.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let deleteModalOpen = $state(false);
	let closeModalOpen = $state(false);
	let closeExitPrice = $state<number | string>('');
	let error = $state('');
	let images = $state<TradeImage[]>([]);

	const tradeId = $derived($page.params.id ?? '');
	const trade = $derived(tradesStore.currentTrade);

	onMount(async () => {
		await tradesStore.loadTrade(tradeId);
		try {
			images = await getDataService().getTradeImages(tradeId);
		} catch {
			// non-critical
		}
	});

	async function handleDelete() {
		try {
			await tradesStore.deleteTrade(tradeId);
			await goto('/dashboard');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete trade';
		}
		deleteModalOpen = false;
	}

	async function handleCloseTrade() {
		const price = Number(closeExitPrice);
		if (!price || price <= 0) return;
		try {
			await tradesStore.closeTrade(tradeId, price);
			closeModalOpen = false;
			closeExitPrice = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to close trade';
		}
	}
</script>

<div class="detail-page">
	{#if tradesStore.isLoading}
		<LoadingSpinner message="Loading trade..." />
	{:else if !trade}
		<div class="not-found">
			<p>Trade not found.</p>
			<a href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></a>
		</div>
	{:else}
		<div class="detail-header">
			<div class="header-left">
				<a href="/dashboard" class="back-link">Back to Dashboard</a>
				<h1>
					<span class="ticker">{trade.tickerSymbol}</span>
					<Badge variant={trade.direction === 'long' ? 'success' : 'danger'}>
						{trade.direction === 'long' ? 'LONG' : 'SHORT'}
					</Badge>
					<Badge variant={trade.status === 'open' ? 'info' : 'default'}>
						{trade.status === 'open' ? 'OPEN' : 'CLOSED'}
					</Badge>
				</h1>
			</div>
			<div class="header-actions">
				{#if trade.status === 'open'}
					<Button variant="secondary" onclick={() => (closeModalOpen = true)}>
						Close Trade
					</Button>
				{/if}
				<a href="/trades/{trade.id}/edit">
					<Button variant="secondary">Edit</Button>
				</a>
				<Button variant="danger" onclick={() => (deleteModalOpen = true)}>
					Delete
				</Button>
			</div>
		</div>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="detail-grid">
			<div class="detail-card">
				<h2>Trade Details</h2>
				<dl class="info-grid">
					<div class="info-item">
						<dt>Date</dt>
						<dd>{formatDate(trade.date)}</dd>
					</div>
					<div class="info-item">
						<dt>Entry Price</dt>
						<dd class="mono">{formatPrice(trade.entryPrice)}</dd>
					</div>
					<div class="info-item">
						<dt>Stop Loss</dt>
						<dd class="mono">{formatPrice(trade.stopLoss)}</dd>
					</div>
					<div class="info-item">
						<dt>Take Profit</dt>
						<dd class="mono">{formatPrice(trade.takeProfit)}</dd>
					</div>
					{#if trade.positionSize}
						<div class="info-item">
							<dt>Position Size</dt>
							<dd class="mono">{trade.positionSize}</dd>
						</div>
					{/if}
					{#if trade.exitPrice}
						<div class="info-item">
							<dt>Exit Price</dt>
							<dd class="mono">{formatPrice(trade.exitPrice)}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<div class="detail-card">
				<h2>Performance</h2>
				<div class="performance-grid">
					<div class="perf-item">
						<span class="perf-label">Risk:Reward</span>
						<RRBadge ratio={trade.rrRatio} />
					</div>
					{#if trade.pnlAmount !== null}
						<div class="perf-item">
							<span class="perf-label">P&L Amount</span>
							<span class="perf-value {trade.pnlAmount >= 0 ? 'positive' : 'negative'}">
								{formatCurrency(trade.pnlAmount)}
							</span>
						</div>
					{/if}
					{#if trade.pnlPercent !== null}
						<div class="perf-item">
							<span class="perf-label">P&L Percent</span>
							<span class="perf-value {trade.pnlPercent >= 0 ? 'positive' : 'negative'}">
								{formatPercent(trade.pnlPercent)}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if trade.notes}
			<div class="detail-card">
				<h2>Notes</h2>
				<RichTextDisplay content={trade.notes} />
			</div>
		{/if}

		<div class="detail-card">
			<h2>Images</h2>
			<ImageAttachment tradeId={trade.id} bind:images editable={false} />
		</div>

		<Modal
			bind:open={deleteModalOpen}
			title="Delete Trade"
			confirmLabel="Delete"
			confirmVariant="danger"
			onconfirm={handleDelete}
		>
			<p>Are you sure you want to delete this trade for <strong>{trade.tickerSymbol}</strong>? This cannot be undone.</p>
		</Modal>

		<Modal
			bind:open={closeModalOpen}
			title="Close Trade"
			confirmLabel="Close Trade"
			onconfirm={handleCloseTrade}
		>
			<p>Enter the exit price to close this <strong>{trade.tickerSymbol}</strong> trade.</p>
			<Input
				type="number"
				label="Exit Price"
				bind:value={closeExitPrice}
				step="any"
				required
			/>
		</Modal>
	{/if}
</div>

<style>
	.detail-page {
		max-width: 56rem;
		margin: 0 auto;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.back-link {
		font-size: 0.875rem;
		color: var(--color-primary, #2563eb);
		text-decoration: none;
		display: inline-block;
		margin-bottom: 0.5rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.ticker {
		margin-right: 0.25rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}

	.detail-card {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.detail-card h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: var(--color-text-muted, #6b7280);
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin: 0;
	}

	.info-item dt {
		font-size: 0.75rem;
		color: var(--color-text-muted, #9ca3af);
		margin-bottom: 0.125rem;
	}

	.info-item dd {
		margin: 0;
		font-weight: 500;
	}

	.mono {
		font-family: monospace;
	}

	.performance-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.perf-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.perf-label {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
	}

	.perf-value {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.positive {
		color: #16a34a;
	}

	.negative {
		color: #dc2626;
	}

	.not-found {
		text-align: center;
		padding: 3rem;
	}

	.error {
		background: #fee2e2;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
</style>
