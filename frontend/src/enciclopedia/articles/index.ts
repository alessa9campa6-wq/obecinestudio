import { Article } from "../types";
import { REGIA_ARTICLES } from "./regia";
import { FOTOGRAFIA_ARTICLES } from "./fotografia";
import { ATTREZZATURA_ARTICLES } from "./attrezzatura";
import { ILLUMINAZIONE_ARTICLES } from "./illuminazione";
import { AUDIO_ARTICLES } from "./audio";
import { MONTAGGIO_ARTICLES } from "./montaggio";
import { COLOR_ARTICLES } from "./color";
import { PRODUZIONE_ARTICLES } from "./produzione";
import { SCENEGGIATURA_ARTICLES } from "./sceneggiatura";
import { SPECIALI_ARTICLES } from "./speciali";
import { LEGAL_ARTICLES } from "./legal";
import { GLOSSARIO_ARTICLES } from "./glossario";

export const ALL_ARTICLES: Article[] = [
  ...REGIA_ARTICLES,
  ...FOTOGRAFIA_ARTICLES,
  ...ATTREZZATURA_ARTICLES,
  ...ILLUMINAZIONE_ARTICLES,
  ...AUDIO_ARTICLES,
  ...MONTAGGIO_ARTICLES,
  ...COLOR_ARTICLES,
  ...PRODUZIONE_ARTICLES,
  ...SCENEGGIATURA_ARTICLES,
  ...SPECIALI_ARTICLES,
  ...LEGAL_ARTICLES,
  ...GLOSSARIO_ARTICLES,
];

export const ARTICLES_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ALL_ARTICLES.map((a) => [a.slug, a]),
);

export function articlesByCategory(categoryId: string): Article[] {
  return ALL_ARTICLES.filter((a) => a.categoryId === categoryId);
}

export function searchArticles(query: string): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_ARTICLES;
  const tokens = q.split(/\s+/).filter(Boolean);
  return ALL_ARTICLES.filter((a) => {
    const haystack = [
      a.title,
      a.subtitle,
      a.shortDescription,
      a.keywords.join(" "),
      a.synonyms.join(" "),
      a.content.principiante,
      a.content.intermedio,
      a.content.avanzato,
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}
