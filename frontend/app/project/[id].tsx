import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Item } from "@/src/api";
import { useAuth } from "@/src/auth";
import { FormatsTool, LensCalculator } from "@/src/components/CalcTools";
import ChatPanel from "@/src/components/ChatPanel";
import BranoModule from "@/src/components/BranoModule";
import DocModule from "@/src/components/DocModule";
import SoggettoModule from "@/src/components/SoggettoModule";
import TrattamentoModule from "@/src/components/TrattamentoModule";
import EquipmentLibrary from "@/src/components/EquipmentLibrary";
import PianoModule from "@/src/components/PianoModule";
import PersonaggiModule from "@/src/components/PersonaggiModule";
import NoteModule from "@/src/components/NoteModule";
import SceneModule from "@/src/components/SceneModule";
import ShotlistModule from "@/src/components/ShotlistModule";
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
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

function ModuleView({ def }: { def: ModuleDef }) {
  switch (def.kind) {
    case "overview":
      return <Overview />;
    case "list":
      if (def.key === "personaggi") return <PersonaggiModule key={def.key} def={def} />;
      if (def.key === "note") return <NoteModule key={def.key} def={def} />;
      if (def.key === "scene") return <SceneModule key={def.key} def={def} />;
      if (def.key === "shotlist") return <ShotlistModule key={def.key} def={def} />;
      return <ListModule key={def.key} def={def} />;
    case "doc":
      if (def.key === "soggetto") return <SoggettoModule key={def.key} def={def} />;
      if (def.key === "trattamento") return <TrattamentoModule key={def.key} def={def} />;
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
      return <Viewfinder />;
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

// Scheda di una sezione: vetro, filigrana dell'icona e alone dorato quando la
// sezione ha già qualcosa dentro.
function SezioneCard({ def, count, larghezza, onPress }: { def: ModuleDef; count: number; larghezza: number; onPress: () => void }) {
  const { colors } = useTheme();
  const piena = count > 0;
  return (
    <Pressable testID={`module-nav-${def.key}`} onPress={onPress} style={({ pressed }) => ({ width: larghezza, transform: [{ scale: pressed ? 0.975 : 1 }] })}>
      <View
        style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: piena ? "rgba(212,175,55,0.5)" : colors.divider,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOpacity: piena ? 0.26 : 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        }}
      >
        <Glass style={{ minHeight: 148, padding: spacing.lg, justifyContent: "space-between", borderRadius: 22 }} tint={piena ? colors.brandTertiary : undefined}>
          <LinearGradient
            colors={piena ? ["rgba(212,175,55,0.22)", "rgba(212,175,55,0)"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
          <View style={{ position: "absolute", right: -10, bottom: -12, opacity: piena ? 0.13 : 0.06 }} pointerEvents="none">
            <Icon name={def.icon} size={84} color={piena ? colors.brandPrimary : colors.onSurface} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: piena ? "rgba(212,175,55,0.55)" : colors.divider,
                backgroundColor: piena ? "rgba(212,175,55,0.16)" : "transparent",
              }}
            >
              <Icon name={def.icon} size={18} color={piena ? colors.brandPrimary : colors.onSurfaceTertiary} />
            </View>
            <View style={{ flex: 1 }} />
            {piena ? (
              <View style={{ minWidth: 25, height: 25, paddingHorizontal: 7, borderRadius: 13, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "800", color: colors.onBrandPrimary }}>{count}</Text>
              </View>
            ) : (
              <Icon name="arrow-top-right" size={17} color={colors.muted} />
            )}
          </View>
          <View style={{ gap: 3 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, fontWeight: "600", color: piena ? colors.onSurface : colors.onSurfaceSecondary }} numberOfLines={2}>
              {def.label}
            </Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: piena ? colors.brandPrimary : colors.muted }} numberOfLines={1}>
              {piena ? (count === 1 ? "1 elemento dentro" : `${count} elementi dentro`) : "Ancora da iniziare"}
            </Text>
          </View>
        </Glass>
      </View>
    </Pressable>
  );
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

  // Avanzamento: quante sezioni hanno già qualcosa dentro.
  const sezioni = MODULES.filter((m) => m.kind !== "overview" && modVisible(m));
  const piene = sezioni.filter((m) => (summary.data?.[COUNT_KEY(m.key)] ?? 0) > 0).length;

  const cover = p.data.cover_path ? fileUrl(p.data.cover_path) : null;
  const testoSup = cover ? "#FFFFFF" : colors.onSurface;
  const testoTenue = cover ? "rgba(255,255,255,0.78)" : colors.muted;

  const enableModule = async (key: string) => {
    try {
      await api(`/projects/${id}`, { method: "PUT", body: { ...p.data, modules: [...(p.data!.modules ?? []), key] } });
      await p.refetch();
      setActive(key);
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const pillIcona = (name: IconName, onPress: () => void, testID: string, label: string) => (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      <Glass
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: cover ? "rgba(255,255,255,0.3)" : colors.divider,
        }}
      >
        <Icon name={name} size={19} color={testoSup} />
      </Glass>
    </Pressable>
  );

  const progresso = sezioni.length ? piene / sezioni.length : 0;
  const cols = width >= 640 ? 3 : 2;

  const hero = (big: boolean) => (
    <View
      style={{
        overflow: "hidden",
        borderRadius: big ? 0 : 26,
        backgroundColor: cover ? colors.surfaceTertiary : colors.surfaceSecondary,
      }}
    >
      {cover ? <Image source={{ uri: cover }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" transition={200} /> : null}
      <LinearGradient
        colors={cover ? ["rgba(8,8,9,0.25)", "rgba(8,8,9,0.72)", "rgba(8,8,9,0.95)"] : [colors.brandTertiary, colors.surfaceSecondary]}
        style={{ paddingTop: big ? insets.top + spacing.sm : spacing.md, paddingHorizontal: big ? spacing.lg : spacing.md, paddingBottom: spacing.lg, gap: spacing.sm }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {pillIcona("chevron-left", goHome, "back-to-projects-button", "Torna ai progetti")}
          <View style={{ flex: 1 }} />
          <Pressable testID="export-project-pdf-button" accessibilityRole="button" accessibilityLabel="Esporta il dossier in PDF" onPress={doExport} disabled={exporting}>
            <Glass
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: spacing.md,
                borderRadius: 19,
                borderWidth: 1,
                borderColor: cover ? "rgba(255,255,255,0.3)" : colors.divider,
              }}
            >
              {exporting ? <ActivityIndicator size="small" color={testoSup} /> : <Icon name="file-pdf-box" size={17} color={testoSup} />}
              <Text style={{ color: testoSup, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700" }}>Dossier</Text>
            </Glass>
          </Pressable>
        </View>

        <View style={{ gap: spacing.xs, paddingTop: big ? spacing.lg : spacing.sm }}>
          <View style={{ alignSelf: "flex-start", backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
            <Text style={{ color: colors.onBrandPrimary, fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" }} numberOfLines={1}>
              {p.data.type}
              {p.data.client ? ` · ${p.data.client}` : ""}
            </Text>
          </View>
          <Text testID="project-title" style={{ fontFamily: fonts.display, fontSize: big ? 32 : 25, lineHeight: big ? 38 : 30, color: testoSup, fontWeight: "600" }} numberOfLines={2}>
            {p.data.title}
          </Text>
          {p.data.logline ? (
            <Text style={{ fontFamily: fonts.text, fontSize: 13.5, lineHeight: 19, color: testoTenue }} numberOfLines={big ? 3 : 2}>
              {p.data.logline}
            </Text>
          ) : null}
          {role !== "owner" ? (
            <View testID="my-access-banner" style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingTop: 2 }}>
              <Icon name={canEdit ? "account-edit-outline" : "eye-outline"} size={15} color={cover ? colors.brandSecondary : colors.brandPrimary} />
              <Text style={{ fontFamily: fonts.text, fontSize: 12, color: testoTenue }}>Progetto condiviso · {ROLE_LABELS[role]}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: 5, paddingTop: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: testoSup }}>
              {piene} di {sezioni.length} sezioni
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: testoTenue }}>{Math.round(progresso * 100)}%</Text>
          </View>
          <View style={{ height: 5, borderRadius: radius.pill, backgroundColor: cover ? "rgba(255,255,255,0.22)" : colors.surfaceTertiary, overflow: "hidden" }}>
            <View style={{ height: 5, width: `${Math.max(3, progresso * 100)}%`, borderRadius: radius.pill, backgroundColor: colors.brandPrimary }} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const nav = (
    <View style={{ gap: spacing.md }}>
      {featured.length > 0 && (
        <View testID="featured-modules" style={{ gap: spacing.xs }}>
          <Text style={[s.label, { color: colors.brandPrimary }]}>In evidenza · {profile?.label}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {featured.map((m) => (
              <Chip key={m.key} testID={`featured-${m.key}`} icon={m.icon} label={m.label} selected={current === m.key} onPress={() => setActive(m.key)} />
            ))}
          </View>
          {profile?.compact && (
            <Pressable testID="toggle-all-modules" onPress={() => setShowAll(!showAll)} style={{ minHeight: 44, justifyContent: "center" }}>
              <Text style={[s.muted, { color: colors.brandPrimary, fontWeight: "600" }]}>{showAll ? "Mostra solo la vista essenziale" : "Mostra tutti gli strumenti"}</Text>
            </Pressable>
          )}
        </View>
      )}

      {!compact &&
        PHASES.map((ph, i) => {
          const mods = MODULES.filter((m) => m.phase === ph.key && modVisible(m));
          if (!mods.length) return null;
          return (
            <View key={ph.key} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 14, color: colors.brandPrimary, width: 22 }}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={[s.label, { letterSpacing: 1.3 }]}>{ph.label}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
              </View>
              {wide ? (
                <View style={{ gap: 2 }}>
                  {mods.map((m) => {
                    const sel = current === m.key;
                    const n = summary.data?.[COUNT_KEY(m.key)] ?? 0;
                    return (
                      <Pressable
                        key={m.key}
                        testID={`module-nav-${m.key}`}
                        onPress={() => setActive(m.key)}
                        style={({ pressed }) => ({
                          minHeight: 44,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                          paddingRight: spacing.sm,
                          borderRadius: 14,
                          overflow: "hidden",
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        {sel ? (
                          <LinearGradient
                            colors={[colors.brandTertiary, "transparent"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                            pointerEvents="none"
                          />
                        ) : null}
                        <View style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: sel ? colors.brandPrimary : "transparent" }} />
                        <Icon name={m.icon} size={19} color={sel ? colors.brandPrimary : colors.onSurfaceTertiary} />
                        <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 14.5, color: colors.onSurface, fontWeight: sel ? "700" : "500" }} numberOfLines={1}>
                          {m.label}
                        </Text>
                        {n > 0 ? (
                          <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: sel ? colors.brandPrimary : colors.muted }}>{n}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                  {mods.map((m) => (
                    <SezioneCard
                      key={m.key}
                      def={m}
                      count={summary.data?.[COUNT_KEY(m.key)] ?? 0}
                      larghezza={(width - spacing.lg * 2 - spacing.md * (cols - 1)) / cols}
                      onPress={() => setActive(m.key)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

      {!compact && hidden.length > 0 && (
        <View testID="extra-modules" style={{ gap: spacing.sm }}>
          <Text style={s.label}>Aggiungi moduli da altri tipi di progetto</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {hidden.map((m) => (
              <Chip key={m.key} testID={`enable-module-${m.key}`} icon="plus" label={m.label} onPress={() => enableModule(m.key)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );


  const sidebar = wide ? (
    <View testID="project-sidebar" style={{ width: 348 }}>
      <Glass
        style={{
          flex: 1,
          margin: spacing.lg,
          marginRight: 0,
          borderRadius: 28,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.divider,
        }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }} showsVerticalScrollIndicator={false}>
          {hero(false)}
          {nav}
        </ScrollView>
      </Glass>
    </View>
  ) : (
    <View testID="project-sidebar" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        {hero(true)}
        <View style={{ padding: spacing.lg, gap: spacing.lg, paddingTop: spacing.lg }}>{nav}</View>
      </ScrollView>
    </View>
  );

  const def = current ? MODULES.find((m) => m.key === current) : null;
  return (
    <HubContext.Provider value={{ project: p.data, back: wide ? null : () => setActive(null), go, focus, clearFocus, canEdit, canManage }}>
      <ChatProvider projectId={p.data.id}>
        <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.surface }}>
          <LinearGradient colors={[colors.brandTertiary, "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300, opacity: 0.45 }} pointerEvents="none" />
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
