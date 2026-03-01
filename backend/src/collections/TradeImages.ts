import type { CollectionConfig } from 'payload';

export const TradeImages: CollectionConfig = {
	slug: 'trade-images',
	upload: {
		staticDir: '../media/trade-images',
		mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
		imageSizes: [
			{
				name: 'thumbnail',
				width: 200,
				height: 200,
				position: 'centre',
			},
			{
				name: 'medium',
				width: 800,
				height: 600,
				position: 'centre',
			},
		],
	},
	access: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
	},
	fields: [
		{
			name: 'trade',
			type: 'relationship',
			relationTo: 'trade-positions',
			required: true,
		},
		{
			name: 'sortOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
		},
	],
};
