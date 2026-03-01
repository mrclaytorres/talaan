<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte.js';
	import { appStore } from '$lib/stores/app.svelte.js';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showRecovery = $state(false);
	let securityAnswer = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const valid = await userStore.verifyPassword(password);
			if (valid) {
				appStore.setAuthenticated(true);
			} else {
				error = 'Incorrect password';
				password = '';
			}
		} catch {
			error = 'Failed to verify password';
		} finally {
			loading = false;
		}
	}

	async function handleRecovery(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (userStore.user?.securityQ && securityAnswer) {
				const valid = await userStore.verifySecurityAnswer(securityAnswer);
				if (valid) {
					await userStore.changePassword(null);
					appStore.setAuthenticated(true);
				} else {
					error = 'Incorrect security answer';
				}
			}
		} catch {
			error = 'Recovery failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="lock-screen">
	<div class="lock-container">
		<img src="/logo.svg" alt="Talaan" class="lock-logo" />
		<h1 class="lock-title">Talaan</h1>
		<p class="lock-subtitle">Enter your password to continue</p>

		{#if !showRecovery}
			<form onsubmit={handleSubmit}>
				<Input
					type="password"
					label="Password"
					bind:value={password}
					{error}
					required
				/>
				<div class="lock-actions">
					<Button type="submit" {loading}>Unlock</Button>
				</div>
				{#if userStore.user?.securityQ}
					<button
						type="button"
						class="forgot-link"
						onclick={() => (showRecovery = true)}
					>
						Forgot password?
					</button>
				{/if}
			</form>
		{:else}
			<form onsubmit={handleRecovery}>
				<p class="security-question">
					{userStore.user?.securityQ}
				</p>
				<Input
					type="text"
					label="Your Answer"
					bind:value={securityAnswer}
					{error}
					required
				/>
				<div class="lock-actions">
					<Button variant="secondary" onclick={() => (showRecovery = false)}>
						Back
					</Button>
					<Button type="submit" {loading}>Reset Password</Button>
				</div>
			</form>
		{/if}
	</div>
</div>

<style>
	.lock-screen {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-page, #f9fafb);
		z-index: 900;
	}

	.lock-container {
		max-width: 24rem;
		width: 100%;
		padding: 2rem;
		background: var(--color-bg, #ffffff);
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.lock-logo {
		display: block;
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
	}

	.lock-title {
		text-align: center;
		font-size: 1.5rem;
		margin: 0 0 0.25rem;
	}

	.lock-subtitle {
		text-align: center;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
	}

	.lock-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
		justify-content: center;
	}

	.forgot-link {
		display: block;
		text-align: center;
		margin-top: 1rem;
		color: var(--color-primary, #2563eb);
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.security-question {
		font-weight: 500;
		margin-bottom: 0.75rem;
	}
</style>
