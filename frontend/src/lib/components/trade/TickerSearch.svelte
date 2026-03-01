<script lang="ts">
	import type { Ticker } from '$lib/types/index.js';
	import { getDataService } from '$lib/services/index.js';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		value: string;
		onchange: (symbol: string) => void;
		error?: string;
	}

	let { value = $bindable(''), onchange, error }: Props = $props();

	let results = $state<Ticker[]>([]);
	let showDropdown = $state(false);
	let searching = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		value = input.value.toUpperCase();
		input.value = value;

		if (debounceTimer) clearTimeout(debounceTimer);

		if (input.value.trim().length === 0) {
			loadRecent();
			return;
		}

		debounceTimer = setTimeout(() => {
			searchTickers(input.value.trim());
		}, 200);
	}

	async function searchTickers(query: string) {
		searching = true;
		try {
			const ds = getDataService();
			results = await ds.searchTickers(query);
			showDropdown = results.length > 0;
		} catch {
			results = [];
		} finally {
			searching = false;
		}
	}

	async function loadRecent() {
		try {
			const ds = getDataService();
			const recent = await ds.getRecentTickers(5);
			if (recent.length > 0) {
				results = recent.map((symbol) => ({
					symbol,
					name: '',
					assetClass: 'stock' as const,
					exchange: null,
					baseCurrency: null,
					quoteCurrency: null,
				}));
				showDropdown = true;
			}
		} catch {
			// ignore
		}
	}

	function selectTicker(ticker: Ticker) {
		value = ticker.symbol;
		onchange(ticker.symbol);
		showDropdown = false;
	}

	function handleFocus() {
		if (value.trim().length === 0) {
			loadRecent();
		} else if (results.length > 0) {
			showDropdown = true;
		}
	}

	function handleBlur() {
		// Delay to allow click on dropdown items
		setTimeout(() => {
			showDropdown = false;
			if (value.trim()) {
				onchange(value.trim().toUpperCase());
			}
		}, 200);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showDropdown = false;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (value.trim()) {
				onchange(value.trim().toUpperCase());
				showDropdown = false;
			}
		}
	}

	function getAssetBadgeVariant(assetClass: string): 'info' | 'success' | 'warning' {
		switch (assetClass) {
			case 'stock': return 'info';
			case 'forex': return 'success';
			case 'crypto': return 'warning';
			default: return 'info';
		}
	}
</script>

<div class="ticker-search">
	<label for="ticker-input" class="label">Ticker / Pair <span class="required">*</span></label>
	<div class="input-wrapper">
		<input
			id="ticker-input"
			type="text"
			class="input"
			class:has-error={!!error}
			{value}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			placeholder="Search or type symbol..."
			autocomplete="off"
		/>
		{#if searching}
			<span class="spinner" aria-hidden="true"></span>
		{/if}
	</div>

	{#if showDropdown && results.length > 0}
		<ul class="dropdown" role="listbox">
			{#each results as ticker (ticker.symbol)}
				<li>
					<button
						class="dropdown-item"
						type="button"
						role="option"
						aria-selected="false"
						onmousedown={() => selectTicker(ticker)}
					>
						<span class="ticker-symbol">{ticker.symbol}</span>
						{#if ticker.name}
							<span class="ticker-name">{ticker.name}</span>
						{/if}
						<Badge variant={getAssetBadgeVariant(ticker.assetClass)}>
							{ticker.assetClass}
						</Badge>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if error}
		<p class="error-text">{error}</p>
	{/if}
</div>

<style>
	.ticker-search {
		position: relative;
	}

	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: var(--color-text, #374151);
	}

	.required {
		color: var(--color-danger, #dc2626);
	}

	.input-wrapper {
		position: relative;
	}

	.input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 1rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary, #2563eb);
		box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(37, 99, 235, 0.1));
	}

	.input.has-error {
		border-color: var(--color-danger, #dc2626);
	}

	.spinner {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--color-border, #e5e7eb);
		border-top-color: var(--color-primary, #2563eb);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: translateY(-50%) rotate(360deg); }
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 50;
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		max-height: 15rem;
		overflow-y: auto;
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0.25rem;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.875rem;
		border-radius: 0.25rem;
		text-align: left;
	}

	.dropdown-item:hover {
		background: var(--color-hover, #f3f4f6);
	}

	.ticker-symbol {
		font-weight: 700;
		min-width: 4rem;
	}

	.ticker-name {
		flex: 1;
		color: var(--color-text-muted, #6b7280);
		font-size: 0.8125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.error-text {
		font-size: 0.75rem;
		color: var(--color-danger, #dc2626);
		margin: 0.25rem 0 0;
	}
</style>
