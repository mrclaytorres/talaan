<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte.js';
	import { accountsStore } from '$lib/stores/accounts.svelte.js';
	import { tradesStore } from '$lib/stores/trades.svelte.js';
	import { validatePassword } from '$lib/utils/validators.js';
	import { exportJSON, exportCSV, importJSON, downloadBlob } from '$lib/utils/export.js';
	import { getDataService } from '$lib/services/index.js';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	let saving = $state(false);
	let toastMessage = $state('');
	let toastVariant = $state<'success' | 'error'>('success');
	let showToast = $state(false);

	// Profile
	let displayName = $state(userStore.user?.displayName ?? '');
	let timezone = $state(userStore.user?.timezone ?? 'UTC');

	// Password
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordError = $state('');

	// Export/Import
	let exporting = $state(false);
	let importing = $state(false);
	let showImportConfirm = $state(false);
	let importFile = $state<File | null>(null);
	let csvAccountId = $state<string>('all');
	let fileInputRef = $state<HTMLInputElement | null>(null);

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

	async function saveProfile() {
		saving = true;
		try {
			await userStore.updateUser({
				displayName: displayName.trim(),
				timezone,
			});
			showNotification('Profile updated', 'success');
		} catch {
			showNotification('Failed to save profile', 'error');
		} finally {
			saving = false;
		}
	}

	async function changePassword() {
		passwordError = '';

		if (userStore.user?.passwordHash) {
			const valid = await userStore.verifyPassword(currentPassword);
			if (!valid) {
				passwordError = 'Current password is incorrect';
				return;
			}
		}

		if (newPassword) {
			const result = validatePassword(newPassword);
			if (!result.valid) {
				passwordError = result.errors[0];
				return;
			}
			if (newPassword !== confirmPassword) {
				passwordError = 'Passwords do not match';
				return;
			}
		}

		saving = true;
		try {
			await userStore.changePassword(newPassword || null);
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			showNotification(newPassword ? 'Password updated' : 'Password removed', 'success');
		} catch {
			showNotification('Failed to update password', 'error');
		} finally {
			saving = false;
		}
	}

	function showNotification(msg: string, variant: 'success' | 'error') {
		toastMessage = msg;
		toastVariant = variant;
		showToast = true;
	}

	async function handleExportJSON() {
		exporting = true;
		try {
			const ds = getDataService();
			const blob = await exportJSON(ds);
			downloadBlob(blob, `talaan-backup-${new Date().toISOString().split('T')[0]}.json`);
			showNotification('Backup exported successfully', 'success');
		} catch {
			showNotification('Export failed', 'error');
		} finally {
			exporting = false;
		}
	}

	async function handleExportCSV() {
		exporting = true;
		try {
			const ds = getDataService();
			const accountId = csvAccountId === 'all' ? undefined : csvAccountId;
			const blob = await exportCSV(ds, accountId);
			downloadBlob(blob, `talaan-trades-${new Date().toISOString().split('T')[0]}.csv`);
			showNotification('CSV exported successfully', 'success');
		} catch {
			showNotification('CSV export failed', 'error');
		} finally {
			exporting = false;
		}
	}

	function handleImportSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) {
			importFile = input.files[0];
			showImportConfirm = true;
		}
	}

	async function handleImportConfirm() {
		if (!importFile) return;
		showImportConfirm = false;
		importing = true;
		try {
			const ds = getDataService();
			const result = await importJSON(ds, importFile);
			showNotification(
				`Imported ${result.accounts} account(s) and ${result.trades} trade(s)`,
				'success',
			);
			// Reload all stores so the UI updates immediately
			await accountsStore.loadAccounts();
			await userStore.loadUser();
			await tradesStore.loadTrades();
		} catch (e) {
			showNotification(e instanceof Error ? e.message : 'Import failed', 'error');
		} finally {
			importing = false;
			importFile = null;
		}
	}
</script>

<div class="settings-page">
	<h1>Settings</h1>

	<section class="settings-section">
		<h2>Profile</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveProfile();
			}}
		>
			<Input label="Display Name" bind:value={displayName} required />
			<div class="field-spacer"></div>
			<Select label="Timezone" bind:value={timezone} options={timezoneOptions} />
			<div class="section-actions">
				<Button type="submit" loading={saving}>Save Profile</Button>
			</div>
		</form>
	</section>

	<section class="settings-section">
		<h2>{userStore.user?.passwordHash ? 'Change Password' : 'Set Password'}</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				changePassword();
			}}
		>
			{#if userStore.user?.passwordHash}
				<Input type="password" label="Current Password" bind:value={currentPassword} required />
				<div class="field-spacer"></div>
			{/if}
			<Input
				type="password"
				label="New Password"
				bind:value={newPassword}
				placeholder={userStore.user?.passwordHash ? 'Leave blank to remove' : 'Optional'}
				error={passwordError}
			/>
			{#if newPassword}
				<div class="field-spacer"></div>
				<Input type="password" label="Confirm Password" bind:value={confirmPassword} required />
			{/if}
			<div class="section-actions">
				<Button type="submit" loading={saving}>
					{newPassword ? 'Update Password' : 'Remove Password'}
				</Button>
			</div>
		</form>
	</section>

	<section class="settings-section">
		<h2>Data Management</h2>
		<div class="data-actions">
			<div class="data-action">
				<p class="data-desc">Export a full JSON backup of all your data.</p>
				<Button onclick={handleExportJSON} loading={exporting} variant="secondary">
					Export JSON Backup
				</Button>
			</div>
			<div class="data-action">
				<p class="data-desc">Export trades as CSV.</p>
				<div class="csv-row">
					<select
						class="csv-account-select"
						bind:value={csvAccountId}
						aria-label="Account for CSV export"
					>
						<option value="all">All Accounts</option>
						{#each accountsStore.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
					<Button onclick={handleExportCSV} loading={exporting} variant="secondary">
						Export CSV
					</Button>
				</div>
			</div>
			<div class="data-action">
				<p class="data-desc">Import a JSON backup. This will replace all existing data.</p>
				<input
					type="file"
					accept=".json,application/json"
					class="import-input"
					onchange={handleImportSelect}
					disabled={importing}
					bind:this={fileInputRef}
				/>
				<Button variant="secondary" loading={importing} onclick={() => fileInputRef?.click()}>
					{importing ? 'Importing...' : 'Import Backup'}
				</Button>
			</div>
		</div>
	</section>

	<section class="settings-section">
		<h2>App Info</h2>
		<p class="info-text">Talaan v{__APP_VERSION__}</p>
		<p class="info-text">Developed by ClayTorres</p>
		<p class="info-text">
			<a
				href="https://buymeacoffee.com/claytorres"
				target="_blank"
				rel="noopener noreferrer"
				class="coffee-link">Buy Me a Coffee</a
			>
		</p>
	</section>

	{#if showImportConfirm}
		<Modal
			bind:open={showImportConfirm}
			title="Import Backup"
			confirmLabel="Import"
			confirmVariant="danger"
			onconfirm={handleImportConfirm}
			oncancel={() => {
				showImportConfirm = false;
				importFile = null;
			}}
		>
			<p>
				This will <strong>replace all existing data</strong> with the imported backup. This cannot be
				undone.
			</p>
			<p>Continue?</p>
		</Modal>
	{/if}
</div>

{#if showToast}
	<Toast message={toastMessage} variant={toastVariant} bind:visible={showToast} />
{/if}

<style>
	.settings-page {
		max-width: 36rem;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0 0 1.5rem;
	}

	.settings-section {
		background: var(--color-bg, #ffffff);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
		border: 1px solid var(--color-border, #e5e7eb);
	}

	.settings-section h2 {
		font-size: 1.125rem;
		margin: 0 0 1rem;
	}

	.field-spacer {
		height: 0.75rem;
	}

	.section-actions {
		margin-top: 1rem;
		display: flex;
		justify-content: flex-end;
	}

	.info-text {
		color: var(--color-text-muted, #6b7280);
		margin: 0;
	}

	.data-actions {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.data-action {
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border, #f3f4f6);
	}

	.data-action:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.data-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 0.5rem;
	}

	.csv-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.csv-account-select {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #d1d5db);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: var(--color-bg, #ffffff);
	}

	.import-input {
		display: none;
	}

	.coffee-link {
		color: var(--color-primary, #3b82f6);
		text-decoration: none;
		font-weight: 500;
	}

	.coffee-link:hover {
		text-decoration: underline;
	}
</style>
