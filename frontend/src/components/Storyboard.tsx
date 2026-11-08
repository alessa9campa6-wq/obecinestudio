import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { BRUSH_KEYS, BRUSHES, BrushKey, isEraser } from "@/src/brushes/specs";
import { pickAndUpload } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { Brush } from "@/src/components/sketch-shared";
import { SketchCanvas, StrokeThumb } from "@/src/components/SketchCanvas";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { ASPECTS, Stroke } from "@/src/strokes";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, IconName, toast, useStyles } from "@/src/ui";

// Inchiostri da storyboard: neri e terre, poi i colori per le note.
const INKS = ["#111111", "#3A3A3A", "#6B6B6B", "#A6A6A6", "#B3261E", "#E2553D", "#F29E38", "#D4AF37", "#F2D64B", "#1F6F4A", "#5FA463", "#1E4FA3", "#4F8FD8", "#6B3FA0", "#C2549A", "#7B4B2A", "#C9A27E", "#FFFFFF"];

// I grigi a pennarello sono il modo in cui si disegna uno storyboard: dieci
// valori, dal bianco al nero, per costruire luci e ombre a strati.
const GRIGI = [
  { l: "Bianco", c: "#FFFFFF" },
  { l: "10%", c: "#E6E6E6" },
  { l: "20%", c: "#CCCCCC" },
  { l: "30%", c: "#B3B3B3" },
  { l: "40%", c: "#999999" },
  { l: "50%", c: "#808080" },
  { l: "60%", c: "#666666" },
  { l: "70%", c: "#4D4D4D" },
  { l: "80%", c: "#333333" },
  { l: "Nero", c: "#111111" },
];

const SIZES = [{ k: 0.3, l: "XXS" }, { k: 0.5, l: "XS" }, { k: 0.75, l: "S" }, { k: 1, l: "M" }, { k: 1.6, l: "L" }, { k: 2.6, l: "XL" }, { k: 4, l: "XXL" }];
const ALPHAS = [0.25, 0.5, 0.75, 1];
const SHOTS = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "Insert"];

const hex = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};
const SPECTRUM = [0.2, 0.35, 0.5, 0.65, 0.8].map((l) => Array.from({ length: 12 }, (_, i) => hex(i * 30, 0.75, l)));
const NEUTRI = Array.from({ length: 12 }, (_, i) => hex(0, 0, i / 11));

function Swatch({ c, size = 30, selected, onPress }: { c: string; size?: number; selected?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`ink-${c}`}
      hitSlop={4}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.brandPrimary : colors.border,
      }}
    />
  );
}

// Tavolozza a scomparsa: si apre dal pallino del colore e si chiude appena
// scegli. Non è una finestra a parte, così resta usabile anche in schermo
// intero senza impilare due modal.
function Palette({ brush, setBrush, onClose }: { brush: Brush; setBrush: (b: Brush) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [recenti, setRecenti] = useState<string[]>([]);

  const scegli = (c: string) => {
    setBrush({ ...brush, color: c, tool: isEraser(brush.tool) ? "inchiostro" : brush.tool });
    if (!INKS.includes(c)) setRecenti((r) => [c, ...r.filter((x) => x !== c)].slice(0, 8));
    onClose();
  };

  return (
    <View testID="color-palette" style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }}>
      <Text style={s.label}>Grigi da storyboard</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {GRIGI.map((g) => (
          <Pressable
            key={g.l}
            testID={`grigio-${g.l}`}
            onPress={() => scegli(g.c)}
            style={{ flex: 1, height: 30, borderRadius: 6, backgroundColor: g.c, borderWidth: brush.color === g.c ? 3 : 1, borderColor: brush.color === g.c ? colors.brandPrimary : colors.border }}
          />
        ))}
      </View>

      <Text style={s.label}>Inchiostri</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {INKS.map((c) => <Swatch key={c} c={c} selected={brush.color === c} onPress={() => scegli(c)} />)}
        {recenti.map((c) => <Swatch key={`r-${c}`} c={c} selected={brush.color === c} onPress={() => scegli(c)} />)}
      </View>

      <Text style={s.label}>Tutti i colori</Text>
      {[...SPECTRUM, NEUTRI].map((riga, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 4 }}>
          {riga.map((c) => (
            <Pressable
              key={c + i}
              testID={`palette-${c}`}
              onPress={() => scegli(c)}
              style={{ flex: 1, height: 26, borderRadius: 5, backgroundColor: c, borderWidth: brush.color === c ? 3 : 0, borderColor: colors.brandPrimary }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// Barra strumenti: due righe compatte. Sopra i pennelli, sotto colore, tratto
// e opacità. Tutto scorre in orizzontale per non rubare spazio al disegno.
function ToolStrip({
  brush,
  setBrush,
  undo,
  redo,
  clear,
  grid,
  setGrid,
  palette,
  setPalette,
}: {
  brush: Brush;
  setBrush: (b: Brush) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  grid: boolean;
  setGrid: (v: boolean) => void;
  palette: boolean;
  setPalette: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();

  return (
    <View testID="storyboard-toolbar" style={{ gap: spacing.xs, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: "center", paddingHorizontal: spacing.sm }}>
        {BRUSH_KEYS.map((k: BrushKey) => {
          const sel = brush.tool === k;
          return (
            <Pressable
              key={k}
              testID={`tool-${k}`}
              onPress={() => setBrush({ ...brush, tool: k })}
              style={{ width: 56, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: sel ? colors.brandTertiary : "transparent" }}
            >
              <Icon name={BRUSHES[k].icon as IconName} size={20} color={sel ? colors.onBrandTertiary : colors.onSurfaceTertiary} />
              <Text numberOfLines={1} style={{ fontSize: 9, color: sel ? colors.onBrandTertiary : colors.muted }}>{BRUSHES[k].label}</Text>
            </Pressable>
          );
        })}
        <View style={{ width: 1, height: 32, backgroundColor: colors.divider }} />
        <Button testID="undo-stroke-button" icon="undo" small variant="secondary" onPress={undo} />
        <Button testID="redo-stroke-button" icon="redo" small variant="secondary" onPress={redo} />
        <Button testID="grid-toggle-button" icon="grid" small variant={grid ? "primary" : "secondary"} onPress={() => setGrid(!grid)} />
        <Button testID="clear-canvas-button" icon="delete-sweep-outline" small variant="secondary" onPress={clear} />
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: "center", paddingHorizontal: spacing.sm }}>
        <Pressable
          testID="palette-toggle"
          onPress={() => setPalette(!palette)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isEraser(brush.tool) ? colors.surfaceTertiary : brush.color,
            borderWidth: palette ? 3 : 1,
            borderColor: palette ? colors.brandPrimary : colors.border,
          }}
        >
          {isEraser(brush.tool) ? <Icon name="eraser" size={16} color={colors.onSurface} /> : null}
        </Pressable>
        <Text style={s.muted}>Colore</Text>
        <View style={{ width: 1, height: 24, backgroundColor: colors.divider }} />
        <Text style={s.label}>Tratto</Text>
        {SIZES.map((z) => (
          <Chip key={z.l} testID={`brush-size-${z.l}`} label={z.l} selected={brush.size === z.k} onPress={() => setBrush({ ...brush, size: z.k })} />
        ))}
        <View style={{ width: 1, height: 24, backgroundColor: colors.divider }} />
        <Text style={s.label}>Opacità</Text>
        {ALPHAS.map((a) => (
          <Chip key={a} testID={`brush-alpha-${a}`} label={`${a * 100}%`} selected={brush.alpha === a} onPress={() => setBrush({ ...brush, alpha: a })} />
        ))}
        <View style={{ width: 1, height: 24, backgroundColor: colors.divider }} />
        <Chip
          testID="pencil-only-switch"
          icon="pencil"
          label="Solo Pencil"
          selected={brush.pencilOnly}
          onPress={() => setBrush({ ...brush, pencilOnly: !brush.pencilOnly })}
        />
      </ScrollView>
    </View>
  );
}

function FrameEditor({
  frame,
  frames,
  onOpen,
  onDone,
}: {
  frame: Item;
  frames: Item[];
  onOpen: (id: string) => void;
  onDone: () => void;
}) {
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
  const [brush, setBrush] = useState<Brush>({ tool: "matita", color: INKS[0], size: 1, alpha: 1, pencilOnly: false });
  const [grid, setGrid] = useState(false);
  const [palette, setPalette] = useState(false);
  const [dettagli, setDettagli] = useState(wide);
  const [title, setTitle] = useState(frame.title);
  const [data, setData] = useState<Record<string, any>>(frame.data);
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightBusy, setLightBusy] = useState(false);

  const setStrokes = useMemo(
    () => (fn: (x: Stroke[]) => Stroke[]) => {
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

  const indice = frames.findIndex((f) => f.id === frame.id);
  const precedente = indice > 0 ? frames[indice - 1] : null;
  const successivo = indice >= 0 && indice < frames.length - 1 ? frames[indice + 1] : null;

  const save = (close: boolean) =>
    m.update.mutate(
      { id: frame.id, title, data: { ...data, strokes } },
      { onSuccess: () => (toast("Frame salvato"), close && onDone()), onError: (e: Error) => toast(e.message, "error") },
    );

  const canonical = () => {
    save(false);
    setDettagli(false);
    setPalette(false);
  };

  const cambiaFrame = (id: string | null) => {
    if (!id) return;
    save(false);
    onOpen(id);
  };

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
      <Text style={s.muted}>Sovrapponi una foto o una reference e ricalcala: resta sotto il disegno e non finisce nel PDF.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
        <Button testID="lightbox-pick" icon="image-filter-center-focus-weak" label={data.underlay ? "Cambia immagine" : "Sovrapponi immagine"} small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
        {data.underlay ? [0.15, 0.35, 0.6, 0.85].map((o) => <Chip key={o} testID={`lightbox-opacity-${o}`} label={`${Math.round(o * 100)}%`} selected={(data.underlayOpacity ?? 0.35) === o} onPress={() => setData({ ...data, underlayOpacity: o })} />) : null}
        {data.underlay ? <Button testID="lightbox-remove" icon="close" small variant="secondary" onPress={() => setData({ ...data, underlay: null })} /> : null}
      </View>
    </View>
  );

  const fields = (
    <View style={{ gap: spacing.md }}>
      <Field testID="frame-title-input" label="Titolo frame" value={title} onChangeText={setTitle} />
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Formato del frame</Text>
        <ChipRow>
          {ASPECTS.map((a) => (
            <Chip key={a.k} testID={`frame-aspect-${a.k}`} label={a.k} selected={(data.aspect ?? "16:9") === a.k} onPress={() => setData({ ...data, aspect: a.k })} />
          ))}
        </ChipRow>
      </View>
      <RefInput f={{ key: "scena", label: "Scena", type: "ref", ref: "scene" }} value={data.scena} onChange={(v) => setData({ ...data, scena: v })} onGo={(mm) => go(mm)} />
      {project.type === "Social" && <RefInput f={{ key: "contenuto", label: "Contenuto social", type: "ref", ref: "contenuti" }} value={data.contenuto} onChange={(v) => setData({ ...data, contenuto: v })} onGo={(mm) => go(mm)} />}
      {project.type === "Serie TV" && <RefInput f={{ key: "episodio", label: "Episodio", type: "ref", ref: "episodi" }} value={data.episodio} onChange={(v) => setData({ ...data, episodio: v })} onGo={(mm) => go(mm)} />}
      <RefInput f={{ key: "shot", label: "Inquadratura in shotlist", type: "ref", ref: "shotlist" }} value={data.shot} onChange={(v) => setData({ ...data, shot: v })} onGo={(mm) => go(mm)} />
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Campo / scala dell’inquadratura</Text>
        <ChipRow>
          {SHOTS.map((o) => (
            <Chip key={o} testID={`frame-shot-${o}`} label={o} selected={data.inquadratura === o} onPress={() => setData({ ...data, inquadratura: o })} />
          ))}
        </ChipRow>
      </View>
      <Field testID="frame-movement-input" label="Movimento di camera / Ottica" value={data.movimento ?? ""} onChangeText={(t) => setData({ ...data, movimento: t })} />
      <Field testID="frame-desc-input" label="Descrizione / Dialogo" value={data.descrizione ?? ""} onChangeText={(t) => setData({ ...data, descrizione: t })} multiline minHeight={90} />
      {lightbox}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button testID="frame-save-button" icon="check" label="Salva" loading={m.update.isPending} onPress={() => save(false)} />
        <Button testID="frame-back-button" icon="view-grid-outline" label="Chiudi" variant="secondary" onPress={() => save(true)} />
      </View>
      <View style={{ flexDirection: "row" }}>
        {confirmDel ? (
          <Button testID="frame-delete-confirm" icon="trash-can" label="Elimina davvero" variant="danger" onPress={() => m.remove.mutate(frame.id, { onSuccess: () => (toast("Frame eliminato"), onDone()) })} />
        ) : (
          <Button testID="frame-delete-button" icon="trash-can-outline" label="Elimina frame" variant="secondary" onPress={() => setConfirmDel(true)} />
        )}
      </View>
    </View>
  );

  const canvasMaxH = Math.max(220, height * (wide ? 0.62 : 0.46));
  const tools = (
    <ToolStrip
      brush={brush}
      setBrush={setBrush}
      undo={undo}
      redo={redo}
      clear={() => setStrokes(() => [])}
      grid={grid}
      setGrid={setGrid}
      palette={palette}
      setPalette={setPalette}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title={title || "Frame"}
        subtitle="Apple Pencil · due dita = annulla"
        right={
          <>
            {wide ? (
              <>
                <Button testID="frame-prev" icon="chevron-left" variant="secondary" disabled={!precedente} onPress={() => cambiaFrame(precedente?.id ?? null)} />
                <Button testID="frame-next" icon="chevron-right" variant="secondary" disabled={!successivo} onPress={() => cambiaFrame(successivo?.id ?? null)} />
                <Button testID="frame-details-toggle" icon="tune-variant" variant={dettagli ? "primary" : "secondary"} onPress={() => setDettagli(!dettagli)} />
              </>
            ) : null}
            <Button testID="frame-fullscreen-button" icon="fullscreen" variant="secondary" onPress={() => setFull(true)} />
            <Button testID="frame-save-button-header" icon="check" label={wide ? "Salva" : undefined} loading={m.update.isPending} onPress={canonical} />
          </>
        }
      />

      {/* Su iPhone il titolo avrebbe pochi pixel: la navigazione tra i frame
          sta su una riga sua, che è anche il modo naturale di scorrere. */}
      {wide ? null : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
          <Button testID="frame-prev" icon="chevron-left" small variant="secondary" disabled={!precedente} onPress={() => cambiaFrame(precedente?.id ?? null)} />
          <Text style={s.muted}>{indice >= 0 ? `Frame ${indice + 1} di ${frames.length}` : ""}</Text>
          <View style={{ flex: 1 }} />
          <Button testID="frame-details-toggle" icon="tune-variant" label={dettagli ? "Chiudi" : "Dettagli"} small variant={dettagli ? "primary" : "secondary"} onPress={() => setDettagli(!dettagli)} />
          <Button testID="frame-next" icon="chevron-right" small variant="secondary" disabled={!successivo} onPress={() => cambiaFrame(successivo?.id ?? null)} />
        </View>
      )}

      <View style={{ flex: 1, flexDirection: wide && dettagli ? "row" : "column", padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.md }}>
          {/* Una sola tavola da disegno montata per volta: in schermo intero
              quella sotto sparisce, così non ci sono due motori grafici accesi
              insieme (era questo a far chiudere l'app su iPad). */}
          {full ? null : <SketchCanvas {...canvasProps} maxH={canvasMaxH} />}
          {palette && !full ? <Palette brush={brush} setBrush={setBrush} onClose={() => setPalette(false)} /> : null}
          {tools}
        </View>

        {dettagli ? (
          wide ? (
            <ScrollView style={{ width: 320, flexGrow: 0 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
              {fields}
            </ScrollView>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: height * 0.42 }} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
              {fields}
            </ScrollView>
          )
        ) : null}
      </View>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape", "landscape-left", "landscape-right"]}>
        {/* Dentro a un Modal i gesti hanno bisogno del loro contenitore: senza,
            la tavola non riceve i tocchi e la libreria dei gesti può chiudere
            l'app. */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View
            testID="storyboard-fullscreen"
            style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.sm }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Text style={[s.h3, { flex: 1 }]} numberOfLines={1}>
                {indice >= 0 ? `${indice + 1}/${frames.length} · ` : ""}
                {title}
              </Text>
              <Button testID="fullscreen-lightbox" icon="image-filter-center-focus-weak" small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
              <Button testID="fullscreen-palette" icon="palette-outline" small variant={palette ? "primary" : "secondary"} onPress={() => setPalette(!palette)} />
              <Button testID="fullscreen-save" icon="check" small onPress={() => save(false)} />
              <Button testID="fullscreen-close" icon="fullscreen-exit" small variant="secondary" onPress={() => setFull(false)} />
            </View>

            {palette ? <Palette brush={brush} setBrush={setBrush} onClose={() => setPalette(false)} /> : null}

            <View style={{ flex: 1, justifyContent: "center" }} onLayout={(e) => setFullH(e.nativeEvent.layout.height)}>
              {fullH > 0 ? <SketchCanvas {...canvasProps} maxH={fullH} /> : null}
            </View>

            {tools}
          </View>
        </GestureHandlerRootView>
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
  if (frame) return <FrameEditor key={frame.id} frame={frame} frames={frames} onOpen={setEditing} onDone={() => setEditing(null)} />;

  const last = frames[frames.length - 1];
  const add = () =>
    m.create.mutate(
      { title: `Frame ${frames.length + 1}`, data: { strokes: [], aspect: last?.data.aspect ?? (project.type === "Social" ? "9:16" : "16:9") } },
      { onSuccess: (it) => setEditing(it.id) },
    );
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
          ListEmptyComponent={
            <Empty
              icon="draw"
              title="Aggiungi il tuo primo frame"
              subtitle="Disegna le inquadrature con Apple Pencil, collega scena e shotlist."
              action={canEdit ? <Button testID="storyboard-empty-add" icon="plus" label="Nuovo frame" onPress={add} /> : undefined}
            />
          }
          renderItem={({ item, index }) => {
            const sel = selected.includes(item.id);
            return (
              <Pressable
                testID={`storyboard-frame-${item.id}`}
                onPress={() => (selecting ? setSelected((a) => (sel ? a.filter((x) => x !== item.id) : [...a, item.id])) : setEditing(item.id))}
                onLongPress={() => canEdit && (setSelecting(true), setSelected([item.id]))}
                style={({ pressed }) => ({
                  width: cellW,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: radius.md,
                  borderWidth: sel ? 3 : 1,
                  borderColor: sel ? colors.brandPrimary : colors.border,
                  overflow: "hidden",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <StrokeThumb strokes={item.data.strokes ?? []} w={cellW - (sel ? 6 : 2)} aspect={item.data.aspect} />
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
