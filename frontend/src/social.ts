import { fileUrl } from "@/src/api";

// Tipi e piccoli aiuti condivisi da feed, esplora, messaggi e profilo.
export type Person = {
  user_id: string;
  username: string;
  name: string;
  picture?: string | null;
  crew_role?: string;
  profiles?: string[];
  view_mode?: string;
  bio?: string;
  link?: string;
  following?: boolean;
};

export type PostPrivacy = "public" | "unlisted" | "private";

export type Post = {
  id: string;
  author: Person;
  text: string;
  media: string[];
  ratios?: number[];
  kind: "post" | "rental";
  privacy: PostPrivacy;
  project_id?: string | null;
  price?: string;
  place?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number;
  created_at: string;
  likes: number;
  liked: boolean;
  comments: number;
  is_mine: boolean;
};

export type Profile = {
  user: Person & { rental: Record<string, string>; has_rental: boolean };
  posts: number;
  followers: number;
  following: number;
  is_me: boolean;
  following_them: boolean;
};

export type Thread = {
  user_id: string;
  text: string;
  from_me: boolean;
  read: boolean;
  created_at: string;
  user: Person;
};

export type DirectMessage = { id: string; text: string; from_me: boolean; created_at: string };

export type Comment = { id: string; text: string; author: Person; created_at: string; is_mine: boolean };

export const PRIVACY_LABEL: Record<PostPrivacy, string> = {
  public: "Pubblico",
  unlisted: "Non in elenco",
  private: "Solo io",
};

export const PRIVACY_HINT: Record<PostPrivacy, string> = {
  public: "Lo vedono tutti, compare in Esplora e nel profilo",
  unlisted: "Non compare né in Esplora né nel profilo: lo apre solo chi ha il link",
  private: "Lo vedi solo tu: resta un appunto personale",
};

export const nomePersona = (p?: Person | null) => p?.name?.trim() || (p?.username ? `@${p.username}` : "Persona");

export const fotoPersona = (p?: Person | null) => {
  const pic = p?.picture;
  if (!pic) return null;
  return /^https?:\/\//i.test(pic) ? pic : fileUrl(pic);
};

// "adesso", "12 min", "3 h", "ieri", "12 nov": come su Instagram.
export function tempoFa(iso: string): string {
  if (!iso) return "";
  const quando = new Date(iso);
  if (Number.isNaN(quando.getTime())) return "";
  const minuti = Math.floor((Date.now() - quando.getTime()) / 60000);
  if (minuti < 1) return "adesso";
  if (minuti < 60) return `${minuti} min`;
  const ore = Math.floor(minuti / 60);
  if (ore < 24) return `${ore} h`;
  const giorni = Math.floor(ore / 24);
  if (giorni === 1) return "ieri";
  if (giorni < 7) return `${giorni} g`;
  return quando.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
