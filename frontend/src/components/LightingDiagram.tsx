import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Polygon } from "react-native-svg";

import { Item } from "@/src/api";
import { Fader } from "@/src/components/Fader";
import { RemoteImage } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { bersaglio, clamp01, coloreDi, fascio, gruppiDiLavoro, kindOf, LightEl, LIGHT_KINDS, LUCI_COLORI, PIANTA, raggio, snap } from "@/src/lighting";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Field, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

type Misura = { w: number; h: number };

const uid = () => Math.random().toString(36).slice(2, 9);
const MISURE = [
  { l: "Piccola", v: 0.8 },
  { l: "Media", v: 1 },
  { l: "Grande", v: 1.6 },
];

// ── Miniatura della pianta, per l'elenco ─────────────────────────────────────

function MiniPlan({ els }: { els: LightEl[] }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${PIANTA.w} ${PIANTA.h}`}>
      {els
        .filter((el) => kindOf(el.kind).luce)
        .map((el) => {
          const { punti } = fascio(el);
          return <Polygon key={`b-${el.id}`} points={punti} fill={coloreDi(el)} opacity={0.42} />;
        })}
      {els.map((el) => {
        const k = kindOf(el.kind);
        return (
          <Circle
            key={`n-${el.id}`}
            cx={el.x * PIANTA.w}
            cy={el.y * PIANTA.h}
            r={k.forma === "camera" ? 13 : 9}
            fill={k.luce ? coloreDi(el) : "#2A2721"}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}

// ── Elemento trascinabile sulla pianta ──────────────────────────────────────

function Node({ el, misura, selected, onSelect, onMove, onBegin }: { el: LightEl; misura: Misura; selected: boolean; onSelect: () => void; onMove: (x: number, y: number) => void; onBegin: () => void }) {
  const { colors } = useTheme();
  const corrente = useRef(el);
  corrente.current = el;
  const inizio = useRef({ x: 0, y: 0 });
  const parti = useRef(onBegin);
  parti.current = onBegin;

  const gesto = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(() => {
          inizio.current = { x: corrente.current.x, y: corrente.current.y };
          parti.current();
          onSelect();
        })
        .onUpdate((e) => onMove(snap(clamp01(inizio.current.x + e.translationX / misura.w)), snap(clamp01(inizio.current.y + e.translationY / misura.h)))),
    [misura.w, misura.h, onSelect, onMove],
  );

  const k = kindOf(el.kind);
  const r = raggio(el);
  const lato = Math.max(58, r * 2 + 18);
  const scuro = k.forma === "camera" || k.forma === "modificatore";

  return (
    <GestureDetector gesture={gesto}>
      <View testID={`light-node-${el.kind}`} collapsable={false} style={{ position: "absolute", left: el.x * misura.w - lato / 2, top: el.y * misura.h - lato / 2, width: lato, alignItems: "center" }}>
        <View
          style={{
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: k.luce ? coloreDi(el) : scuro ? "#26231C" : "#FFFFFF",
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? colors.brandPrimary : scuro ? "#26231C" : colors.borderStrong,
            transform: [{ rotate: `${el.rot}deg` }],
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Icon name={k.icon} size={r} color={k.luce ? "#17140F" : scuro ? "#F4EFE3" : "#26231C"} />
        </View>
        {el.label ? (
          <View style={{ marginTop: 3, maxWidth: 130, backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 9.5, color: "#26231C", fontWeight: "600" }}>
              {el.label}
            </Text>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

// ── Pianta (editor) ─────────────────────────────────────────────────────────

function Pianta({ els, misura, sel, foto, mostraFoto, onMisura, onSelect, onMove, onBegin }: { els: LightEl[]; misura: Misura; sel: string | null; foto?: string; mostraFoto: boolean; onMisura: (m: Misura) => void; onSelect: (id: string) => void; onMove: (id: string, x: number, y: number) => void; onBegin: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const selezioni = useRef<Record<string, () => void>>({});
  const movimenti = useRef<Record<string, (x: number, y: number) => void>>({});
  const selFn = (id: string) => (selezioni.current[id] ??= () => onSelect(id));
  const moveFn = (id: string) => (movimenti.current[id] ??= (x: number, y: number) => onMove(id, x, y));

  return (
    <View
      testID="lighting-canvas"
      onLayout={(e) => onMisura({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ width: "100%", aspectRatio: 4 / 3, backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
    >
      {foto && mostraFoto ? <RemoteImage path={foto} style={StyleSheet.absoluteFill} /> : null}
      {foto && mostraFoto ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF", opacity: 0.72 }]} /> : null}

      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${PIANTA.w} ${PIANTA.h}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Line key={`v${i}`} x1={(i * PIANTA.w) / 6} y1={0} x2={(i * PIANTA.w) / 6} y2={PIANTA.h} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
        ))}
        {[1, 2, 3].map((i) => (
          <Line key={`h${i}`} x1={0} y1={(i * PIANTA.h) / 4} x2={PIANTA.w} y2={(i * PIANTA.h) / 4} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
        ))}
        {els
          .filter((el) => kindOf(el.kind).luce)
          .map((el) => {
            const { punti } = fascio(el);
            const punta = bersaglio(el);
            return (
              <G key={el.id}>
                <Polygon points={punti} fill={coloreDi(el)} opacity={sel === el.id ? 0.55 : 0.36} />
                <Circle cx={punta.x} cy={punta.y} r={4} fill={coloreDi(el)} opacity={0.9} />
              </G>
            );
          })}
      </Svg>

      {misura.w > 0 &&
        els.map((el) => <Node key={el.id} el={el} misura={misura} selected={sel === el.id} onSelect={selFn(el.id)} onMove={moveFn(el.id)} onBegin={onBegin} />)}

      {!els.length ? (
        <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: 6 }}>
          <Icon name="lightbulb-on-outline" size={26} color="#B7AE9C" />
          <Text style={[s.muted, { textAlign: "center", color: "#8A8375" }]}>Aggiungi camera, attori e luci dal banco in basso, poi trascinali sulla pianta.</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Scheda in elenco ────────────────────────────────────────────────────────

function SetupCard({ item, index, onPress, onEdit, width }: { item: Item; index: number; onPress: () => void; onEdit: () => void; width: number }) {
  const { colors } = useTheme();
  const s = useStyles();
  const els: LightEl[] = item.data.elements ?? [];
  const luci = els.filter((el) => kindOf(el.kind).luce).length;
  return (
    <Pressable testID={`lighting-diagram-${item.id}`} onPress={onPress} style={({ pressed }) => ({ width, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
        <View style={{ backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <View style={{ width: "100%", aspectRatio: 4 / 3 }}>
            {els.length ? <MiniPlan els={els} /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }}><Icon name="lightbulb-outline" size={24} color="#B7AE9C" /><Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: "#8A8375" }}>Pianta vuota</Text></View>}
          </View>
          <View style={{ position: "absolute", left: 8, top: 8, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "rgba(255,255,255,0.94)", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 10, color: "#26231C" }}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
          <View style={{ position: "absolute", right: 8, top: 8, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "rgba(23,20,15,0.62)" }}>
            <Icon name="lightbulb-on-outline" size={10} color="#F4EFE3" />
            <Text style={{ fontFamily: fonts.text, fontSize: 9.5, fontWeight: "700", color: "#F4EFE3" }}>{luci}</Text>
          </View>
        </View>
        <View style={{ padding: spacing.md, gap: 2 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.onSurface }} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
            {[item.data.location ? "Location collegata" : "Senza location", els.length ? `${els.length} elementi` : "Da disegnare"].join(" · ")}
          </Text>
        </View>
        <Pressable onPress={onEdit} style={{ position: "absolute", right: 0, bottom: 0, top: 0, width: 44, alignItems: "center", justifyContent: "center" }}>
          <Icon name="pencil-outline" size={16} color={colors.muted} />
        </Pressable>
      </Glass>
    </Pressable>
  );
}

// ── Editor del diagramma ────────────────────────────────────────────────────

function DiagramEditor({ diagram, onClose }: { diagram: Item; onClose: () => void }) {
  const { project, go } = useHub();
  const m = useItemMutations(project.id, "luci");
  const lookup = useLookup(project.id);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [title, setTitle] = useState(diagram.title);
  const [els, setEls] = useState<LightEl[]>(diagram.data.elements ?? []);
  const [storia, setStoria] = useState<LightEl[][]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState<string>(diagram.data.note ?? "");
  const [misura, setMisura] = useState<Misura>({ w: 0, h: 0 });
  const [loc, setLoc] = useState<string>(diagram.data.location ?? "");
  const [scenes, setScenes] = useState<string[]>(diagram.data.scene ?? []);
  const [gear, setGear] = useState<string[]>(diagram.data.attrezzatura ?? []);
  const [mostraFoto, setMostraFoto] = useState(true);
  const [scheda, setScheda] = useState(false);
  const [conferma, setConferma] = useState(false);

  const selezionato = els.find((e) => e.id === sel) ?? null;
  const foto = (lookup.get(loc)?.data.foto as string | undefined) ?? undefined;

  const spingi = () => setStoria((passate) => [...passate.slice(-24), els]);
  const annulla = () => {
    const ultima = storia[storia.length - 1];
    if (!ultima) return;
    setEls(ultima);
    setStoria((passate) => passate.slice(0, -1));
    setSel(null);
  };
  const patch = (p: Partial<LightEl>) => setEls((a) => a.map((e) => (e.id === sel ? { ...e, ...p } : e)));

  const aggiungi = (kind: string) => {
    const k = kindOf(kind);
    spingi();
    const nuovo: LightEl = { id: uid(), kind, x: clamp01(0.5 + Math.cos(els.length * 1.1) * 0.2), y: clamp01(0.5 + Math.sin(els.length * 1.1) * 0.2), rot: 0, label: "", size: 1, colore: k.colore };
    setEls((a) => [...a, nuovo]);
    setSel(nuovo.id);
  };
  const duplica = () => {
    if (!selezionato) return;
    spingi();
    const copia: LightEl = { ...selezionato, id: uid(), x: clamp01(selezionato.x + 0.04), y: clamp01(selezionato.y + 0.04) };
    setEls((a) => [...a, copia]);
    setSel(copia.id);
  };
  const elimina = () => {
    if (!selezionato) return;
    spingi();
    setEls((a) => a.filter((e) => e.id !== sel));
    setSel(null);
    setScheda(false);
  };

  const salva = (close: boolean) => {
    m.update.mutate(
      { id: diagram.id, title, data: { elements: els, note, location: loc, scene: scenes, attrezzatura: gear } },
      { onSuccess: () => (toast("Diagramma salvato"), close && onClose()), onError: (e: Error) => toast(e.message, "error") },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title={title}
        subtitle={`${els.length} elementi${foto ? " · foto location" : ""}`}
        right={
          <>
            <Button testID="lighting-back" icon="chevron-left" variant="secondary" onPress={() => salva(true)} />
            <Button testID="lighting-undo" icon="undo" variant="secondary" disabled={!storia.length} onPress={annulla} />
            <Button icon="card-text-outline" label={wide ? "Scheda" : undefined} variant="secondary" onPress={() => setScheda(true)} />
            <Button testID="lighting-save-button" icon="check" label={wide ? "Salva" : undefined} loading={m.update.isPending} onPress={() => salva(false)} />
          </>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xs }}>
            <Text style={{ ...s.label, fontSize: 9.5 }}>Pianta</Text>
            <View style={{ flex: 1 }} />
            {foto ? (
              <Pressable testID="lighting-toggle-photo" onPress={() => setMostraFoto(!mostraFoto)} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: mostraFoto ? colors.brandPrimary : colors.divider, backgroundColor: mostraFoto ? colors.brandTertiary : "transparent" }}>
                <Icon name="image-outline" size={12} color={mostraFoto ? colors.onBrandTertiary : colors.muted} />
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: mostraFoto ? colors.onBrandTertiary : colors.muted }}>Foto</Text>
              </Pressable>
            ) : null}
            {els.length ? (
              <Pressable testID="lighting-clear" onPress={() => (spingi(), setEls([]), setSel(null))} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: colors.divider }}>
                <Icon name="delete-sweep-outline" size={12} color={colors.muted} />
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.muted }}>Svuota</Text>
              </Pressable>
            ) : null}
          </View>
          <Pianta els={els} misura={misura} sel={sel} foto={foto} mostraFoto={mostraFoto} onMisura={setMisura} onSelect={setSel} onMove={(id, x, y) => setEls((a) => a.map((e) => (e.id === id ? { ...e, x, y } : e)))} onBegin={spingi} />
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm }}>
          {gruppiDiLavoro.map((gruppo) => (
            <View key={gruppo.key} style={{ gap: 5 }}>
              <Text style={{ ...s.label, fontSize: 9 }}>{gruppo.label}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {LIGHT_KINDS.filter((k) => k.gruppo === gruppo.key).map((k) => (
                  <Pressable
                    key={k.k}
                    testID={`add-light-${k.k}`}
                    onPress={() => aggiungi(k.k)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}
                  >
                    <Icon name={k.icon as IconName} size={14} color={colors.brandPrimary} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "600", color: colors.onSurface }}>{k.l}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </Glass>

        {selezionato ? (
          <Glass testID="light-selected-panel" style={{ borderRadius: 20, borderWidth: 1, borderColor: "rgba(212,175,55,0.45)", padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name={kindOf(selezionato.kind).icon as IconName} size={18} color={colors.brandPrimary} />
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 13.5, fontWeight: "700", color: colors.onSurface }}>{kindOf(selezionato.kind).l}</Text>
              <Button testID="light-deselect-button" icon="check" variant="secondary" small onPress={() => setSel(null)} />
            </View>

            <Field testID="light-label-input" label="Etichetta (lampada, potenza, gel…)" value={selezionato.label} onChangeText={(t) => patch({ label: t })} placeholder="es. Aputure 600d, 5600K" />

            <View style={{ gap: 2 }}>
              <Fader
                testID="light-rotation-fader"
                label="Direzione del fascio"
                value={selezionato.rot ?? 0}
                min={0}
                max={360}
                step={5}
                onChange={(v) => patch({ rot: v })}
                format={(v) => `${Math.round(v)}°`}
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
              {MISURE.map((x) => (
                <Chip key={x.l} testID={`light-size-${x.l}`} label={x.l} selected={Math.abs((selezionato.size ?? 1) - x.v) < 0.01} onPress={() => patch({ size: x.v })} />
              ))}
              <Chip testID="light-rotate-0" icon="arrow-right" label="Dritto" onPress={() => patch({ rot: 0 })} />
            </View>

            {kindOf(selezionato.kind).luce ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <Text style={s.label}>Colore</Text>
                {LUCI_COLORI.map((c) => (
                  <Pressable key={c.nome} testID={`light-colore-${c.nome}`} onPress={() => patch({ colore: c.hex })} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.hex, borderWidth: coloreDi(selezionato).toLowerCase() === c.hex.toLowerCase() ? 3 : 1, borderColor: coloreDi(selezionato).toLowerCase() === c.hex.toLowerCase() ? colors.brandPrimary : colors.border }} />
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button testID="light-duplicate-button" icon="content-duplicate" label="Duplica" variant="secondary" small onPress={duplica} />
              <Button testID="light-delete-button" icon="trash-can-outline" label="Elimina" variant="secondary" small onPress={elimina} />
            </View>

            {gear.length && kindOf(selezionato.kind).luce ? (
              <View style={{ gap: 4 }}>
                <Text style={s.label}>Prendi il nome dall’attrezzatura</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {gear
                    .map((id) => lookup.get(id))
                    .filter(Boolean)
                    .map((g) => (
                      <Chip key={g!.id} testID={`light-gear-${g!.id}`} icon="lightbulb-outline" label={g!.title} selected={selezionato.label === g!.title} onPress={() => patch({ label: g!.title })} />
                    ))}
                </ScrollView>
              </View>
            ) : null}
          </Glass>
        ) : null}

        <Field testID="lighting-note-input" label="Note (temperatura, intensità, gel…)" value={note} onChangeText={setNote} multiline minHeight={90} />
      </ScrollView>

      <Sheet visible={scheda} onClose={() => setScheda(false)} title="Scheda del setup">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
          <Field testID="lighting-title-input" label="Nome del setup" value={title} onChangeText={setTitle} placeholder="es. Notte in cucina" />
          <RefInput f={{ key: "location", label: "Location", type: "ref", ref: "location" }} value={loc} onChange={setLoc} onGo={(mm) => go(mm)} />
          <RefInput f={{ key: "scene", label: "Scene che usano questo setup", type: "ref", ref: "scene", multi: true }} value={scenes} onChange={setScenes} onGo={(mm) => go(mm)} />
          <RefInput f={{ key: "attrezzatura", label: "Attrezzatura usata (dalla sezione Attrezzatura)", type: "ref", ref: "attrezzatura", multi: true }} value={gear} onChange={setGear} onGo={(mm) => go(mm)} />
          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            {conferma ? (
              <Button testID="lighting-delete-confirm" icon="trash-can" label="Elimina davvero" variant="danger" onPress={() => m.remove.mutate(diagram.id, { onSuccess: () => (toast("Setup eliminato"), onClose()) })} />
            ) : (
              <Button testID="lighting-delete-diagram" icon="trash-can-outline" label="Elimina setup" variant="secondary" onPress={() => setConferma(true)} />
            )}
            <Button icon="check" label="Fatto" onPress={() => setScheda(false)} />
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}

// ── Elenco dei setup ────────────────────────────────────────────────────────

export default function LightingDiagram({ def }: { def: ModuleDef }) {
  const { project, focus, clearFocus, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [sel, setSel] = useState<string | null>(focus?.module === def.key ? focus.id : null);

  useEffect(() => {
    if (focus?.module === def.key) {
      setSel(focus.id);
      clearFocus();
    }
  }, [focus, def.key, clearFocus]);

  const list = q.data ?? [];
  const current = list.find((d) => d.id === sel) ?? null;
  const add = () => m.create.mutate({ title: `Setup ${list.length + 1}`, data: { elements: [] } }, { onSuccess: (it) => setSel(it.id) });

  if (current) return <DiagramEditor key={current.id} diagram={current} onClose={() => setSel(null)} />;

  const luci = list.reduce((n, d) => n + ((d.data.elements ?? []) as LightEl[]).filter((el) => kindOf(el.kind).luce).length, 0);
  const cols = width > 1100 ? 3 : width > 760 ? 2 : 1;
  const cardW = (Math.min(width, 1200) - 48 - spacing.md * (cols - 1)) / cols;

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={12} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${list.length} ${list.length === 1 ? "setup" : "setup"} · ${luci} luci in pianta`}
        right={
          <>
            <Button testID="lighting-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!list.length} onPress={() => exportModule(project, def, list, lookup)} />
            {canEdit ? <Button testID="lighting-add-diagram" icon="plus" label="Setup" onPress={add} loading={m.create.isPending} /> : null}
          </>
        }
      />

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : !list.length ? (
        <Empty icon="lightbulb-group-outline" title="Nessun diagramma luce" subtitle="Crea un setup e posiziona camera, attori e luci: il fascio mostra dove butta la luce." action={canEdit ? <Button testID="lighting-empty-add" icon="plus" label="Nuovo setup" onPress={add} /> : undefined} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
          <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary, padding: spacing.xl, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Icon name="lightbulb-group-outline" size={14} color={colors.brandPrimary} />
              <Text style={s.label}>I diagrammi luce</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
              {project.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {pillola("lightbulb-group-outline", `${list.length} ${list.length === 1 ? "setup" : "setup"}`)}
              {pillola("lightbulb-on-outline", `${luci} luci`)}
              {pillola("movie-open-outline", `${list.filter((d) => (d.data.scene ?? []).length).length} con scene`)}
            </View>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {list.map((d, i) => (
              <SetupCard key={d.id} item={d} index={i} width={cardW} onPress={() => setSel(d.id)} onEdit={() => setSel(d.id)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
