<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		message: string;
		icon?: string;
		action?: Snippet;
	}

	let { message, icon = '📋', action }: Props = $props();
</script>

<div class="empty-state">
	<span class="icon" aria-hidden="true">{icon}</span>
	<p class="message">{message}</p>
	{#if action}
		<div class="action">
			{@render action()}
		</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 1.5rem;
		text-align: center;
	}

	.icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.message {
		font-size: 1rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 1.5rem;
	}

	.action {
		display: flex;
		gap: 0.5rem;
	}
</style>
