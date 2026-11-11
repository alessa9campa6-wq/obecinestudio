import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
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
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { ASPECTS, Stroke, viewH, VW } from "@/src/strokes";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Field, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Una tavola da storyboard: pannelli numerati su un foglio, e una stanza buia
// in cui si disegna. Tutto il resto (liste, schede, menu) sta dietro.
// ─────────────────────────────────────────────────────────────────────────────

const INKS = ["#111111", "#3A3A3A", "#6B6B6B", "#A6A6A6", "#B3261E", "#E2553D", "#F29E38", "#D4AF37", "#F2D64B", "#1F6F4A", "#5FA463", "#1E4FA3", "#4F8FD8", "#6B3FA0", "#C2549A", "#7B4B2A", "#C9A27E", "#FFFFFF"];
const GRIGI = ["#FFFFFF", "#E6E6E6", "#CCCCCC", "#B3B3B3", "#999999", "#808080", "#666666", "#4D4D4D", "#333333", "#111111"];
const SIZES = [
  { k: 0.25, l: "XXS" },
  { k: 0.5, l: "XS" },
  { k: 0.75, l: "S" },
  { k: 1, l: "M" },
  { k: 1.6, l: "L" },
  { k: 2.6, l: "XL" },
  { k: 4, l: "XXL" },
];
const SHOTS = ["ECU", "CU", "MCU", "MS", "WS", "EWS", "OTS", "POV", "Insert"];
const GOLD = "#D4AF37";
const INK = "#F2ECDD";
const INK_MUTED = "#A79E8A";
const DESK = "#131210";

const HINTS: Record<BrushKey, string> = {
  matita: "Grafite, si scurisce con la pressione",
  inchiostro: "Contorni pieni e netti",
  pennarello: "Punta larga per i grigi",
  acquerello: "Velatura trasparente",
  pennello: "Setole sensibili alla pressione",
  carboncino: "Grana per ombre morbide",
  aerografo: "Spruzzo per sfumare",
  linea: "Dritta da punto a punto",
  gomma: "Cancella i tratti",
  "gomma-morbida": "Cancella con bordo morbido",
};

const sigla = (size: number) => SIZES.reduce((best, z) => (Math.abs(z.k - size) < Math.abs(best.k - size) ? z : best), SIZES[0]).l;

function Round({ icon, onPress, active, disabled, testID, tone = "dark" }: { icon: IconName; onPress: () => void; active?: boolean; disabled?: boolean; testID?: string; tone?: "dark" | "light" }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.3 : pressed ? 0.7 : 1,
        backgroundColor: active ? (tone === "dark" ? GOLD : colors.brandTertiary) : tone === "dark" ? "rgba(255,255,255,0.07)" : colors.surfaceTertiary,
        borderWidth: 1,
        borderColor: active ? GOLD : tone === "dark" ? "rgba(255,255,255,0.12)" : colors.divider,
      })}
    >
      <Icon name={icon} size={18} color={active ? (tone === "dark" ? "#17140F" : colors.onBrandTertiary) : tone === "dark" ? INK : colors.onSurface} />
    </Pressable>
  );
}

// ── Palette ──────────────────────────────────────────────────────────────────

function Palette({ brush, setBrush, onDone }: { brush: Brush; setBrush: (b: Brush) => void; onDone: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [recenti, setRecenti] = useState<string[]>([]);
  const [hsv, setHsv] = useState<Hsv>(hexToHsv(brush.color));

  useEffect(() => setHsv(hexToHsv(brush.color)), [brush.color]);

  const scegli = (c: string) => {
    setBrush({ ...brush, color: c, tool: isEraser(brush.tool) ? "inchiostro" : brush.tool });
    if (!INKS.includes(c) && !GRIGI.includes(c)) setRecenti((r) => [c, ...r.filter((x) => x !== c)].slice(0, 10));
  };

  return (
    <Sheet visible onClose={onDone} title="Colore del tratto">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg }}>
        <View style={{ flexDirection: "row", gap: spacing.lg, flexWrap: "wrap", justifyContent: "center" }}>
          <ColorWheel
            hsv={hsv}
            size={196}
            onChange={(v) => {
              setHsv(v);
              scegli(hsvToHex(v));
            }}
          />
          <View style={{ flex: 1, minWidth: 200, gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Grigi da storyboard</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {GRIGI.map((c) => (
                  <Pressable key={c} testID={`grigio-${c}`} onPress={() => scegli(c)} style={{ flex: 1, height: 34, borderRadius: 7, backgroundColor: c, borderWidth: brush.color === c ? 3 : 1, borderColor: brush.color === c ? GOLD : colors.border }} />
                ))}
              </View>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Inchiostri</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {INKS.map((c) => (
                  <Pressable key={c} testID={`ink-${c}`} onPress={() => scegli(c)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: brush.color === c ? 3 : 1, borderColor: brush.color === c ? GOLD : colors.border }} />
                ))}
                {recenti.map((c) => (
                  <Pressable key={`r-${c}`} testID={`recente-${c}`} onPress={() => scegli(c)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: brush.color === c ? 3 : 1, borderColor: brush.color === c ? GOLD : colors.border }} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.divider, backgroundColor: "#FFFFFF", height: 96, alignItems: "center", justifyContent: "center", gap: 4 }}>
          <View style={{ width: 30 + brush.size * 12, height: Math.max(3, brush.size * 4), borderRadius: 40, backgroundColor: brush.color, opacity: brush.alpha }} />
          <Text style={{ fontFamily: fonts.script, fontSize: 11, color: "#7A7364" }}>
            {brush.color} · {sigla(brush.size)} · {Math.round(brush.alpha * 100)}%
          </Text>
        </View>
        <Button icon="check" label="Fatto" onPress={onDone} />
      </ScrollView>
    </Sheet>
  );
}

// ── Banco strumenti ──────────────────────────────────────────────────────────

function Dock({
  brush,
  setBrush,
  undo,
  redo,
  grid,
  setGrid,
  clear,
  onColor,
  bottom,
}: {
  brush: Brush;
  setBrush: (b: Brush) => void;
  undo: () => void;
  redo: () => void;
  grid: boolean;
  setGrid: (v: boolean) => void;
  clear: () => void;
  onColor: () => void;
  bottom: number;
}) {
  const eraser = isEraser(brush.tool);
  return (
    <View style={{ paddingHorizontal: 10, paddingBottom: bottom, gap: 6 }}>
      <View
        testID="storyboard-toolbar"
        style={{ borderRadius: 24, backgroundColor: "rgba(28,26,22,0.97)", borderWidth: 1, borderColor: "rgba(212,175,55,0.28)", paddingVertical: 8, paddingHorizontal: 8, gap: 6 }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {BRUSH_KEYS.map((k: BrushKey) => {
            const sel = brush.tool === k;
            return (
              <Pressable
                key={k}
                testID={`tool-${k}`}
                onPress={() => setBrush({ ...brush, tool: k })}
                style={{ width: 58, paddingVertical: 5, borderRadius: 14, alignItems: "center", gap: 3, backgroundColor: sel ? GOLD : "transparent" }}
              >
                <Icon name={BRUSHES[k].icon as IconName} size={18} color={sel ? "#17140F" : INK} />
                <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 9, fontWeight: sel ? "700" : "500", color: sel ? "#17140F" : INK_MUTED }}>
                  {BRUSHES[k].label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.09)", marginHorizontal: 4 }} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Pressable
            testID="palette-toggle"
            onPress={onColor}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: eraser ? "rgba(255,255,255,0.1)" : brush.color, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }}
          >
            {eraser ? <Icon name="eraser" size={17} color={INK} /> : null}
          </Pressable>

          <View style={{ width: 132 }}>
            <Fader tone="dark" testID="brush-size-fader" label="Tratto" value={brush.size} min={0.25} max={4} step={0.05} onChange={(v) => setBrush({ ...brush, size: v })} format={() => sigla(brush.size)} />
          </View>
          <View style={{ width: 140 }}>
            <Fader tone="dark" testID="brush-alpha-fader" label="Opacità" value={brush.alpha} min={0.05} max={1} step={0.01} onChange={(v) => setBrush({ ...brush, alpha: v })} format={(v) => `${Math.round(v * 100)}%`} />
          </View>

          <View style={{ flex: 1 }} />

          <Round testID="undo-stroke-button" icon="undo" onPress={undo} />
          <Round testID="redo-stroke-button" icon="redo" onPress={redo} />
          <Round testID="grid-toggle-button" icon="grid" active={grid} onPress={() => setGrid(!grid)} />
          <Round testID="clear-canvas-button" icon="delete-sweep-outline" onPress={clear} />
          <Round testID="pencil-only-switch" icon="pencil" active={brush.pencilOnly} onPress={() => setBrush({ ...brush, pencilOnly: !brush.pencilOnly })} />
        </View>
        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: INK_MUTED, paddingHorizontal: 6 }}>{HINTS[brush.tool]}</Text>
      </View>
    </View>
  );
}

// ── Stanza del disegno ───────────────────────────────────────────────────────

function Desk({ frame, frames, onOpen, onDone, onAdd, onDuplicate }: { frame: Item; frames: Item[]; onOpen: (id: string) => void; onDone: () => void; onAdd: () => void; onDuplicate: () => void }) {
  const { project, go } = useHub();
  const m = useItemMutations(project.id, "storyboard");
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 900;

  const [strokes, setStrokesState] = useState<Stroke[]>(frame.data.strokes ?? []);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState<Brush>({ tool: "matita", color: "#111111", size: 1, alpha: 1, pencilOnly: false });
  const [grid, setGrid] = useState(false);
  const [title, setTitle] = useState(frame.title);
  const [data, setData] = useState<Record<string, any>>(frame.data);
  const [palette, setPalette] = useState(false);
  const [info, setInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [lightBusy, setLightBusy] = useState(false);
  const saved = useRef(JSON.stringify({ title: frame.title, data: frame.data }));

  const index = frames.findIndex((f) => f.id === frame.id);
  const prev = index > 0 ? frames[index - 1] : null;
  const next = index >= 0 && index < frames.length - 1 ? frames[index + 1] : null;

  const setStrokes = useMemo(
    () => (fn: (x: Stroke[]) => Stroke[]) => {
      setStrokesState(fn);
      setRedo([]);
    },
    [],
  );
  const undo = useMemo(
    () => () =>
      setStrokesState((a) => {
        if (a.length) setRedo((r) => [...r, a[a.length - 1]]);
        return a.slice(0, -1);
      }),
    [],
  );
  const ripristina = () => {
    if (!redo.length) return;
    setStrokesState((a) => [...a, redo[redo.length - 1]]);
    setRedo((r) => r.slice(0, -1));
  };

  // Salvataggio automatico: si scrive da soli dopo una pausa, senza "Salva".
  const update = m.update;
  useEffect(() => {
    const payload = { title, data: { ...data, strokes } };
    const snapshot = JSON.stringify(payload);
    if (snapshot === saved.current) return;
    setSaving(true);
    const t = setTimeout(() => {
      update.mutate(
        { id: frame.id, title, data: { ...data, strokes } },
        {
          onSuccess: () => {
            saved.current = snapshot;
            setSaving(false);
          },
          onError: (e: Error) => {
            setSaving(false);
            toast(e.message, "error");
          },
        },
      );
    }, 700);
    return () => clearTimeout(t);
  }, [title, data, strokes, update, frame.id]);

  const chiudi = () => {
    const payload = { title, data: { ...data, strokes } };
    if (JSON.stringify(payload) !== saved.current) update.mutate({ id: frame.id, title, data: { ...data, strokes } });
    onDone();
  };
  const vaiA = (id: string | null) => {
    if (!id) return;
    const payload = { title, data: { ...data, strokes } };
    if (JSON.stringify(payload) !== saved.current) update.mutate({ id: frame.id, title, data: { ...data, strokes } });
    onOpen(id);
  };

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

  // La tavola ha una misura esplicita: senza larghezza il canvas resterebbe a zero.
  const maxH = Math.max(200, height - insets.top - insets.bottom - (wide ? 300 : 320));
  const maxW = Math.max(240, Math.min(width - 44, 1000));
  const vh = viewH(data.aspect);
  const sheetW = Math.floor(Math.min(maxW, (maxH * VW) / vh));
  const sheetH = Math.floor((sheetW * vh) / VW);

  const strip = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingVertical: 8, alignItems: "flex-start" }}>
      {frames.map((f, i) => (
        <Pressable key={f.id} testID={`frame-strip-${f.id}`} onPress={() => vaiA(f.id)} style={{ alignItems: "center", gap: 3, opacity: f.id === frame.id ? 1 : 0.5 }}>
          <View style={{ borderRadius: 6, borderWidth: f.id === frame.id ? 2 : 1, borderColor: f.id === frame.id ? GOLD : "rgba(255,255,255,0.2)", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
            <StrokeThumb strokes={f.data.strokes ?? []} w={70} aspect={f.data.aspect} />
          </View>
          <Text style={{ fontFamily: fonts.script, fontSize: 10, color: f.id === frame.id ? GOLD : INK_MUTED }}>{String(i + 1).padStart(2, "0")}</Text>
        </Pressable>
      ))}
      <Pressable onPress={onAdd} style={{ width: 70, height: 48, borderRadius: 6, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center" }}>
        <Icon name="plus" size={18} color={INK_MUTED} />
      </Pressable>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: DESK }}>
      <LinearGradient colors={["#221F19", "#100F0D"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Round testID="frame-back-button" icon="close" onPress={chiudi} />
        <View style={{ flex: 1, paddingHorizontal: 6 }}>
          <Text style={{ fontFamily: fonts.script, fontSize: 10, letterSpacing: 1.4, color: GOLD }}>
            PANNELLO {String(index + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")} · {data.aspect ?? "16:9"}
          </Text>
          <TextInput
            testID="frame-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="Senza titolo"
            placeholderTextColor={INK_MUTED}
            style={{ fontFamily: fonts.display, fontSize: 19, color: INK, paddingVertical: 2 }}
          />
        </View>
        <Text style={{ fontFamily: fonts.text, fontSize: 10, color: saving ? GOLD : INK_MUTED }}>{saving ? "SALVATAGGIO…" : "SALVATO"}</Text>
        <Round testID="frame-prev" icon="chevron-left" onPress={() => vaiA(prev?.id ?? null)} disabled={!prev} />
        <Round testID="frame-next" icon="chevron-right" onPress={() => vaiA(next?.id ?? null)} disabled={!next} />
        <Round testID="frame-info-button" icon="tune-variant" active={info} onPress={() => setInfo(true)} />
        <Pressable testID="frame-save-button" onPress={chiudi} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: GOLD }}>
          <Icon name="check" size={16} color="#17140F" />
          <Text style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: "#17140F" }}>Fatto</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, paddingTop: 8, gap: 8 }}>
        <View style={{ padding: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
          <View
            style={{
              width: sheetW,
              height: sheetH,
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: 0.55,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            <SketchCanvas
              strokes={strokes}
              setStrokes={setStrokes}
              brush={brush}
              grid={grid}
              onUndo={undo}
              aspect={data.aspect}
              underlay={data.underlay}
              underlayOpacity={data.underlayOpacity ?? 0.35}
              maxH={sheetH}
            />
          </View>
        </View>
        <View style={{ paddingTop: 6, paddingBottom: 2, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", alignSelf: "stretch" }}>{strip}</View>
      </View>

      <Dock
        brush={brush}
        setBrush={setBrush}
        undo={undo}
        redo={ripristina}
        grid={grid}
        setGrid={setGrid}
        clear={() => setStrokes(() => [])}
        onColor={() => setPalette(true)}
        bottom={insets.bottom + 8}
      />

      {palette ? <Palette brush={brush} setBrush={setBrush} onDone={() => setPalette(false)} /> : null}

      <Sheet visible={info} onClose={() => setInfo(false)} title="Dettagli del pannello">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Formato</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {ASPECTS.map((a) => (
                <Chip key={a.k} testID={`frame-aspect-${a.k}`} label={a.k} selected={(data.aspect ?? "16:9") === a.k} onPress={() => setData({ ...data, aspect: a.k })} />
              ))}
            </View>
          </View>

          <RefInput f={{ key: "scena", label: "Scena", type: "ref", ref: "scene" }} value={data.scena} onChange={(v) => setData({ ...data, scena: v })} onGo={(mm) => go(mm)} />
          <RefInput f={{ key: "shot", label: "Inquadratura in shotlist", type: "ref", ref: "shotlist" }} value={data.shot} onChange={(v) => setData({ ...data, shot: v })} onGo={(mm) => go(mm)} />
          {project.type === "Serie TV" ? <RefInput f={{ key: "episodio", label: "Episodio", type: "ref", ref: "episodi" }} value={data.episodio} onChange={(v) => setData({ ...data, episodio: v })} onGo={(mm) => go(mm)} /> : null}
          {project.type === "Social" ? <RefInput f={{ key: "contenuto", label: "Contenuto social", type: "ref", ref: "contenuti" }} value={data.contenuto} onChange={(v) => setData({ ...data, contenuto: v })} onGo={(mm) => go(mm)} /> : null}

          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Campo / scala</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {SHOTS.map((o) => (
                <Chip key={o} testID={`frame-shot-${o}`} label={o} selected={data.inquadratura === o} onPress={() => setData({ ...data, inquadratura: data.inquadratura === o ? "" : o })} />
              ))}
            </View>
          </View>

          <Field testID="frame-movement-input" label="Movimento di camera / Ottica" value={data.movimento ?? ""} onChangeText={(t) => setData({ ...data, movimento: t })} />
          <Field testID="frame-desc-input" label="Azione e dialogo" value={data.descrizione ?? ""} onChangeText={(t) => setData({ ...data, descrizione: t })} multiline minHeight={100} />

          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Tavolo luminoso</Text>
            <Button testID="lightbox-pick" icon="image-filter-center-focus-weak" label={data.underlay ? "Cambia immagine" : "Sovrapponi una reference"} variant="secondary" loading={lightBusy} onPress={pickUnderlay} />
            {data.underlay ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, alignItems: "center" }}>
                {[0.15, 0.35, 0.6, 0.85].map((o) => (
                  <Chip key={o} testID={`lightbox-opacity-${o}`} label={`${Math.round(o * 100)}%`} selected={(data.underlayOpacity ?? 0.35) === o} onPress={() => setData({ ...data, underlayOpacity: o })} />
                ))}
                <Button testID="lightbox-remove" icon="close" small variant="secondary" onPress={() => setData({ ...data, underlay: null })} />
              </View>
            ) : (
              <Text style={s.muted}>Resta sotto il disegno e non finisce nel PDF.</Text>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            <Button icon="content-copy" label="Duplica pannello" variant="secondary" onPress={() => (chiudi(), onDuplicate())} />
            {confirmDel ? (
              <Button testID="frame-delete-confirm" icon="trash-can" label="Elimina davvero" variant="danger" onPress={() => m.remove.mutate(frame.id, { onSuccess: () => (toast("Pannello eliminato"), onDone()) })} />
            ) : (
              <Button testID="frame-delete-button" icon="trash-can-outline" variant="secondary" onPress={() => setConfirmDel(true)} />
            )}
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}

// ── Tavola ───────────────────────────────────────────────────────────────────

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

  const cols = width > 1180 ? 3 : width > 760 ? 2 : 1;
  const gap = 14;
  const cellW = (Math.min(width, 1180) - 48 - gap * (cols - 1)) / cols;

  const add = () =>
    m.create.mutate(
      { title: `Pannello ${frames.length + 1}`, data: { strokes: [], aspect: frames[frames.length - 1]?.data.aspect ?? (project.type === "Social" ? "9:16" : "16:9") } },
      { onSuccess: (it) => setEditing(it.id) },
    );

  const frame = frames.find((f) => f.id === editing);

  if (frame) {
    return (
      <Desk
        key={frame.id}
        frame={frame}
        frames={frames}
        onOpen={setEditing}
        onDone={() => setEditing(null)}
        onAdd={add}
        onDuplicate={() =>
          m.create.mutate(
            { title: `${frame.title} (copia)`, data: { ...frame.data } },
            { onSuccess: (it) => (setEditing(it.id), toast("Pannello duplicato")), onError: (e: Error) => toast(e.message, "error") },
          )
        }
      />
    );
  }

  const removeSelected = async () => {
    try {
      for (const id of selected) await m.remove.mutateAsync(id);
      toast(`${selected.length} pannelli eliminati`);
    } catch (e: any) {
      toast(e.message, "error");
    }
    setSelected([]);
    setSelecting(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[colors.brandTertiary, colors.surface]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }} />

      <View style={{ paddingHorizontal: 24, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 22, height: 1.5, backgroundColor: GOLD }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, letterSpacing: 2, fontWeight: "700", color: colors.brandPrimary }}>TAVOLA</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.onSurface, marginTop: 4 }}>Storyboard</Text>
            <Text style={[s.muted, { marginTop: 2 }]} numberOfLines={1}>
              {project.title} · {frames.length} {frames.length === 1 ? "pannello" : "pannelli"} · {scene.length} {scene.length === 1 ? "scena" : "scene"}
            </Text>
          </View>

          {selecting ? (
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
              <Text style={s.muted}>{selected.length} scelti</Text>
              <Button testID="storyboard-delete-selected" icon="trash-can-outline" label="Elimina" variant="danger" disabled={!selected.length} loading={m.remove.isPending} onPress={removeSelected} />
              <Button testID="storyboard-cancel-select" icon="close" variant="secondary" onPress={() => (setSelecting(false), setSelected([]))} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center" }}>
              {canEdit && frames.length ? <Button testID="storyboard-select" icon="checkbox-multiple-marked-outline" variant="secondary" onPress={() => setSelecting(true)} /> : null}
              <Button testID="storyboard-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!frames.length} onPress={() => exportModule(project, def, frames, lookup)} />
              {canEdit ? <Button testID="storyboard-add-frame" icon="plus" label="Nuovo pannello" onPress={add} /> : null}
            </View>
          )}
        </View>

        {scene.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip testID="storyboard-filter-tutte" label={`Tutte ${frames.length}`} selected={!scenaFiltro} onPress={() => setScenaFiltro(null)} />
            {scene.map((id) => (
              <Chip key={id} testID={`storyboard-filter-${id}`} label={lookup.get(id)?.title ?? "Scena"} selected={scenaFiltro === id} onPress={() => setScenaFiltro(scenaFiltro === id ? null : id)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : (
        <FlatList
          key={cols}
          data={visibili}
          numColumns={cols}
          keyExtractor={(f) => f.id}
          columnWrapperStyle={cols > 1 ? { gap } : undefined}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl, gap }}
          ListEmptyComponent={
            frames.length && !visibili.length ? (
              <Empty icon="filter-off-outline" title="Nessun pannello in questa scena" action={<Button label="Mostra tutti" variant="secondary" onPress={() => setScenaFiltro(null)} />} />
            ) : (
              <View style={{ alignItems: "center", paddingTop: spacing.xl }}>
                <Pressable
                  testID="storyboard-empty-add"
                  onPress={add}
                  style={{ width: cellW, aspectRatio: 16 / 9, borderRadius: 6, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: "rgba(255,255,255,0.35)" }}
                >
                  <Icon name="draw" size={34} color={colors.brandPrimary} />
                  <Text style={[s.h3, { fontSize: 15 }]}>Primo pannello</Text>
                  <Text style={[s.muted, { textAlign: "center", paddingHorizontal: spacing.xl }]}>Tocca per aprire la tavola e disegnare la prima inquadratura.</Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item, index }) => {
            const sel = selected.includes(item.id);
            const scena = lookup.get(item.data.scena)?.title;
            const aspect = item.data.aspect ?? "16:9";
            return (
              <Pressable
                testID={`storyboard-frame-${item.id}`}
                onPress={() => (selecting ? setSelected((a) => (sel ? a.filter((x) => x !== item.id) : [...a, item.id])) : setEditing(item.id))}
                onLongPress={() => canEdit && (setSelecting(true), setSelected([item.id]))}
                style={({ pressed }) => ({ width: cellW, opacity: pressed ? 0.9 : 1 })}
              >
                <View style={{ borderRadius: 6, overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: sel ? 2 : 1, borderColor: sel ? GOLD : "rgba(0,0,0,0.1)", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
                  <View style={{ backgroundColor: "#FFFFFF" }}>
                    <StrokeThumb strokes={item.data.strokes ?? []} w={cellW - (sel ? 4 : 2)} aspect={aspect} />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 9, paddingVertical: 7, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", backgroundColor: "#FCF8EF" }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 13, color: GOLD }}>{String(index + 1).padStart(2, "0")}</Text>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: "#211E19" }}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 10.5, color: "#8A8375" }}>
                        {[scena, item.data.inquadratura, item.data.movimento].filter(Boolean).join(" · ") || "Nessun collegamento"}
                      </Text>
                    </View>
                    {item.data.inquadratura ? <Text style={{ fontFamily: fonts.script, fontSize: 10.5, color: "#7A7364" }}>{item.data.inquadratura}</Text> : null}
                  </View>
                  {selecting ? (
                    <View style={{ position: "absolute", top: 8, right: 8 }}>
                      <Icon name={sel ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={sel ? GOLD : "rgba(0,0,0,0.4)"} />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
