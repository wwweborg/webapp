export interface CachedImage {
  buffer: Buffer;
  contentType: string;
}

const globalForImageCache = globalThis as unknown as {
  __webappImageCache?: Map<string, CachedImage>;
};

export const imageCache: Map<string, CachedImage> =
  globalForImageCache.__webappImageCache ||
  (globalForImageCache.__webappImageCache = new Map<string, CachedImage>());

export function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'avif':
      return 'image/avif';
    case 'png':
    default:
      return 'image/png';
  }
}
