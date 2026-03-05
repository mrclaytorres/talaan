<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import { getDataService } from '$lib/services/index.js';
	import type { CreateTradeData, TradeImage } from '$lib/types/index.js';
	import TradeForm from '$lib/components/trade/TradeForm.svelte';
	import ImageAttachment from '$lib/components/trade/ImageAttachment.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let error = $state('');

	const tradeId = $derived($page.params.id ?? '');
	const trade = $derived(tradesStore.currentTrade);
	const tradeAccount = $derived(
		trade ? accountsStore.accounts.find((a) => String(a.id) === String(trade.account)) : undefined,
	);

	let images = $state<TradeImage[]>([]);

	onMount(async () => {
		await tradesStore.loadTrade(tradeId);
		try {
			images = await getDataService().getTradeImages(tradeId);
		} catch {
			// non-critical
		}
	});

	async function handleSubmit(data: CreateTradeData) {
		error = '';
		try {
			await tradesStore.updateTrade(tradeId, data);
			await goto(`/trades/${tradeId}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update trade';
		}
	}

	function handleCancel() {
		goto(`/trades/${tradeId}`);
	}
</script>

<div class="edit-trade-page">
	{#if tradesStore.isLoading}
		<LoadingSpinner message="Loading trade..." />
	{:else if !trade}
		<div class="not-found">
			<p>Trade not found.</p>
			<a href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></a>
		</div>
	{:else}
		<h1>Edit Trade — {trade.tickerSymbol}</h1>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="form-container">
			<TradeForm
				{trade}
				accountId={trade.account}
				startingCapital={tradeAccount?.startingCapital}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			/>
		</div>

		<div class="images-section">
			<h2>Images</h2>
			<ImageAttachment tradeId={trade.id} bind:images editable={true} />
		</div>
	{/if}
</div>

<style>
	.edit-trade-page {
		max-width: 40rem;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0 0 1.5rem;
	}

	h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.form-container {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.images-section {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
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
