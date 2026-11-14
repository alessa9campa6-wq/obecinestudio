import { storage } from "@/src/utils/storage";
import { FavoriteItem, RecentItem } from "./types";

const FAV_KEY = "enciclopedia_favorites";
const REC_KEY = "enciclopedia_recent";

export async function loadFavorites(): Promise<FavoriteItem[]> {
  return ((await (storage as any).getItem(FAV_KEY, [])) as FavoriteItem[]) ?? [];
}

export async function saveFavorites(items: FavoriteItem[]): Promise<void> {
  await (storage as any).setItem(FAV_KEY, items);
}

export async function toggleFavorite(slug: string): Promise<FavoriteItem[]> {
  const items = await loadFavorites();
  const idx = items.findIndex((i) => i.slug === slug);
  if (idx >= 0) items.splice(idx, 1);
  else items.unshift({ slug, savedAt: Date.now() });
  await saveFavorites(items);
  return items;
}

export async function isFavorite(slug: string): Promise<boolean> {
  const items = await loadFavorites();
  return items.some((i) => i.slug === slug);
}

export async function loadRecent(): Promise<RecentItem[]> {
  return ((await (storage as any).getItem(REC_KEY, [])) as RecentItem[]) ?? [];
}

export async function pushRecent(slug: string): Promise<RecentItem[]> {
  const items = await loadRecent();
  const filtered = items.filter((i) => i.slug !== slug);
  filtered.unshift({ slug, viewedAt: Date.now() });
  const trimmed = filtered.slice(0, 20);
  await (storage as any).setItem(REC_KEY, trimmed);
  return trimmed;
}
