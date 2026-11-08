// Skia brush engine for the storyboard (native only).
//
// Model: three offscreen surfaces at device resolution.
//   committed  every finished stroke, on a transparent background
//   live       the stroke being drawn, at full opacity (its "coverage")
//   display    committed + live composited with the brush's blend/opacity/grain
// The page (white paper, light-table underlay) lives in React Native views
// below the Skia canvas, so the eraser really removes pixels instead of painting white.
//
// Finished strokes are NOT re-rendered per frame: each frame only the newest
// dabs are added to `live` and two images are blitted into `display`.
import {
  AlphaType,
  BlendMode,
  BlurStyle,
  ColorType,
  FilterMode,
  MipmapMode,
  PaintStyle,
  PointMode,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
} from "@shopify/react-native-skia";
import type { SkCanvas, SkImage, SkPaint, SkSurface } from "@shopify/react-native-skia";

import { Stroke } from "../strokes";
import { Dab, StrokeSampler } from "./sampler";
import { BRUSH_KEYS, BrushSpec, clamp01, mulberry32, seedOf, specFor } from "./specs";

const BLEND = { srcOver: BlendMode.SrcOver, multiply: BlendMode.Multiply, dstOut: BlendMode.DstOut } as const;
const HISTORY = 2; // snapshots kept for instant undo
const GRAIN_TILE = 192;
const GRAIN_SCALE = 1.1; // logical units per grain pixel
const BRISTLES = 9;

type Bristle = { u: number; thr: number; paint: SkPaint };
type Active = {
  spec: BrushSpec;
  color: string;
  size: number;
  alpha: number;
  sampler: StrokeSampler;
  rng: () => number;
  last: Dab | null;
  first: Dab | null;
  dabs: number;
  line: { x0: number; y0: number; x1: number; y1: number } | null;
  bounds: { x0: number; y0: number; x1: number; y1: number };
  fill: SkPaint;
  stroke: SkPaint;
  core?: SkPaint;
  coreFill?: SkPaint;
  bristles?: Bristle[];
  dots?: SkPaint[];
  speck?: SkPaint;
};

const TRANSPARENT = Skia.Color("transparent");

// CPU (raster) surfaces on purpose: their images can be drawn by the <Canvas> thread without
// sharing GPU textures across threads, which is a classic cause of native crashes.
const makeSurface = (w: number, h: number): SkSurface | null => Skia.Surface.Make(w, h) ?? Skia.Surface.MakeOffscreen(w, h);

function strokePaint(color: string, alpha = 1): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setStyle(PaintStyle.Stroke);
  p.setStrokeCap(StrokeCap.Round);
  p.setStrokeJoin(StrokeJoin.Round);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  return p;
}
function fillPaint(color: string, alpha = 1): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setStyle(PaintStyle.Fill);
  p.setColor(Skia.Color(color));
  p.setAlphaf(alpha);
  return p;
}

export class BrushEngine {
  readonly pxW: number;
  readonly pxH: number;
  readonly sx: number; // device px per logical unit

  private committed: SkSurface;
  private live: SkSurface;
  private display: SkSurface | null = null;
  private committedImage: SkImage;
  private applied: Stroke[] = [];
  private history: { count: number; image: SkImage }[] = [];
  readonly unsupported = new Set<string>(); // brushes that failed the self-test: drawn as ink
  private act: Active | null = null;
  private dirty = false;
  private shown: SkImage | null = null; // last display image of the active stroke
  private batching = false; // true while replaying many strokes: no snapshots per stroke
  private grains = new Map<number, ReturnType<SkImage["makeShaderOptions"]> | null>();
  private blurs = new Map<number, ReturnType<typeof Skia.MaskFilter.MakeBlur>>();
  private grainImages: SkImage[] = [];
  private retired: SkImage[] = []; // images the UI may still be drawing; disposed a few frames later

  constructor(
    readonly vw: number,
    readonly vh: number,
    pxW: number,
    committed: SkSurface,
    live: SkSurface,
  ) {
    this.pxW = pxW;
    this.pxH = Math.max(1, Math.round((pxW * vh) / vw));
    this.sx = pxW / vw;
    this.committed = committed;
    this.live = live;
    this.committed.getCanvas().clear(TRANSPARENT);
    this.live.getCanvas().clear(TRANSPARENT);
    this.committed.flush();
    this.committedImage = this.committed.makeImageSnapshot();
  }

  // ------------------------------------------------------------------ strokes
  begin(tool: string, color: string, size: number, alpha: number, x0: number, y0: number) {
    if (this.unsupported.has(tool)) tool = "inchiostro";
    const spec = specFor(tool);
    const rng = mulberry32(seedOf(x0, y0));
    const col = spec.erase ? "#000000" : color;
    const a: Active = {
      spec,
      color: col,
      size,
      alpha,
      sampler: new StrokeSampler(spec, size),
      rng,
      last: null,
      first: null,
      dabs: 0,
      line: null,
      bounds: { x0: x0, y0: y0, x1: x0, y1: y0 },
      fill: fillPaint(col),
      stroke: strokePaint(col),
    };
    if (spec.kind === "wash") {
      a.core = strokePaint(col, 0.55);
      a.core.setBlendMode(BlendMode.Src);
      a.coreFill = fillPaint(col, 0.55);
      a.coreFill.setBlendMode(BlendMode.Src);
      const softSigma = Math.max(0.5, a.spec.soft * a.spec.base * a.size * this.sx);
      a.fill.setMaskFilter(this.blur(softSigma));
      a.stroke.setMaskFilter(this.blur(softSigma));
    } else if (spec.kind === "bristle") {
      a.bristles = [];
      for (let k = 0; k < BRISTLES; k++) {
        const u = ((k + rng() * 0.8) / (BRISTLES - 1)) * 2 - 1;
        const paint = strokePaint(col, 0.55 + rng() * 0.45);
        paint.setBlendMode(BlendMode.Src);
        a.bristles.push({ u: Math.max(-1, Math.min(1, u)), thr: rng() * 0.35, paint });
      }
    } else if (spec.kind === "scatter") {
      a.dots = [strokePaint(col, 0.9), strokePaint(col, 0.55), strokePaint(col, 0.28)];
    } else if (spec.kind === "spray") {
      a.fill = fillPaint(col, spec.flow);
      a.speck = strokePaint(col, 0.5);
    }
    this.act = a;
    this.live.getCanvas().clear(TRANSPARENT);
    this.dirty = true;
  }

  add(x: number, y: number, p: number) {
    const a = this.act;
    if (!a) return;
    if (a.spec.kind === "line") {
      if (!a.line) a.line = { x0: x, y0: y, x1: x, y1: y };
      a.line.x1 = x;
      a.line.y1 = y;
      this.paintLine(a);
      return;
    }
    this.paintDabs(a, a.sampler.push(x, y, p));
    if (a.spec.bleed) this.bleedLive(a);
  }

  // Finish the stroke and bake it into `committed`.
  end(stroke: Stroke, keepHistory = true) {
    const a = this.act;
    if (!a) return;
    if (a.spec.kind !== "line") {
      this.paintDabs(a, a.sampler.end());
      if (a.dabs <= 1 && a.first) this.live.getCanvas().drawCircle(a.first.x * this.sx, a.first.y * this.sx, (a.first.w / 2) * this.sx, a.fill);
    }
    if (keepHistory && !this.batching) this.pushHistory();
    this.compositeLive(this.committed.getCanvas(), a, true);
    this.committed.flush();
    if (!this.batching) this.refreshCommitted();
    this.applied.push(stroke);
    this.act = null;
    this.dirty = false;
    this.shown = null;
  }

  // Abandon a stroke (palm rejection, cancelled touch). Nothing reached `committed`.
  cancel() {
    this.act = null;
    this.live.getCanvas().clear(TRANSPARENT);
    this.dirty = false;
    this.shown = null;
  }

  // Draw a stored stroke (undo/redo, resize, thumbnails, PDF).
  replay(s: Stroke, keepHistory = true) {
    if (!s.points?.length) {
      if (s.d) this.replayPath(s);
      return;
    }
    const pts = s.points;
    this.begin(s.tool ?? "inchiostro", s.color, s.size ?? 1, s.alpha ?? 1, pts[0][0], pts[0][1]);
    const a = this.act!;
    if (a.spec.kind === "line") {
      a.line = { x0: pts[0][0], y0: pts[0][1], x1: pts[pts.length - 1][0], y1: pts[pts.length - 1][1] };
      this.paintLine(a);
    } else {
      const dabs: Dab[] = [];
      for (const [x, y, p] of pts) for (const d of a.sampler.push(x, y, p)) dabs.push(d);
      this.paintDabs(a, dabs); // end() flushes the final segment
    }
    this.end(s, keepHistory);
  }

  // Old strokes saved as SVG path strings.
  private replayPath(s: Stroke) {
    const path = Skia.Path.MakeFromSVGString(s.d!);
    if (!path) return;
    const c = this.committed.getCanvas();
    const p = strokePaint(s.color);
    p.setStrokeWidth(s.width ?? 3);
    c.save();
    c.scale(this.sx, this.sx);
    c.drawPath(path, p);
    c.restore();
    this.committed.flush();
    if (!this.batching) this.refreshCommitted();
    this.applied.push(s);
  }

  // ------------------------------------------------------------- history/sync
  // Make `committed` match `next`, doing as little work as possible.
  sync(next: Stroke[]) {
    if (this.act) return;
    const cur = this.applied;
    let i = 0;
    while (i < cur.length && i < next.length && cur[i] === next[i]) i++;
    if (i === cur.length && i === next.length) return;
    if (i === cur.length) {
      for (let j = i; j < next.length; j++) this.replay(next[j]); // redo / append
      return;
    }
    if (i === next.length) {
      // undo: restore a snapshot when we still have one
      for (let h = this.history.length - 1; h >= 0; h--) {
        if (this.history[h].count === next.length) {
          const c = this.committed.getCanvas();
          c.clear(TRANSPARENT);
          c.drawImage(this.history[h].image, 0, 0);
          this.committed.flush();
          this.refreshCommitted();
          this.applied = next.slice();
          while (this.history.length > h + 1) this.retire(this.history.pop()!.image);
          return;
        }
      }
    }
    this.rebuild(next);
  }

  rebuild(next: Stroke[]) {
    this.committed.getCanvas().clear(TRANSPARENT);
    this.applied = [];
    for (const h of this.history) this.retire(h.image);
    this.history = [];
    this.batching = true;
    try {
      for (const s of next) this.replay(s, false);
    } finally {
      this.batching = false;
    }
    this.committed.flush();
    this.refreshCommitted();
  }

  clear() {
    this.rebuild([]);
  }

  private pushHistory() {
    const count = this.applied.length;
    while (this.history.length && this.history[this.history.length - 1].count >= count) this.retire(this.history.pop()!.image);
    this.history.push({ count, image: this.committed.makeImageSnapshot() });
    while (this.history.length > HISTORY) this.retire(this.history.shift()!.image);
  }

  // ------------------------------------------------------------------ display
  // Image to show right now. Cheap when idle (returns the committed snapshot).
  image(): SkImage {
    const a = this.act;
    if (!a) return this.committedImage;
    if (!this.dirty && this.shown) return this.shown;
    this.dirty = false;
    if (!this.display) this.display = makeSurface(this.pxW, this.pxH);
    if (!this.display) return this.committedImage;
    const c = this.display.getCanvas();
    c.clear(TRANSPARENT);
    c.drawImage(this.committedImage, 0, 0);
    this.compositeLive(c, a, false);
    this.display.flush();
    const img = this.display.makeImageSnapshot();
    this.retire(img);
    this.shown = img;
    return img;
  }

  // Flattened picture on a paper colour (thumbnails and PDF).
  exportImage(paper: string): SkImage {
    const s = makeSurface(this.pxW, this.pxH);
    if (!s) return this.committed.makeImageSnapshot();
    const c = s.getCanvas();
    c.clear(Skia.Color(paper));
    c.drawImage(this.committedImage, 0, 0);
    s.flush();
    const img = s.makeImageSnapshot();
    s.dispose();
    return img;
  }

  dispose() {
    for (const h of this.history) h.image.dispose();
    this.history = [];
    for (const i of this.retired) i.dispose();
    this.retired = [];
    for (const g of this.grainImages) g.dispose();
    this.grainImages = [];
    this.committedImage.dispose();
    this.committed.dispose();
    this.live.dispose();
    this.display?.dispose();
  }

  // Images the UI may still be drawing are disposed a few frames later.
  private retire(img: SkImage) {
    this.retired.push(img);
    while (this.retired.length > 2) this.retired.shift()!.dispose();
  }
  private refreshCommitted() {
    this.retire(this.committedImage);
    this.committedImage = this.committed.makeImageSnapshot();
  }

  // ----------------------------------------------------------------- drawing
  private grow(a: Active, x: number, y: number, r: number) {
    const b = a.bounds;
    if (x - r < b.x0) b.x0 = x - r;
    if (y - r < b.y0) b.y0 = y - r;
    if (x + r > b.x1) b.x1 = x + r;
    if (y + r > b.y1) b.y1 = y + r;
  }

  private blur(sigma: number) {
    const key = Math.max(1, Math.round(sigma));
    let f = this.blurs.get(key);
    if (!f) {
      f = Skia.MaskFilter.MakeBlur(BlurStyle.Normal, key, true);
      this.blurs.set(key, f);
    }
    return f;
  }

  private paintLine(a: Active) {
    const l = a.line!;
    const c = this.live.getCanvas();
    const w = Math.max(0.5, a.spec.base * a.size);
    c.clear(TRANSPARENT);
    c.save();
    c.scale(this.sx, this.sx);
    a.stroke.setStrokeWidth(w);
    c.drawLine(l.x0, l.y0, l.x1, l.y1, a.stroke);
    c.restore();
    a.bounds = { x0: Math.min(l.x0, l.x1) - w, y0: Math.min(l.y0, l.y1) - w, x1: Math.max(l.x0, l.x1) + w, y1: Math.max(l.y0, l.y1) + w };
    this.dirty = true;
  }

  private paintDabs(a: Active, dabs: Dab[]) {
    if (!dabs.length) return;
    const c = this.live.getCanvas();
    c.save();
    c.scale(this.sx, this.sx);
    switch (a.spec.kind) {
      case "capsule":
        this.drawCapsules(c, a, dabs);
        break;
      case "wash":
        this.drawWash(c, a, dabs);
        break;
      case "bristle":
        this.drawBristles(c, a, dabs);
        break;
      case "scatter":
        this.drawScatter(c, a, dabs);
        break;
      case "spray":
        this.drawSpray(c, a, dabs);
        break;
    }
    c.restore();
    for (const d of dabs) {
      if (!a.first) a.first = d;
      this.grow(a, d.x, d.y, d.w);
      a.dabs++;
    }
    this.dirty = true;
  }

  private drawCapsules(c: SkCanvas, a: Active, dabs: Dab[]) {
    for (const d of dabs) {
      const l = a.last;
      if (!l) c.drawCircle(d.x, d.y, d.w / 2, a.fill);
      else {
        a.stroke.setStrokeWidth((l.w + d.w) / 2);
        c.drawLine(l.x, l.y, d.x, d.y, a.stroke);
      }
      a.last = d;
    }
  }

  // Watercolor: opaque rim, then the interior is reset to a lighter wash.
  private drawWash(c: SkCanvas, a: Active, dabs: Dab[]) {
    for (const d of dabs) {
      const l = a.last;
      if (!l) {
        a.fill.setMaskFilter(this.blur(d.w * 0.15));
        c.drawCircle(d.x, d.y, (d.w / 2) * 1.15, a.fill);
      } else {
        const w = ((l.w + d.w) / 2) * 1.15;
        a.stroke.setStrokeWidth(w);
        a.stroke.setMaskFilter(this.blur(w * 0.12));
        c.drawLine(l.x, l.y, d.x, d.y, a.stroke);
      }
      a.last = d;
    }
  }

  // Bristle brush: parallel lines that thin out and drop away at light pressure.
  private drawBristles(c: SkCanvas, a: Active, dabs: Dab[]) {
    const bs = a.bristles!;
    for (const d of dabs) {
      const l = a.last;
      if (l) {
        const bw = Math.max(0.7, (((l.w + d.w) / 2) / BRISTLES) * 1.5);
        for (const b of bs) {
          if (d.p < b.thr) continue;
          const o0 = b.u * l.w * 0.45;
          const o1 = b.u * d.w * 0.45;
          b.paint.setStrokeWidth(bw);
          c.drawLine(l.x + l.nx * o0, l.y + l.ny * o0, d.x + d.nx * o1, d.y + d.ny * o1, b.paint);
        }
      }
      a.last = d;
    }
  }

  // Charcoal: particles scattered inside the nib, three sizes/strengths.
  private drawScatter(c: SkCanvas, a: Active, dabs: Dab[]) {
    const buckets: { x: number; y: number }[][] = [[], [], []];
    const rng = a.rng;
    for (const d of dabs) {
      const R = d.w / 2;
      const M = Math.max(4, Math.min(160, Math.round(0.15 * d.w * d.w)));
      for (let j = 0; j < M; j++) {
        const ang = rng() * Math.PI * 2;
        const r = R * Math.sqrt(rng());
        const k = rng();
        buckets[k < 0.45 ? 0 : k < 0.8 ? 1 : 2].push({ x: d.x + Math.cos(ang) * r, y: d.y + Math.sin(ang) * r });
      }
      a.last = d;
    }
    const scale = Math.max(0.8, Math.min(2, 0.7 + (dabs[dabs.length - 1].w || 0) / 30));
    const widths = [1.1, 1.8, 2.8];
    for (let b = 0; b < 3; b++) {
      if (!buckets[b].length) continue;
      a.dots![b].setStrokeWidth(widths[b] * scale);
      c.drawPoints(PointMode.Points, buckets[b], a.dots![b]);
    }
  }

  // Airbrush: soft dabs that build up where you linger, plus fine speckle.
  private drawSpray(c: SkCanvas, a: Active, dabs: Dab[]) {
    const rng = a.rng;
    const speck: { x: number; y: number }[] = [];
    for (const d of dabs) {
      a.fill.setMaskFilter(this.blur(d.w * 0.22));
      c.drawCircle(d.x, d.y, d.w * 0.3, a.fill);
      const M = Math.max(3, Math.min(40, Math.round(d.w * 0.5)));
      for (let j = 0; j < M; j++) {
        const ang = rng() * Math.PI * 2;
        const r = (d.w / 2) * Math.min(1.2, ((rng() + rng() + rng()) / 3) * 1.6);
        speck.push({ x: d.x + Math.cos(ang) * r, y: d.y + Math.sin(ang) * r });
      }
      a.last = d;
    }
    if (speck.length) {
      a.speck!.setStrokeWidth(1.3);
      c.drawPoints(PointMode.Points, speck, a.speck!);
    }
  }

  // Apply blend, opacity, soft edge and paper grain, then draw `live` onto `target`.
  private bleedLive(a: Active) {
    const amount = a.spec.bleed ?? 0;
    if (amount <= 0) return;
    const img = this.live.makeImageSnapshot();
    const c = this.live.getCanvas();
    c.clear(TRANSPARENT);
    const p = Skia.Paint();
    const sigma = Math.max(0.5, amount * 10 * this.sx);
    p.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Decal, null));
    c.drawImage(img, 0, 0, p);
    this.live.flush();
    img.dispose();
  }

  private compositeLive(target: SkCanvas, a: Active, bake: boolean) {
    this.live.flush();
    const img = this.live.makeImageSnapshot();
    const margin = Math.ceil((a.spec.soft * a.spec.base * a.size * 3 + 4) * this.sx);
    const b = a.bounds;
    const x0 = Math.max(0, Math.floor(b.x0 * this.sx - margin));
    const y0 = Math.max(0, Math.floor(b.y0 * this.sx - margin));
    const x1 = Math.min(this.pxW, Math.ceil(b.x1 * this.sx + margin));
    const y1 = Math.min(this.pxH, Math.ceil(b.y1 * this.sx + margin));
    if (x1 > x0 && y1 > y0) {
      const layer = Skia.Paint();
      layer.setAlphaf(clamp01(a.spec.opacity * a.alpha));
      layer.setBlendMode(BLEND[a.spec.blend]);
      target.saveLayer(layer, Skia.XYWHRect(x0, y0, x1 - x0, y1 - y0));
      let p: SkPaint | undefined;
      if (a.spec.soft > 0) {
        const sigma = Math.max(0.5, a.spec.soft * a.spec.base * Math.sqrt(a.size) * this.sx);
        p = Skia.Paint();
        p.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Decal, null));
      }
      // Never pass an explicit `undefined` paint: the native layer rejects it.
      if (p) target.drawImage(img, 0, 0, p);
      else target.drawImage(img, 0, 0);
      const grain = a.spec.grain > 0 ? this.grain(a.spec.grain) : null;
      if (grain) {
        const g = this.sx * GRAIN_SCALE;
        const gp = Skia.Paint();
        gp.setShader(grain);
        gp.setBlendMode(BlendMode.DstIn);
        target.save();
        target.scale(g, g);
        target.drawRect(Skia.XYWHRect(x0 / g, y0 / g, (x1 - x0) / g, (y1 - y0) / g), gp);
        target.restore();
      }
      target.restore();
    }
    img.dispose();
    if (bake) this.live.getCanvas().clear(TRANSPARENT);
  }

  // Paper-tooth mask: a tiling alpha texture. Higher `level` means more holes.
  private grain(level: number) {
    const key = Math.round(level * 100);
    if (this.grains.has(key)) return this.grains.get(key) ?? null;
    const S = GRAIN_TILE;
    const bytes = new Uint8Array(S * S * 4);
    const rng = mulberry32(1337 + key);
    const hole = 0.55 * level;
    for (let i = 0; i < S * S; i++) bytes[i * 4 + 3] = Math.round(255 * clamp01((rng() - hole) / 0.25));
    const data = Skia.Data.fromBytes(bytes);
    const image = Skia.Image.MakeImage({ width: S, height: S, alphaType: AlphaType.Premul, colorType: ColorType.RGBA_8888 }, data, S * 4);
    if (image) this.grainImages.push(image);
    const shader = image ? image.makeShaderOptions(TileMode.Repeat, TileMode.Repeat, FilterMode.Linear, MipmapMode.None) : null;
    this.grains.set(key, shader);
    return shader;
  }
}

// Returns null when Skia cannot create offscreen surfaces; callers fall back to SVG.
export function createBrushEngine(vw: number, vh: number, pxW: number): BrushEngine | null {
  const w = Math.max(2, Math.round(pxW));
  const h = Math.max(2, Math.round((w * vh) / vw));
  const committed = makeSurface(w, h);
  const live = makeSurface(w, h);
  if (!committed || !live) return null;
  return new BrushEngine(vw, vh, w, committed, live);
}

// Draws every brush on a tiny canvas, including undo/redo, and reports what throws.
// Runs once per app session so a Skia API problem is named (brush + error) instead of
// surfacing as a vague failure on the first touch.
export type EngineProblem = { tool: string; error: string };
let diagnostics: EngineProblem[] | null = null;

export function engineDiagnostics(): EngineProblem[] {
  if (diagnostics) return diagnostics;
  const out: EngineProblem[] = [];
  const msg = (e: unknown) => String((e as Error)?.message ?? e);
  let e: BrushEngine | null = null;
  try {
    e = createBrushEngine(160, 90, 64);
    if (!e) {
      diagnostics = [{ tool: "*", error: "superfici Skia non disponibili" }];
      return diagnostics;
    }
    const done: Stroke[] = [];
    for (const tool of BRUSH_KEYS) {
      const s: Stroke = { tool, color: "#112233", size: 1, alpha: 1, points: [[10, 10, 0.5], [30, 20, 0.6], [60, 25, 0.7], [90, 20, 0.5]] };
      try {
        e.begin(tool, s.color, 1, 1, 10, 10);
        for (const [x, y, p] of s.points!) e.add(x, y, p);
        e.image();
        e.end(s);
        e.image();
        done.push(s);
      } catch (err) {
        out.push({ tool, error: msg(err) });
        try {
          e.cancel();
        } catch {}
      }
    }
    try {
      e.sync(done.slice(0, -1)); // undo from a snapshot
      e.sync(done); // redo
      e.sync([]); // rebuild
    } catch (err) {
      out.push({ tool: "annulla/ripeti", error: msg(err) });
    }
  } catch (err) {
    out.push({ tool: "*", error: msg(err) });
  } finally {
    try {
      e?.dispose();
    } catch {}
  }
  diagnostics = out;
  return out;
}
