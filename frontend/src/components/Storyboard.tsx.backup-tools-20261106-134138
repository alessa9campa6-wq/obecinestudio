import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Switch, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, PointerType } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Path } from "react-native-svg";

import { Item } from "@/src/api";
import { pickAndUpload, RemoteImage } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { ASPECTS, Pt, Stroke, strokeAttrs, ToolKey, TOOLS, viewH, VW } from "@/src/strokes";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, IconName, toast, useStyles } from "@/src/ui";

// Drawing ink, paper and guides stay identical in both themes, like real storyboard paper.
const PAPER = "#FFFFFF";
const GUIDE = "#4F8FD8";
const INKS = ["#111111", "#3A3A3A", "#6B6B6B", "#A6A6A6", "#B3261E", "#E2553D", "#F29E38", "#D4AF37", "#F2D64B", "#1F6F4A", "#5FA463", "#1E4FA3", "#4F8FD8", "#6B3FA0", "#C2549A", "#7B4B2A", "#C9A27E", "#FFFFFF"];
const SIZES = [{ k: 0.3, l: "XXS" }, { k: 0.5, l: "XS" }, { k: 0.75, l: "S" }, { k: 1, l: "M" }, { k: 1.6, l: "L" }, { k: 2.6, l: "XL" }, { k: 4, l: "XXL" }];
const ALPHAS = [0.25, 0.5, 0.75, 1];
const SHOTS = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "Insert"];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// 12 hues x 5 tones + greys for the extended colour picker.
const hex = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};
const SPECTRUM = [0.2, 0.35, 0.5, 0.65, 0.8].map((l) => Array.from({ length: 12 }, (_, i) => hex(i * 30, 0.75, l)));
const GREYS = Array.from({ length: 12 }, (_, i) => hex(0, 0, i / 11));

function StrokePath({ s }: { s: Stroke }) {
  const a = strokeAttrs(s);
  return <Path d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth} opacity={a.opacity} strokeLinecap="round" strokeLinejoin="round" />;
}

function Thumb({ strokes, w, aspect }: { strokes: Stroke[]; w: number; aspect?: string }) {
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

type Brush = { tool: ToolKey; color: string; size: number; alpha: number; pencilOnly: boolean };
// "stylus" and "finger" are certain (touch started alone); "unknown" started while other touches were down.
type Track = { pts: Pt[]; len: number; kind: "stylus" | "finger" | "unknown"; t0: number; lastT: number };

type CanvasProps = { strokes: Stroke[]; setStrokes: (fn: (s: Stroke[]) => Stroke[]) => void; brush: Brush; aspect?: string; grid: boolean; underlay?: string; underlayOpacity?: number; maxH?: number; onUndo: () => void };

function Canvas({ strokes, setStrokes, brush, aspect, grid, underlay, underlayOpacity = 0.35, maxH, onUndo }: CanvasProps) {
  const [w, setW] = useState(0);
  const [cur, setCur] = useState<Stroke | null>(null);
  const vh = viewH(aspect);
  const h0 = (w * vh) / VW;
  const h = maxH && h0 > maxH ? maxH : h0;
  const cw = (h * VW) / vh;
  const scale = cw ? VW / cw : 1;
  const color = brush.tool === "gomma" ? PAPER : brush.color;

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
              {strokes.map((s, i) => (
                <StrokePath key={i} s={s} />
              ))}
              {cur ? <StrokePath s={cur} /> : null}
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

function Toolbar({ brush, setBrush, undo, redo, clear, grid, setGrid }: { brush: Brush; setBrush: (b: Brush) => void; undo: () => void; redo: () => void; clear: () => void; grid: boolean; setGrid: (v: boolean) => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [palette, setPalette] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const pickColor = (c: string) => {
    setBrush({ ...brush, color: c, tool: brush.tool === "gomma" ? "penna" : brush.tool });
    if (!INKS.includes(c)) setRecent((r) => [c, ...r.filter((x) => x !== c)].slice(0, 8));
  };
  const swatch = (c: string, size = 32) => (
    <Pressable key={c} testID={`ink-${c}`} hitSlop={4} onPress={() => pickColor(c)} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, borderWidth: brush.color === c ? 3 : 1, borderColor: brush.color === c ? colors.brandPrimary : colors.border }} />
  );
  return (
    <View testID="storyboard-toolbar" style={{ gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: "center" }}>
        {(Object.keys(TOOLS) as ToolKey[]).map((k) => {
          const sel = brush.tool === k;
          return (
            <Pressable key={k} testID={`tool-${k}`} onPress={() => setBrush({ ...brush, tool: k })} style={{ minWidth: 64, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: sel ? colors.brandTertiary : "transparent", paddingHorizontal: spacing.xs, flexShrink: 0 }}>
              <Icon name={TOOLS[k].icon as IconName} size={22} color={sel ? colors.onBrandTertiary : colors.onSurfaceTertiary} />
              <Text style={{ fontSize: 10, color: sel ? colors.onBrandTertiary : colors.muted }}>{TOOLS[k].label}</Text>
            </Pressable>
          );
        })}
        <View style={{ width: 1, height: 36, backgroundColor: colors.divider }} />
        <Button testID="undo-stroke-button" icon="undo" small variant="secondary" onPress={undo} />
        <Button testID="redo-stroke-button" icon="redo" small variant="secondary" onPress={redo} />
        <Button testID="grid-toggle-button" icon="grid" small variant={grid ? "primary" : "secondary"} onPress={() => setGrid(!grid)} />
        <Button testID="clear-canvas-button" icon="delete-sweep-outline" small variant="secondary" onPress={clear} />
      </ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
        {INKS.map((c) => swatch(c))}
        {recent.map((c) => swatch(c))}
        <Pressable testID="palette-toggle" onPress={() => setPalette(!palette)} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: palette ? colors.brandTertiary : colors.surfaceTertiary }}>
          <Icon name="palette-outline" size={18} color={palette ? colors.onBrandTertiary : colors.onSurfaceTertiary} />
        </Pressable>
      </View>
      {palette && (
        <View testID="color-palette" style={{ gap: 4 }}>
          {[...SPECTRUM, GREYS].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 4 }}>
              {row.map((c) => (
                <Pressable key={c + i} testID={`palette-${c}`} onPress={() => pickColor(c)} style={{ flex: 1, height: 28, borderRadius: 6, backgroundColor: c, borderWidth: brush.color === c ? 3 : 0, borderColor: colors.brandPrimary }} />
              ))}
            </View>
          ))}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: "center" }}>
        <Text style={s.label}>Tratto</Text>
        {SIZES.map((z) => (
          <Chip key={z.l} testID={`brush-size-${z.l}`} label={z.l} selected={brush.size === z.k} onPress={() => setBrush({ ...brush, size: z.k })} />
        ))}
        <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
        <Text style={s.label}>Opacità</Text>
        {ALPHAS.map((a) => (
          <Chip key={a} testID={`brush-alpha-${a}`} label={`${a * 100}%`} selected={brush.alpha === a} onPress={() => setBrush({ ...brush, alpha: a })} />
        ))}
        <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
        <Switch testID="pencil-only-switch" value={brush.pencilOnly} onValueChange={(v) => setBrush({ ...brush, pencilOnly: v })} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
        <Text style={s.muted}>Solo Apple Pencil (ignora palmo e dita)</Text>
      </ScrollView>
    </View>
  );
}

function FrameEditor({ frame, onDone }: { frame: Item; onDone: () => void }) {
  const { project, go } = useHub();
  const m = useItemMutations(project.id, "storyboard");
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 1000;
  const [full, setFull] = useState(false);
  const [fullH, setFullH] = useState(0);
  const [strokes, setStrokesState] = useState<Stroke[]>(frame.data.strokes ?? []);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const setStrokes = useMemo(
    () => (fn: (s: Stroke[]) => Stroke[]) => {
      setStrokesState(fn);
      setRedoStack([]);
    },
    [],
  );
  const undo = useMemo(
    () => () =>
      setStrokesState((a) => {
        if (a.length) setRedoStack((r) => [...r, a[a.length - 1]]);
        return a.slice(0, -1);
      }),
    [],
  );
  const redo = () => {
    if (!redoStack.length) return;
    setStrokesState((a) => [...a, redoStack[redoStack.length - 1]]);
    setRedoStack((r) => r.slice(0, -1));
  };
  const [brush, setBrush] = useState<Brush>({ tool: "matita", color: INKS[0], size: 1, alpha: 1, pencilOnly: false });
  const [grid, setGrid] = useState(false);
  const [title, setTitle] = useState(frame.title);
  const [data, setData] = useState<Record<string, any>>(frame.data);
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightBusy, setLightBusy] = useState(false);

  const save = (close: boolean) =>
    m.update.mutate(
      { id: frame.id, title, data: { ...data, strokes } },
      { onSuccess: () => (toast("Frame salvato"), close && onDone()), onError: (e: Error) => toast(e.message, "error") },
    );

  const tools = <Toolbar brush={brush} setBrush={setBrush} undo={undo} redo={redo} clear={() => setStrokes(() => [])} grid={grid} setGrid={setGrid} />;
  const canvasProps = { strokes, setStrokes, brush, grid, onUndo: undo, aspect: data.aspect, underlay: data.underlay, underlayOpacity: data.underlayOpacity ?? 0.35 };
  const pickUnderlay = async () => {
    setLightBusy(true);
    try {
      const p = await pickAndUpload(false);
      if (p) setData((d) => ({ ...d, underlay: p }));
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLightBusy(false);
    }
  };
  const lightbox = (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>Tavolo luminoso</Text>
      <Text style={s.muted}>Sovrapponi una foto o una reference e ricalcala: l'immagine resta sotto il disegno e non viene stampata.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
        <Button testID="lightbox-pick" icon="image-filter-center-focus-weak" label={data.underlay ? "Cambia immagine" : "Sovrapponi immagine"} small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
        {data.underlay ? [0.15, 0.35, 0.6, 0.85].map((o) => <Chip key={o} testID={`lightbox-opacity-${o}`} label={`${Math.round(o * 100)}%`} selected={(data.underlayOpacity ?? 0.35) === o} onPress={() => setData({ ...data, underlayOpacity: o })} />) : null}
        {data.underlay ? <Button testID="lightbox-remove" icon="close" small variant="secondary" onPress={() => setData({ ...data, underlay: null })} /> : null}
      </View>
    </View>
  );
  const fields = (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Formato del frame</Text>
        <ChipRow>
          {ASPECTS.map((a) => (
            <Chip key={a.k} testID={`frame-aspect-${a.k}`} label={a.k} selected={(data.aspect ?? "16:9") === a.k} onPress={() => setData({ ...data, aspect: a.k })} />
          ))}
        </ChipRow>
      </View>
      {lightbox}
      <Field testID="frame-title-input" label="Titolo frame" value={title} onChangeText={setTitle} />
      <RefInput f={{ key: "scena", label: "Scena", type: "ref", ref: "scene" }} value={data.scena} onChange={(v) => setData({ ...data, scena: v })} onGo={(mm) => go(mm)} />
      {project.type === "Social" && <RefInput f={{ key: "contenuto", label: "Contenuto social", type: "ref", ref: "contenuti" }} value={data.contenuto} onChange={(v) => setData({ ...data, contenuto: v })} onGo={(mm) => go(mm)} />}
      {project.type === "Serie TV" && <RefInput f={{ key: "episodio", label: "Episodio", type: "ref", ref: "episodi" }} value={data.episodio} onChange={(v) => setData({ ...data, episodio: v })} onGo={(mm) => go(mm)} />}
      <RefInput f={{ key: "shot", label: "Inquadratura in shotlist", type: "ref", ref: "shotlist" }} value={data.shot} onChange={(v) => setData({ ...data, shot: v })} onGo={(mm) => go(mm)} />
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Campo</Text>
        <ChipRow>
          {SHOTS.map((o) => (
            <Chip key={o} testID={`frame-shot-${o}`} label={o} selected={data.inquadratura === o} onPress={() => setData({ ...data, inquadratura: o })} />
          ))}
        </ChipRow>
      </View>
      <Field testID="frame-movement-input" label="Movimento / Ottica" value={data.movimento ?? ""} onChangeText={(t) => setData({ ...data, movimento: t })} />
      <Field testID="frame-desc-input" label="Descrizione / Dialogo" value={data.descrizione ?? ""} onChangeText={(t) => setData({ ...data, descrizione: t })} multiline minHeight={90} />
    </View>
  );
  const canvasMaxH = Math.max(240, height * (wide ? 0.62 : 0.5));

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title={title || "Frame"}
        subtitle="Apple Pencil sensibile alla pressione · tocco con due dita = annulla"
        right={
          <>
            {confirmDel ? (
              <Button testID="frame-delete-confirm" icon="trash-can" label="Elimina" variant="danger" onPress={() => m.remove.mutate(frame.id, { onSuccess: () => (toast("Frame eliminato"), onDone()) })} />
            ) : (
              <Button testID="frame-delete-button" icon="trash-can-outline" variant="secondary" onPress={() => setConfirmDel(true)} />
            )}
            <Button testID="frame-fullscreen-button" icon="fullscreen" variant="secondary" onPress={() => setFull(true)} />
            <Button testID="frame-back-button" icon="view-grid-outline" variant="secondary" onPress={() => save(true)} />
            <Button testID="frame-save-button" icon="check" label="Salva" loading={m.update.isPending} onPress={() => save(false)} />
          </>
        }
      />
      {wide ? (
        <View style={{ flex: 1, flexDirection: "row", padding: spacing.lg, gap: spacing.lg }}>
          <ScrollView style={{ flex: 1 }} scrollEnabled={false} contentContainerStyle={{ gap: spacing.md }}>
            <Canvas {...canvasProps} maxH={canvasMaxH} />
            {tools}
          </ScrollView>
          <ScrollView style={{ width: 320, flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
            {fields}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <Canvas {...canvasProps} maxH={canvasMaxH} />
            {tools}
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
            {fields}
          </ScrollView>
        </View>
      )}
      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape", "landscape-left", "landscape-right"]}>
        <View testID="storyboard-fullscreen" style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={[s.h3, { flex: 1 }]} numberOfLines={1}>{title}</Text>
            <Button testID="fullscreen-lightbox" icon="image-filter-center-focus-weak" small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
            <Button testID="fullscreen-save" icon="check" label="Salva" small onPress={() => save(false)} />
            <Button testID="fullscreen-close" icon="fullscreen-exit" small variant="secondary" onPress={() => setFull(false)} />
          </View>
          <View style={{ flex: 1, justifyContent: "center" }} onLayout={(e) => setFullH(e.nativeEvent.layout.height)}>
            {fullH > 0 && <Canvas {...canvasProps} maxH={fullH} />}
          </View>
          {tools}
        </View>
      </Modal>
    </View>
  );
}

export default function Storyboard({ def }: { def: ModuleDef }) {
  const { project, focus, clearFocus, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<string | null>(focus?.module === def.key ? focus.id : null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (focus?.module === def.key) {
      setEditing(focus.id);
      clearFocus();
    }
  }, [focus, def.key, clearFocus]);
  const frames = q.data ?? [];
  const paneW = width >= 768 ? width - 300 : width;
  const cols = paneW > 900 ? 3 : paneW > 520 ? 2 : 1;
  const cellW = (paneW - spacing.xl * 2 - spacing.md * (cols - 1)) / cols;
  const frame = frames.find((f) => f.id === editing);
  if (frame) return <FrameEditor key={frame.id} frame={frame} onDone={() => setEditing(null)} />;

  const last = frames[frames.length - 1];
  const add = () => m.create.mutate({ title: `Frame ${frames.length + 1}`, data: { strokes: [], aspect: last?.data.aspect ?? (project.type === "Social" ? "9:16" : "16:9") } }, { onSuccess: (it) => setEditing(it.id) });
  const removeSelected = async () => {
    try {
      for (const id of selected) await m.remove.mutateAsync(id);
      toast(`${selected.length} frame eliminati`);
    } catch (e: any) {
      toast(e.message, "error");
    }
    setSelected([]);
    setSelecting(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={selecting ? `${selected.length} selezionati` : `${frames.length} frame`}
        right={
          selecting ? (
            <>
              <Button testID="storyboard-delete-selected" icon="trash-can-outline" label="Elimina" variant="danger" disabled={!selected.length} loading={m.remove.isPending} onPress={removeSelected} />
              <Button testID="storyboard-cancel-select" icon="close" variant="secondary" onPress={() => (setSelecting(false), setSelected([]))} />
            </>
          ) : (
            <>
              {canEdit && frames.length > 0 && <Button testID="storyboard-select" icon="checkbox-multiple-marked-outline" variant="secondary" onPress={() => setSelecting(true)} />}
              <Button testID="storyboard-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!frames.length} onPress={() => exportModule(project, def, frames, lookup)} />
              {canEdit && <Button testID="storyboard-add-frame" icon="plus" label="Frame" loading={m.create.isPending} onPress={add} />}
            </>
          )
        }
      />
      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : (
        <FlatList
          key={cols}
          data={frames}
          numColumns={cols}
          keyExtractor={(f) => f.id}
          columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
          ListEmptyComponent={<Empty icon="draw" title="Aggiungi il tuo primo frame" subtitle="Disegna le inquadrature con Apple Pencil, collega scena e shotlist." action={canEdit ? <Button testID="storyboard-empty-add" icon="plus" label="Nuovo frame" onPress={add} /> : undefined} />}
          renderItem={({ item, index }) => {
            const sel = selected.includes(item.id);
            return (
              <Pressable
                testID={`storyboard-frame-${item.id}`}
                onPress={() => (selecting ? setSelected((a) => (sel ? a.filter((x) => x !== item.id) : [...a, item.id])) : setEditing(item.id))}
                onLongPress={() => canEdit && (setSelecting(true), setSelected([item.id]))}
                style={({ pressed }) => ({ width: cellW, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: sel ? 3 : 1, borderColor: sel ? colors.brandPrimary : colors.border, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}
              >
                <Thumb strokes={item.data.strokes ?? []} w={cellW - (sel ? 6 : 2)} aspect={item.data.aspect} />
                {selecting && (
                  <View style={{ position: "absolute", top: spacing.sm, right: spacing.sm }}>
                    <Icon name={sel ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={28} color={colors.brandPrimary} />
                  </View>
                )}
                <View style={{ padding: spacing.md, gap: 2 }}>
                  <Text style={s.h3} numberOfLines={1}>
                    {index + 1}. {item.title}
                  </Text>
                  <Text style={s.muted} numberOfLines={2}>
                    {[item.data.aspect, lookup.get(item.data.scena)?.title, item.data.inquadratura, item.data.descrizione].filter(Boolean).join(" · ") || "Tocca per disegnare"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
