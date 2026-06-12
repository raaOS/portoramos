/**
 * Type definitions untuk Gallery Featured projects.
 *
 * Digunakan oleh `galleryFeaturedService`, `adminQueries`,
 * dan `GalleryManager` component.
 *
 * @module types/gallery
 */

/**
 * Data featured projects yang ditampilkan di gallery.
 *
 * Disimpan di Cloudflare D1 melalui `content` service
 * dan di-sync ke client melalui realtime polling.
 */
export interface GalleryFeaturedData {
  /** Daftar ID project yang di-pin sebagai featured. Urutan = urutan tampil. */
  featuredProjectIds: string[];

  /** ISO 8601 timestamp pembaruan terakhir. */
  lastUpdated: string;
}
