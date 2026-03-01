<script lang="ts">
	import { goto } from '$app/navigation';
	import { appStore } from '$lib/stores/app.svelte.js';
	import LockScreen from '$lib/components/ui/LockScreen.svelte';

	$effect(() => {
		if (appStore.isLoading) return;

		if (appStore.isFirstLaunch) {
			goto('/setup');
			return;
		}

		if (appStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

{#if !appStore.isLoading && !appStore.isFirstLaunch && !appStore.isAuthenticated && appStore.hasPassword}
	<LockScreen />
{/if}
