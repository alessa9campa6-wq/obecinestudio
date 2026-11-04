import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Switch, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Item } from "@/src/api";
import { pickAndUpload, RemoteImage } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { Pt, Stroke, strokeAttrs, ToolKey, TOOLS } from "@/src/strokes";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, IconName, toast, useStyles } from "@/src/ui";

const VW = 1600;
const VH = 900;
// Drawing ink and paper stay identical in both themes, like real storyboard paper.
const PAPER = "#FFFFFF";
const INKS = ["#111111", "#6B6B6B", "#B3261E", "#1E4FA3", "#D4AF37", "#1F6F4A", "#7B4B2A"];
const SIZES = [{ k: 0.6, l: "S" }, { k: 1, l: "M" }, { k: 1.8, l: "L" }];
const SHOTS = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "Insert"];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function StrokePath({ s }: { s: Stroke }) {
  const a = strokeAttrs(s);
  return <Path d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth} opacity={a.opacity} strokeLinecap="round" strokeLinejoin="round" />;
}

function Thumb({ strokes, w }: { strokes: Stroke[]; w: number }) {
  return (
    <Svg width={w} height={(w * VH) / VW} viewBox={`0 0 ${VW} ${VH}`} style={{ backgroundColor: PAPER }}>
      {strokes.map((s, i) => (
        <StrokePath key={i} s={s} />
      ))}
    </Svg>
  );
}

type Brush = { tool: ToolKey; color: string; size: number; pencilOnly: boolean };

function Canvas({ strokes, setStrokes, brush, underlay, underlayOpacity = 0.35, maxH }: { strokes: Stroke[]; setStrokes: (fn: (s: Stroke[]) => Stroke[]) => void; brush: Brush; underlay?: string; underlayOpacity?: number; maxH?: number }) {
  const [w, setW] = useState(0);
  const [cur, setCur] = useState<Stroke | null>(null);
  const pts = useRef<Pt[]>([]);
  const ignore = useRef(false);
  const scale = w ? VW / Math.min(w, maxH ? (maxH * VW) / VH : w) : 1;
  const color = brush.tool === "gomma" ? PAPER : brush.color;
  const pan = useMemo(() => {
    const pressureOf = (e: any) => (e.stylusData?.pressure != null ? clamp(e.stylusData.pressure, 0.05, 1) : clamp(0.8 - Math.hypot(e.velocityX ?? 0, e.velocityY ?? 0) / 5000, 0.25, 0.8));
    const make = (): Stroke => ({ tool: brush.tool, color, size: brush.size, points: [...pts.current] });
    return Gesture.Pan()
      .minDistance(0)
      .maxPointers(1)
      .runOnJS(true)
      .onBegin((e) => {
        ignore.current = brush.pencilOnly && !e.stylusData;
        if (ignore.current) return;
        pts.current = [[e.x * scale, e.y * scale, e.stylusData?.pressure ?? 0.5]];
        setCur(make());
      })
      .onUpdate((e) => {
        if (ignore.current) return;
        const last = pts.current[pts.current.length - 1];
        const x = e.x * scale;
        const y = e.y * scale;
        if (last && Math.hypot(x - last[0], y - last[1]) < 2) return;
        pts.current.push([x, y, pressureOf(e)]);
        setCur(make());
      })
      .onFinalize(() => {
        if (!ignore.current && pts.current.length) {
          const s = make();
          setStrokes((a) => [...a, s]);
        }
        pts.current = [];
        setCur(null);
      });
  }, [scale, brush, color, setStrokes]);
  const h0 = (w * VH) / VW;
  const h = maxH && h0 > maxH ? maxH : h0;
  const cw = (h * VW) / VH;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: "100%", alignItems: "center" }}>
      {w > 0 && (
        <GestureDetector gesture={pan}>
          <View testID="storyboard-canvas" collapsable={false} style={{ width: cw, height: h, backgroundColor: PAPER, borderRadius: radius.sm, overflow: "hidden" }}>
            {underlay ? <RemoteImage path={underlay} style={{ position: "absolute", width: cw, height: h, opacity: underlayOpacity }} /> : null}
            <Svg width={cw} height={h} viewBox={`0 0 ${VW} ${VH}`}>
              {strokes.map((s, i) => (
                <StrokePath key={i} s={s} />
              ))}
              {cur ? <StrokePath s={cur} /> : null}
            </Svg>
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

function Toolbar({ brush, setBrush, undo, clear }: { brush: Brush; setBrush: (b: Brush) => void; undo: () => void; clear: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={{ gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm }}>
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
      </ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
        {INKS.map((c) => (
          <Pressable key={c} testID={`ink-${c}`} onPress={() => setBrush({ ...brush, color: c, tool: brush.tool === "gomma" ? "penna" : brush.tool })} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: brush.color === c ? 3 : 1, borderColor: brush.color === c ? colors.brandPrimary : colors.border }} />
        ))}
        <View style={{ width: 1, height: 28, backgroundColor: colors.divider }} />
        {SIZES.map((z) => (
          <Chip key={z.l} testID={`brush-size-${z.l}`} label={z.l} selected={brush.size === z.k} onPress={() => setBrush({ ...brush, size: z.k })} />
        ))}
        <Button testID="undo-stroke-button" icon="undo" small variant="secondary" onPress={undo} />
        <Button testID="clear-canvas-button" icon="delete-sweep-outline" small variant="secondary" onPress={clear} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Switch testID="pencil-only-switch" value={brush.pencilOnly} onValueChange={(v) => setBrush({ ...brush, pencilOnly: v })} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
          <Text style={s.muted}>Solo Apple Pencil</Text>
        </View>
      </View>
    </View>
  );
}

function FrameEditor({ frame, onDone }: { frame: Item; onDone: () => void }) {
  const { project, go } = useHub();
  const m = useItemMutations(project.id, "storyboard");
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [full, setFull] = useState(false);
  const [fullH, setFullH] = useState(0);
  const [strokes, setStrokesState] = useState<Stroke[]>(frame.data.strokes ?? []);
  const setStrokes = useMemo(() => (fn: (s: Stroke[]) => Stroke[]) => setStrokesState(fn), []);
  const [brush, setBrush] = useState<Brush>({ tool: "matita", color: INKS[0], size: 1, pencilOnly: false });
  const [title, setTitle] = useState(frame.title);
  const [data, setData] = useState<Record<string, any>>(frame.data);

  const save = (close: boolean) =>
    m.update.mutate(
      { id: frame.id, title, data: { ...data, strokes } },
      { onSuccess: () => (toast("Frame salvato"), close && onDone()), onError: (e: Error) => toast(e.message, "error") },
    );

  const tools = <Toolbar brush={brush} setBrush={setBrush} undo={() => setStrokes((a) => a.slice(0, -1))} clear={() => setStrokes(() => [])} />;
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightBusy, setLightBusy] = useState(false);
  const canvasProps = { strokes, setStrokes, brush, underlay: data.underlay, underlayOpacity: data.underlayOpacity ?? 0.35 };
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
      <Text style={s.label}>Lavagna luminosa</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
        <Button testID="lightbox-pick" icon="image-filter-center-focus-weak" label={data.underlay ? "Cambia immagine" : "Sovrapponi immagine"} small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
        {data.underlay ? [0.2, 0.35, 0.6].map((o) => <Chip key={o} testID={`lightbox-opacity-${o}`} label={`${Math.round(o * 100)}%`} selected={(data.underlayOpacity ?? 0.35) === o} onPress={() => setData({ ...data, underlayOpacity: o })} />) : null}
        {data.underlay ? <Button testID="lightbox-remove" icon="close" small variant="secondary" onPress={() => setData({ ...data, underlay: null })} /> : null}
      </View>
    </View>
  );
  const fields = (
    <View style={{ gap: spacing.md }}>
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

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title={title || "Frame"}
        subtitle="Matita, penna, pennarello, pennello: sensibili alla pressione dell'Apple Pencil"
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
          <View style={{ flex: 1, gap: spacing.md }}>
            <Canvas {...canvasProps} />
            {tools}
          </View>
          <ScrollView style={{ width: 300, flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
            {fields}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <Canvas {...canvasProps} />
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
  const { project, focus, clearFocus } = useHub();
  const q = useItems(project.id, def.key);
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<string | null>(focus?.module === def.key ? focus.id : null);
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

  const add = () => m.create.mutate({ title: `Frame ${frames.length + 1}`, data: { strokes: [] } }, { onSuccess: (it) => setEditing(it.id) });

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${frames.length} frame`}
        right={
          <>
            <Button testID="storyboard-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!frames.length} onPress={() => exportModule(project, def, frames, lookup)} />
            <Button testID="storyboard-add-frame" icon="plus" label="Frame" loading={m.create.isPending} onPress={add} />
          </>
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
          ListEmptyComponent={<Empty icon="draw" title="Aggiungi il tuo primo frame" subtitle="Disegna le inquadrature con Apple Pencil, collega scena e shotlist." action={<Button testID="storyboard-empty-add" icon="plus" label="Nuovo frame" onPress={add} />} />}
          renderItem={({ item, index }) => (
            <Pressable testID={`storyboard-frame-${item.id}`} onPress={() => setEditing(item.id)} style={({ pressed }) => ({ width: cellW, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden", opacity: pressed ? 0.85 : 1 })}>
              <Thumb strokes={item.data.strokes ?? []} w={cellW - 2} />
              <View style={{ padding: spacing.md, gap: 2 }}>
                <Text style={s.h3} numberOfLines={1}>
                  {index + 1}. {item.title}
                </Text>
                <Text style={s.muted} numberOfLines={2}>
                  {[lookup.get(item.data.scena)?.title, item.data.inquadratura, item.data.descrizione].filter(Boolean).join(" · ") || "Tocca per disegnare"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
