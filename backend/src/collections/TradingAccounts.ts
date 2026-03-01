import type { CollectionConfig } from 'payload';

export const TradingAccounts: CollectionConfig = {
  slug: 'trading-accounts',
  labels: {
    singular: 'Trading Account',
    plural: 'Trading Accounts',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  defaultSort: 'createdAt',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'USD',
      maxLength: 10,
    },
    {
      name: 'startingCapital',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
  ],
};
