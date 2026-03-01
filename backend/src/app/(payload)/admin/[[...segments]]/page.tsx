import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from './importMap.js';
import configPromise from '@payload-config';

export const generateMetadata = generatePageMetadata;

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export default async function Page({ params, searchParams }: Args) {
  return RootPage({
    config: configPromise,
    importMap,
    params,
    searchParams,
  });
}
