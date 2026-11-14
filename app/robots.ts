import type {MetadataRoute} from 'next';
import {ALLOW_INDEXING, SITE_URL} from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    // Private by default: a normal deployment holds someone's personal notes.
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
