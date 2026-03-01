<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatRRRatio } from '$lib/utils/formatters.js';

	interface Props {
		ratio: number | null;
	}

	let { ratio }: Props = $props();

	const variant = $derived(
		ratio === null
			? 'default'
			: ratio < 0
				? 'danger'
				: ratio >= 2
					? 'success'
					: ratio >= 1
						? 'warning'
						: 'danger',
	);
</script>

<Badge {variant}>
	{formatRRRatio(ratio)}
</Badge>
