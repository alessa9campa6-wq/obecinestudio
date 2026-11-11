import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { BRUSH_KEYS, BRUSHES, BrushKey, isEraser } from "@/src/brushes/specs";
import { ColorWheel, hexToHsv, Hsv, hsvToHex } from "@/src/components/ColorWheel";
import { Fader } from "@/src/components/Fader";
import { pickAndUpload } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { Brush } from "@/src/components/sketch-shared";
import { SketchCanvas, StrokeThumb } from "@/src/components/SketchCanvas";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { ASPECTS, Stroke } from "@/src/strokes";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Field, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

// Inchiostri da storyboard: neri e terre, poi i colori per le note.
const INKS = ["#111111", "#3A3A3A", "#6B6B6B", "#A6A6A6", "#B3261E", "#E2553D", "#F29E38", "#D4AF37", "#F2D64B", "#1F6F4A", "#5FA463", "#1E4FA3", "#4F8FD8", "#6B3FA0", "#C2549A", "#7B4B2A", "#C9A27E", "#FFFFFF"];

// I grigi a pennarello: dieci valori per costruire luci e ombre a strati.
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

const SIZES = [
  { k: 0.3, l: "XXS" },
  { k: 0.5, l: "XS" },
  { k: 0.75, l: "S" },
  { k: 1, l: "M" },
  { k: 1.6, l: "L" },
  { k: 2.6, l: "XL" },
  { k: 4, l: "XXL" },
];
const ALPHAS = [0.25, 0.5, 0.75, 1];
const SHOTS = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "Insert"];

const HINTS: Record<BrushKey, string> = {
  matita: "Grafite leggera, si scurisce con la pressione. Per gli schizzi.",
  inchiostro: "Tratto pieno e netto: contorni e linee pulite.",
  pennarello: "Punta larga e trasparente, perfetta per i grigi del chiaroscuro.",
  acquerello: "Velatura morbida e trasparente, da sovrapporre a strati.",
  pennello: "Setole sensibili alla pressione: volumi e campiture.",
  carboncino: "Grana irregolare, per ombre morbide e texture.",
  aerografo: "Spruzzo morbido che si accumula: sfumature e fumo.",
  linea: "Linea dritta dal punto di partenza a quello di arrivo.",
  gomma: "Cancella i tratti già disegnati.",
  "gomma-morbida": "Cancella con un bordo morbido, senza tagli netti.",
};

function Swatch({ c, size = 30, selected, onPress, testID }: { c: string; size?: number; selected?: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID ?? `ink-${c}`}
      hitSlop={4}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? colors.brandPrimary : colors.border,
        shadowColor: "#000",
        shadowOpacity: selected ? 0.18 : 0,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    />
  );
}

// Tavolozza: grigi da storyboard, inchiostri pronti, ruota colori e recenti.
function Palette({ brush, setBrush }: { brush: Brush; setBrush: (b: Brush) => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [recenti, setRecenti] = useState<string[]>([]);
  const [hsv, setHsv] = useState<Hsv>(hexToHsv(brush.color));

  useEffect(() => {
    setHsv(hexToHsv(brush.color));
  }, [brush.color]);

  const scegli = (c: string) => {
    setBrush({ ...brush, color: c, tool: isEraser(brush.tool) ? "inchiostro" : brush.tool });
    if (!INKS.includes(c)) setRecenti((r) => [c, ...r.filter((x) => x !== c)].slice(0, 10));
  };

  return (
    <Glass testID="color-palette" style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Grigi da storyboard</Text>
        <View style={{ flexDirection: "row", gap: 5 }}>
          {GRIGI.map((g) => (
            <Pressable
              key={g.l}
              testID={`grigio-${g.l}`}
              onPress={() => scegli(g.c)}
              style={{ flex: 1, height: 30, borderRadius: 6, backgroundColor: g.c, borderWidth: brush.color === g.c ? 3 : 1, borderColor: brush.color === g.c ? colors.brandPrimary : colors.border }}
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
        <ColorWheel hsv={hsv} onChange={(v) => (setHsv(v), setBrush({ ...brush, color: hsvToHex(v), tool: isEraser(brush.tool) ? "inchiostro" : brush.tool }))} size={188} />
        <View style={{ flex: 1, minWidth: 150, gap: spacing.sm }}>
          <Text style={s.label}>Inchiostri</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {INKS.map((c) => (
              <Swatch key={c} c={c} size={26} selected={brush.color === c} onPress={() => scegli(c)} />
            ))}
            {recenti.map((c) => (
              <Swatch testID={`recente-${c}`} key={`r-${c}`} c={c} size={26} selected={brush.color === c} onPress={() => scegli(c)} />
            ))}
          </View>
          <View style={{ height: 44, borderRadius: radius.md, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.divider, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 26 + brush.size * 8, height: Math.max(2, brush.size * 3), borderRadius: 40, backgroundColor: brush.color, opacity: brush.alpha }} />
          </View>
          <Text style={s.muted}>Anteprima del tratto con colore, spessore e opacità attuali.</Text>
        </View>
      </View>
    </Glass>
  );
}

function Panel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={s.label}>{title}</Text>
        <View style={{ flex: 1 }} />
        <Pressable testID="panel-close" onPress={onClose} hitSlop={8}>
          <Icon name="close" size={16} color={colors.muted} />
        </Pressable>
      </View>
      {children}
    </Glass>
  );
}

function ToolDock({
  brush,
  setBrush,
  undo,
  redo,
  clear,
  grid,
  setGrid,
  panel,
  setPanel,
}: {
  brush: Brush;
  setBrush: (b: Brush) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  grid: boolean;
  setGrid: (v: boolean) => void;
  panel: "colore" | "tratto" | "opacita" | null;
  setPanel: (p: "colore" | "tratto" | "opacita" | null) => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const eraser = isEraser(brush.tool);
  const toggle = (p: "colore" | "tratto" | "opacita") => setPanel(panel === p ? null : p);

  return (
    <View style={{ gap: spacing.sm }}>
      {/* Strumenti: ogni pennello con il suo nome, quello attivo in oro. */}
      <Glass testID="storyboard-toolbar" style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.xs }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, alignItems: "center", paddingHorizontal: 2 }}>
          {BRUSH_KEYS.map((k: BrushKey) => {
            const sel = brush.tool === k;
            return (
              <Pressable
                key={k}
                testID={`tool-${k}`}
                onPress={() => setBrush({ ...brush, tool: k })}
                style={{
                  width: 62,
                  paddingVertical: 6,
                  borderRadius: 14,
                  alignItems: "center",
                  gap: 2,
                  backgroundColor: sel ? colors.brandTertiary : "transparent",
                  borderWidth: 1,
                  borderColor: sel ? "rgba(212,175,55,0.55)" : "transparent",
                }}
              >
                <Icon name={BRUSHES[k].icon as IconName} size={19} color={sel ? colors.onBrandTertiary : colors.onSurfaceTertiary} />
                <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 9.5, fontWeight: sel ? "700" : "500", color: sel ? colors.onBrandTertiary : colors.muted }}>
                  {BRUSHES[k].label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Glass>

      {/* Colore, tratto, opacità: tre comandi, ognuno apre il suo pannello. */}
      <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable
            testID="palette-toggle"
            onPress={() => toggle("colore")}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: eraser ? colors.surfaceTertiary : brush.color,
              borderWidth: panel === "colore" ? 3 : 1,
              borderColor: panel === "colore" ? colors.brandPrimary : colors.border,
            }}
          >
            {eraser ? <Icon name="eraser" size={17} color={colors.onSurface} /> : null}
          </Pressable>

          <Pressable testID="panel-tratto" onPress={() => toggle("tratto")} style={{ flex: 1, gap: 2 }}>
            <Text style={s.label}>Tratto</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: Math.max(3, brush.size * 3.2), height: Math.max(3, brush.size * 3.2), borderRadius: 20, backgroundColor: eraser ? colors.muted : brush.color, opacity: eraser ? 0.6 : brush.alpha }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: colors.onSurface }}>{SIZES.reduce((best, z) => (Math.abs(z.k - brush.size) < Math.abs(best.k - brush.size) ? z : best), SIZES[0]).l}</Text>
            </View>
            <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
              <View style={{ width: `${((brush.size - 0.2) / 3.8) * 100}%`, height: 4, borderRadius: radius.pill, backgroundColor: colors.brandPrimary }} />
            </View>
          </Pressable>

          <Pressable testID="panel-opacita" onPress={() => toggle("opacita")} style={{ flex: 1, gap: 2 }}>
            <Text style={s.label}>Opacità</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: colors.onSurface }}>{Math.round(brush.alpha * 100)}%</Text>
            <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
              <View style={{ width: `${brush.alpha * 100}%`, height: 4, borderRadius: radius.pill, backgroundColor: colors.brandPrimary }} />
            </View>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: "center" }}>
          <Button testID="undo-stroke-button" icon="undo" small variant="secondary" onPress={undo} />
          <Button testID="redo-stroke-button" icon="redo" small variant="secondary" onPress={redo} />
          <Button testID="grid-toggle-button" icon="grid" small variant={grid ? "primary" : "secondary"} onPress={() => setGrid(!grid)} />
          <Button testID="clear-canvas-button" icon="delete-sweep-outline" small variant="secondary" onPress={clear} />
          <Chip testID="pencil-only-switch" icon="pencil" label="Solo Pencil" selected={brush.pencilOnly} onPress={() => setBrush({ ...brush, pencilOnly: !brush.pencilOnly })} />
        </ScrollView>

        {panel === "colore" ? (
          <View style={{ paddingTop: spacing.xs }}>
            <Palette brush={brush} setBrush={setBrush} />
          </View>
        ) : panel === "tratto" ? (
          <Panel title="Spessore del tratto" onClose={() => setPanel(null)}>
            <Fader
              testID="brush-size-fader"
              value={brush.size}
              min={0.2}
              max={4}
              step={0.05}
              onChange={(v) => setBrush({ ...brush, size: v })}
              format={() => `${SIZES.reduce((best, z) => (Math.abs(z.k - brush.size) < Math.abs(best.k - brush.size) ? z : best), SIZES[0]).l} · ${brush.size.toFixed(2)}×`}
              gradient={["#C9C9C9", brush.color]}
            />
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: spacing.xs }}>
              {SIZES.map((z) => (
                <Pressable key={z.l} testID={`brush-size-${z.l}`} onPress={() => setBrush({ ...brush, size: z.k })} style={{ alignItems: "center", gap: 3, flex: 1 }}>
                  <View
                    style={{
                      width: Math.max(4, Math.min(30, 4 + z.k * 6.5)),
                      height: Math.max(4, Math.min(30, 4 + z.k * 6.5)),
                      borderRadius: 20,
                      backgroundColor: brush.size === z.k ? brush.color : colors.muted,
                      opacity: brush.size === z.k ? 1 : 0.45,
                      borderWidth: brush.size === z.k ? 2 : 0,
                      borderColor: colors.brandPrimary,
                    }}
                  />
                  <Text style={{ fontFamily: fonts.text, fontSize: 8.5, color: brush.size === z.k ? colors.onSurface : colors.muted }}>{z.l}</Text>
                </Pressable>
              ))}
            </View>
          </Panel>
        ) : panel === "opacita" ? (
          <Panel title="Opacità del tratto" onClose={() => setPanel(null)}>
            <Fader
              testID="brush-alpha-fader"
              value={brush.alpha}
              min={0.05}
              max={1}
              step={0.01}
              onChange={(v) => setBrush({ ...brush, alpha: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              gradient={["rgba(255,255,255,1)", brush.color]}
            />
            <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
              {ALPHAS.map((a) => (
                <Chip key={a} testID={`brush-alpha-${a}`} label={`${a * 100}%`} selected={Math.abs(brush.alpha - a) < 0.005} onPress={() => setBrush({ ...brush, alpha: a })} />
              ))}
            </View>
            <Text style={s.muted}>{HINTS[brush.tool]}</Text>
          </Panel>
        ) : null}
      </Glass>

      <Text style={[s.muted, { fontSize: 11.5, paddingHorizontal: 4 }]}>{HINTS[brush.tool]}</Text>
    </View>
  );
}

function FrameCard({
  item,
  index,
  cellW,
  selected,
  selecting,
  onPress,
  onLongPress,
  lookup,
}: {
  item: Item;
  index: number;
  cellW: number;
  selected: boolean;
  selecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
  lookup: ReturnType<typeof useLookup>;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const scena = lookup.get(item.data.scena)?.title;
  const aspect = item.data.aspect ?? "16:9";
  return (
    <Pressable testID={`storyboard-frame-${item.id}`} onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => ({ width: cellW, opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Glass style={{ borderRadius: 20, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brandPrimary : colors.divider, overflow: "hidden" }}>
        <View style={{ backgroundColor: "#EFECE6", padding: spacing.sm }}>
          <View style={{ borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "#FFFFFF" }}>
            <StrokeThumb strokes={item.data.strokes ?? []} w={cellW - spacing.sm * 2 - 2} aspect={aspect} />
          </View>
          <View style={{ position: "absolute", top: spacing.sm + 4, left: spacing.sm + 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.92)" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 11, color: "#111111" }}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
          {selecting ? (
            <View style={{ position: "absolute", top: spacing.sm + 2, right: spacing.sm + 2 }}>
              <Icon name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={26} color={selected ? colors.brandPrimary : "rgba(0,0,0,0.35)"} />
            </View>
          ) : null}
        </View>
        <View style={{ padding: spacing.md, gap: 3 }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {item.data.inquadratura ? (
              <View style={{ borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 10.5, fontWeight: "700", color: colors.brandPrimary }}>{item.data.inquadratura}</Text>
              </View>
            ) : null}
            <Text style={[s.muted, { fontSize: 11 }]}>{aspect}</Text>
          </View>
          <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={2}>
            {[scena, item.data.movimento, item.data.descrizione].filter(Boolean).join(" · ") || "Tocca per disegnare"}
          </Text>
        </View>
      </Glass>
    </Pressable>
  );
}

function FrameEditor({ frame, frames, onOpen, onDone, onDuplicate }: { frame: Item; frames: Item[]; onOpen: (id: string) => void; onDone: () => void; onDuplicate: () => void }) {
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
  const [panel, setPanel] = useState<"colore" | "tratto" | "opacita" | null>(null);
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
    setPanel(null);
  };

  const cambiaFrame = (id: string | null) => {
    if (!id || id === frame.id) return;
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

  const sezione = (titolo: string, icona: IconName, contenuto: React.ReactNode) => (
    <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={icona} size={14} color={colors.brandPrimary} />
        <Text style={s.label}>{titolo}</Text>
      </View>
      {contenuto}
    </Glass>
  );

  const lightbox = (
    <View style={{ gap: spacing.xs }}>
      <Button testID="lightbox-pick" icon="image-filter-center-focus-weak" label={data.underlay ? "Cambia immagine" : "Sovrapponi immagine"} small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
      {data.underlay ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, alignItems: "center" }}>
          {[0.15, 0.35, 0.6, 0.85].map((o) => (
            <Chip key={o} testID={`lightbox-opacity-${o}`} label={`${Math.round(o * 100)}%`} selected={(data.underlayOpacity ?? 0.35) === o} onPress={() => setData({ ...data, underlayOpacity: o })} />
          ))}
          <Button testID="lightbox-remove" icon="close" small variant="secondary" onPress={() => setData({ ...data, underlay: null })} />
        </View>
      ) : (
        <Text style={s.muted}>Una foto o una reference resta sotto il disegno e non finisce nel PDF.</Text>
      )}
    </View>
  );

  const fields = (
    <View style={{ gap: spacing.md }}>
      {sezione(
        "Frame",
        "image-frame",
        <>
          <Field testID="frame-title-input" label="Titolo del frame" value={title} onChangeText={setTitle} />
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Formato</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {ASPECTS.map((a) => (
                <Chip key={a.k} testID={`frame-aspect-${a.k}`} label={a.k} selected={(data.aspect ?? "16:9") === a.k} onPress={() => setData({ ...data, aspect: a.k })} />
              ))}
            </View>
          </View>
        </>,
      )}

      {sezione(
        "Collegamenti",
        "link-variant",
        <>
          <RefInput f={{ key: "scena", label: "Scena", type: "ref", ref: "scene" }} value={data.scena} onChange={(v) => setData({ ...data, scena: v })} onGo={(mm) => go(mm)} />
          <RefInput f={{ key: "shot", label: "Inquadratura in shotlist", type: "ref", ref: "shotlist" }} value={data.shot} onChange={(v) => setData({ ...data, shot: v })} onGo={(mm) => go(mm)} />
          {project.type === "Social" ? <RefInput f={{ key: "contenuto", label: "Contenuto social", type: "ref", ref: "contenuti" }} value={data.contenuto} onChange={(v) => setData({ ...data, contenuto: v })} onGo={(mm) => go(mm)} /> : null}
          {project.type === "Serie TV" ? <RefInput f={{ key: "episodio", label: "Episodio", type: "ref", ref: "episodi" }} value={data.episodio} onChange={(v) => setData({ ...data, episodio: v })} onGo={(mm) => go(mm)} /> : null}
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Campo / scala</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {SHOTS.map((o) => (
                <Chip key={o} testID={`frame-shot-${o}`} label={o} selected={data.inquadratura === o} onPress={() => setData({ ...data, inquadratura: data.inquadratura === o ? "" : o })} />
              ))}
            </View>
          </View>
        </>,
      )}

      {sezione(
        "Movimento e note",
        "camera-outline",
        <>
          <Field testID="frame-movement-input" label="Movimento di camera / Ottica" value={data.movimento ?? ""} onChangeText={(t) => setData({ ...data, movimento: t })} />
          <Field testID="frame-desc-input" label="Descrizione / Dialogo" value={data.descrizione ?? ""} onChangeText={(t) => setData({ ...data, descrizione: t })} multiline minHeight={90} />
        </>,
      )}

      {sezione("Tavolo luminoso", "image-filter-center-focus-weak", lightbox)}

      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        <Button testID="frame-save-button" icon="check" label="Salva" loading={m.update.isPending} onPress={() => save(false)} />
        <Button testID="frame-back-button" icon="view-grid-outline" label="Chiudi" variant="secondary" onPress={() => save(true)} />
        <Button testID="frame-duplicate-button" icon="content-copy" label="Duplica" variant="secondary" onPress={() => (save(false), onDuplicate())} />
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

  const canvasMaxH = Math.max(220, height * (wide ? 0.56 : 0.42));
  const tools = <ToolDock brush={brush} setBrush={setBrush} undo={undo} redo={redo} clear={() => setStrokes(() => [])} grid={grid} setGrid={setGrid} panel={panel} setPanel={setPanel} />;

  // Striscia dei frame: si salta da un disegno all'altro senza uscire.
  const strip = frames.length > 1 ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}>
      {frames.map((f, i) => (
        <Pressable key={f.id} testID={`frame-strip-${f.id}`} onPress={() => cambiaFrame(f.id)} style={{ opacity: f.id === frame.id ? 1 : 0.55 }}>
          <View style={{ borderRadius: 9, borderWidth: f.id === frame.id ? 2 : 1, borderColor: f.id === frame.id ? colors.brandPrimary : colors.divider, overflow: "hidden", backgroundColor: "#FFFFFF" }}>
            <StrokeThumb strokes={f.data.strokes ?? []} w={76} aspect={f.data.aspect} />
          </View>
          <Text style={{ fontFamily: fonts.script, fontSize: 9.5, textAlign: "center", color: f.id === frame.id ? colors.brandPrimary : colors.muted }}>{i + 1}</Text>
        </Pressable>
      ))}
    </ScrollView>
  ) : null;

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title={title || "Frame"}
        subtitle={`Frame ${indice >= 0 ? indice + 1 : 1} di ${frames.length} · ${data.aspect ?? "16:9"} · Apple Pencil o dito`}
        right={
          <>
            <Button testID="frame-prev" icon="chevron-left" variant="secondary" disabled={!precedente} onPress={() => cambiaFrame(precedente?.id ?? null)} />
            <Button testID="frame-next" icon="chevron-right" variant="secondary" disabled={!successivo} onPress={() => cambiaFrame(successivo?.id ?? null)} />
            <Button testID="frame-details-toggle" icon="tune-variant" variant={dettagli ? "primary" : "secondary"} onPress={() => setDettagli(!dettagli)} />
            <Button testID="frame-fullscreen-button" icon="fullscreen" variant="secondary" onPress={() => setFull(true)} />
            <Button testID="frame-save-button-header" icon="check" label={wide ? "Salva" : undefined} loading={m.update.isPending} onPress={canonical} />
          </>
        }
      />

      <View style={{ flex: 1, flexDirection: wide && dettagli ? "row" : "column", padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.sm }}>
          {full ? null : (
            <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm, gap: spacing.sm }}>
              <SketchCanvas {...canvasProps} maxH={canvasMaxH} />
              {strip}
            </Glass>
          )}
          {tools}
        </View>

        {dettagli ? (
          <ScrollView style={wide ? { width: 340, flexGrow: 0 } : undefined} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
            {fields}
          </ScrollView>
        ) : null}
      </View>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape", "landscape-left", "landscape-right"]}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View
            testID="storyboard-fullscreen"
            style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.sm }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 19, color: colors.onSurface }} numberOfLines={1}>
                {indice + 1}/{frames.length} · {title}
              </Text>
              <Button testID="fullscreen-lightbox" icon="image-filter-center-focus-weak" small variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
              <Button testID="fullscreen-save" icon="check" small onPress={() => save(false)} />
              <Button testID="fullscreen-close" icon="fullscreen-exit" small variant="secondary" onPress={() => setFull(false)} />
            </View>

            <View style={{ flex: 1, justifyContent: "center" }} onLayout={(e) => setFullH(e.nativeEvent.layout.height)}>
              {fullH > 0 ? (
                <View style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm, backgroundColor: colors.surfaceSecondary }}>
                  <SketchCanvas {...canvasProps} maxH={fullH - 40} />
                </View>
              ) : null}
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
  const [scenaFiltro, setScenaFiltro] = useState<string | null>(null);

  useEffect(() => {
    if (focus?.module === def.key) {
      setEditing(focus.id);
      clearFocus();
    }
  }, [focus, def.key, clearFocus]);

  const frames = q.data ?? [];
  const visibili = scenaFiltro ? frames.filter((f) => f.data.scena === scenaFiltro) : frames;
  const scene = [...new Set(frames.map((f) => f.data.scena).filter(Boolean))] as string[];
  const formati = [...new Set(frames.map((f) => f.data.aspect ?? "16:9"))];

  const paneW = width >= 768 ? width - 300 : width;
  const cols = paneW > 900 ? 3 : paneW > 520 ? 2 : 1;
  const cellW = (paneW - spacing.xl * 2 - spacing.md * (cols - 1)) / cols;

  const frame = frames.find((f) => f.id === editing);
  const add = () => {
    const last = frames[frames.length - 1];
    m.create.mutate(
      { title: `Frame ${frames.length + 1}`, data: { strokes: [], aspect: last?.data.aspect ?? (project.type === "Social" ? "9:16" : "16:9") } },
      { onSuccess: (it) => setEditing(it.id) },
    );
  };

  if (frame) {
    return (
      <FrameEditor
        key={frame.id}
        frame={frame}
        frames={frames}
        onOpen={setEditing}
        onDone={() => setEditing(null)}
        onDuplicate={() =>
          m.create.mutate(
            { title: `${frame.title} (copia)`, data: { ...frame.data } },
            { onSuccess: (it) => (setEditing(it.id), toast("Frame duplicato")), onError: (e: Error) => toast(e.message, "error") },
          )
        }
      />
    );
  }

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

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={selecting ? `${selected.length} selezionati` : `${frames.length} frame · ${scene.length} scene · ${formati.length} formati`}
        right={
          selecting ? (
            <>
              <Button testID="storyboard-delete-selected" icon="trash-can-outline" label="Elimina" variant="danger" disabled={!selected.length} loading={m.remove.isPending} onPress={removeSelected} />
              <Button testID="storyboard-cancel-select" icon="close" variant="secondary" onPress={() => (setSelecting(false), setSelected([]))} />
            </>
          ) : (
            <>
              {canEdit && frames.length > 0 ? <Button testID="storyboard-select" icon="checkbox-multiple-marked-outline" variant="secondary" onPress={() => setSelecting(true)} /> : null}
              <Button testID="storyboard-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!frames.length} onPress={() => exportModule(project, def, frames, lookup)} />
              {canEdit ? <Button testID="storyboard-add-frame" icon="plus" label="Frame" loading={m.create.isPending} onPress={add} /> : null}
            </>
          )
        }
      />

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : (
        <FlatList
          key={cols}
          data={visibili}
          numColumns={cols}
          keyExtractor={(f) => f.id}
          columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
              <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
                <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Icon name="draw" size={14} color={colors.brandPrimary} />
                    <Text style={s.label}>La storyboard</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.onSurface }} numberOfLines={2}>
                    {project.title}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                    {pillola("image-frame", `${frames.length} frame`)}
                    {pillola("movie-open-outline", `${scene.length} scene`)}
                    {formati.slice(0, 3).map((f) => pillola("aspect-ratio", f))}
                  </View>
                  <Text style={[s.muted, { paddingTop: spacing.xs }]}>Disegna con Pencil, scegli il pennello e regola tratto e opacità con i fader. Due dita = annulla.</Text>
                </View>
              </View>
              {scene.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                  <Chip testID="storyboard-filter-tutte" label={`Tutte (${frames.length})`} selected={!scenaFiltro} onPress={() => setScenaFiltro(null)} />
                  {scene.map((id) => (
                    <Chip key={id} testID={`storyboard-filter-${id}`} label={lookup.get(id)?.title ?? "Scena"} selected={scenaFiltro === id} onPress={() => setScenaFiltro(scenaFiltro === id ? null : id)} />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            frames.length && !visibili.length ? (
              <Empty icon="filter-off-outline" title="Nessun frame in questa scena" action={<Button label="Mostra tutti" variant="secondary" onPress={() => setScenaFiltro(null)} />} />
            ) : (
              <Empty
                icon="draw"
                title="Aggiungi il tuo primo frame"
                subtitle="Disegna le inquadrature con Apple Pencil, collega scena e shotlist."
                action={canEdit ? <Button testID="storyboard-empty-add" icon="plus" label="Nuovo frame" onPress={add} /> : undefined}
              />
            )
          }
          renderItem={({ item, index }) => {
            const sel = selected.includes(item.id);
            return (
              <FrameCard
                item={item}
                index={index}
                cellW={cellW}
                selected={sel}
                selecting={selecting}
                lookup={lookup}
                onPress={() => (selecting ? setSelected((a) => (sel ? a.filter((x) => x !== item.id) : [...a, item.id])) : setEditing(item.id))}
                onLongPress={() => canEdit && (setSelecting(true), setSelected([item.id]))}
              />
            );
          }}
        />
      )}
    </View>
  );
}
