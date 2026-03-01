<script lang="ts">
	import { goto } from '$app/navigation';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import type { CreateTradeData } from '$lib/types/index.js';
	import TradeForm from '$lib/components/trade/TradeForm.svelte';

	const activeAccount = $derived(
		appStore.activeAccountId !== 'all'
			? accountsStore.accounts.find((a) => String(a.id) === appStore.activeAccountId)
			: accountsStore.accounts[0],
	);

	const resolvedAccountId = $derived(activeAccount?.id ?? '');

	let error = $state('');

	async function handleSubmit(data: CreateTradeData) {
		error = '';
		try {
			const trade = await tradesStore.createTrade(data);
			await goto(`/trades/${trade.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create trade';
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}
</script>

<div class="new-trade-page">
	<h1>New Trade</h1>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	<div class="form-container">
		<TradeForm
			accountId={resolvedAccountId}
			startingCapital={activeAccount?.startingCapital}
			onsubmit={handleSubmit}
			oncancel={handleCancel}
		/>
	</div>
</div>

<style>
	.new-trade-page {
		max-width: 40rem;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0 0 1.5rem;
	}

	.form-container {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
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
