import { num } from "@/src/modules";

// ---- tavola della moodboard -------------------------------------------------
// La tavola è un rettangolo 3:2. Posizioni e misure si salvano come frazioni
// della tavola (0..1), non in pixel: così la stessa disposizione si ritrova
// identica sul telefono, sull'iPad e nel PDF.
export const BOARD_RATIO = 1.5;

export type BoardBox = { x: number; y: number; w: number; h: number; rot: number; z: number };

// Sfondi pronti per le schede di testo: un moodboard è anche colore.
export const BOARD_FONDI = [
  { nome: "Nero", hex: "#111111" },
  { nome: "Carta", hex: "#F2EDE4" },
  { nome: "Bianco", hex: "#FFFFFF" },
  { nome: "Oro", hex: "#D4AF37" },
  { nome: "Terracotta", hex: "#B4553C" },
  { nome: "Verde", hex: "#2F5D50" },
  { nome: "Blu", hex: "#2B3A67" },
];

// Testo leggibile sul colore scelto: nero sui fondi chiari, bianco sugli scuri.
export function testoSu(hex: string): string {
  const grezzo = String(hex ?? "").replace("#", "").trim();
  const pieno = grezzo.length === 3 ? grezzo.split("").map((c) => c + c).join("") : grezzo.padEnd(6, "0").slice(0, 6);
  const n = parseInt(pieno, 16);
  if (isNaN(n)) return "#FFFFFF";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#111111" : "#FFFFFF";
}

const dentro = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Disposizione automatica: le moodboard fatte prima non hanno posizioni salvate,
// quindi vanno sparse in una griglia calcolata sull'ordine. È deterministica:
// app e PDF ottengono lo stesso risultato.
export function boardAuto(count: number): BoardBox[] {
  if (count < 1) return [];

  const colonne = Math.max(1, Math.ceil(Math.sqrt(count * BOARD_RATIO)));
  const righe = Math.ceil(count / colonne);
  const cw = 1 / colonne;
  const ch = 1 / righe;
  const buco = 0.012;

  // Misure e posizioni variano in modo deterministico: una griglia perfetta
  // sembra un archivio, non un moodboard. Ogni scheda resta dentro la sua
  // cella, quindi non si sovrappongono.
  const caso = (i: number, passo: number) => ((i * passo) % 100) / 100;

  return Array.from({ length: count }, (_, i) => {
    const colonna = i % colonne;
    const riga = Math.floor(i / colonne);
    const w = Math.min(cw - buco * 2, cw * (0.84 + 0.16 * caso(i, 53)));
    const h = Math.min(ch - buco * 2, ch * (0.84 + 0.16 * caso(i, 29)));

    return {
      x: colonna * cw + buco + caso(i, 37) * Math.max(0, cw - buco * 2 - w),
      y: riga * ch + buco + caso(i, 71) * Math.max(0, ch - buco * 2 - h),
      w,
      h,
      rot: ((i % 5) - 2) * 1.2,
      z: i,
    };
  });
}

const vuoto = (v: any) => v === undefined || v === null || v === "";

// Posizione di un elemento: quella salvata sulla scheda, altrimenti quella
// automatica. Una sola funzione per app e PDF, così non possono divergere.
export function boardBoxes(items: { data: Record<string, any> }[]): BoardBox[] {
  const auto = boardAuto(items.length);

  return items.map((item, i) => {
    const d = item.data ?? {};
    const w = dentro(vuoto(d.tavola_w) ? auto[i].w : num(d.tavola_w), 0.06, 1);
    const h = dentro(vuoto(d.tavola_h) ? auto[i].h : num(d.tavola_h), 0.05, 1);

    return {
      x: dentro(vuoto(d.tavola_x) ? auto[i].x : num(d.tavola_x), 0, Math.max(0, 1 - w)),
      y: dentro(vuoto(d.tavola_y) ? auto[i].y : num(d.tavola_y), 0, Math.max(0, 1 - h)),
      w,
      h,
      rot: dentro(vuoto(d.tavola_rot) ? auto[i].rot : num(d.tavola_rot), -45, 45),
      z: Math.round(vuoto(d.tavola_z) ? auto[i].z : num(d.tavola_z)),
    };
  });
}

// I dati da salvare quando un elemento viene spostato, ridimensionato o ruotato.
export const boardSave = (box: BoardBox) => ({
  tavola_x: Math.round(box.x * 1000) / 1000,
  tavola_y: Math.round(box.y * 1000) / 1000,
  tavola_w: Math.round(box.w * 1000) / 1000,
  tavola_h: Math.round(box.h * 1000) / 1000,
  tavola_rot: Math.round(box.rot),
  tavola_z: Math.round(box.z),
});

export const limitato = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
