import type { CollectionConfig } from 'payload';
import { validateTradeBeforeChange } from '../hooks/trade-validation';

export const TradePositions: CollectionConfig = {
	slug: 'trade-positions',
	admin: {
		useAsTitle: 'tickerSymbol',
		defaultColumns: ['tickerSymbol', 'date', 'direction', 'status'],
	},
	access: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
	},
	hooks: {
		beforeChange: [validateTradeBeforeChange],
	},
	defaultSort: '-date',
	fields: [
		{
			name: 'account',
			type: 'relationship',
			relationTo: 'trading-accounts',
			required: true,
		},
		{
			name: 'date',
			type: 'date',
			required: true,
		},
		{
			name: 'tickerSymbol',
			type: 'text',
			required: true,
			maxLength: 20,
		},
		{
			name: 'direction',
			type: 'select',
			required: true,
			options: [
				{ label: 'Long', value: 'long' },
				{ label: 'Short', value: 'short' },
			],
		},
		{
			name: 'entryPrice',
			type: 'number',
			required: true,
			min: 0,
		},
		{
			name: 'stopLoss',
			type: 'number',
			required: true,
			min: 0,
		},
		{
			name: 'takeProfit',
			type: 'number',
			required: true,
			min: 0,
		},
		{
			name: 'positionSize',
			type: 'number',
			min: 0,
		},
		{
			name: 'exitPrice',
			type: 'number',
			min: 0,
		},
		{
			name: 'status',
			type: 'select',
			required: true,
			defaultValue: 'open',
			options: [
				{ label: 'Open', value: 'open' },
				{ label: 'Closed', value: 'closed' },
			],
		},
		{
			name: 'rrRatio',
			type: 'number',
		},
		{
			name: 'pnlAmount',
			type: 'number',
		},
		{
			name: 'pnlPercent',
			type: 'number',
		},
		{
			name: 'notes',
			type: 'textarea',
		},
	],
};
