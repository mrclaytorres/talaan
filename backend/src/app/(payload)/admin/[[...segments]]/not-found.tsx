import type { AdminViewProps } from 'payload';

import { NotFoundPage } from '@payloadcms/next/views';
import { importMap } from './importMap.js';
import configPromise from '@payload-config';

export { generatePageMetadata as generateMetadata } from '@payloadcms/next/views';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({
    config: configPromise,
    importMap,
    params,
    searchParams,
  });
}
