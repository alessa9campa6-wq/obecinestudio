import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
import { RefInput } from "@/src/components/ItemEditor";
import { useInvalidateProject, useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, screenplayHtml, wrap } from "@/src/pdf";
import { syncScreenplay } from "@/src/sync";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, toast, useStyles } from "@/src/ui";

type ElType = "scene" | "action" | "character" | "parenthetical" | "dialogue" | "transition";
type El = { id: string; type: ElType; text: string };

const TYPES: { k: ElType; l: string }[] = [
  { k: "scene", l: "Scena" },
  { k: "action", l: "Azione" },
  { k: "character", l: "Personaggio" },
  { k: "parenthetical", l: "Parentetica" },
  { k: "dialogue", l: "Dialogo" },
  { k: "transition", l: "Transizione" },
];
const NEXT: Record<ElType, ElType> = { scene: "action", action: "action", character: "dialogue", parenthetical: "dialogue", dialogue: "character", transition: "scene" };
const UPPER: ElType[] = ["scene", "character", "transition"];
const PH: Record<ElType, string> = { scene: "INT. LUOGO - GIORNO", action: "Descrivi l'azione...", character: "NOME", parenthetical: "(sottovoce)", dialogue: "Battuta...", transition: "STACCO SU:" };
const uid = () => Math.random().toString(36).slice(2, 10);

function elStyle(t: ElType) {
  switch (t) {
    case "scene":
      return { fontWeight: "700" as const, marginTop: spacing.lg };
    case "character":
      return { marginLeft: "37%" as const, marginTop: spacing.md };
    case "parenthetical":
      return { marginLeft: "28%" as const, marginRight: "28%" as const };
    case "dialogue":
      return { marginLeft: "17%" as const, marginRight: "17%" as const };
    case "transition":
      return { textAlign: "right" as const, marginTop: spacing.md };
    default:
      return { marginTop: spacing.sm };
  }
}

function Editor({ script, onSave }: { script: Item; onSave: (els: El[]) => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [els, setEls] = useState<El[]>(() => (script.data.elements?.length ? script.data.elements : [{ id: uid(), type: "scene", text: "" }]));
  const [focused, setFocused] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const refs = useRef<Record<string, { focus: () => void } | null>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(els), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [els]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pending) {
      refs.current[pending]?.focus();
      setPending(null);
    }
  }, [pending, els]);

  const insertAfter = (id: string | null, type?: ElType) => {
    const idx = id ? els.findIndex((e) => e.id === id) : els.length - 1;
    const cur = els[idx];
    const n: El = { id: uid(), type: type ?? (cur ? NEXT[cur.type] : "scene"), text: "" };
    const next = [...els];
    next.splice(idx + 1, 0, n);
    setEls(next);
    setPending(n.id);
  };
  const setText = (id: string, text: string) => setEls((a) => a.map((e) => (e.id === id ? { ...e, text: UPPER.includes(e.type) ? text.toUpperCase() : text } : e)));
  const setType = (t: ElType) => {
    if (!focused) return insertAfter(null, t);
    setEls((a) => a.map((e) => (e.id === focused ? { ...e, type: t, text: UPPER.includes(t) ? e.text.toUpperCase() : e.text } : e)));
  };
  const removeIfEmpty = (id: string) => {
    const idx = els.findIndex((e) => e.id === id);
    if (els.length <= 1 || els[idx].text) return;
    setEls(els.filter((e) => e.id !== id));
    setPending(els[Math.max(0, idx - 1)].id);
  };

  const focusedType = els.find((e) => e.id === focused)?.type;
  const scenes = els.filter((e) => e.type === "scene" && e.text).length;
  const pages = Math.max(1, Math.round(els.reduce((a, e) => a + Math.ceil((e.text.length || 1) / 60) + 1, 0) / 55));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: 140 }}>
        <View testID="screenplay-paper" style={{ width: "100%", maxWidth: 720, backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: "8%", paddingVertical: spacing.xxl }}>
          {els.map((e, i) => (
            <TextInput
              key={e.id}
              testID={`screenplay-el-${i}`}
              ref={(r) => {
                refs.current[e.id] = r as unknown as { focus: () => void } | null;
              }}
              value={e.text}
              onChangeText={(t) => setText(e.id, t)}
              onFocus={() => setFocused(e.id)}
              multiline
              scrollEnabled={false}
              submitBehavior="submit"
              onSubmitEditing={() => insertAfter(e.id)}
              onKeyPress={(ev) => {
                const k = ev.nativeEvent.key;
                if (k === "Backspace") removeIfEmpty(e.id);
                if (Platform.OS === "web" && k === "Enter" && !(ev.nativeEvent as any).shiftKey) {
                  ev.preventDefault();
                  insertAfter(e.id);
                }
              }}
              placeholder={PH[e.type]}
              placeholderTextColor={colors.muted}
              style={[{ fontFamily: fonts.script, fontSize: 16, lineHeight: 22, color: colors.onSurface, paddingVertical: 2, borderLeftWidth: 2, borderLeftColor: focused === e.id ? colors.brandPrimary : "transparent", paddingLeft: spacing.xs }, elStyle(e.type)]}
            />
          ))}
        </View>
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.sm, gap: spacing.xs }}>
        <ChipRow>
          {TYPES.map((t) => (
            <Chip key={t.k} testID={`screenplay-type-${t.k}`} label={t.l} selected={focusedType === t.k} onPress={() => setType(t.k)} />
          ))}
        </ChipRow>
        <Text testID="screenplay-stats" style={{ fontFamily: fonts.text, fontSize: 12, color: colors.muted }}>
          {scenes} scene · ~{pages} pag. · Invio = nuovo blocco · Salvataggio automatico
        </Text>
      </View>
    </View>
  );
}

export default function ScreenplayEditor({ def }: { def: ModuleDef }) {
  const { project, go } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const [sel, setSel] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const invalidate = useInvalidateProject(project.id);
  const { width } = useWindowDimensions();
  const scripts = useMemo(() => q.data ?? [], [q.data]);
  const current = scripts.find((x) => x.id === sel) ?? scripts[scripts.length - 1];

  const newVersion = () =>
    m.create.mutate(
      { title: `Versione ${scripts.length + 1}`, data: { elements: current?.data.elements ?? [] } },
      { onSuccess: (it) => (setSel(it.id), toast("Nuova versione creata")) },
    );

  const doSync = async () => {
    if (!current) return;
    setSyncing(true);
    try {
      const fresh = await api<Item[]>(`/projects/${project.id}/items`);
      const script = fresh.find((x) => x.id === current.id) ?? current;
      const r = await syncScreenplay(project.id, script.data.elements ?? [], fresh);
      invalidate();
      toast(`${r.total} scene sincronizzate · nuove: ${r.scene} scene, ${r.location} location, ${r.personaggi} personaggi`);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={current ? `${current.title} · formato standard` : "Formato standard"}
        right={
          <>
            <Button testID="screenplay-sync-scenes" icon="sync" label={width > 900 ? "Sincronizza scene" : undefined} variant="secondary" disabled={!current} loading={syncing} onPress={doSync} />
            <Button testID="screenplay-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!current} onPress={() => current && exportHtml(project.title, wrap(project.title, screenplayHtml(current), `Sceneggiatura · ${current.title}`))} />
            <Button testID="screenplay-new-version" icon="source-branch-plus" variant="secondary" onPress={newVersion} loading={m.create.isPending} />
          </>
        }
      />
      {scripts.length > 1 && (
        <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <ChipRow>
            {scripts.map((x) => (
              <Chip key={x.id} testID={`screenplay-version-${x.id}`} label={x.title} selected={current?.id === x.id} onPress={() => setSel(x.id)} />
            ))}
          </ChipRow>
        </View>
      )}
      {current && (project.type === "Serie TV" || project.type === "Social") && (
        <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <RefInput
            f={project.type === "Serie TV" ? { key: "parte", label: "Episodio di questa versione", type: "ref", ref: "episodi" } : { key: "parte", label: "Contenuto social di questo script", type: "ref", ref: "contenuti" }}
            value={current.data.parte}
            onChange={(v) => m.update.mutate({ id: current.id, data: { ...current.data, parte: v } })}
            onGo={(mm) => go(mm)}
          />
        </View>
      )}
      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : current ? (
        <Editor key={current.id} script={current} onSave={(els) => m.update.mutate({ id: current.id, data: { ...current.data, elements: els } })} />
      ) : (
        <Empty
          icon="script-text-outline"
          title="Inizia la tua sceneggiatura"
          subtitle="Scena, azione, personaggio, dialogo: il formato standard è già impostato."
          action={<Button testID="screenplay-create" icon="plus" label="Crea sceneggiatura" onPress={() => m.create.mutate({ title: "Versione 1", data: { elements: [] } })} />}
        />
      )}
      {m.update.isPending ? <Text style={[s.muted, { position: "absolute", top: 8, right: 16 }]}>Salvataggio...</Text> : null}
    </View>
  );
}
