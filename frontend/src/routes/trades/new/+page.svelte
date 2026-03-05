<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import type { CreateTradeData, TradeImage, TradePosition } from '$lib/types/index.js';
	import TradeForm from '$lib/components/trade/TradeForm.svelte';
	import ImageAttachment from '$lib/components/trade/ImageAttachment.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const activeAccount = $derived(
		appStore.activeAccountId !== 'all'
			? accountsStore.accounts.find((a) => String(a.id) === appStore.activeAccountId)
			: accountsStore.accounts[0],
	);

	const resolvedAccountId = $derived(activeAccount?.id ?? '');
	const dateParam = $derived($page.url.searchParams.get('date') ?? undefined);

	let error = $state('');
	let createdTrade = $state<TradePosition | null>(null);
	let images = $state<TradeImage[]>([]);

	async function handleSubmit(data: CreateTradeData) {
		error = '';
		try {
			const trade = await tradesStore.createTrade(data);
			createdTrade = trade;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create trade';
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}

	function handleDone() {
		goto(`/trades/${createdTrade!.id}`);
	}
</script>

<div class="new-trade-page">
	{#if createdTrade}
		<h1>Add Images</h1>
		<p class="step-hint">Trade saved. Attach screenshots or charts, then continue.</p>

		<div class="form-container">
			<ImageAttachment tradeId={createdTrade.id} bind:images editable={true} />
		</div>

		<div class="done-actions">
			<Button onclick={handleDone}>
				{images.length > 0 ? 'Done' : 'Skip'}
			</Button>
		</div>
	{:else}
		<h1>New Trade</h1>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<div class="form-container">
			<TradeForm
				accountId={resolvedAccountId}
				startingCapital={activeAccount?.startingCapital}
				initialDate={dateParam}
				onsubmit={handleSubmit}
				oncancel={handleCancel}
			/>
		</div>
	{/if}
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

	.step-hint {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.875rem;
		margin: -1rem 0 1.5rem;
	}

	.form-container {
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.done-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
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
