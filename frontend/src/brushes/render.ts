// Renders stored strokes to an image (thumbnails, PDF). Native only; render.web.ts is a no-op.
import { ImageFormat } from "@shopify/react-native-skia";

import { Stroke, viewH, VW } from "../strokes";
import { createBrushEngine } from "./engine";

const PAPER = "#FFFFFF";
export type RenderOpts = { width: number; format?: "png" | "jpeg"; quality?: number };

// Cache per strokes array (react-query keeps the same array until the data changes).
const cache = new WeakMap<Stroke[], Map<string, string>>();
const keyOf = (aspect: string | undefined, o: RenderOpts) => `${aspect ?? ""}|${Math.round(o.width)}|${o.format ?? "png"}`;

export function peekDataUri(strokes: Stroke[], aspect: string | undefined, o: RenderOpts): string | null {
  return cache.get(strokes)?.get(keyOf(aspect, o)) ?? null;
}

export function strokesToDataUri(strokes: Stroke[], aspect: string | undefined, o: RenderOpts): string | null {
  const hit = peekDataUri(strokes, aspect, o);
  if (hit) return hit;
  const engine = createBrushEngine(VW, viewH(aspect), o.width);
  if (!engine) return null;
  try {
    engine.rebuild(strokes);
    const img = engine.exportImage(PAPER);
    const jpeg = o.format === "jpeg";
    const b64 = jpeg ? img.encodeToBase64(ImageFormat.JPEG, o.quality ?? 85) : img.encodeToBase64(ImageFormat.PNG, 100);
    img.dispose();
    const uri = `data:image/${jpeg ? "jpeg" : "png"};base64,${b64}`;
    let m = cache.get(strokes);
    if (!m) cache.set(strokes, (m = new Map()));
    m.set(keyOf(aspect, o), uri);
    return uri;
  } catch {
    return null;
  } finally {
    engine.dispose();
  }
}

// One thumbnail per tick so opening a long storyboard never blocks the UI.
const queue: (() => void)[] = [];
let running = false;
export function enqueueRender(job: () => void) {
  queue.push(job);
  if (running) return;
  running = true;
  const next = () => {
    const j = queue.shift();
    if (!j) {
      running = false;
      return;
    }
    try {
      j();
    } finally {
      setTimeout(next, 0);
    }
  };
  setTimeout(next, 0);
}
