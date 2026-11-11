import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
import { SectionHero } from "@/src/components/SectionHero";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { docHtml, exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, useStyles } from "@/src/ui";

// A single living document per module (no titles): sections are written inline
// and saved automatically. The Soggetto logline stays in sync with the project.
function Paper({ def, doc }: { def: ModuleDef; doc: Item | null }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, def.key);
  const qc = useQueryClient();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Record<string, string>>(() => ({
    ...(def.key === "soggetto" && project.logline ? { logline: project.logline } : {}),
    ...(doc?.data.body && !doc?.data[def.sections!.slice(-1)[0].key] ? { [def.sections!.find((x) => x.long)!.key]: doc.data.body } : {}),
    ...(doc?.data ?? {}),
  }));
  const [saved, setSaved] = useState(true);
  const idRef = useRef<string | null>(doc?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const syncLogline = useMutation({
    mutationFn: (logline: string) => api(`/projects/${project.id}`, { method: "PUT", body: { ...project, logline } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", project.id] }),
  });

  const persist = async (next: Record<string, string>) => {
    if (idRef.current) await m.update.mutateAsync({ id: idRef.current, data: next });
    else idRef.current = (await m.create.mutateAsync({ title: def.label, data: next })).id;
    if (def.key === "soggetto" && next.logline !== undefined && next.logline !== project.logline) syncLogline.mutate(next.logline);
    setSaved(true);
  };
  const change = (k: string, v: string) => {
    const next = { ...data, [k]: v };
    setData(next);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(next), 1000);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  // L'assistente IA scrive sul server: quando arriva un documento aggiornato la pagina si riallinea.
  useEffect(() => {
    if (!doc || !saved) return;
    idRef.current = doc.id;
    setData((prev) => ({ ...prev, ...(doc.data ?? {}) }));
  }, [doc?.id, doc?.updated_at, saved]);

  const words = Object.values(data).join(" ").split(/\s+/).filter(Boolean).length;
  const groups = Array.from(new Set((def.sections ?? []).map((x) => x.group).filter(Boolean))) as string[];
  const sections = (def.sections ?? []).filter((x) => !group || x.group === group);
  let lastGroup = "";

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${words} parole · ${saved ? "Salvato" : "Salvataggio..."}`}
        right={<Button testID={`${def.key}-export-pdf`} icon="file-pdf-box" variant="secondary" onPress={() => exportHtml(def.label, wrap(`${def.label} · ${project.title}`, docHtml(def, { data } as unknown as Item), project.title))} />}
      />
      {groups.length > 0 && (
        <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <ChipRow>
            <Chip testID="doc-group-all" label="Tutto" selected={!group} onPress={() => setGroup(null)} />
            {groups.map((g) => (
              <Chip key={g} testID={`doc-group-${g}`} label={g} selected={group === g} onPress={() => setGroup(g)} />
            ))}
          </ChipRow>
        </View>
      )}
      <KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        <View style={{ width: "100%", maxWidth: 760 }}>
          <SectionHero icon={def.icon} eyebrow={def.label} pills={[{ icon: "text-box-outline", text: `${words} parole` }]} />
        </View>
        <View testID={`${def.key}-paper`} style={{ width: "100%", maxWidth: 760, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, gap: spacing.xl }}>
          {def.key === "soggetto" && (
            <Text style={[s.h1, { fontSize: 30 }]} numberOfLines={2}>
              {project.title}
            </Text>
          )}
          {sections.map((sec) => {
            const header = sec.group && sec.group !== lastGroup ? sec.group : null;
            if (sec.group) lastGroup = sec.group;
            return (
              <View key={sec.key} style={{ gap: spacing.xs }}>
                {header && <Text style={[s.h2, { color: colors.brandPrimary, marginTop: spacing.md }]}>{header}</Text>}
                <Text style={s.label}>{sec.label}</Text>
                <TextInput
                  testID={`doc-${sec.key}-input`}
                  value={data[sec.key] ?? ""}
                  onChangeText={(t) => change(sec.key, t)}
                  multiline
                  scrollEnabled={false}
                  placeholder={sec.hint ?? "Scrivi qui..."}
                  placeholderTextColor={colors.muted}
                  style={{ fontFamily: sec.long ? fonts.display : fonts.text, fontSize: sec.long ? 18 : 16, lineHeight: sec.long ? 30 : 24, color: colors.onSurface, minHeight: sec.long ? 180 : 44, textAlignVertical: "top", paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider }}
                />
              </View>
            );
          })}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export default function DocModule({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const q = useItems(project.id, def.key);
  const { colors } = useTheme();
  if (q.isLoading)
    return (
      <ScrollView>
        <ActivityIndicator style={{ marginTop: spacing.xxxl }} color={colors.brandPrimary} />
      </ScrollView>
    );
  return <Paper key={def.key} def={def} doc={q.data?.[0] ?? null} />;
}
