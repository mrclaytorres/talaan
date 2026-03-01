import type { User, CreateUserData, UpdateUserData } from '$lib/types/index.js';
import { getDataService } from '$lib/services/index.js';

class UserStore {
	user = $state<User | null>(null);
	isLoading = $state(false);

	async loadUser(): Promise<void> {
		this.isLoading = true;
		try {
			const ds = getDataService();
			this.user = await ds.getUser();
		} finally {
			this.isLoading = false;
		}
	}

	async createUser(data: CreateUserData): Promise<void> {
		const ds = getDataService();

		let passwordHash: string | null = null;
		if (data.password) {
			passwordHash = await hashPassword(data.password);
		}

		let securityAHash: string | null = null;
		if (data.securityA) {
			securityAHash = await hashPassword(data.securityA);
		}

		this.user = await ds.createUser({
			...data,
			passwordHash,
			securityA: securityAHash,
		} as unknown as CreateUserData);

		// Auto-create "Default" trading account
		await ds.createAccount({
			user: this.user.id,
			name: 'Default',
			currency: 'USD',
			startingCapital: 0,
		});
	}

	async updateUser(data: UpdateUserData): Promise<void> {
		if (!this.user) return;
		const ds = getDataService();
		this.user = await ds.updateUser(this.user.id, data);
	}

	async verifyPassword(input: string): Promise<boolean> {
		if (!this.user?.passwordHash) return true;
		return verifyHash(input, this.user.passwordHash);
	}

	async verifySecurityAnswer(input: string): Promise<boolean> {
		if (!this.user?.securityA) return false;
		return verifyHash(input, this.user.securityA);
	}

	async changePassword(newPassword: string | null): Promise<void> {
		if (!this.user) return;
		const ds = getDataService();
		const passwordHash = newPassword ? await hashPassword(newPassword) : null;
		this.user = await ds.updateUser(this.user.id, { passwordHash });
	}
}

export const userStore = new UserStore();

/**
 * Hash a password using PBKDF2 with SHA-256.
 * Stores as "salt:hash" in hex format.
 */
async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt.buffer as ArrayBuffer,
			iterations: 100_000,
			hash: 'SHA-256',
		},
		keyMaterial,
		256,
	);
	const hashHex = bufToHex(new Uint8Array(bits));
	const saltHex = bufToHex(salt);
	return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
async function verifyHash(
	password: string,
	stored: string,
): Promise<boolean> {
	const [saltHex, expectedHash] = stored.split(':');
	const salt = hexToBuf(saltHex);
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits'],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt.buffer as ArrayBuffer,
			iterations: 100_000,
			hash: 'SHA-256',
		},
		keyMaterial,
		256,
	);
	const hashHex = bufToHex(new Uint8Array(bits));
	return hashHex === expectedHash;
}

function bufToHex(buf: Uint8Array): string {
	return Array.from(buf)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexToBuf(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}
