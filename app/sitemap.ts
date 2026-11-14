import type {MetadataRoute} from 'next';
import {ALLOW_INDEXING, SITE_URL} from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // A personal deployment should never advertise its notes shell to crawlers.
  if (!ALLOW_INDEXING) return [];

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
