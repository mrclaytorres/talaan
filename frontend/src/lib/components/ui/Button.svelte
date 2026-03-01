<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		onclick,
		children,
	}: Props = $props();
</script>

<button
	{type}
	class="btn btn-{variant} btn-{size}"
	disabled={disabled || loading}
	{onclick}
	aria-busy={loading}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{/if}
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.15s,
			opacity 0.15s;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
	.btn-md {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}
	.btn-lg {
		padding: 0.75rem 1.5rem;
		font-size: 1.125rem;
	}

	.btn-primary {
		background-color: var(--color-primary, #2563eb);
		color: white;
	}
	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-primary-dark, #1d4ed8);
	}

	.btn-secondary {
		background-color: var(--color-secondary, #e5e7eb);
		color: var(--color-text, #1f2937);
	}
	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-secondary-dark, #d1d5db);
	}

	.btn-danger {
		background-color: var(--color-danger, #dc2626);
		color: white;
	}
	.btn-danger:hover:not(:disabled) {
		background-color: var(--color-danger-dark, #b91c1c);
	}

	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
