import { registerAs } from '@nestjs/config';

export default registerAs('catalog', () => ({
  defaultPageSize: parseInt(process.env.CATALOG_DEFAULT_PAGE_SIZE ?? '24', 10),
  maxImageSizeBytes: parseInt(
    process.env.CATALOG_MAX_IMAGE_SIZE_BYTES ?? `${8 * 1024 * 1024}`,
    10,
  ),
  // Object storage integration is deferred (no bucket/CDN provisioned yet) —
  // images are written to local disk as a stand-in, swap for a real
  // uploader behind the same ProductsService.uploadImage contract later.
  imageStorageDir: process.env.CATALOG_IMAGE_STORAGE_DIR ?? 'uploads/products',
  imageBaseUrl: process.env.CATALOG_IMAGE_BASE_URL ?? '/static/products',
}));
