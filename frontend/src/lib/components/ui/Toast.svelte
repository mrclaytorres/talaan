<script lang="ts">
	interface Props {
		message: string;
		variant?: 'success' | 'error' | 'warning' | 'info';
		visible?: boolean;
		onclose?: () => void;
	}

	let {
		message,
		variant = 'info',
		visible = $bindable(true),
		onclose,
	}: Props = $props();

	function close() {
		visible = false;
		onclose?.();
	}

	$effect(() => {
		if (visible) {
			const timer = setTimeout(close, 5000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if visible}
	<div class="toast toast-{variant}" role="alert">
		<p class="toast-message">{message}</p>
		<button class="toast-close" onclick={close} aria-label="Close notification">
			&times;
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 2000;
		animation: slideIn 0.3s ease;
	}

	.toast-success {
		background-color: var(--positive-bg);
		color: var(--positive-text);
		border: 1px solid var(--positive);
	}

	.toast-error {
		background-color: var(--negative-bg);
		color: var(--negative-text);
		border: 1px solid var(--negative);
	}

	.toast-warning {
		background-color: var(--warning-bg);
		color: var(--warning);
		border: 1px solid var(--warning);
	}

	.toast-info {
		background-color: var(--info-bg);
		color: var(--info);
		border: 1px solid var(--info);
	}

	.toast-message {
		margin: 0;
		font-size: 0.875rem;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: inherit;
		padding: 0;
		line-height: 1;
	}

	@keyframes slideIn {
		from {
			transform: translateY(1rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
