// SVG canvas: used on web and as a fallback when Skia offscreen surfaces are unavailable.
// Same props as the Skia canvas. Known limits of this renderer: no brush textures and
// the eraser mask applies to every stroke, not only the ones drawn before it.
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector, PointerType } from "react-native-gesture-handler";
import Svg, { Defs, G, Line, Mask, Path, Rect } from "react-native-svg";

import { isEraser } from "@/src/brushes/specs";
import { RemoteImage } from "@/src/components/Images";
import { CanvasProps, clamp, GUIDE, PAPER, Track } from "@/src/components/sketch-shared";
import { Stroke, strokeAttrs, viewH, VW } from "@/src/strokes";
import { radius, useTheme } from "@/src/theme";

function StrokePath({ s }: { s: Stroke }) {
  const a = strokeAttrs(s);
  return <Path d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth} opacity={a.opacity} strokeLinecap="round" strokeLinejoin="round" />;
}

export function StrokeThumb({ strokes, w, aspect }: { strokes: Stroke[]; w: number; aspect?: string }) {
  const { colors } = useTheme();
  const vh = viewH(aspect);
  const boxH = (w * 9) / 16;
  const fitW = Math.min(w, (boxH * VW) / vh);
  return (
    <View style={{ width: w, height: boxH, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
      <Svg width={fitW} height={(fitW * vh) / VW} viewBox={`0 0 ${VW} ${vh}`} style={{ backgroundColor: PAPER }}>
        {strokes.map((s, i) => (
          <StrokePath key={i} s={s} />
        ))}
      </Svg>
    </View>
  );
}

export function SketchCanvas({ strokes, setStrokes, brush, aspect, grid, underlay, underlayOpacity = 0.35, maxH, onUndo }: CanvasProps) {
  const [w, setW] = useState(0);
  const [cur, setCur] = useState<Stroke | null>(null);
  const maskId = useMemo(() => "eraser-" + Math.random().toString(36).slice(2), []);
  const vh = viewH(aspect);
  const h0 = (w * vh) / VW;
  const h = maxH && h0 > maxH ? maxH : h0;
  const cw = (h * VW) / vh;
  const scale = cw ? VW / cw : 1;
  const color = isEraser(brush.tool) ? PAPER : brush.color;

  const tracks = useRef(new Map<number, Track>());
  const owner = useRef<number | null>(null);
  const pressure = useRef<number | null>(null);
  const stylusSeen = useRef(false);
  const multiTap = useRef<{ t0: number; n: number; moved: boolean } | null>(null);

  const gesture = useMemo(() => {
    const strict = () => brush.pencilOnly || stylusSeen.current;
    const make = (t: Track): Stroke => {
      const pts = brush.tool === "linea" && t.pts.length > 1 ? [t.pts[0], t.pts[t.pts.length - 1]] : t.pts;
      return { tool: brush.tool, color, size: brush.size, alpha: brush.alpha, points: [...pts] };
    };
    // Palm rejection: in pencil mode only the Apple Pencil (or, when several touches are down,
    // the touch that actually draws) can own the stroke; a resting palm never does.
    const pick = () => {
      if (owner.current != null && tracks.current.has(owner.current)) return;
      let best: number | null = null;
      let bestLen = 0;
      tracks.current.forEach((t, id) => {
        if (t.kind === "stylus" && (best == null || tracks.current.get(best)!.kind !== "stylus")) {
          best = id;
          bestLen = Infinity;
          return;
        }
        if (strict() && t.kind === "finger") return;
        const need = strict() ? 18 : 3;
        if (t.len >= need && t.len > bestLen) {
          best = id;
          bestLen = t.len;
        }
      });
      owner.current = best;
    };
    const stylusPan = Gesture.Pan()
      .minDistance(0)
      .runOnJS(true)
      .onBegin((e) => {
        if (e.pointerType === PointerType.STYLUS || e.stylusData) stylusSeen.current = true;
        if (e.stylusData) pressure.current = e.stylusData.pressure;
      })
      .onUpdate((e) => {
        if (e.stylusData) pressure.current = e.stylusData.pressure;
      })
      .onFinalize(() => {
        pressure.current = null;
      });
    const draw = Gesture.Manual()
      .runOnJS(true)
      .onTouchesDown((e, mgr) => {
        mgr.activate();
        const now = Date.now();
        const alone = e.numberOfTouches === 1 && tracks.current.size === 0;
        for (const t of e.changedTouches) {
          const kind = alone ? (e.pointerType === PointerType.STYLUS ? "stylus" : "finger") : "unknown";
          if (kind === "stylus") stylusSeen.current = true;
          tracks.current.set(t.id, { pts: [[t.x * scale, t.y * scale, pressure.current ?? 0.5]], len: 0, kind, t0: now, lastT: now });
        }
        // Two/three-finger tap = undo (only when no pencil is involved).
        if (e.numberOfTouches >= 2 && owner.current == null && ![...tracks.current.values()].some((t) => t.kind === "stylus")) {
          multiTap.current = { t0: multiTap.current?.t0 ?? now, n: e.numberOfTouches, moved: false };
        }
        pick();
        if (owner.current != null) setCur(make(tracks.current.get(owner.current)!));
      })
      .onTouchesMove((e) => {
        const now = Date.now();
        for (const t of e.changedTouches) {
          const tr = tracks.current.get(t.id);
          if (!tr) continue;
          const last = tr.pts[tr.pts.length - 1];
          const x = t.x * scale;
          const y = t.y * scale;
          const d = Math.hypot(x - last[0], y - last[1]);
          if (d < 2) continue;
          const speed = d / scale / Math.max(1, now - tr.lastT);
          const p = pressure.current != null ? clamp(pressure.current, 0.05, 1) : clamp(0.8 - speed * 0.12, 0.25, 0.8);
          tr.pts.push([x, y, p]);
          tr.len += d / scale;
          tr.lastT = now;
          if (multiTap.current && tr.len > 12) multiTap.current.moved = true;
        }
        pick();
        if (owner.current != null) {
          multiTap.current = null;
          setCur(make(tracks.current.get(owner.current)!));
        }
      })
      .onTouchesUp((e, mgr) => {
        for (const t of e.changedTouches) {
          const tr = tracks.current.get(t.id);
          if (t.id === owner.current && tr) {
            const s = make(tr);
            setStrokes((a) => [...a, s]);
            owner.current = null;
            setCur(null);
          }
          tracks.current.delete(t.id);
        }
        if (tracks.current.size === 0) {
          const mt = multiTap.current;
          if (mt && !mt.moved && Date.now() - mt.t0 < 350) onUndo();
          multiTap.current = null;
          owner.current = null;
          setCur(null);
          mgr.end();
        }
      })
      .onTouchesCancelled((_e, mgr) => {
        tracks.current.clear();
        owner.current = null;
        multiTap.current = null;
        setCur(null);
        mgr.end();
      });
    return Gesture.Simultaneous(draw, stylusPan);
  }, [scale, brush, color, setStrokes, onUndo]);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: "100%", alignItems: "center" }}>
      {w > 0 && (
        <GestureDetector gesture={gesture}>
          <View testID="storyboard-canvas" collapsable={false} style={{ width: cw, height: h, backgroundColor: PAPER, borderRadius: radius.sm, overflow: "hidden" }}>
            {underlay ? <RemoteImage path={underlay} style={{ position: "absolute", width: cw, height: h, opacity: underlayOpacity }} /> : null}
            <Svg width={cw} height={h} viewBox={`0 0 ${VW} ${vh}`}>
              <Defs>
                <Mask id={maskId}>
                  <Rect x={0} y={0} width={VW} height={vh} fill="white" />
                  {[...strokes, ...(cur && isEraser(cur.tool) ? [cur] : [])]
                    .filter((s) => isEraser(s.tool))
                    .map((s, i) => (
                      <StrokePath key={`erase-${i}`} s={{ ...s, color: "#000000", alpha: 1 }} />
                    ))}
                </Mask>
              </Defs>
              <G mask={`url(#${maskId})`}>
                {[...strokes, ...(cur && !isEraser(cur.tool) ? [cur] : [])]
                  .filter((s) => !isEraser(s.tool))
                  .map((s, i) => (
                    <StrokePath key={i} s={s} />
                  ))}
              </G>
              {grid ? (
                <>
                  {[1, 2].map((i) => (
                    <Line key={`v${i}`} x1={(VW * i) / 3} y1={0} x2={(VW * i) / 3} y2={vh} stroke={GUIDE} strokeWidth={2} opacity={0.5} />
                  ))}
                  {[1, 2].map((i) => (
                    <Line key={`h${i}`} x1={0} y1={(vh * i) / 3} x2={VW} y2={(vh * i) / 3} stroke={GUIDE} strokeWidth={2} opacity={0.5} />
                  ))}
                  <Line x1={VW / 2 - 30} y1={vh / 2} x2={VW / 2 + 30} y2={vh / 2} stroke={GUIDE} strokeWidth={2} opacity={0.7} />
                  <Line x1={VW / 2} y1={vh / 2 - 30} x2={VW / 2} y2={vh / 2 + 30} stroke={GUIDE} strokeWidth={2} opacity={0.7} />
                </>
              ) : null}
            </Svg>
          </View>
        </GestureDetector>
      )}
    </View>
  );
}
