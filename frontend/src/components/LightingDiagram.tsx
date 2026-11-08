import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Polygon } from "react-native-svg";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import {
  bersaglio,
  clamp01,
  coloreDi,
  fascio,
  gruppiDiLavoro,
  kindOf,
  LightEl,
  LIGHT_KINDS,
  LUCI_COLORI,
  PIANTA,
  raggio,
  snap,
} from "@/src/lighting";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, toast, useStyles } from "@/src/ui";

type Misura = { w: number; h: number };

const uid = () => Math.random().toString(36).slice(2, 9);

const MISURE = [
  { l: "Piccola", v: 0.8 },
  { l: "Media", v: 1 },
  { l: "Grande", v: 1.6 },
];

// Un elemento in pianta. Si trascina col dito; si seleziona con un tocco.
function Node({
  el,
  misura,
  selected,
  onSelect,
  onMove,
  onBegin,
}: {
  el: LightEl;
  misura: Misura;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onBegin: () => void;
}) {
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
        .onUpdate((e) =>
          onMove(
            snap(clamp01(inizio.current.x + e.translationX / misura.w)),
            snap(clamp01(inizio.current.y + e.translationY / misura.h)),
          ),
        ),
    [misura.w, misura.h, onSelect, onMove],
  );

  const k = kindOf(el.kind);
  const r = raggio(el);
  const lato = Math.max(56, r * 2 + 16);
  const scuro = k.forma === "camera" || k.forma === "modificatore";

  return (
    <GestureDetector gesture={gesto}>
      <View
        testID={`light-node-${el.kind}`}
        collapsable={false}
        style={{ position: "absolute", left: el.x * misura.w - lato / 2, top: el.y * misura.h - lato / 2, width: lato, alignItems: "center" }}
      >
        <View
          style={{
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: k.luce ? coloreDi(el) : scuro ? colors.surfaceInverse : colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: scuro ? colors.surfaceInverse : colors.borderStrong,
            transform: [{ rotate: `${el.rot}deg` }],
          }}
        >
          {k.forma === "attore" ? (
            <Icon name={k.icon} size={r} color={colors.onSurface} />
          ) : (
            <Icon name={k.icon} size={r} color={scuro ? colors.onSurfaceInverse : colors.onSurface} />
          )}
        </View>
        {selected ? (
          <View
            pointerEvents="none"
            style={{ position: "absolute", width: r * 2 + 10, height: r * 2 + 10, borderRadius: r + 5, borderWidth: 2, borderColor: colors.brandPrimary }}
          />
        ) : null}
        {el.label ? (
          <View style={{ marginTop: 2, maxWidth: 120, backgroundColor: colors.surface, opacity: 0.92, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.sm }}>
            <Text numberOfLines={1} style={{ fontSize: 10, color: colors.onSurface, fontWeight: "600" }}>
              {el.label}
            </Text>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

// La pianta: griglia, foto della location in trasparenza, fasci di luce e
// elementi trascinabili.
function Pianta({
  els,
  misura,
  sel,
  foto,
  onMisura,
  onSelect,
  onMove,
  onBegin,
}: {
  els: LightEl[];
  misura: Misura;
  sel: string | null;
  foto?: string;
  onMisura: (m: Misura) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onBegin: () => void;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const selezioni = useRef<Record<string, () => void>>({});
  const movimenti = useRef<Record<string, (x: number, y: number) => void>>({});
  const selFn = (id: string) => (selezioni.current[id] ??= () => onSelect(id));
  const moveFn = (id: string) =>
    (movimenti.current[id] ??= (x: number, y: number) => onMove(id, x, y));

  return (
    <View
      testID="lighting-canvas"
      onLayout={(e) => onMisura({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{
        width: "100%",
        aspectRatio: 4 / 3,
        maxHeight: 700,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {foto ? <RemoteImage path={foto} style={StyleSheet.absoluteFill} /> : null}
      {foto ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceSecondary, opacity: 0.72 }]} /> : null}

      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${PIANTA.w} ${PIANTA.h}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Line key={`v${i}`} x1={(i * PIANTA.w) / 6} y1={0} x2={(i * PIANTA.w) / 6} y2={PIANTA.h} stroke={colors.divider} strokeWidth={1} />
        ))}
        {[1, 2, 3].map((i) => (
          <Line key={`h${i}`} x1={0} y1={(i * PIANTA.h) / 4} x2={PIANTA.w} y2={(i * PIANTA.h) / 4} stroke={colors.divider} strokeWidth={1} />
        ))}

        {els
          .filter((el) => kindOf(el.kind).luce)
          .map((el) => {
            const { punti } = fascio(el);
            const punta = bersaglio(el);
            const attivo = sel === el.id;

            return (
              <G key={el.id}>
                <Polygon points={punti} fill={coloreDi(el)} opacity={attivo ? 0.55 : 0.38} />
                <Circle cx={punta.x} cy={punta.y} r={4} fill={coloreDi(el)} opacity={0.9} />
              </G>
            );
          })}
      </Svg>

      {misura.w > 0 &&
        els.map((el) => (
          <Node
            key={el.id}
            el={el}
            misura={misura}
            selected={sel === el.id}
            onSelect={selFn(el.id)}
            onMove={moveFn(el.id)}
            onBegin={onBegin}
          />
        ))}

      {!els.length && (
        <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={[s.muted, { textAlign: "center" }]}>
            Aggiungi camera, attori e luci dai gruppi qui sopra, poi trascinali: il fascio indica dove butta la luce.
          </Text>
        </View>
      )}
    </View>
  );
}

function DiagramEditor({ diagram }: { diagram: Item }) {
  const { project, go } = useHub();
  const m = useItemMutations(project.id, "luci");
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const lookup = useLookup(project.id);

  const [els, setEls] = useState<LightEl[]>(diagram.data.elements ?? []);
  const [storia, setStoria] = useState<LightEl[][]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState<string>(diagram.data.note ?? "");
  const [misura, setMisura] = useState<Misura>({ w: 0, h: 0 });
  const [loc, setLoc] = useState<string>(diagram.data.location ?? "");
  const [scenes, setScenes] = useState<string[]>(diagram.data.scene ?? []);
  const [gear, setGear] = useState<string[]>(diagram.data.attrezzatura ?? []);
  const [mostraFoto, setMostraFoto] = useState(true);

  const selezionato = els.find((e) => e.id === sel);
  const foto = (lookup.get(loc)?.data.foto as string | undefined) ?? undefined;

  // Ogni modifica parte da una copia: "Annulla" torna indietro di un passo.
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
    const nuovo: LightEl = {
      id: uid(),
      kind,
      // A spirale attorno al centro: gli elementi nuovi non finiscono uno
      // sopra l'altro e si vedono subito.
      x: clamp01(0.5 + Math.cos(els.length * 1.1) * 0.2),
      y: clamp01(0.5 + Math.sin(els.length * 1.1) * 0.2),
      rot: 0,
      label: "",
      size: 1,
      colore: k.colore,
    };
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
  };

  const svuota = () => {
    spingi();
    setEls([]);
    setSel(null);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
      <RefInput f={{ key: "location", label: "Location", type: "ref", ref: "location" }} value={loc} onChange={setLoc} onGo={(mm) => go(mm)} />
      <RefInput f={{ key: "scene", label: "Scene che usano questo setup", type: "ref", ref: "scene", multi: true }} value={scenes} onChange={setScenes} onGo={(mm) => go(mm)} />
      <RefInput f={{ key: "attrezzatura", label: "Attrezzatura usata (dalla sezione Attrezzatura)", type: "ref", ref: "attrezzatura", multi: true }} value={gear} onChange={setGear} onGo={(mm) => go(mm)} />

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={[s.label, { flex: 1 }]}>Cosa metti in pianta</Text>
          {storia.length ? <Button testID="lighting-undo" icon="undo" variant="secondary" label="Annulla" onPress={annulla} /> : null}
        </View>

        {gruppiDiLavoro.map((gruppo) => (
          <View key={gruppo.key} style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
              {gruppo.label}
            </Text>
            <ChipRow>
              {LIGHT_KINDS.filter((k) => k.gruppo === gruppo.key).map((k) => (
                <Chip
                  key={k.k}
                  testID={`add-light-${k.k}`}
                  icon={k.icon}
                  label={k.l}
                  onPress={() => aggiungi(k.k)}
                />
              ))}
            </ChipRow>
          </View>
        ))}
      </View>

      <Pianta
        els={els}
        misura={misura}
        sel={sel}
        foto={mostraFoto ? foto : undefined}
        onMisura={setMisura}
        onSelect={setSel}
        onMove={(id, x, y) => setEls((a) => a.map((e) => (e.id === id ? { ...e, x, y } : e)))}
        onBegin={spingi}
      />

      <ChipRow>
        {foto ? (
          <Chip testID="lighting-toggle-photo" icon="image-outline" label="Foto della location" selected={mostraFoto} onPress={() => setMostraFoto(!mostraFoto)} />
        ) : null}
        {els.length ? <Chip testID="lighting-clear" icon="delete-sweep-outline" label="Svuota la pianta" onPress={svuota} /> : null}
      </ChipRow>

      {selezionato ? (
        <View testID="light-selected-panel" style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name={kindOf(selezionato.kind).icon} size={18} color={colors.brandPrimary} />
            <Text style={{ flex: 1, color: colors.onSurface, fontWeight: "700" }}>{kindOf(selezionato.kind).l}</Text>
            <Button testID="light-deselect-button" icon="check" variant="secondary" small onPress={() => setSel(null)} />
          </View>

          <Field
            testID="light-label-input"
            label="Etichetta (lampada, potenza, gel...)"
            value={selezionato.label}
            onChangeText={(t) => patch({ label: t })}
            placeholder="es. Aputure 600d, 5600K"
          />

          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Direzione del fascio</Text>
            <ChipRow>
              <Chip testID="light-rotate-left" icon="rotate-left" label="−15°" onPress={() => patch({ rot: ((selezionato.rot ?? 0) + 345) % 360 })} />
              <Chip testID="light-rotate-right" icon="rotate-right" label="+15°" onPress={() => patch({ rot: ((selezionato.rot ?? 0) + 15) % 360 })} />
              <Chip testID="light-rotate-0" icon="arrow-right" label={`${(selezionato.rot ?? 0) % 360}°`} selected onPress={() => patch({ rot: 0 })} />
            </ChipRow>
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Dimensione</Text>
            <ChipRow>
              {MISURE.map((x) => (
                <Chip key={x.l} testID={`light-size-${x.l}`} label={x.l} selected={Math.abs((selezionato.size ?? 1) - x.v) < 0.01} onPress={() => patch({ size: x.v })} />
              ))}
            </ChipRow>
          </View>

          {kindOf(selezionato.kind).luce ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Colore della luce</Text>
              <ChipRow>
                {LUCI_COLORI.map((c) => (
                  <Chip
                    key={c.nome}
                    testID={`light-colore-${c.nome}`}
                    label={c.nome}
                    selected={coloreDi(selezionato).toLowerCase() === c.hex.toLowerCase()}
                    onPress={() => patch({ colore: c.hex })}
                  />
                ))}
              </ChipRow>
            </View>
          ) : null}

          <ChipRow>
            <Chip testID="light-duplicate-button" icon="content-duplicate" label="Duplica" onPress={duplica} />
            <Chip testID="light-delete-button" icon="trash-can-outline" label="Elimina" onPress={elimina} />
          </ChipRow>

          {gear.length > 0 && kindOf(selezionato.kind).luce ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>Prendi il nome dall’attrezzatura</Text>
              <ChipRow>
                {gear.map((id) => lookup.get(id)).filter(Boolean).map((g) => (
                  <Chip
                    key={g!.id}
                    testID={`light-gear-${g!.id}`}
                    icon="lightbulb-outline"
                    label={g!.title}
                    selected={selezionato.label === g!.title}
                    onPress={() => patch({ label: g!.title })}
                  />
                ))}
              </ChipRow>
            </View>
          ) : null}
        </View>
      ) : null}

      <Field testID="lighting-note-input" label="Note (temperatura, intensità, gel...)" value={note} onChangeText={setNote} multiline minHeight={90} />
      <Button
        testID="lighting-save-button"
        icon="check"
        label="Salva diagramma"
        loading={m.update.isPending}
        onPress={() =>
          m.update.mutate(
            { id: diagram.id, data: { elements: els, note, location: loc, scene: scenes, attrezzatura: gear } },
            { onSuccess: () => toast("Diagramma salvato") },
          )
        }
      />
    </ScrollView>
  );
}

export default function LightingDiagram({ def }: { def: ModuleDef }) {
  const { project, focus, clearFocus, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const [sel, setSel] = useState<string | null>(focus?.module === def.key ? focus.id : null);

  useEffect(() => {
    if (focus?.module === def.key) {
      setSel(focus.id);
      clearFocus();
    }
  }, [focus, def.key, clearFocus]);

  const list = q.data ?? [];
  const current = list.find((d) => d.id === sel) ?? list[0];
  const add = () => m.create.mutate({ title: `Setup ${list.length + 1}`, data: { elements: [] } }, { onSuccess: (it) => setSel(it.id) });

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle="Pianta luci e camera per ogni setup"
        right={
          <>
            <Button testID="lighting-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!list.length} onPress={() => exportModule(project, def, list, lookup)} />
            {canEdit && current && <Button testID="lighting-delete-diagram" icon="trash-can-outline" variant="secondary" onPress={() => m.remove.mutate(current.id, { onSuccess: () => setSel(null) })} />}
            {canEdit && <Button testID="lighting-add-diagram" icon="plus" label="Setup" onPress={add} loading={m.create.isPending} />}
          </>
        }
      />
      {list.length > 1 && (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
          <ChipRow>
            {list.map((d) => (
              <Chip key={d.id} testID={`lighting-diagram-${d.id}`} label={d.title} selected={current?.id === d.id} onPress={() => setSel(d.id)} />
            ))}
          </ChipRow>
        </View>
      )}
      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : current ? (
        <DiagramEditor key={current.id} diagram={current} />
      ) : (
        <Empty icon="lightbulb-group-outline" title="Nessun diagramma luce" subtitle="Crea un setup e posiziona camera, attori e luci." action={<Button testID="lighting-empty-add" icon="plus" label="Nuovo setup" onPress={add} />} />
      )}
    </View>
  );
}
