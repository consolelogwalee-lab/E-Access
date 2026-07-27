/**
 * Maps a listing to one of the real property photos in /public/photos,
 * keyed by property type so land shows land, apartments show apartments, etc.
 * image_seed keeps assignment stable per listing.
 */
export const PHOTO_COUNTS: Record<string, number> = {
  land: 6,
  apartment: 7,
  duplex: 11,
  commercial: 4,
};

export function listingImage(
  l: { property_type?: string; image_seed?: number | string },
  offset = 0
): string {
  const type = l.property_type && PHOTO_COUNTS[l.property_type] ? l.property_type : "duplex";
  const count = PHOTO_COUNTS[type];
  const seed = Math.abs(Number(l.image_seed ?? 1) - 1 + offset);
  return `/photos/${type}-${(seed % count) + 1}.jpg`;
}

/** Any photo from the whole pool, for galleries that want variety beyond the type. */
const POOL = [
  "duplex-1", "apartment-1", "duplex-2", "commercial-1", "apartment-2",
  "duplex-3", "land-1", "duplex-4", "apartment-3", "duplex-5", "commercial-2", "land-2",
  "duplex-6", "apartment-4", "interior-1", "duplex-7", "land-3", "apartment-5",
  "duplex-8", "commercial-3", "interior-2", "duplex-9", "apartment-6", "land-4",
  "duplex-10", "estate-aerial", "interior-3", "apartment-7", "duplex-11", "land-5",
  "commercial-4", "land-6",
];
export function poolImage(seed: number | string, offset = 0): string {
  const i = Math.abs(Number(seed) - 1 + offset) % POOL.length;
  return `/photos/${POOL[i]}.jpg`;
}
