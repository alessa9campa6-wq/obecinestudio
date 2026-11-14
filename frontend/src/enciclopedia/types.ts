// Knowledge base cinematografica di CineStudio.
// Struttura modulare e data-driven: aggiungere categorie/articoli non richiede
// modifiche alle schermate, basta estendere i dati.

import type { IconName } from "@/src/ui";

export type ArticleLevel = "principiante" | "intermedio" | "avanzato";

export const LEVEL_LABELS: Record<ArticleLevel, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzato: "Avanzato",
};

export type ArticleImage = {
  alt: string;
  title?: string;
  description?: string;
  caption?: string;
  uri?: string; // remote url
  // local diagram key (resolved by the UI)
  diagram?: string;
};

export type ArticleTable = {
  title?: string;
  columns: string[];
  rows: string[][];
};

export type GlossaryEntry = { term: string; def: string };

export type Article = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  categoryId: string;
  subcategoryId?: string;
  difficulty: ArticleLevel;
  shortDescription: string;
  keywords: string[];
  synonyms: string[]; // termini alternativi/inglesi per la ricerca
  content: {
    principiante: string;
    intermedio: string;
    avanzato: string;
  };
  howItWorks?: string;
  practical?: string;
  examples?: string[];
  pros?: string[];
  cons?: string[];
  commonMistakes?: string[];
  tables?: ArticleTable[];
  formulas?: string[];
  related: string[];
  glossary?: GlossaryEntry[];
  sources?: { title: string; url?: string }[];
  images?: ArticleImage[];
  diagram?: string; // key into DIAGRAMS
  tool?: string; // key into TOOLS
  lastUpdated: string;
};

export type Subcategory = { id: string; title: string };

export type Category = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  subcategories: Subcategory[];
};

export type FavoriteItem = { slug: string; savedAt: number };
export type RecentItem = { slug: string; viewedAt: number };
