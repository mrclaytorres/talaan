export interface User {
	id: string;
	displayName: string;
	passwordHash: string | null;
	timezone: string;
	securityQ: string | null;
	securityA: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserData {
	displayName: string;
	password?: string;
	timezone: string;
	securityQ?: string;
	securityA?: string;
}

export interface UpdateUserData {
	displayName?: string;
	passwordHash?: string | null;
	timezone?: string;
	securityQ?: string | null;
	securityA?: string | null;
}
