import type { CollectionConfig } from 'payload';

export const Tickers: CollectionConfig = {
  slug: 'tickers',
  labels: {
    singular: 'Ticker',
    plural: 'Tickers',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'symbol',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 20,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'assetClass',
      type: 'select',
      required: true,
      options: [
        { label: 'Stock', value: 'stock' },
        { label: 'Forex', value: 'forex' },
        { label: 'Crypto', value: 'crypto' },
      ],
    },
    {
      name: 'exchange',
      type: 'text',
    },
    {
      name: 'baseCurrency',
      type: 'text',
    },
    {
      name: 'quoteCurrency',
      type: 'text',
    },
  ],
};
