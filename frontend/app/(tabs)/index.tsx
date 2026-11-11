import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarCard } from "@/src/components/CalendarCard";
import PostComposer from "@/src/components/PostComposer";
import { TodayCard } from "@/src/components/TodayCard";

import { api, fileUrl, Item, Project } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ROLE_LABELS } from "@/src/hub";
import { PROFILES, PROJECT_TYPES } from "@/src/modules";
import { fonts, radius, setColorScheme, spacing, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { Button, Chip, Empty, Field, Glass, GlassButton, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

const PLACEHOLDER = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=80&w=900";

type Layout = "big" | "list" | "mini";

const ICONE_TIPO: Record<string, IconName> = {
  Film: "movie-open-outline",
  Cortometraggio: "filmstrip",
  "Serie TV": "television-classic",
  Videoclip: "music-note-outline",
  Social: "cellphone-play",
  Documentario: "video-vintage",
  Spot: "bullhorn-outline",
};

// Tre sole icone nel vetro: cambia vista senza mangiare mezza schermata.
function LayoutPicker({ value, onChange }: { value: Layout; onChange: (v: Layout) => void }) {
  const { colors } = useTheme();
  const voci: { v: Layout; icon: IconName; label: string }[] = [
    { v: "big", icon: "image-outline", label: "Copertine" },
    { v: "list", icon: "format-list-bulleted", label: "Elenco" },
    { v: "mini", icon: "view-grid-outline", label: "Mini" },
  ];
  return (
    <Glass testID="home-layout" style={{ flexDirection: "row", borderRadius: radius.pill, padding: 3 }} tint={colors.surfaceSecondary}>
      {voci.map((o) => (
        <Pressable
          key={o.v}
          testID={`home-layout-${o.v}`}
          accessibilityLabel={o.label}
          onPress={() => onChange(o.v)}
          style={{
            width: 36,
            height: 30,
            borderRadius: radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: value === o.v ? colors.brandPrimary : "transparent",
          }}
        >
          <Icon name={o.icon} size={16} color={value === o.v ? colors.onBrandPrimary : colors.muted} />
        </Pressable>
      ))}
    </Glass>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { colors, scheme } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const [layout, setLayout] = useState<Layout>("big");
  useEffect(() => {
    void storage.getItem<string>("home_layout", "big").then((v) => {
      if (v === "big" || v === "list" || v === "mini") setLayout(v);
    });
  }, []);
  const cambiaLayout = (v: Layout) => {
    setLayout(v);
    void storage.setItem("home_layout", v);
  };
  const cols =
    layout === "mini" ? (width >= 1100 ? 5 : width >= 700 ? 4 : 3) : layout === "list" ? 1 : width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const [filter, setFilter] = useState("Tutti");
  const [owner, setOwner] = useState<"all" | "mine" | "shared">("all");
  const profile = PROFILES.find((p) => p.key === (user?.view_mode ?? "filmmaker"));
  const [open, setOpen] = useState(false);
  const [filtri, setFiltri] = useState(false);
  const [nuovoPost, setNuovoPost] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Film", logline: "", genre: "", director: "", client: "" });

  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
  useEffect(() => {
    if (!q.data) return;
    for (const p of q.data) {
      void qc.prefetchQuery({ queryKey: ["project", p.id], queryFn: () => api<Project>(`/projects/${p.id}`) });
      void qc.prefetchQuery({ queryKey: ["items", p.id, "__all"], queryFn: () => api<Item[]>(`/projects/${p.id}/items`) });
      void qc.prefetchQuery({ queryKey: ["summary", p.id], queryFn: () => api<Record<string, number>>(`/projects/${p.id}/summary`) });
    }
  }, [q.data, qc]);

  const create = useMutation({
    mutationFn: () => api<Project>("/projects", { method: "POST", body: form }),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm({ title: "", type: "Film", logline: "", genre: "", director: "", client: "" });
      router.push(`/project/${p.id}`);
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const all = q.data ?? [];
  const shared = all.filter((p) => p.my_role && p.my_role !== "owner").length;
  const data = all.filter(
    (p) => (filter === "Tutti" || p.type === filter) && (owner === "all" || (owner === "mine" ? (p.my_role ?? "owner") === "owner" : (p.my_role ?? "owner") !== "owner")),
  );
  const cardW = (width - spacing.xl * 2 - spacing.lg * (cols - 1)) / cols;
  const filtriAttivi = (filter !== "Tutti" ? 1 : 0) + (owner !== "all" ? 1 : 0);
  const tipi = useMemo(() => new Set(all.map((p) => p.type)).size, [all]);

  const picture = user?.picture;
  const avatarUri = picture ? (/^https?:\/\//i.test(picture) ? picture : fileUrl(picture)) : null;
  const initials =
    (user?.name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={12} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const intestazione = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <View style={{ flex: 1 }}>
          <View style={{ width: 22, height: 1.5, backgroundColor: colors.brandPrimary }} />
          <Text style={[s.muted, { marginTop: 5, fontSize: 11.5 }]} numberOfLines={1}>
            Ciao {user?.name?.split(" ")[0] || "a te"}
          </Text>
        </View>
        <GlassButton testID="theme-toggle-button" icon={scheme === "dark" ? "white-balance-sunny" : "weather-night"} accessibilityLabel="Cambia tema" onPress={() => setColorScheme(scheme === "dark" ? "light" : "dark")} />
        <GlassButton testID="home-new-post" icon="plus" accessibilityLabel="Nuovo post" onPress={() => setNuovoPost(true)} />
        <Pressable testID="account-button" accessibilityLabel="Apri profilo" onPress={() => router.push("/profilo")} hitSlop={6}>
          <View style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, borderWidth: 1.5, borderColor: colors.brandPrimary }}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40 }} contentFit="cover" transition={150} />
            ) : (
              <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 13, fontWeight: "700" }}>{initials}</Text>
            )}
          </View>
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, letterSpacing: 2, fontWeight: "700", color: colors.brandPrimary }}>AREA DI LAVORO</Text>
        <Text testID="dashboard-title" style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.onSurface }} numberOfLines={1}>
          La tua area
        </Text>
        <Pressable testID="dashboard-view-mode" onPress={() => router.push("/account")} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}>
          <Icon name={(profile?.icon ?? "movie-open-outline") as IconName} size={13} color={colors.brandPrimary} />
          <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "600", color: colors.onSurfaceSecondary }} numberOfLines={1}>
            Vista {profile?.label}
          </Text>
          <Icon name="chevron-right" size={13} color={colors.muted} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {pillola("movie-open-outline", `${all.length} ${all.length === 1 ? "progetto" : "progetti"}`)}
        {shared ? pillola("account-multiple-outline", `${shared} condivisi`) : null}
        {tipi ? pillola("shape-outline", `${tipi} ${tipi === 1 ? "tipo" : "tipi"}`) : null}
      </View>

      <TodayCard projects={all} />
      <CalendarCard projects={all} />

      <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.onSurface }}>Progetti</Text>
              <View style={{ borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.onSurfaceSecondary }}>{data.length}</Text>
              </View>
            </View>
            <Text style={s.muted} numberOfLines={1}>
              {filtriAttivi ? "Filtri attivi" : shared ? `${shared} ${shared === 1 ? "progetto condiviso" : "progetti condivisi"} con te` : "Tutti i tuoi lavori"}
            </Text>
          </View>
          <LayoutPicker value={layout} onChange={cambiaLayout} />
          <Pressable
            testID="home-filters"
            onPress={() => setFiltri(true)}
            hitSlop={6}
            style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: filtriAttivi ? colors.brandTertiary : colors.surfaceTertiary, borderWidth: 1, borderColor: filtriAttivi ? colors.brandPrimary : colors.divider }}
          >
            <Icon name="tune-variant" size={18} color={filtriAttivi ? colors.onBrandTertiary : colors.onSurface} />
          </Pressable>
        </View>

        {filtriAttivi > 0 ? (
          <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
            {filter !== "Tutti" ? (
              <Pressable onPress={() => setFilter("Tutti")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11.5, fontWeight: "600" }}>{filter}</Text>
                <Icon name="close" size={11} color={colors.onBrandTertiary} />
              </Pressable>
            ) : null}
            {owner !== "all" ? (
              <Pressable onPress={() => setOwner("all")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11.5, fontWeight: "600" }}>{owner === "mine" ? "Creati da me" : "Condivisi con me"}</Text>
                <Icon name="close" size={11} color={colors.onBrandTertiary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient colors={[colors.brandTertiary, "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280, opacity: 0.62 }} pointerEvents="none" />

      {q.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, paddingTop: insets.top }}>
          <ActivityIndicator color={colors.brandPrimary} />
          <Text style={s.muted}>Caricamento progetti…</Text>
        </View>
      ) : q.isError ? (
        <Empty icon="alert-circle-outline" title="Impossibile caricare i progetti" action={<Button label="Riprova" onPress={() => q.refetch()} />} />
      ) : (
        <FlatList
          key={`${layout}-${cols}`}
          testID="projects-list"
          data={data}
          numColumns={cols}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={<View style={{ paddingTop: insets.top + spacing.md }}>{intestazione}</View>}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          columnWrapperStyle={cols > 1 ? { gap: layout === "mini" ? spacing.sm : spacing.lg } : undefined}
          contentContainerStyle={{
            gap: layout === "list" ? spacing.sm : layout === "mini" ? spacing.md : spacing.lg,
            paddingBottom: insets.bottom + 130,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.xl,
          }}
          ListEmptyComponent={
            <View style={{ paddingTop: spacing.md }}>
              <Pressable
                testID="empty-new-project-button"
                onPress={() => setOpen(true)}
                style={{ borderRadius: 24, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }}
              >
                <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.16)", borderWidth: 1, borderColor: "rgba(212,175,55,0.5)" }}>
                  <Icon name="plus" size={26} color={colors.brandPrimary} />
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.onSurface }}>{filtriAttivi ? "Nessun progetto con questi filtri" : "Il primo progetto"}</Text>
                <Text style={[s.muted, { textAlign: "center", paddingHorizontal: spacing.xl }]}>
                  {filtriAttivi ? "Togli i filtri per rivedere tutti i tuoi lavori." : "Film, corto, serie o videoclip: si parte da un titolo."}
                </Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const cover = item.cover_path ? fileUrl(item.cover_path) : PLACEHOLDER;
            const condiviso = !!item.my_role && item.my_role !== "owner";
            const tipo = `${item.type}${item.client ? ` · ${item.client}` : ""}`;
            const icona = ICONE_TIPO[item.type] ?? "movie-open-outline";

            if (layout === "list") {
              return (
                <Pressable
                  testID={`project-card-${item.id}`}
                  onPress={() => router.push(`/project/${item.id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}
                >
                  <Glass style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm }}>
                    <View style={{ borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.divider }}>
                      <Image source={{ uri: cover }} style={{ width: 62, height: 80 }} contentFit="cover" transition={150} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Icon name={icona} size={11} color={colors.brandPrimary} />
                        <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 9.5, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }} numberOfLines={1}>
                          {tipo}
                        </Text>
                      </View>
                      <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 19 }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.logline ? (
                        <Text style={{ color: colors.muted, fontFamily: fonts.text, fontSize: 12, lineHeight: 16 }} numberOfLines={1}>
                          {item.logline}
                        </Text>
                      ) : null}
                      {condiviso ? (
                        <Text style={{ color: colors.muted, fontFamily: fonts.text, fontSize: 11 }} numberOfLines={1}>
                          Condiviso · {ROLE_LABELS[item.my_role!]}
                        </Text>
                      ) : null}
                    </View>
                    <Icon name="chevron-right" size={20} color={colors.muted} />
                  </Glass>
                </Pressable>
              );
            }

            if (layout === "mini") {
              return (
                <Pressable testID={`project-card-${item.id}`} onPress={() => router.push(`/project/${item.id}`)} style={({ pressed }) => ({ width: cardW, gap: 5, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                  <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}>
                    <Image source={{ uri: cover }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" transition={150} />
                    <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44 }} />
                    <View style={{ position: "absolute", left: 6, bottom: 5 }}>
                      <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 10, fontWeight: "700" }} numberOfLines={1}>
                        {item.type}
                      </Text>
                    </View>
                    {condiviso ? (
                      <View style={{ position: "absolute", top: 5, right: 5, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, padding: 3 }}>
                        <Icon name="account-multiple-outline" size={11} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                testID={`project-card-${item.id}`}
                onPress={() => router.push(`/project/${item.id}`)}
                style={({ pressed }) => ({
                  width: cardW,
                  height: 258,
                  borderRadius: 24,
                  overflow: "hidden",
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                  backgroundColor: colors.surfaceTertiary,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  shadowColor: "#000",
                  shadowOpacity: 0.12,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                })}
              >
                <Image source={{ uri: cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                <LinearGradient colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.92)"]} locations={[0, 0.45, 1]} style={{ flex: 1, justifyContent: "space-between", padding: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
                      <Icon name={icona} size={11} color={colors.onBrandPrimary} />
                      <Text style={{ color: colors.onBrandPrimary, fontFamily: fonts.text, fontSize: 10, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }} numberOfLines={1}>
                        {item.type}
                      </Text>
                    </View>
                    {condiviso ? (
                      <View testID={`project-role-${item.id}`} style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
                        <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 10, fontWeight: "600" }} numberOfLines={1}>
                          {ROLE_LABELS[item.my_role!]}
                        </Text>
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }} />
                    {item.client ? (
                      <View style={{ backgroundColor: "rgba(0,0,0,0.35)", borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: "rgba(255,255,255,0.9)", fontFamily: fonts.text, fontSize: 9.5 }} numberOfLines={1}>
                          {item.client}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ gap: 5 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 25, lineHeight: 29, color: "#FFFFFF" }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.logline ? (
                      <Text style={{ fontFamily: fonts.text, color: "rgba(255,255,255,0.84)", fontSize: 12.5, lineHeight: 17 }} numberOfLines={2}>
                        {item.logline}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 3 }}>
                      <View style={{ width: 16, height: 1.5, backgroundColor: colors.brandPrimary }} />
                      <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.8 }}>APRI IL PROGETTO</Text>
                      <Icon name="arrow-right" size={13} color={colors.brandPrimary} />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
      )}

      {width < 600 ? (
        <View style={{ position: "absolute", right: spacing.xl, bottom: insets.bottom + 96 }}>
          <Button testID="new-project-fab" icon="plus" label="Nuovo" onPress={() => setOpen(true)} />
        </View>
      ) : null}

      <PostComposer visible={nuovoPost} onClose={() => setNuovoPost(false)} hasRental={!!user?.rental?.nome} />

      <Sheet
        testID="home-filters-sheet"
        visible={filtri}
        onClose={() => setFiltri(false)}
        title="Filtra progetti"
        footer={<Button testID="filters-apply" label={`Mostra ${data.length} ${data.length === 1 ? "progetto" : "progetti"}`} onPress={() => setFiltri(false)} />}
      >
        <View style={{ gap: spacing.lg, padding: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Tipo di progetto</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {["Tutti", ...PROJECT_TYPES].map((t) => (
                <Chip key={t} testID={`filter-chip-${t}`} label={t} selected={filter === t} onPress={() => setFilter(t)} />
              ))}
            </View>
          </View>
          {shared > 0 ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Di chi</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {([["all", "Tutti i progetti"], ["mine", "Creati da me"], ["shared", `Condivisi con me (${shared})`]] as const).map(([k, l]) => (
                  <Chip key={k} testID={`owner-filter-${k}`} icon={k === "shared" ? "account-multiple-outline" : undefined} label={l} selected={owner === k} onPress={() => setOwner(k)} />
                ))}
              </View>
            </View>
          ) : null}
          {filtriAttivi > 0 ? (
            <Button
              label="Azzera filtri"
              variant="ghost"
              icon="filter-off-outline"
              onPress={() => {
                setFilter("Tutti");
                setOwner("all");
              }}
            />
          ) : null}
        </View>
      </Sheet>

      <Sheet
        testID="new-project-sheet"
        visible={open}
        onClose={() => setOpen(false)}
        title="Nuovo progetto"
        footer={<Button testID="create-project-submit" label="Crea progetto" loading={create.isPending} disabled={!form.title.trim()} onPress={() => create.mutate()} />}
      >
        <View style={{ gap: spacing.md, padding: spacing.lg }}>
          <Field testID="project-title-input" label="Titolo" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Il mio film" />
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Tipo</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {PROJECT_TYPES.map((t) => (
                <Chip key={t} testID={`project-type-${t}`} icon={ICONE_TIPO[t]} label={t} selected={form.type === t} onPress={() => setForm({ ...form, type: t })} />
              ))}
            </View>
          </View>
          <Field testID="project-logline-input" label="Logline" value={form.logline} onChangeText={(t) => setForm({ ...form, logline: t })} multiline minHeight={80} placeholder="Di cosa parla, in una frase" />
          <Field testID="project-genre-input" label="Genere" value={form.genre} onChangeText={(t) => setForm({ ...form, genre: t })} />
          <Field testID="project-director-input" label="Regia" value={form.director} onChangeText={(t) => setForm({ ...form, director: t })} />
          <Field
            testID="project-client-input"
            label={form.type === "Social" || form.type === "Spot" ? "Cliente" : "Cliente / Produzione (facoltativo)"}
            value={form.client}
            onChangeText={(t) => setForm({ ...form, client: t })}
          />
        </View>
      </Sheet>
    </View>
  );
}
