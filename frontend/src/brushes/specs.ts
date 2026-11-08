// Brush definitions for the storyboard. Pure data, no Skia imports, so it is
// shared by the Skia engine, the SVG fallback and the toolbar.
//
// Every brush declares HOW it is drawn (kind), HOW the finished stroke is
// composited (blend/opacity/soft/grain) and whether it erases. The engine has
// no per-tool `if` outside of this table.

export type BrushKey =
  | "matita"
  | "inchiostro"
  | "pennarello"
  | "acquerello"
  | "pennello"
  | "carboncino"
  | "aerografo"
  | "linea"
  | "gomma"
  | "gomma-morbida";

// capsule: chain of round-capped segments (hard tools, eraser)
// wash:    capsule chain with a darker rim (watercolor)
// bristle: parallel bristle lines that drop out at light pressure
// scatter: random particles inside the nib (charcoal)
// spray:   soft blurred dabs that build up + speckle (airbrush)
// line:    straight line from first to last point
export type BrushKind = "capsule" | "wash" | "bristle" | "scatter" | "spray" | "line";
export type BlendName = "srcOver" | "multiply" | "dstOut";

export type BrushSpec = {
  label: string;
  icon: string;
  kind: BrushKind;
  base: number; // nib diameter in logical units at size 1 (the canvas is 1600 units wide)
  press: number; // how much pressure changes the width
  ramp: number; // distance over which a stroke grows from thin to full width
  smooth: number; // 0..1 stabilizer
  spacing: number; // dab spacing as a fraction of the width
  minStep: number; // minimum dab spacing in logical units
  blend: BlendName; // how the finished stroke is composited on the page
  opacity: number; // stroke opacity (multiplied by the opacity chip)
  flow: number; // per-dab alpha for brushes that build up (spray)
  grain: number; // 0..1 paper tooth applied to the finished stroke
  soft: number; // composite blur as a fraction of the width (0 = hard edge)
  bleed?: number; // 0..1 how much the wash spreads after the stroke
  erase?: boolean;
};

export const BRUSHES: Record<BrushKey, BrushSpec> = {
  matita: { label: "Matita", icon: "pencil-outline", kind: "capsule", base: 2.4, press: 1.1, ramp: 6, smooth: 0.3, spacing: 0.3, minStep: 1.2, blend: "srcOver", opacity: 0.9, flow: 1, grain: 0.5, soft: 0 },
  inchiostro: { label: "Inchiostro", icon: "fountain-pen-tip", kind: "capsule", base: 3.4, press: 0.9, ramp: 10, smooth: 0.45, spacing: 0.3, minStep: 1.2, blend: "srcOver", opacity: 1, flow: 1, grain: 0, soft: 0 },
  pennarello: { label: "Pennarello", icon: "marker", kind: "capsule", base: 18, press: 0.12, ramp: 2, smooth: 0.45, spacing: 0.25, minStep: 1.5, blend: "multiply", opacity: 0.6, flow: 1, grain: 0, soft: 0.08 },
  acquerello: { label: "Acquerello", icon: "brush", kind: "wash", base: 26, press: 0.8, ramp: 14, smooth: 0.55, spacing: 0.25, minStep: 1.5, blend: "multiply", opacity: 0.42, flow: 1, grain: 0, soft: 0.03, bleed: 0 },
  pennello: { label: "Pennello", icon: "brush", kind: "bristle", base: 14, press: 1.2, ramp: 12, smooth: 0.35, spacing: 0.3, minStep: 2, blend: "srcOver", opacity: 0.95, flow: 1, grain: 0, soft: 0.09 },
  carboncino: { label: "Carboncino", icon: "grease-pencil", kind: "scatter", base: 9, press: 1.4, ramp: 8, smooth: 0.25, spacing: 0.3, minStep: 2.5, blend: "srcOver", opacity: 0.9, flow: 1, grain: 0.8, soft: 0.01 },
  aerografo: { label: "Aerografo", icon: "weather-windy", kind: "spray", base: 34, press: 0.5, ramp: 0, smooth: 0.6, spacing: 0.18, minStep: 2, blend: "srcOver", opacity: 1, flow: 0.1, grain: 0, soft: 0.8 },
  linea: { label: "Linea", icon: "vector-line", kind: "line", base: 4, press: 0, ramp: 0, smooth: 0, spacing: 1, minStep: 1, blend: "srcOver", opacity: 1, flow: 1, grain: 0, soft: 0 },
  gomma: { label: "Gomma", icon: "eraser", kind: "capsule", base: 40, press: 0, ramp: 0, smooth: 0.2, spacing: 0.25, minStep: 1.5, blend: "dstOut", opacity: 1, flow: 1, grain: 0, soft: 0, erase: true },
  "gomma-morbida": { label: "Gomma morbida", icon: "eraser", kind: "capsule", base: 64, press: 0.2, ramp: 0, smooth: 0.3, spacing: 0.25, minStep: 1.5, blend: "dstOut", opacity: 0.5, flow: 1, grain: 0, soft: 0.18, erase: true },
};

export const BRUSH_KEYS = Object.keys(BRUSHES) as BrushKey[];

// Unknown / legacy tool names ("penna") fall back to ink.
export const specFor = (key?: string): BrushSpec => BRUSHES[key as BrushKey] ?? BRUSHES.inchiostro;
export const isEraser = (key?: string): boolean => !!BRUSHES[key as BrushKey]?.erase;

export const widthFor = (spec: BrushSpec, size: number, pressure: number): number =>
  Math.max(0.5, spec.base * size * (1 + spec.press * (pressure - 0.5) * 1.7));

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Small deterministic PRNG so a stroke looks identical live, after undo,
// in thumbnails and in the PDF.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const seedOf = (x: number, y: number): number =>
  (Math.imul(Math.round(x * 10), 73856093) ^ Math.imul(Math.round(y * 10), 19349663)) >>> 0;
