<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import { userStore } from '$lib/stores/user.svelte.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import AccountSwitcher from '$lib/components/account/AccountSwitcher.svelte';

	let { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/accounts', label: 'Accounts' },
		{ href: '/settings', label: 'Settings' },
	];

	$effect(() => {
		appStore.init().then(() => {
			if (!appStore.isFirstLaunch) {
				userStore.loadUser();
				accountsStore.loadAccounts();
			}
		});
	});

	$effect(() => {
		if (appStore.isLoading) return;

		const path = $page.url.pathname;

		if (appStore.isFirstLaunch && path !== '/setup') {
			goto('/setup');
		}
	});

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}

	const showNav = $derived(
		!appStore.isLoading && !appStore.isFirstLaunch && appStore.isAuthenticated,
	);
</script>

{#if appStore.isLoading}
	<div class="app-loading">
		<LoadingSpinner size="lg" message="Loading Talaan..." />
	</div>
{:else}
	<div class="app-layout">
		{#if showNav}
			<!-- TOP NAVBAR — desktop -->
			<header class="topnav">
				<div class="topnav-left">
					<div class="brand">
						<img src="/logo.svg" alt="Talaan" class="brand-icon" />
						<span class="brand-name">Talaan</span>
					</div>
					<nav class="desktop-nav" aria-label="Main navigation">
						{#each navItems as item}
							<a
								href={item.href}
								class="nav-link"
								class:active={isActive(item.href)}
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
				<div class="topnav-right">
					<AccountSwitcher />
					<button
						class="theme-toggle"
						onclick={() => themeStore.toggle()}
						aria-label="Toggle dark/light theme"
					>
						{#if themeStore.current === 'dark'}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
						{/if}
					</button>
				</div>
			</header>

			<!-- BOTTOM NAV — mobile -->
			<nav class="bottom-bar" aria-label="Mobile navigation">
				<a href="/dashboard" class="bottom-link" class:active={isActive('/dashboard')} aria-current={isActive('/dashboard') ? 'page' : undefined}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 16 4-8 4 4 4-8"/></svg>
					<span>Dashboard</span>
				</a>
				<a href="/accounts" class="bottom-link" class:active={isActive('/accounts')} aria-current={isActive('/accounts') ? 'page' : undefined}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 17a5 5 0 0 1 10 0"/><path d="M12 17a5 5 0 0 1 10 0"/><circle cx="7" cy="7" r="4"/><circle cx="17" cy="7" r="4"/></svg>
					<span>Accounts</span>
				</a>
				<a href="/settings" class="bottom-link" class:active={isActive('/settings')} aria-current={isActive('/settings') ? 'page' : undefined}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
					<span>Settings</span>
				</a>
			</nav>
		{/if}

		<main class="main-content" class:has-topnav={showNav}>
			{@render children()}
		</main>
	</div>
{/if}

{#if appStore.error}
	<div class="global-error" role="alert">
		<p>{appStore.error}</p>
		<button onclick={() => appStore.clearError()}>Dismiss</button>
	</div>
{/if}

<style>
	.app-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.app-layout {
		min-height: 100vh;
	}

	/* ─── TOP NAVBAR ─── */
	.topnav {
		display: none;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		padding: 0 24px;
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.topnav-left {
		display: flex;
		align-items: center;
		gap: 28px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brand-icon {
		width: 28px;
		height: 28px;
		border-radius: 6px;
	}

	.brand-name {
		font-weight: 700;
		font-size: 15px;
		color: var(--accent-text);
		letter-spacing: -0.02em;
	}

	.desktop-nav {
		display: flex;
		gap: 4px;
	}

	.nav-link {
		padding: 7px 14px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition);
	}

	.nav-link:hover {
		color: var(--text-secondary);
		background: var(--bg-elevated);
		text-decoration: none;
	}

	.nav-link.active {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.topnav-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.theme-toggle {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-surface);
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
	}

	.theme-toggle:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	/* ─── BOTTOM BAR — mobile ─── */
	.bottom-bar {
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bg-surface);
		border-top: 1px solid var(--border);
		z-index: 100;
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.bottom-link {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 4px;
		text-decoration: none;
		color: var(--text-muted);
		font-size: 10px;
		font-weight: 500;
		transition: color var(--transition);
	}

	.bottom-link:hover {
		text-decoration: none;
		color: var(--text-secondary);
	}

	.bottom-link.active {
		color: var(--accent-text);
	}

	/* ─── MAIN CONTENT ─── */
	.main-content {
		padding: 16px;
		padding-bottom: 72px;
	}

	.global-error {
		position: fixed;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background-color: var(--negative-bg);
		color: var(--negative-text);
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		border: 1px solid var(--negative);
		z-index: 2000;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.global-error p {
		margin: 0;
	}

	.global-error button {
		background: none;
		border: none;
		color: var(--negative-text);
		cursor: pointer;
		font-weight: 600;
	}

	@media (min-width: 768px) {
		.topnav {
			display: flex;
		}

		.bottom-bar {
			display: none;
		}

		.main-content {
			padding: 20px 24px;
			padding-bottom: 24px;
			max-width: 1200px;
			margin: 0 auto;
		}
	}
</style>
