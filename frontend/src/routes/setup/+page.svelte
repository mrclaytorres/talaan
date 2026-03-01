<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte.js';
	import { appStore } from '$lib/stores/app.svelte.js';
	import { validatePassword } from '$lib/utils/validators.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let step = $state(1);
	let loading = $state(false);

	// Step 1
	let displayName = $state('');
	let timezone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

	// Step 2
	let password = $state('');
	let confirmPassword = $state('');
	let securityQ = $state('');
	let securityA = $state('');
	let passwordErrors = $state<string[]>([]);

	const timezoneOptions = [
		'UTC',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Singapore',
		'Australia/Sydney',
	].map((tz) => ({ value: tz, label: tz.replace(/_/g, ' ') }));

	function validateStep1(): boolean {
		return displayName.trim().length > 0;
	}

	function validateStep2(): boolean {
		if (!password) return true; // Password is optional
		const result = validatePassword(password);
		passwordErrors = result.errors;
		if (!result.valid) return false;
		if (password !== confirmPassword) {
			passwordErrors = ['Passwords do not match'];
			return false;
		}
		return true;
	}

	function nextStep() {
		if (step === 1 && validateStep1()) {
			step = 2;
		} else if (step === 2 && validateStep2()) {
			step = 3;
		}
	}

	async function handleSubmit() {
		loading = true;
		try {
			await userStore.createUser({
				displayName: displayName.trim(),
				timezone,
				password: password || undefined,
				securityQ: securityQ || undefined,
				securityA: securityA || undefined,
			});
			appStore.isFirstLaunch = false;
			appStore.isAuthenticated = true;
			goto('/dashboard');
		} catch (e) {
			appStore.error =
				e instanceof Error ? e.message : 'Failed to create profile';
		} finally {
			loading = false;
		}
	}
</script>

<div class="setup-page">
	<div class="setup-container">
		<img src="/logo.svg" alt="Talaan" class="setup-logo" />
		<h1 class="setup-title">Welcome to Talaan</h1>
		<p class="setup-subtitle">a trading journal — let's set up your profile</p>

		<div class="steps-indicator" aria-label="Setup progress">
			{#each [1, 2, 3] as s}
				<div class="step-dot" class:active={step >= s} aria-hidden="true"></div>
			{/each}
		</div>

		{#if step === 1}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					nextStep();
				}}
			>
				<h2 class="step-title">Your Profile</h2>
				<Input
					label="Display Name"
					bind:value={displayName}
					placeholder="Enter your name"
					required
				/>
				<div class="field-spacer"></div>
				<Select label="Timezone" bind:value={timezone} options={timezoneOptions} />
				<div class="step-actions">
					<Button type="submit" disabled={!validateStep1()}>Next</Button>
				</div>
			</form>
		{:else if step === 2}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					nextStep();
				}}
			>
				<h2 class="step-title">Security (Optional)</h2>
				<p class="step-description">
					Protect your journal with a password. You can skip this step.
				</p>
				<Input type="password" label="Password" bind:value={password} placeholder="Optional" />
				{#if password}
					<div class="field-spacer"></div>
					<Input
						type="password"
						label="Confirm Password"
						bind:value={confirmPassword}
						error={passwordErrors[0]}
					/>
					<div class="field-spacer"></div>
					<Input label="Security Question" bind:value={securityQ} placeholder="e.g., Your first pet's name?" />
					{#if securityQ}
						<div class="field-spacer"></div>
						<Input label="Security Answer" bind:value={securityA} required />
					{/if}
				{/if}
				<div class="step-actions">
					<Button variant="secondary" onclick={() => (step = 1)}>Back</Button>
					<Button type="submit">Next</Button>
				</div>
			</form>
		{:else}
			<div>
				<h2 class="step-title">Confirm Setup</h2>
				<dl class="summary">
					<dt>Name</dt>
					<dd>{displayName}</dd>
					<dt>Timezone</dt>
					<dd>{timezone.replace(/_/g, ' ')}</dd>
					<dt>Password</dt>
					<dd>{password ? 'Set' : 'Not set'}</dd>
				</dl>
				<p class="step-description">
					A "Default" trading account will be created for you automatically.
				</p>
				<div class="step-actions">
					<Button variant="secondary" onclick={() => (step = 2)}>Back</Button>
					<Button onclick={handleSubmit} {loading}>Create Profile</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.setup-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
	}

	.setup-container {
		max-width: 28rem;
		width: 100%;
		padding: 2rem;
		background: var(--color-bg, #ffffff);
		border-radius: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.setup-logo {
		display: block;
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
	}

	.setup-title {
		text-align: center;
		font-size: 1.5rem;
		margin: 0 0 0.25rem;
	}

	.setup-subtitle {
		text-align: center;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
	}

	.steps-indicator {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.step-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background-color: var(--color-border, #d1d5db);
		transition: background-color 0.2s;
	}

	.step-dot.active {
		background-color: var(--color-primary, #2563eb);
	}

	.step-title {
		font-size: 1.125rem;
		margin: 0 0 0.5rem;
	}

	.step-description {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 1rem;
	}

	.field-spacer {
		height: 0.75rem;
	}

	.step-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.summary {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 1rem 0;
	}

	.summary dt {
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
	}

	.summary dd {
		margin: 0;
	}
</style>
