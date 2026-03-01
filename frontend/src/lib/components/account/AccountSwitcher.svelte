<script lang="ts">
	import { accountsStore } from '$lib/stores/accounts.svelte.js';

	function handleChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		accountsStore.setActiveAccount(select.value);
	}
</script>

<div class="account-switcher">
	<select
		class="account-select"
		value={accountsStore.activeAccountId}
		onchange={handleChange}
		aria-label="Switch account"
	>
		<option value="all">All Accounts</option>
		{#each accountsStore.accounts as account (account.id)}
			<option value={String(account.id)}>
				{account.name} ({account.currency})
			</option>
		{/each}
	</select>
</div>

<style>
	.account-switcher {
		padding: 0.5rem;
	}

	.account-select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: var(--color-bg, #ffffff);
		color: var(--color-text, #374151);
		cursor: pointer;
	}

	.account-select:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}
</style>
