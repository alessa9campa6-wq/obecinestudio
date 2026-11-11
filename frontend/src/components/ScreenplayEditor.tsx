import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
import { RefInput } from "@/src/components/ItemEditor";
import { useInvalidateProject, useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, screenplayHtml, wrap } from "@/src/pdf";
import { syncScreenplay } from "@/src/sync";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

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

// Un filetto colorato a sinistra dice che tipo di blocco stai guardando.
function bordo(t: ElType, colori: { brandPrimary: string; brandSecondary: string; border: string; muted: string }) {
  switch (t) {
    case "scene":
      return "rgba(212,175,55,0.55)";
    case "character":
      return "rgba(230,208,163,0.55)";
    case "dialogue":
      return "transparent";
    case "transition":
      return colori.muted;
    default:
      return colori.border;
  }
}

function MiniStat({ icon, valore, etichetta }: { icon: IconName; valore: string | number; etichetta: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 1, minWidth: 54 }}>
      <Icon name={icon} size={15} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.display, fontSize: 17, color: colors.onSurface }} numberOfLines={1}>
        {valore}
      </Text>
      <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 0.7, textTransform: "uppercase", fontWeight: "700", color: colors.muted }} numberOfLines={1}>
        {etichetta}
      </Text>
    </View>
  );
}

function Editor({ script, onSave }: { script: Item; onSave: (els: El[]) => void }) {
  const { project } = useHub();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [els, setEls] = useState<El[]>(() => (script.data.elements?.length ? script.data.elements : [{ id: uid(), type: "scene", text: "" }]));
  const [focused, setFocused] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [indice, setIndice] = useState(false);
  const [sporco, setSporco] = useState(false);
  const refs = useRef<Record<string, { focus: () => void } | null>>({});
  const pos = useRef<Record<string, number>>({});
  const paperY = useRef<number | null>(null);
  const scroll = useRef<ScrollView | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSporco(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(els);
      setSporco(false);
    }, 1200);
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
    const i = id ? els.findIndex((e) => e.id === id) : els.length - 1;
    const cur = els[i];
    const n: El = { id: uid(), type: type ?? (cur ? NEXT[cur.type] : "scene"), text: "" };
    const next = [...els];
    next.splice(i + 1, 0, n);
    setEls(next);
    setPending(n.id);
  };
  const setText = (id: string, text: string) => setEls((a) => a.map((e) => (e.id === id ? { ...e, text: UPPER.includes(e.type) ? text.toUpperCase() : text } : e)));
  const setType = (t: ElType) => {
    if (!focused) return insertAfter(null, t);
    setEls((a) => a.map((e) => (e.id === focused ? { ...e, type: t, text: UPPER.includes(t) ? e.text.toUpperCase() : e.text } : e)));
  };
  const removeIfEmpty = (id: string) => {
    const i = els.findIndex((e) => e.id === id);
    if (els.length <= 1 || els[i].text) return;
    setEls(els.filter((e) => e.id !== id));
    setPending(els[Math.max(0, i - 1)].id);
  };
  const vaiA = (id: string) => {
    setIndice(false);
    const y = pos.current[id];
    const base = paperY.current;
    if (y != null && base != null) setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, base + y - 24), animated: true }), 120);
  };

  const focusedType = els.find((e) => e.id === focused)?.type;
  const scene = els.filter((e) => e.type === "scene" && e.text);
  const voci = Array.from(new Set(els.filter((e) => e.type === "character" && e.text).map((e) => e.text.trim()))).filter(Boolean);
  const pagine = Math.max(1, Math.round(els.reduce((a, e) => a + Math.ceil((e.text.length || 1) / 60) + 1, 0) / 55));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + 190 }}>
        <View style={{ width: "100%", maxWidth: 720 }}>
          <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
            <MiniStat icon="movie-open-outline" valore={scene.length} etichetta="scene" />
            <View style={{ width: 1, height: 26, backgroundColor: colors.divider }} />
            <MiniStat icon="file-document-outline" valore={`~${pagine}`} etichetta="pagine" />
            <View style={{ width: 1, height: 26, backgroundColor: colors.divider }} />
            <MiniStat icon="account-voice" valore={voci.length} etichetta="voci" />
            <View style={{ flex: 1 }} />
            <Button testID="screenplay-scenes" icon="format-list-bulleted" label={width > 760 ? "Scene" : undefined} variant="secondary" small onPress={() => setIndice(true)} />
          </Glass>
        </View>

        <View
          testID="screenplay-paper"
          onLayout={(e) => (paperY.current = e.nativeEvent.layout.y)}
          style={{
            width: "100%",
            maxWidth: 720,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.divider,
            paddingHorizontal: "9%",
            paddingTop: spacing.xl,
            paddingBottom: spacing.xxl,
            shadowColor: "#000",
            shadowOpacity: 0.16,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.muted, flex: 1 }} numberOfLines={1}>
              {project.title}
            </Text>
            <Text style={{ fontFamily: fonts.script, fontSize: 11, color: colors.muted }}>{script.title}</Text>
            {sporco ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary }} /> : null}
          </View>

          {els.map((e, i) => (
            <TextInput
              key={e.id}
              testID={`screenplay-el-${i}`}
              ref={(r) => {
                refs.current[e.id] = r as unknown as { focus: () => void } | null;
              }}
              onLayout={(ev) => {
                pos.current[e.id] = ev.nativeEvent.layout.y;
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
              style={[
                {
                  fontFamily: fonts.script,
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.onSurface,
                  paddingVertical: 2,
                  borderLeftWidth: 2,
                  borderLeftColor: focused === e.id ? colors.brandPrimary : bordo(e.type, colors),
                  paddingLeft: spacing.xs,
                },
                elStyle(e.type),
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.sm }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs }}>
          <ChipRow>
            {TYPES.map((t) => (
              <Chip key={t.k} testID={`screenplay-type-${t.k}`} label={t.l} selected={focusedType === t.k} onPress={() => setType(t.k)} />
            ))}
          </ChipRow>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text testID="screenplay-stats" style={[s.muted, { flex: 1, fontSize: 11.5 }]}>
              {scene.length} scene · ~{pagine} pag. · {sporco ? "Salvataggio..." : "Salvato"}
            </Text>
            <Text style={[s.muted, { fontSize: 11 }]} numberOfLines={1}>
              Invio = nuovo blocco
            </Text>
          </View>
        </Glass>
      </View>

      <Sheet testID="screenplay-scenes-sheet" visible={indice} onClose={() => setIndice(false)} title="Vai a una scena">
        {scene.length ? (
          scene.map((sc, i) => (
            <Pressable
              key={sc.id}
              testID={`screenplay-scene-${i}`}
              onPress={() => vaiA(sc.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: spacing.sm,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.divider,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ width: 26, fontFamily: fonts.script, fontSize: 12, color: colors.brandPrimary }}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={{ flex: 1, fontFamily: fonts.script, fontSize: 13.5, color: colors.onSurface }} numberOfLines={1}>
                {sc.text || "Scena senza titolo"}
              </Text>
              <Icon name="arrow-right" size={15} color={colors.muted} />
            </Pressable>
          ))
        ) : (
          <Text style={s.muted}>Ancora nessuna scena: scrivi il titolo della prima e la trovi qui.</Text>
        )}
      </Sheet>
    </View>
  );
}

export default function ScreenplayEditor({ def }: { def: ModuleDef }) {
  const { project, go } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
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
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
          <ChipRow>
            {scripts.map((x) => (
              <Chip key={x.id} testID={`screenplay-version-${x.id}`} label={x.title} selected={current?.id === x.id} onPress={() => setSel(x.id)} />
            ))}
          </ChipRow>
        </View>
      )}
      {current && (project.type === "Serie TV" || project.type === "Social") && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
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
    </View>
  );
}
