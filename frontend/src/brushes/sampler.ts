// Turns raw touch points into evenly spaced "dabs" along a smooth curve.
// Causal and deterministic: feeding the same points one at a time (live) or all
// at once (replay) yields exactly the same dabs.
import { BrushSpec, widthFor } from "./specs";

export type Dab = {
  x: number;
  y: number;
  w: number; // diameter
  p: number; // smoothed pressure 0..1
  d: number; // arc length from the start of the stroke
  nx: number; // unit normal of the travel direction
  ny: number;
  v: number; // speed in logical units per millisecond (0.25 when unknown)
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export class StrokeSampler {
  private n = 0;
  private sx = 0; // stabilized pointer
  private sy = 0;
  private pp = 0.5; // smoothed pressure
  private ax = 0; // start of the current curve (a midpoint)
  private ay = 0;
  private ap = 0.5;
  private cx = 0; // control point (previous stabilized pointer)
  private cy = 0;
  private cp = 0.5;
  private qx = 0; // last evaluated curve point
  private qy = 0;
  private rawX = 0;
  private rawY = 0;
  private dist = 0;
  private acc = 0;
  private dx = 1;
  private dy = 0;
  private pv = 0.25; // smoothed speed
  private lastV = 0.25; // speed at the last emitted dab
  private tgtV = 0.25; // speed the current curve should end at

  constructor(
    private spec: BrushSpec,
    private size: number,
  ) {}

  private widthAt(p: number, dist: number): number {
    const r = this.spec.ramp;
    const ramp = r > 0 ? 0.35 + 0.65 * smoothstep(Math.min(1, dist / r)) : 1;
    return widthFor(this.spec, this.size, p) * ramp;
  }

  private dab(x: number, y: number, p: number, v = this.lastV): Dab {
    return { x, y, w: this.widthAt(p, this.dist), p, d: this.dist, nx: -this.dy, ny: this.dx, v };
  }

  push(x: number, y: number, p: number, v?: number): Dab[] {
    this.rawX = x;
    this.rawY = y;
    this.lastV = this.tgtV;
    if (v != null) {
      this.pv += (v - this.pv) * 0.4;
      this.tgtV = this.pv;
    }
    if (this.n === 0) {
      this.n = 1;
      this.sx = this.ax = this.cx = this.qx = x;
      this.sy = this.ay = this.cy = this.qy = y;
      this.pp = this.ap = this.cp = p;
      return [this.dab(x, y, p, this.tgtV)];
    }
    const k = 1 - this.spec.smooth * 0.6;
    this.sx += (x - this.sx) * k;
    this.sy += (y - this.sy) * k;
    this.pp += (p - this.pp) * 0.35;
    this.n++;
    const mx = (this.cx + this.sx) / 2;
    const my = (this.cy + this.sy) / 2;
    const mp = (this.cp + this.pp) / 2;
    const out = this.curve(this.ax, this.ay, this.ap, this.cx, this.cy, mx, my, mp);
    this.ax = mx;
    this.ay = my;
    this.ap = mp;
    this.cx = this.sx;
    this.cy = this.sy;
    this.cp = this.pp;
    return out;
  }

  // Flush the last curve segment so the stroke ends exactly under the pen.
  end(): Dab[] {
    if (this.n < 2) return [];
    return this.curve(this.ax, this.ay, this.ap, this.cx, this.cy, this.rawX, this.rawY, this.pp);
  }

  private curve(ax: number, ay: number, ap: number, cx: number, cy: number, bx: number, by: number, bp: number): Dab[] {
    const L = Math.hypot(cx - ax, cy - ay) + Math.hypot(bx - cx, by - cy);
    if (!(L > 1e-6)) return [];
    const N = Math.max(1, Math.ceil(L / 1.5));
    const out: Dab[] = [];
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const u = 1 - t;
      const x = u * u * ax + 2 * u * t * cx + t * t * bx;
      const y = u * u * ay + 2 * u * t * cy + t * t * by;
      const seg = Math.hypot(x - this.qx, y - this.qy);
      if (seg > 1e-6) {
        const ux = (x - this.qx) / seg;
        const uy = (y - this.qy) / seg;
        const mx = this.dx * 0.5 + ux * 0.5;
        const my = this.dy * 0.5 + uy * 0.5;
        const ml = Math.hypot(mx, my) || 1;
        this.dx = mx / ml;
        this.dy = my / ml;
      }
      this.dist += seg;
      this.acc += seg;
      this.qx = x;
      this.qy = y;
      const p = ap + (bp - ap) * t;
      const w = this.widthAt(p, this.dist);
      const step = Math.max(this.spec.minStep, w * this.spec.spacing);
      if (this.acc >= step) {
        this.acc = this.acc > step * 2 ? 0 : this.acc - step;
        const v = this.lastV + (this.tgtV - this.lastV) * t;
        out.push({ x, y, w, p, d: this.dist, nx: -this.dy, ny: this.dx, v });
      }
    }
    this.lastV = this.tgtV;
    return out;
  }
}
