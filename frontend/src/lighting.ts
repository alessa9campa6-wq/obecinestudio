import type { IconName } from "@/src/ui";

// ---- diagrammi luce --------------------------------------------------------
// Un solo posto descrive cosa si può mettere in pianta, che forma ha e come
// disegnare il fascio di luce. L'editor dell'app e il PDF leggono da qui, così
// il foglio stampato mostra lo stesso schema che vedi sul telefono.
export type LightEl = {
  id: string;
  kind: string;
  x: number;
  y: number;
  rot: number;
  label: string;
  size?: number;
  colore?: string;
};

export type Forma = "camera" | "attore" | "luce" | "modificatore";

export type LightKind = {
  k: string;
  l: string;
  icon: IconName;
  gruppo: "soggetti" | "luci" | "modificatori";
  forma: Forma;
  // Un elemento che emette luce: si porta dietro il fascio e il colore.
  luce: boolean;
  colore: string;
};

// Colori pronti: tungsteno, luce neutra, daylight e gel colorati.
export const LUCI_COLORI = [
  { nome: "Caldo 3200K", hex: "#FFC46B" },
  { nome: "Neutro 4300K", hex: "#FFF0C9" },
  { nome: "Freddo 5600K", hex: "#BFD9FF" },
  { nome: "Rosso", hex: "#FF7A6B" },
  { nome: "Blu", hex: "#6FA8FF" },
  { nome: "Verde", hex: "#9BE89B" },
];

const CALDO = LUCI_COLORI[0].hex;
const NEUTRO = LUCI_COLORI[1].hex;
const FREDDO = LUCI_COLORI[2].hex;

export const LIGHT_KINDS: LightKind[] = [
  { k: "camera", l: "Camera", icon: "video-vintage", gruppo: "soggetti", forma: "camera", luce: false, colore: "" },
  { k: "actor", l: "Attore", icon: "account", gruppo: "soggetti", forma: "attore", luce: false, colore: "" },
  { k: "key", l: "Key", icon: "lightbulb-on", gruppo: "luci", forma: "luce", luce: true, colore: CALDO },
  { k: "fill", l: "Fill", icon: "lightbulb-outline", gruppo: "luci", forma: "luce", luce: true, colore: NEUTRO },
  { k: "back", l: "Controluce", icon: "lightbulb-on-outline", gruppo: "luci", forma: "luce", luce: true, colore: FREDDO },
  { k: "fresnel", l: "Fresnel", icon: "spotlight-beam", gruppo: "luci", forma: "luce", luce: true, colore: CALDO },
  { k: "led", l: "Pannello LED", icon: "view-grid-outline", gruppo: "luci", forma: "luce", luce: true, colore: NEUTRO },
  { k: "soft", l: "Softbox", icon: "square-outline", gruppo: "luci", forma: "luce", luce: true, colore: NEUTRO },
  { k: "practical", l: "Practical", icon: "lamp", gruppo: "luci", forma: "luce", luce: true, colore: CALDO },
  { k: "haze", l: "Haze", icon: "weather-fog", gruppo: "modificatori", forma: "modificatore", luce: false, colore: "" },
  { k: "bounce", l: "Riflettente", icon: "circle-half-full", gruppo: "modificatori", forma: "modificatore", luce: false, colore: "" },
  { k: "flag", l: "Bandiera", icon: "flag-outline", gruppo: "modificatori", forma: "modificatore", luce: false, colore: "" },
  { k: "window", l: "Finestra", icon: "window-closed-variant", gruppo: "modificatori", forma: "modificatore", luce: false, colore: "" },
];

export const gruppiDiLavoro = [
  { key: "soggetti" as const, label: "Soggetti" },
  { key: "luci" as const, label: "Luci" },
  { key: "modificatori" as const, label: "Modificatori" },
];

export const kindOf = (k: string) => LIGHT_KINDS.find((x) => x.k === k) ?? LIGHT_KINDS[0];

// La pianta è un rettangolo 4:3 in coordinate fisse: app e PDF usano gli stessi
// numeri, quindi il fascio ha la stessa apertura su schermo e sulla carta.
export const PIANTA = { w: 1000, h: 750 };

export const clamp01 = (v: number) => Math.max(0.03, Math.min(0.97, v));

// Aggancio a una griglia fine (2% della pianta): lo schema resta ordinato, ma
// lo spostamento è impercettibile rispetto a dove metti il dito.
export const snap = (v: number, passo = 0.02) =>
  Number((Math.round(v / passo) * passo).toFixed(3));

export const centro = (el: LightEl) => ({ cx: el.x * PIANTA.w, cy: el.y * PIANTA.h });

export const raggio = (el: LightEl) => 20 * (el.size || 1);

export const coloreDi = (el: LightEl) =>
  el.colore && /^#[0-9a-fA-F]{6}$/.test(el.colore) ? el.colore : kindOf(el.kind).colore || "#D4AF37";

// Il fascio: un cono che parte dal centro dell'elemento nella direzione della
// rotazione (0° = verso destra, come un orologio).
export const FASCIO_APERTURA = 0.28; // mezzo angolo, in radianti (~16°)

export function fascio(el: LightEl, scala = 1) {
  const { cx, cy } = centro(el);
  const lunghezza = 300 * (el.size || 1) * scala;
  const a = ((el.rot || 0) * Math.PI) / 180;
  const p1 = [cx + lunghezza * Math.cos(a - FASCIO_APERTURA), cy + lunghezza * Math.sin(a - FASCIO_APERTURA)];
  const p2 = [cx + lunghezza * Math.cos(a + FASCIO_APERTURA), cy + lunghezza * Math.sin(a + FASCIO_APERTURA)];

  return {
    punta: { x: cx + lunghezza * Math.cos(a), y: cy + lunghezza * Math.sin(a) },
    punti: `${cx},${cy} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,
  };
}

// Il puntino dove arriva la luce: aiuta a capire "dove butta".
export const bersaglio = (el: LightEl) => fascio(el).punta;

// Nome del colore, per la legenda stampata.
export const nomeColore = (el: LightEl) =>
  LUCI_COLORI.find((c) => c.hex.toLowerCase() === coloreDi(el).toLowerCase())?.nome ?? "colore personalizzato";
