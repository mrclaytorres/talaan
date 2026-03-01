<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		confirmLabel?: string;
		confirmVariant?: 'primary' | 'danger';
		cancelLabel?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
		children: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		confirmLabel = 'Confirm',
		confirmVariant = 'primary',
		cancelLabel = 'Cancel',
		onconfirm,
		oncancel,
		children,
	}: Props = $props();

	function handleCancel() {
		open = false;
		oncancel?.();
	}

	function handleConfirm() {
		onconfirm?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-label={title}
		tabindex="-1"
		onkeydown={handleKeydown}
		onclick={handleBackdropClick}
	>
		<div class="modal">
			<h2 class="modal-title">{title}</h2>
			<div class="modal-body">
				{@render children()}
			</div>
			<div class="modal-actions">
				<Button variant="secondary" onclick={handleCancel}>
					{cancelLabel}
				</Button>
				<Button variant={confirmVariant} onclick={handleConfirm}>
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: var(--color-bg, #ffffff);
		border-radius: 0.75rem;
		padding: 1.5rem;
		max-width: 28rem;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-title {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-body {
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}
</style>
