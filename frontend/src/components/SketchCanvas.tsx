// Native storyboard canvas: Skia engine (see src/brushes/engine.ts).
// Touch handling and palm rejection are the same as the previous SVG canvas; only the
// rendering changed. Falls back to the SVG canvas if Skia cannot create offscreen surfaces.
import { Canvas, Image as SkiaImage } from "@shopify/react-native-skia";
import type { SkImage } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelRatio, Text, View } from "react-native";
import { Gesture, GestureDetector, PointerType } from "react-native-gesture-handler";

import { BrushEngine, createBrushEngine, engineDiagnostics } from "@/src/brushes/engine";
import { enqueueRender, peekDataUri, strokesToDataUri } from "@/src/brushes/render";
import { isEraser } from "@/src/brushes/specs";
import { RemoteImage } from "@/src/components/Images";
import { SketchCanvas as SvgCanvas } from "@/src/components/SketchCanvasSvg";
import { CanvasProps, clamp, GUIDE, PAPER, Track } from "@/src/components/sketch-shared";
import { Stroke, viewH, VW } from "@/src/strokes";
import { radius, useTheme } from "@/src/theme";

function Guides({ cw, h }: { cw: number; h: number }) {
  const line = (key: string, style: object, o = 0.5) => <View key={key} pointerEvents="none" style={{ position: "absolute", backgroundColor: GUIDE, opacity: o, ...style }} />;
  return (
    <>
      {[1, 2].map((i) => line(`v${i}`, { left: (cw * i) / 3, top: 0, bottom: 0, width: 1 }))}
      {[1, 2].map((i) => line(`h${i}`, { top: (h * i) / 3, left: 0, right: 0, height: 1 }))}
      {line("cx", { left: cw / 2 - 9, top: h / 2, width: 18, height: 1 }, 0.7)}
      {line("cy", { left: cw / 2, top: h / 2 - 9, width: 1, height: 18 }, 0.7)}
    </>
  );
}

export function SketchCanvas(props: CanvasProps) {
  const { strokes, setStrokes, brush, aspect, grid, underlay, underlayOpacity = 0.35, maxH, onUndo } = props;
  const [w, setW] = useState(0);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); // shown under the canvas so it can be copied
  const [frame, setFrame] = useState<SkImage | null>(null);
  const vh = viewH(aspect);
  const h0 = (w * vh) / VW;
  const h = maxH && h0 > maxH ? maxH : h0;
  const cw = (h * VW) / vh;
  const scale = cw ? VW / cw : 1;
  const pxW = Math.round(cw * Math.min(1.5, PixelRatio.get()));

  const engineRef = useRef<BrushEngine | null>(null);
  // Any JS error from the engine switches to the SVG canvas (strokes live in the parent, nothing is lost).
  const fail = useCallback((e: unknown) => {
    console.warn("[SketchCanvas] engine error", e);
    setNotice(`Motore pennelli disattivato: ${(e as Error)?.message ?? String(e)}`);
    engineRef.current = null;
    setFailed(true);
  }, []);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  // One engine per canvas size. Strokes are vectors, so resizing just replays them.
  useEffect(() => {
    if (pxW < 2) return;
    let e: BrushEngine | null = null;
    try {
      const problems = engineDiagnostics();
      if (problems.some((p) => p.tool === "*" || p.tool === "inchiostro" || p.tool === "annulla/ripeti")) {
        throw new Error(problems.map((p) => `${p.tool}: ${p.error}`).join(" | "));
      }
      e = createBrushEngine(VW, vh, pxW);
      if (!e) {
        setFailed(true);
        return;
      }
      for (const p of problems) e.unsupported.add(p.tool);
      if (problems.length) setNotice(`Alcuni pennelli non sono disponibili e usano l'inchiostro: ${problems.map((p) => `${p.tool} (${p.error})`).join(" | ")}`);
      e.sync(strokesRef.current);
      engineRef.current = e;
      setFrame(e.image());
    } catch (err) {
      fail(err);
      return;
    }
    return () => {
      engineRef.current = null;
      try {
        e?.dispose();
      } catch {}
    };
  }, [pxW, vh, fail]);

  // External changes (undo, redo, clear, loading a frame) are mirrored into the engine.
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    try {
      e.sync(strokes);
      setFrame(e.image());
    } catch (err) {
      fail(err);
    }
  }, [strokes, pxW, vh, fail]);

  // At most one React update per display frame while drawing.
  const raf = useRef<number | null>(null);
  const schedule = useCallback(() => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const e = engineRef.current;
      try {
        if (e) setFrame(e.image());
      } catch (err) {
        fail(err);
      }
    });
  }, [fail]);
  useEffect(
    () => () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const tracks = useRef(new Map<number, Track>());
  const owner = useRef<number | null>(null);
  const fed = useRef(-1); // points already sent to the engine; -1 = stroke not started
  const pressure = useRef<number | null>(null);
  const stylusSeen = useRef(false);
  const multiTap = useRef<{ t0: number; n: number; moved: boolean } | null>(null);
  const color = isEraser(brush.tool) ? PAPER : brush.color;

  const gesture = useMemo(() => {
    const strict = () => brush.pencilOnly || stylusSeen.current;
    const make = (t: Track): Stroke => {
      const pts = brush.tool === "linea" && t.pts.length > 1 ? [t.pts[0], t.pts[t.pts.length - 1]] : t.pts;
      return { tool: brush.tool, color, size: brush.size, alpha: brush.alpha, points: [...pts] };
    };
    // Send the owner's new points to the engine (starting the stroke on the first call).
    const feed = () => {
      const e = engineRef.current;
      const tr = owner.current != null ? tracks.current.get(owner.current) : undefined;
      if (!e || !tr) return;
      try {
        if (fed.current < 0) {
          e.begin(brush.tool, color, brush.size, brush.alpha, tr.pts[0][0], tr.pts[0][1]);
          fed.current = 0;
        }
        for (; fed.current < tr.pts.length; fed.current++) {
          const [x, y, p] = tr.pts[fed.current];
          e.add(x, y, p);
        }
        schedule();
      } catch (err) {
        fail(err);
      }
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
    const abort = () => {
      try {
        if (fed.current >= 0) engineRef.current?.cancel();
      } catch (err) {
        fail(err);
      }
      fed.current = -1;
      owner.current = null;
      schedule();
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
        if (owner.current != null) feed();
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
          feed();
        }
      })
      .onTouchesUp((e, mgr) => {
        for (const t of e.changedTouches) {
          const tr = tracks.current.get(t.id);
          if (t.id === owner.current && tr) {
            feed(); // flush any points not yet drawn
            const s = make(tr);
            const eng = engineRef.current;
            try {
              if (eng && fed.current >= 0) eng.end(s);
            } catch (err) {
              fail(err);
            }
            fed.current = -1;
            setStrokes((a) => [...a, s]);
            owner.current = null;
            schedule();
          }
          tracks.current.delete(t.id);
        }
        if (tracks.current.size === 0) {
          const mt = multiTap.current;
          if (mt && !mt.moved && Date.now() - mt.t0 < 350) onUndo();
          multiTap.current = null;
          owner.current = null;
          mgr.end();
        }
      })
      .onTouchesCancelled((_e, mgr) => {
        tracks.current.clear();
        multiTap.current = null;
        abort();
        mgr.end();
      });
    return Gesture.Simultaneous(draw, stylusPan);
  }, [scale, brush, color, setStrokes, onUndo, schedule, fail]);

  const noticeView = notice ? (
    <Text selectable style={{ fontSize: 11, color: "#B3261E", paddingTop: 4 }}>
      {notice}
    </Text>
  ) : null;
  if (failed)
    return (
      <View>
        <SvgCanvas {...props} />
        {noticeView}
      </View>
    );

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: "100%", alignItems: "center" }}>
      {w > 0 && (
        <GestureDetector gesture={gesture}>
          <View testID="storyboard-canvas" collapsable={false} style={{ width: cw, height: h, backgroundColor: PAPER, borderRadius: radius.sm, overflow: "hidden" }}>
            {underlay ? <RemoteImage path={underlay} style={{ position: "absolute", width: cw, height: h, opacity: underlayOpacity }} /> : null}
            <Canvas pointerEvents="none" style={{ position: "absolute", width: cw, height: h }}>
              {frame ? <SkiaImage image={frame} x={0} y={0} width={cw} height={h} fit="fill" /> : null}
            </Canvas>
            {grid ? <Guides cw={cw} h={h} /> : null}
          </View>
        </GestureDetector>
      )}
      {noticeView}
    </View>
  );
}

export function StrokeThumb({ strokes, w, aspect }: { strokes: Stroke[]; w: number; aspect?: string }) {
  const { colors } = useTheme();
  const vh = viewH(aspect);
  const boxH = (w * 9) / 16;
  const fitW = Math.min(w, (boxH * VW) / vh);
  const fitH = (fitW * vh) / VW;
  const opts = { width: Math.round(fitW * Math.min(1.5, PixelRatio.get())), format: "jpeg" as const, quality: 85 };
  const [uri, setUri] = useState<string | null>(() => (strokes.length ? peekDataUri(strokes, aspect, opts) : null));
  useEffect(() => {
    if (!strokes.length) {
      setUri(null);
      return;
    }
    const hit = peekDataUri(strokes, aspect, opts);
    if (hit) {
      setUri(hit);
      return;
    }
    let alive = true;
    enqueueRender(() => {
      if (alive) setUri(strokesToDataUri(strokes, aspect, opts));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, aspect, opts.width]);
  return (
    <View style={{ width: w, height: boxH, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
      <View style={{ width: fitW, height: fitH, backgroundColor: PAPER }}>
        {uri ? <Image source={{ uri }} style={{ width: fitW, height: fitH }} contentFit="fill" /> : null}
      </View>
    </View>
  );
}
