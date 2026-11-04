import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, IconName, toast, useStyles } from "@/src/ui";

type El = { id: string; kind: string; x: number; y: number; rot: number; label: string };
const KINDS: { k: string; l: string; icon: IconName }[] = [
  { k: "camera", l: "Camera", icon: "video-vintage" },
  { k: "actor", l: "Attore", icon: "account" },
  { k: "key", l: "Key", icon: "lightbulb-on" },
  { k: "fill", l: "Fill", icon: "lightbulb-outline" },
  { k: "back", l: "Controluce", icon: "lightbulb-on-outline" },
  { k: "fresnel", l: "Fresnel", icon: "spotlight-beam" },
  { k: "led", l: "Pannello LED", icon: "view-grid-outline" },
  { k: "soft", l: "Softbox", icon: "square-outline" },
  { k: "practical", l: "Practical", icon: "lamp" },
  { k: "bounce", l: "Pannello", icon: "circle-half-full" },
  { k: "flag", l: "Bandiera", icon: "flag-outline" },
  { k: "window", l: "Finestra", icon: "window-closed-variant" },
  { k: "haze", l: "Haze", icon: "weather-fog" },
];
const kindOf = (k: string) => KINDS.find((x) => x.k === k) ?? KINDS[0];
const clamp = (v: number) => Math.max(0.03, Math.min(0.97, v));
const uid = () => Math.random().toString(36).slice(2, 9);

function Node({ el, size, selected, onSelect, onMove }: { el: El; size: { w: number; h: number }; selected: boolean; onSelect: () => void; onMove: (x: number, y: number) => void }) {
  const { colors } = useTheme();
  const elRef = useRef(el);
  elRef.current = el;
  const start = useRef({ x: 0, y: 0 });
  const g = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(() => {
          start.current = { x: elRef.current.x, y: elRef.current.y };
          onSelect();
        })
        .onUpdate((e) => onMove(clamp(start.current.x + e.translationX / size.w), clamp(start.current.y + e.translationY / size.h))),
    [size.w, size.h, onSelect, onMove],
  );
  const k = kindOf(el.kind);
  const isLight = !["camera", "actor", "window", "flag"].includes(el.kind);
  return (
    <GestureDetector gesture={g}>
      <View testID={`light-node-${el.kind}`} collapsable={false} style={{ position: "absolute", left: el.x * size.w - 28, top: el.y * size.h - 28, width: 56, alignItems: "center" }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: isLight ? colors.brandPrimary : colors.surfaceInverse, borderWidth: selected ? 3 : 0, borderColor: colors.onSurface, transform: [{ rotate: `${el.rot}deg` }] }}>
          <Icon name={k.icon} size={24} color={isLight ? colors.onBrandPrimary : colors.onSurfaceInverse} />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 10, color: colors.onSurface, marginTop: 2, maxWidth: 90 }}>
          {el.label || k.l}
        </Text>
      </View>
    </GestureDetector>
  );
}

function DiagramEditor({ diagram }: { diagram: Item }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, "luci");
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [els, setEls] = useState<El[]>(diagram.data.elements ?? []);
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState<string>(diagram.data.note ?? "");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const selected = els.find((e) => e.id === sel);
  const onSelectFns = useRef<Record<string, () => void>>({});
  const onMoveFns = useRef<Record<string, (x: number, y: number) => void>>({});
  const selFn = (id: string) => (onSelectFns.current[id] ??= () => setSel(id));
  const moveFn = (id: string) => (onMoveFns.current[id] ??= (x: number, y: number) => setEls((a) => a.map((e) => (e.id === id ? { ...e, x, y } : e))));
  const patch = (p: Partial<El>) => setEls((a) => a.map((e) => (e.id === sel ? { ...e, ...p } : e)));
  const { go } = useHub();
  const lookup = useLookup(project.id);
  const [loc, setLoc] = useState<string>(diagram.data.location ?? "");
  const [scenes, setScenes] = useState<string[]>(diagram.data.scene ?? []);
  const [gear, setGear] = useState<string[]>(diagram.data.attrezzatura ?? []);
  const locPhoto = lookup.get(loc)?.data.foto as string | undefined;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
      <RefInput f={{ key: "location", label: "Location", type: "ref", ref: "location" }} value={loc} onChange={setLoc} onGo={(mm) => go(mm)} />
      <RefInput f={{ key: "scene", label: "Scene che usano questo setup", type: "ref", ref: "scene", multi: true }} value={scenes} onChange={setScenes} onGo={(mm) => go(mm)} />
      <RefInput f={{ key: "attrezzatura", label: "Attrezzatura usata (dalla sezione Attrezzatura)", type: "ref", ref: "attrezzatura", multi: true }} value={gear} onChange={setGear} onGo={(mm) => go(mm)} />
      <ChipRow>
        {KINDS.map((k) => (
          <Chip key={k.k} testID={`add-light-${k.k}`} icon={k.icon} label={k.l} onPress={() => { const n = { id: uid(), kind: k.k, x: 0.25 + Math.random() * 0.5, y: 0.25 + Math.random() * 0.5, rot: 0, label: "" }; setEls((a) => [...a, n]); setSel(n.id); }} />
        ))}
      </ChipRow>
      <View
        testID="lighting-canvas"
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        style={{ width: "100%", aspectRatio: 4 / 3, maxHeight: 620, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
      >
        {locPhoto ? <RemoteImage path={locPhoto} style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.25 }} /> : null}
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={`v${i}`} pointerEvents="none" style={{ position: "absolute", left: `${(i * 100) / 6}%`, top: 0, bottom: 0, width: 1, backgroundColor: colors.divider }} />
        ))}
        {[1, 2, 3].map((i) => (
          <View key={`h${i}`} pointerEvents="none" style={{ position: "absolute", top: `${i * 25}%`, left: 0, right: 0, height: 1, backgroundColor: colors.divider }} />
        ))}
        {size.w > 0 && els.map((e) => <Node key={e.id} el={e} size={size} selected={sel === e.id} onSelect={selFn(e.id)} onMove={moveFn(e.id)} />)}
        {!els.length && (
          <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={s.muted}>Tocca un elemento sopra per aggiungerlo, poi trascinalo</Text>
          </View>
        )}
      </View>
      {selected && (
        <View testID="light-selected-panel" style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end", flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Field testID="light-label-input" label={`Etichetta · ${kindOf(selected.kind).l}`} value={selected.label} onChangeText={(t) => patch({ label: t })} placeholder="es. Aputure 600d, 5600K" />
          </View>
          <Button testID="light-rotate-button" icon="rotate-right" variant="secondary" onPress={() => patch({ rot: (selected.rot + 45) % 360 })} />
          <Button testID="light-delete-button" icon="trash-can-outline" variant="secondary" onPress={() => (setEls((a) => a.filter((e) => e.id !== sel)), setSel(null))} />
          <Button testID="light-deselect-button" icon="check" variant="secondary" onPress={() => setSel(null)} />
          {gear.length > 0 && (
            <View style={{ width: "100%" }}>
              <ChipRow>
                {gear.map((g) => lookup.get(g)).filter(Boolean).map((g) => (
                  <Chip key={g!.id} testID={`light-gear-${g!.id}`} icon="lightbulb-outline" label={g!.title} selected={selected.label === g!.title} onPress={() => patch({ label: g!.title })} />
                ))}
              </ChipRow>
            </View>
          )}
        </View>
      )}
      <Field testID="lighting-note-input" label="Note (temperatura, intensità, gel...)" value={note} onChangeText={setNote} multiline minHeight={90} />
      <Button testID="lighting-save-button" icon="check" label="Salva diagramma" loading={m.update.isPending} onPress={() => m.update.mutate({ id: diagram.id, data: { elements: els, note, location: loc, scene: scenes, attrezzatura: gear } }, { onSuccess: () => toast("Diagramma salvato") })} />
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
