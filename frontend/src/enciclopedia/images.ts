// Immagini di repertorio (Unsplash, licenza Unsplash) usate come copertina
// delle categorie e delle voci. Sono URL pubblici e verificati.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=1200&auto=format&fit=crop`;

export const CATEGORY_IMAGES: Record<string, string> = {
  regia: u("1485846234645-a62644f84728"),
  fotografia: u("1478720568477-152d9b164e26"),
  attrezzatura: u("1612544409025-e1f6a56c1152"),
  illuminazione: u("1470229722913-7c0e2dbbafd3"),
  audio: u("1598488035139-bdbb2231ce04"),
  montaggio: u("1574717024653-61fd2cf4d44d"),
  color: u("1518929458119-e5bf444c30f4"),
  produzione: u("1500530855697-b586d89ba3ee"),
  sceneggiatura: u("1455390582262-044cdead277a"),
  speciali: u("1440404653325-ab127d49abc1"),
  legal: u("1450101499163-c8848c66ca85"),
  glossario: u("1489599849927-2ee91cede3ba"),
};

export function categoryImage(categoryId: string): string {
  return CATEGORY_IMAGES[categoryId] ?? CATEGORY_IMAGES.regia;
}
