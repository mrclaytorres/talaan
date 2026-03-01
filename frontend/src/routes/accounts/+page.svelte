<script lang="ts">
	import { onMount } from 'svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import { userStore } from '$lib/stores/user.svelte.js';
	import type { TradingAccount, CreateAccountData } from '$lib/types/index.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import AccountForm from '$lib/components/account/AccountForm.svelte';

	let showCreateModal = $state(false);
	let editingAccount = $state<TradingAccount | null>(null);
	let deleteTarget = $state<TradingAccount | null>(null);
	let deleteTradeCount = $state(0);
	let error = $state('');

	onMount(() => {
		accountsStore.loadAccounts();
	});

	async function handleCreate(data: CreateAccountData) {
		try {
			await accountsStore.createAccount({
				...data,
				user: userStore.user?.id ?? '',
			});
			showCreateModal = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create account';
		}
	}

	async function handleEdit(data: CreateAccountData) {
		if (!editingAccount) return;
		try {
			await accountsStore.updateAccount(editingAccount.id, {
				name: data.name,
				description: data.description ?? null,
				currency: data.currency,
				startingCapital: data.startingCapital,
			});
			editingAccount = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update account';
		}
	}

	async function confirmDelete(account: TradingAccount) {
		if (accountsStore.accounts.length <= 1) {
			error = 'Cannot delete the last remaining account';
			return;
		}
		const count = await accountsStore.getTradeCountForAccount(account.id);
		deleteTradeCount = count;
		deleteTarget = account;
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await accountsStore.deleteAccount(deleteTarget.id);
			deleteTarget = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete account';
		}
	}
</script>

<div class="accounts-page">
	<div class="page-header">
		<h1>Accounts</h1>
		<Button onclick={() => (showCreateModal = true)}>+ Create Account</Button>
	</div>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	{#if accountsStore.isLoading}
		<LoadingSpinner message="Loading accounts..." />
	{:else}
		<div class="account-list">
			{#each accountsStore.accounts as account (account.id)}
				<div class="account-card">
					<div class="account-info">
						<h2 class="account-name">{account.name}</h2>
						<span class="account-currency">{account.currency}</span>
						{#if account.description}
							<p class="account-desc">{account.description}</p>
						{/if}
					</div>
					<div class="account-actions">
						<Button variant="secondary" size="sm" onclick={() => (editingAccount = account)}>
							Edit
						</Button>
						<Button variant="danger" size="sm" onclick={() => confirmDelete(account)}>
							Delete
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showCreateModal}
		<Modal bind:open={showCreateModal} title="Create Account" confirmLabel="" cancelLabel="">
			<AccountForm
				onsubmit={handleCreate}
				oncancel={() => (showCreateModal = false)}
			/>
		</Modal>
	{/if}

	{#if editingAccount}
		<Modal open={true} title="Edit Account" confirmLabel="" cancelLabel="" oncancel={() => (editingAccount = null)}>
			<AccountForm
				account={editingAccount}
				onsubmit={handleEdit}
				oncancel={() => (editingAccount = null)}
			/>
		</Modal>
	{/if}

	{#if deleteTarget}
		<Modal
			open={true}
			title="Delete Account"
			confirmLabel="Delete"
			confirmVariant="danger"
			onconfirm={handleDelete}
			oncancel={() => (deleteTarget = null)}
		>
			<p>
				Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
				{#if deleteTradeCount > 0}
					This will delete <strong>{deleteTradeCount}</strong> trade{deleteTradeCount === 1 ? '' : 's'}. This cannot be undone.
				{/if}
			</p>
		</Modal>
	{/if}
</div>

<style>
	.accounts-page {
		max-width: 48rem;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
	}

	.error {
		background: #fee2e2;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.account-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.account-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.75rem;
		gap: 1rem;
	}

	.account-info {
		flex: 1;
		min-width: 0;
	}

	.account-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		display: inline;
	}

	.account-currency {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		margin-left: 0.5rem;
		background: var(--color-secondary, #e5e7eb);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}

	.account-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0.25rem 0 0;
	}

	.account-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}
</style>
