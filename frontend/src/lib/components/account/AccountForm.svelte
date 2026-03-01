<script lang="ts">
	import type { TradingAccount, CreateAccountData } from '$lib/types/index.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	interface Props {
		account?: TradingAccount;
		onsubmit: (data: CreateAccountData) => Promise<void>;
		oncancel: () => void;
	}

	let { account, onsubmit, oncancel }: Props = $props();

	let loading = $state(false);
	let errors = $state<Record<string, string>>({});

	let name = $state(account?.name ?? '');
	let description = $state(account?.description ?? '');
	let currency = $state(account?.currency ?? 'USD');
	let startingCapital = $state<number | string>(account?.startingCapital ?? 0);

	const currencyOptions = [
		{ value: 'USD', label: 'USD - US Dollar' },
		{ value: 'EUR', label: 'EUR - Euro' },
		{ value: 'GBP', label: 'GBP - British Pound' },
		{ value: 'JPY', label: 'JPY - Japanese Yen' },
		{ value: 'AUD', label: 'AUD - Australian Dollar' },
		{ value: 'CAD', label: 'CAD - Canadian Dollar' },
		{ value: 'CHF', label: 'CHF - Swiss Franc' },
		{ value: 'BTC', label: 'BTC - Bitcoin' },
	];

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		const trimmed = name.trim();

		if (!trimmed) {
			newErrors.name = 'Account name is required';
		} else if (trimmed.length > 100) {
			newErrors.name = 'Name must be 100 characters or fewer';
		} else {
			const duplicate = accountsStore.accounts.find(
				(a) => a.name.toLowerCase() === trimmed.toLowerCase() && a.id !== account?.id,
			);
			if (duplicate) {
				newErrors.name = 'An account with this name already exists';
			}
		}

		if (description && description.length > 500) {
			newErrors.description = 'Description must be 500 characters or fewer';
		}

		if (startingCapital !== '' && Number(startingCapital) < 0) {
			newErrors.startingCapital = 'Starting capital cannot be negative';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!validate()) return;

		loading = true;
		try {
			await onsubmit({
				user: '',
				name: name.trim(),
				description: description.trim() || undefined,
				currency,
				startingCapital: Number(startingCapital) || 0,
			});
		} finally {
			loading = false;
		}
	}
</script>

<form class="account-form" onsubmit={handleSubmit}>
	<Input label="Account Name" bind:value={name} error={errors.name} placeholder="e.g., Main Brokerage" required />
	<Select label="Currency" bind:value={currency} options={currencyOptions} />
	<Input type="number" label="Starting Capital" bind:value={startingCapital} min={0} step="any" error={errors.startingCapital} placeholder="0.00" />
	<div class="description-field">
		<label for="account-desc" class="desc-label">Description</label>
		<textarea
			id="account-desc"
			bind:value={description}
			rows="2"
			placeholder="Optional description..."
			class="desc-textarea"
			maxlength="500"
		></textarea>
		{#if errors.description}
			<p class="field-error">{errors.description}</p>
		{/if}
	</div>
	<div class="form-actions">
		<Button variant="secondary" onclick={oncancel}>Cancel</Button>
		<Button type="submit" {loading}>
			{account ? 'Save Changes' : 'Create Account'}
		</Button>
	</div>
</form>

<style>
	.account-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.desc-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text, #374151);
	}

	.desc-textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
	}

	.desc-textarea:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}

	.field-error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0.25rem 0 0;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
