<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
		children: Snippet;
	}

	let { variant = 'default', children }: Props = $props();
</script>

<span class="badge badge-{variant}">
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.125rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 9999px;
		line-height: 1.5;
	}

	.badge-default {
		background-color: var(--bg-elevated, #e5e7eb);
		color: var(--text-secondary, #374151);
	}

	.badge-success {
		background-color: var(--positive-bg, #dcfce7);
		color: var(--positive-text, #166534);
	}

	.badge-danger {
		background-color: var(--negative-bg, #fee2e2);
		color: var(--negative-text, #991b1b);
	}

	.badge-warning {
		background-color: var(--warning-bg, #fef3c7);
		color: var(--warning, #92400e);
	}

	.badge-info {
		background-color: var(--info-bg, #dbeafe);
		color: var(--info, #1e40af);
	}
</style>
