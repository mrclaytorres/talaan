<script lang="ts">
	interface Option {
		value: string;
		label: string;
	}

	interface Props {
		label?: string;
		value?: string;
		options: Option[];
		required?: boolean;
		disabled?: boolean;
		error?: string;
		id?: string;
		onchange?: (e: Event) => void;
	}

	let {
		label,
		value = $bindable(''),
		options,
		required = false,
		disabled = false,
		error,
		id,
		onchange,
	}: Props = $props();

	const selectId = id ?? `select-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="select-group" class:has-error={!!error}>
	{#if label}
		<label for={selectId} class="label">
			{label}
			{#if required}<span class="required" aria-label="required">*</span>{/if}
		</label>
	{/if}
	<select
		id={selectId}
		bind:value
		{required}
		{disabled}
		class="select"
		aria-invalid={!!error}
		{onchange}
	>
		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.select-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.required {
		color: var(--color-danger, #dc2626);
	}

	.select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 1rem;
		color: var(--color-text, #1f2937);
		background-color: var(--color-bg, #ffffff);
	}

	.select:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}

	.has-error .select {
		border-color: var(--color-danger, #dc2626);
	}

	.error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}
</style>
