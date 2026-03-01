<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
	}

	let { size = 'md', message }: Props = $props();
</script>

<div class="loading" role="status" aria-label={message ?? 'Loading'}>
	<div class="spinner spinner-{size}"></div>
	{#if message}
		<p class="message">{message}</p>
	{/if}
</div>

<style>
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
	}

	.spinner {
		border: 3px solid var(--color-border, #e5e7eb);
		border-top-color: var(--color-primary, #2563eb);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.spinner-sm {
		width: 1.25rem;
		height: 1.25rem;
	}
	.spinner-md {
		width: 2rem;
		height: 2rem;
	}
	.spinner-lg {
		width: 3rem;
		height: 3rem;
	}

	.message {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
