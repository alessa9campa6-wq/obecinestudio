import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
import { useAuth } from "@/src/auth";
import { FormatsTool, LensCalculator } from "@/src/components/CalcTools";
import ChatPanel from "@/src/components/ChatPanel";
import BranoModule from "@/src/components/BranoModule";
import DocModule from "@/src/components/DocModule";
import EquipmentLibrary from "@/src/components/EquipmentLibrary";
import PianoModule from "@/src/components/PianoModule";
import FloatingChatButton from "@/src/components/FloatingChatButton";
import { ChatProvider } from "@/src/context/ChatContext";
import PeopleLibrary from "@/src/components/PeopleLibrary";
import LightingDiagram from "@/src/components/LightingDiagram";
import ListModule from "@/src/components/ListModule";
import Overview from "@/src/components/Overview";
import ScreenplayEditor from "@/src/components/ScreenplayEditor";
import Slate from "@/src/components/Slate";
import Storyboard from "@/src/components/Storyboard";
import TimeTracker from "@/src/components/TimeTracker";
import Viewfinder from "@/src/components/Viewfinder";
import WeatherSun from "@/src/components/WeatherSun";
import { useAllItems, useProject, useSummary } from "@/src/hooks";
import { HubContext, ROLE_LABELS } from "@/src/hub";
import { COUNT_KEY, ModuleDef, MODULES, PHASES, PROFILES } from "@/src/modules";
import { exportProject } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Icon, toast, useStyles } from "@/src/ui";

function ModuleView({ def }: { def: ModuleDef }) {
  switch (def.kind) {
    case "overview":
      return <Overview />;
    case "list":
      return <ListModule key={def.key} def={def} />;
    case "doc":
      return <DocModule key={def.key} def={def} />;
    case "equipment":
      return <EquipmentLibrary def={def} />;
    case "brano":
      return <BranoModule def={def} />;
    case "piano":
      return <PianoModule def={def} />;
    case "people":
      return <PeopleLibrary def={def} />;
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
  }
}

export default function ProjectHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<string | null>(wide ? "overview" : null);
  const [exporting, setExporting] = useState(false);
  const [showAll, setShowAll] = useState(false);
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
  const qc = useQueryClient();
  const allItems = useAllItems(id);

useEffect(() => {
  if (!allItems.data) return;
  const byModule = new Map<string, Item[]>();
  for (const it of allItems.data) {
    const list = byModule.get(it.module) ?? [];
    list.push(it);
    byModule.set(it.module, list);
  }
  for (const [mod, list] of byModule) {
    qc.setQueryData(["items", id, mod], list);
  }
}, [allItems.data, id, qc]);

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
  const role = p.data.my_role ?? "owner";
  const canEdit = role !== "viewer";
  const canManage = role === "owner" || role === "admin";
  const modVisible = (m: ModuleDef) => !m.types || m.types.includes(p.data!.type) || (p.data!.modules ?? []).includes(m.key) || (summary.data?.[m.key] ?? 0) > 0;
  const hidden = canEdit ? MODULES.filter((m) => !modVisible(m)) : [];
  const profile = PROFILES.find((x) => x.key === (user?.view_mode ?? "filmmaker"));
  const featured = (profile?.featured ?? []).map((k) => MODULES.find((m) => m.key === k)!).filter((m) => m && modVisible(m));
  const compact = !!profile?.compact && !showAll && featured.length > 0;
  const enableModule = async (key: string) => {
    try {
      await api(`/projects/${id}`, { method: "PUT", body: { ...p.data, modules: [...(p.data!.modules ?? []), key] } });
      await p.refetch();
      setActive(key);
    } catch (e: any) {
      toast(e.message, "error");
    }
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
        {role !== "owner" && (
          <View testID="my-access-banner" style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Icon name={canEdit ? "account-edit-outline" : "eye-outline"} size={16} color={colors.brandPrimary} />
            <Text style={[s.muted, { fontSize: 12 }]}>Progetto condiviso · {ROLE_LABELS[role]}</Text>
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.sm, paddingBottom: insets.bottom + spacing.lg }}>
        {featured.length > 0 && (
          <View testID="featured-modules" style={{ marginBottom: spacing.sm }}>
            <Text style={[s.label, { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs, color: colors.brandPrimary }]}>In evidenza · {profile?.label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingHorizontal: spacing.sm }}>
              {featured.map((m) => (
                <Chip key={m.key} testID={`featured-${m.key}`} icon={m.icon} label={m.label} selected={current === m.key} onPress={() => setActive(m.key)} />
              ))}
            </View>
            {profile?.compact && (
              <Pressable testID="toggle-all-modules" onPress={() => setShowAll(!showAll)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md }}>
                <Text style={[s.muted, { color: colors.brandPrimary }]}>{showAll ? "Mostra solo la vista essenziale" : "Mostra tutti gli strumenti"}</Text>
              </Pressable>
            )}
          </View>
        )}
        {!compact && PHASES.map((ph) => (
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
        {!compact && hidden.length > 0 && (
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
    <HubContext.Provider value={{ project: p.data, back: wide ? null : () => setActive(null), go, focus, clearFocus, canEdit, canManage }}>
      <ChatProvider projectId={p.data.id}>
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.surface }}>
          {(wide || !def) && sidebar}
          {def && (
            <View testID={`module-view-${def.key}`} style={{ flex: 1 }}>
              <ModuleView def={def} />
            </View>
          )}
          {canEdit && (
            <>
              <ChatPanel />
              <FloatingChatButton />
            </>
          )}
        </View>
      </ChatProvider>
    </HubContext.Provider>
  );
}
