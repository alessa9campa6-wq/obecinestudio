// Pressure-aware brush geometry for the storyboard. Strokes are stored as points
// [x, y, pressure] in a 1600x900 canvas and rendered as filled outlines so width
// can vary along the line (Apple Pencil pressure, or speed when using a finger).
export type Pt = [number, number, number];
export type Stroke = { tool?: string; color: string; size?: number; points?: Pt[]; d?: string; width?: number };

export const TOOLS = {
  matita: { label: "Matita", icon: "pencil-outline", base: 3, opacity: 0.75, press: 1 },
  penna: { label: "Penna", icon: "fountain-pen-tip", base: 4.5, opacity: 1, press: 0.7 },
  pennarello: { label: "Pennarello", icon: "marker", base: 16, opacity: 0.55, press: 0.1 },
  pennello: { label: "Pennello", icon: "brush", base: 13, opacity: 0.9, press: 1.3 },
  carboncino: { label: "Carboncino", icon: "grease-pencil", base: 10, opacity: 0.4, press: 0.9 },
  gomma: { label: "Gomma", icon: "eraser", base: 36, opacity: 1, press: 0 },
} as const;
export type ToolKey = keyof typeof TOOLS;

const widthAt = (tool: ToolKey, size: number, p: number) => {
  const t = TOOLS[tool] ?? TOOLS.penna;
  return Math.max(0.6, t.base * size * (1 + t.press * (p - 0.5) * 1.6));
};

export function outline(points: Pt[], tool: ToolKey, size: number): string {
  if (!points.length) return "";
  if (points.length === 1) {
    const [x, y, p] = points[0];
    const r = widthAt(tool, size, p) / 2;
    return `M${x - r} ${y} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  }
  // light smoothing of pressure to avoid jagged edges
  const pr = points.map((_, i) => {
    const a = points[Math.max(0, i - 1)][2];
    const b = points[i][2];
    const c = points[Math.min(points.length - 1, i + 1)][2];
    return (a + b * 2 + c) / 4;
  });
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[Math.min(points.length - 1, i + 1)];
    let dx = p1[0] - p0[0];
    let dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = widthAt(tool, size, pr[i]) / 2;
    const [x, y] = points[i];
    left.push(`${(x - dy * w).toFixed(1)} ${(y + dx * w).toFixed(1)}`);
    right.push(`${(x + dy * w).toFixed(1)} ${(y - dx * w).toFixed(1)}`);
  }
  const re = widthAt(tool, size, pr[pr.length - 1]) / 2;
  const rs = widthAt(tool, size, pr[0]) / 2;
  return `M${left[0]} L${left.join(" L")} A${re} ${re} 0 0 1 ${right[right.length - 1]} L${right.reverse().join(" L")} A${rs} ${rs} 0 0 1 ${left[0]}Z`;
}

// Returns SVG attributes for a stroke (supports the older line-based format too).
export function strokeAttrs(s: Stroke): { d: string; fill: string; stroke: string; strokeWidth: number; opacity: number } {
  if (s.points) {
    const tool = (s.tool ?? "penna") as ToolKey;
    return { d: outline(s.points, tool, s.size ?? 1), fill: s.color, stroke: "none", strokeWidth: 0, opacity: TOOLS[tool]?.opacity ?? 1 };
  }
  return { d: s.d ?? "", fill: "none", stroke: s.color, strokeWidth: s.width ?? 3, opacity: 1 };
}
