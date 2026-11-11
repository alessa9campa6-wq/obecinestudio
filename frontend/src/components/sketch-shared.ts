import type { BrushKey } from "@/src/brushes/specs";
import type { Pt, Stroke } from "@/src/strokes";

// Drawing ink, paper and guides stay identical in both themes, like real storyboard paper.
export const PAPER = "#FFFFFF";
export const GUIDE = "#4F8FD8";
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type Brush = { tool: BrushKey; color: string; size: number; alpha: number; pencilOnly: boolean };
// "stylus" and "finger" are certain (touch started alone); "unknown" started while other touches were down.
export type Track = { pts: Pt[]; len: number; kind: "stylus" | "finger" | "unknown"; t0: number; lastT: number };

export type CanvasProps = {
  strokes: Stroke[];
  setStrokes: (fn: (s: Stroke[]) => Stroke[]) => void;
  brush: Brush;
  aspect?: string;
  grid: boolean;
  underlay?: string;
  underlayOpacity?: number;
  maxH?: number;
  onUndo: () => void;
  // Pinch: il canvas riferisce il livello di zoom e accetta un reset esterno.
  onZoom?: (level: number) => void;
  resetZoom?: number;
};
