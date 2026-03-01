import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
	slug: 'users',
	auth: true,
	admin: {
		useAsTitle: 'displayName',
	},
	access: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
	},
	fields: [
		{
			name: 'displayName',
			type: 'text',
			required: true,
			maxLength: 100,
		},
		{
			name: 'passwordHash',
			type: 'text',
			admin: {
				description: 'Hashed locally before storage (PBKDF2 with SHA-256)',
			},
		},
		{
			name: 'timezone',
			type: 'text',
			required: true,
			defaultValue: 'UTC',
		},
		{
			name: 'securityQ',
			type: 'text',
			maxLength: 200,
		},
		{
			name: 'securityA',
			type: 'text',
			admin: {
				description: 'Hashed security answer',
			},
		},
	],
};
