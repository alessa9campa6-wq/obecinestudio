import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
import { FormatsTool, FrameGuides, LensCalculator } from "@/src/components/CalcTools";
import DocModule from "@/src/components/DocModule";
import LensLibrary from "@/src/components/LensLibrary";
import LightingDiagram from "@/src/components/LightingDiagram";
import ListModule from "@/src/components/ListModule";
import Overview from "@/src/components/Overview";
import ScreenplayEditor from "@/src/components/ScreenplayEditor";
import Slate from "@/src/components/Slate";
import Storyboard from "@/src/components/Storyboard";
import TimeTracker from "@/src/components/TimeTracker";
import Viewfinder from "@/src/components/Viewfinder";
import WeatherSun from "@/src/components/WeatherSun";
import { useProject, useSummary } from "@/src/hooks";
import { HubContext } from "@/src/hub";
import { COUNT_KEY, ModuleDef, MODULES, PHASES } from "@/src/modules";
import { exportProject } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Icon, useStyles } from "@/src/ui";

function ModuleView({ def }: { def: ModuleDef }) {
  switch (def.kind) {
    case "overview":
      return <Overview />;
    case "list":
      return <ListModule key={def.key} def={def} />;
    case "doc":
      return <DocModule key={def.key} def={def} />;
    case "lenses":
      return <LensLibrary def={def} />;
    case "viewfinder":
      return <Viewfinder def={def} />;
    case "screenplay":
      return <ScreenplayEditor def={def} />;
    case "storyboard":
      return <Storyboard def={def} />;
    case "lighting":
      return <LightingDiagram def={def} />;
    case "slate":
      return <Slate def={def} />;
    case "time":
      return <TimeTracker def={def} />;
    case "weather":
      return <WeatherSun def={def} />;
    case "lens":
      return <LensCalculator def={def} />;
    case "formats":
      return <FormatsTool def={def} />;
    case "guides":
      return <FrameGuides def={def} />;
  }
}

export default function ProjectHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<string | null>(wide ? "overview" : null);
  const [exporting, setExporting] = useState(false);
  const [focus, setFocus] = useState<{ module: string; id: string } | null>(null);
  const go = useCallback((module: string, itemId?: string) => {
    setActive(module);
    setFocus(itemId ? { module, id: itemId } : null);
  }, []);
  const clearFocus = useCallback(() => setFocus(null), []);
  const p = useProject(id);
  const summary = useSummary(id);
  const goHome = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const all = useQuery({ queryKey: ["items", id, "__all"], queryFn: () => api<Item[]>(`/projects/${id}/items`), enabled: false });

  if (p.isLoading)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  if (!p.data)
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.surface }}>
        <Empty icon="alert-circle-outline" title="Progetto non trovato" action={<Button label="Torna ai progetti" onPress={goHome} />} />
      </View>
    );

  const doExport = async () => {
    setExporting(true);
    const r = await all.refetch();
    if (r.data) await exportProject(p.data!, r.data);
    setExporting(false);
  };

  const current = active ?? (wide ? "overview" : null);
  const modVisible = (m: ModuleDef) => !m.types || m.types.includes(p.data!.type) || (p.data!.modules ?? []).includes(m.key) || (summary.data?.[m.key] ?? 0) > 0;
  const hidden = MODULES.filter((m) => !modVisible(m));
  const enableModule = async (key: string) => {
    await api(`/projects/${id}`, { method: "PUT", body: { ...p.data, modules: [...(p.data!.modules ?? []), key] } });
    await p.refetch();
    setActive(key);
  };
  const sidebar = (
    <View testID="project-sidebar" style={{ width: wide ? 300 : "100%", flex: wide ? undefined : 1, backgroundColor: colors.sidebar, borderRightWidth: wide ? 1 : 0, borderRightColor: colors.border }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Button testID="back-to-projects-button" icon="chevron-left" variant="secondary" small onPress={goHome} />
          <Text style={[s.label, { flex: 1, color: colors.brandPrimary }]} numberOfLines={1}>
            {p.data.type}
          </Text>
          <Button testID="export-project-pdf-button" icon="file-pdf-box" label="Dossier" small variant="secondary" loading={exporting} onPress={doExport} />
        </View>
        <Text testID="project-title" style={[s.h2, { fontSize: 22 }]} numberOfLines={2}>
          {p.data.title}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.sm, paddingBottom: insets.bottom + spacing.lg }}>
        {PHASES.map((ph) => (
          <View key={ph.key} style={{ marginBottom: spacing.sm }}>
            <Text style={[s.label, { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs }]}>{ph.label}</Text>
            {MODULES.filter((m) => m.phase === ph.key && modVisible(m)).map((m) => {
              const sel = current === m.key;
              const n = summary.data?.[COUNT_KEY(m.key)];
              return (
                <Pressable
                  key={m.key}
                  testID={`module-nav-${m.key}`}
                  onPress={() => setActive(m.key)}
                  style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: sel ? colors.brandTertiary : pressed ? colors.surfaceTertiary : "transparent" })}
                >
                  <Icon name={m.icon} size={20} color={sel ? colors.onBrandTertiary : colors.onSurfaceTertiary} />
                  <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 15, color: sel ? colors.onBrandTertiary : colors.onSurface, fontWeight: sel ? "600" : "400" }}>{m.label}</Text>
                  {n ? <Text style={[s.muted, { fontSize: 12 }]}>{n}</Text> : null}
                  {!wide && <Icon name="chevron-right" size={18} color={colors.muted} />}
                </Pressable>
              );
            })}
          </View>
        ))}
        {hidden.length > 0 && (
          <View testID="extra-modules" style={{ padding: spacing.md, gap: spacing.sm }}>
            <Text style={s.label}>Aggiungi moduli da altri tipi di progetto</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {hidden.map((m) => (
                <Chip key={m.key} testID={`enable-module-${m.key}`} icon="plus" label={m.label} onPress={() => enableModule(m.key)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const def = current ? MODULES.find((m) => m.key === current) : null;
  return (
    <HubContext.Provider value={{ project: p.data, back: wide ? null : () => setActive(null), go, focus, clearFocus }}>
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.surface }}>
        {(wide || !def) && sidebar}
        {def && (
          <View testID={`module-view-${def.key}`} style={{ flex: 1 }}>
            <ModuleView def={def} />
          </View>
        )}
      </View>
    </HubContext.Provider>
  );
}
