<script lang="ts">
	interface Props {
		type?: 'text' | 'number' | 'date' | 'password' | 'email';
		label?: string;
		value?: string | number;
		placeholder?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		min?: number;
		max?: number;
		step?: number | string;
		id?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		type = 'text',
		label,
		value = $bindable(''),
		placeholder = '',
		error,
		required = false,
		disabled = false,
		min,
		max,
		step,
		id,
		oninput,
		onchange,
	}: Props = $props();

	const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="input-group" class:has-error={!!error}>
	{#if label}
		<label for={inputId} class="label">
			{label}
			{#if required}<span class="required" aria-label="required">*</span>{/if}
		</label>
	{/if}
	<input
		id={inputId}
		{type}
		bind:value
		{placeholder}
		{required}
		{disabled}
		{min}
		{max}
		{step}
		class="input"
		aria-invalid={!!error}
		aria-describedby={error ? `${inputId}-error` : undefined}
		{oninput}
		{onchange}
	/>
	{#if error}
		<p id="{inputId}-error" class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #374151);
	}

	.required {
		color: var(--color-danger, #dc2626);
	}

	.input {
		width: 100%;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text, #1f2937);
		background-color: var(--color-bg, #ffffff);
		transition: border-color 0.15s;
		box-sizing: border-box;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}

	.input:disabled {
		background-color: var(--color-disabled-bg, #f3f4f6);
		cursor: not-allowed;
	}

	.has-error .input {
		border-color: var(--color-danger, #dc2626);
	}

	.error {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0;
	}
</style>
