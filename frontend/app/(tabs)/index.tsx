import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarCard } from "@/src/components/CalendarCard";
import GlassSwitch from "@/src/components/GlassSwitch";
import PostComposer from "@/src/components/PostComposer";
import { TodayCard } from "@/src/components/TodayCard";

import { api, fileUrl, Item, Project } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ROLE_LABELS } from "@/src/hub";
import { PROFILES, PROJECT_TYPES } from "@/src/modules";
import { fonts, radius, setColorScheme, spacing, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { Button, Chip, ChipRow, Empty, Field, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

const PLACEHOLDER = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=80&w=900";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { colors, scheme } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const [layout, setLayout] = useState<"big" | "list" | "mini">("big");
  useEffect(() => {
    void storage.getItem<string>("home_layout", "big").then((v) => {
      if (v === "big" || v === "list" || v === "mini") setLayout(v);
    });
  }, []);
  const cambiaLayout = (v: "big" | "list" | "mini") => {
    setLayout(v);
    void storage.setItem("home_layout", v);
  };
  const cols =
    layout === "mini" ? (width >= 1100 ? 5 : width >= 700 ? 4 : 3) : layout === "list" ? 1 : width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const [filter, setFilter] = useState("Tutti");
  const [owner, setOwner] = useState<"all" | "mine" | "shared">("all");
  const profile = PROFILES.find((p) => p.key === (user?.view_mode ?? "filmmaker"));
  const [open, setOpen] = useState(false);
  const [nuovoPost, setNuovoPost] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Film", logline: "", genre: "", director: "", client: "" });

  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
  useEffect(() => {
  if (!q.data) return;
  for (const p of q.data) {
    void qc.prefetchQuery({
      queryKey: ["project", p.id],
      queryFn: () => api<Project>(`/projects/${p.id}`),
    });
    void qc.prefetchQuery({
      queryKey: ["items", p.id, "__all"],
      queryFn: () => api<Item[]>(`/projects/${p.id}/items`),
    });
    void qc.prefetchQuery({
      queryKey: ["summary", p.id],
      queryFn: () => api<Record<string, number>>(`/projects/${p.id}/summary`),
    });
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
  const data = all.filter((p) => (filter === "Tutti" || p.type === filter) && (owner === "all" || (owner === "mine" ? (p.my_role ?? "owner") === "owner" : (p.my_role ?? "owner") !== "owner")));
  const cardW = (width - spacing.xl * 2 - spacing.lg * (cols - 1)) / cols;
  const picture = user?.picture;
  const avatarUri = picture
    ? /^https?:\/\//i.test(picture)
      ? picture
      : fileUrl(picture)
    : null;
  const initials =
    (user?.name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: colors.brandPrimary }]}>CineStudio</Text>
            <Text testID="dashboard-title" style={s.h1} numberOfLines={1}>
              I tuoi progetti
            </Text>
            <Text style={s.muted} numberOfLines={1}>
              {data.length === 1 ? "1 progetto" : `${data.length} progetti`}
              {shared ? ` · ${shared} condivisi` : ""}
            </Text>
          </View>
          <Button testID="theme-toggle-button" icon={scheme === "dark" ? "white-balance-sunny" : "weather-night"} variant="secondary" onPress={() => setColorScheme(scheme === "dark" ? "light" : "dark")} />
          <Button testID="home-new-post" icon="plus" variant="secondary" onPress={() => setNuovoPost(true)} />
          <Pressable
            testID="account-button"
            accessibilityLabel="Apri account"
            onPress={() => router.push("/profilo")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surfaceTertiary,
              borderWidth: 1,
              borderColor: colors.divider,
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 36, height: 36 }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
                {initials}
              </Text>
            )}
          </Pressable>
          <Button testID="logout-button" icon="logout" variant="secondary" onPress={logout} />
          {width >= 600 && <Button testID="new-project-button" icon="plus" label="Nuovo progetto" onPress={() => setOpen(true)} />}
        </View>
        <Pressable testID="dashboard-view-mode" onPress={() => router.push("/account")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name={(profile?.icon ?? "movie-open-outline") as IconName} size={16} color={colors.brandPrimary} />
          <Text style={[s.muted, { flex: 1 }]} numberOfLines={2}>
            Ciao {user?.name || user?.email} · vista {profile?.label}: {profile?.hint}
          </Text>
        </Pressable>
        <ChipRow>
          {["Tutti", ...PROJECT_TYPES].map((t) => (
            <Chip key={t} testID={`filter-chip-${t}`} label={t} selected={filter === t} onPress={() => setFilter(t)} />
          ))}
        </ChipRow>
        {shared > 0 && (
          <ChipRow>
            {([["all", "Tutti i progetti"], ["mine", "Creati da me"], ["shared", `Condivisi con me (${shared})`]] as const).map(([k, l]) => (
              <Chip key={k} testID={`owner-filter-${k}`} icon={k === "shared" ? "account-multiple-outline" : undefined} label={l} selected={owner === k} onPress={() => setOwner(k)} />
            ))}
          </ChipRow>
        )}
        <GlassSwitch
          testID="home-layout"
          value={layout}
          onChange={cambiaLayout}
          options={[
            { value: "big", label: "Copertine", icon: "image-outline" },
            { value: "list", label: "Elenco", icon: "format-list-bulleted" },
            { value: "mini", label: "Mini", icon: "view-grid-outline" },
          ]}
        />
      </View>
      {q.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }}>
          <ActivityIndicator color={colors.brandPrimary} />
          <Text style={s.muted}>Caricamento progetti...</Text>
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
          ListHeaderComponent={
            <>
              <TodayCard projects={all} />
              <CalendarCard projects={all} />
            </>
          }
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          columnWrapperStyle={cols > 1 ? { gap: layout === "mini" ? spacing.sm : spacing.lg } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: layout === "list" ? spacing.sm : layout === "mini" ? spacing.md : spacing.lg, paddingBottom: insets.bottom + 130 }}
          ListEmptyComponent={
            <Empty icon="movie-open-outline" title="Nessun progetto trovato" subtitle="Crea il tuo primo capolavoro: film, corto, serie o videoclip." action={<Button testID="empty-new-project-button" label="Nuovo progetto" icon="plus" onPress={() => setOpen(true)} />} />
          }
          renderItem={({ item }) => {
            const cover = item.cover_path ? fileUrl(item.cover_path) : PLACEHOLDER;
            const condiviso = !!item.my_role && item.my_role !== "owner";
            const tipo = `${item.type}${item.client ? ` · ${item.client}` : ""}`;
            if (layout === "list") {
              return (
                <Pressable
                  testID={`project-card-${item.id}`}
                  onPress={() => router.push(`/project/${item.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    padding: spacing.sm,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Image source={{ uri: cover }} style={{ width: 64, height: 80, borderRadius: radius.md }} contentFit="cover" transition={150} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }} numberOfLines={1}>{tipo}</Text>
                    <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 19 }} numberOfLines={1}>{item.title}</Text>
                    {item.logline ? (
                      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 16 }} numberOfLines={2}>{item.logline}</Text>
                    ) : null}
                    {condiviso ? (
                      <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>Condiviso · {ROLE_LABELS[item.my_role!]}</Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              );
            }
            if (layout === "mini") {
              return (
                <Pressable
                  testID={`project-card-${item.id}`}
                  onPress={() => router.push(`/project/${item.id}`)}
                  style={({ pressed }) => ({ width: cardW, gap: 4, opacity: pressed ? 0.85 : 1 })}
                >
                  <View style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}>
                    <Image source={{ uri: cover }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" transition={150} />
                    {condiviso ? (
                      <View style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.pill, padding: 3 }}>
                        <Icon name="account-multiple-outline" size={11} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 10 }} numberOfLines={1}>{item.type}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                testID={`project-card-${item.id}`}
                onPress={() => router.push(`/project/${item.id}`)}
                style={({ pressed }) => ({
                  width: cardW,
                  height: 240,
                  borderRadius: 24,
                  overflow: "hidden",
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  backgroundColor: colors.surfaceTertiary,
                  borderWidth: 1,
                  borderColor: colors.divider,
                })}
              >
                <Image source={{ uri: cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.88)"]} style={{ flex: 1, justifyContent: "flex-end", padding: spacing.lg, gap: spacing.xs }}>
                  <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                    <View style={{ alignSelf: "flex-start", backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                      <Text style={{ color: colors.onBrandPrimary, fontFamily: fonts.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }} numberOfLines={1}>{tipo}</Text>
                    </View>
                    {condiviso ? (
                      <View testID={`project-role-${item.id}`} style={{ alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                        <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 11, fontWeight: "600" }}>Condiviso · {ROLE_LABELS[item.my_role!]}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: fonts.display, fontSize: 25, color: "#FFFFFF" }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.logline ? (
                    <Text style={{ fontFamily: fonts.text, color: "rgba(255,255,255,0.86)", fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                      {item.logline}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 2 }}>
                    <Icon name="arrow-right" size={13} color={colors.brandPrimary} />
                    <Text style={{ color: colors.brandPrimary, fontSize: 11, fontWeight: "700" }}>Apri il progetto</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          }}
        />
      )}
      {width < 600 && (
        <View style={{ position: "absolute", right: spacing.xl, bottom: insets.bottom + 96 }}>
          <Button testID="new-project-fab" icon="plus" label="Nuovo" onPress={() => setOpen(true)} />
        </View>
      )}
      <PostComposer visible={nuovoPost} onClose={() => setNuovoPost(false)} hasRental={!!user?.rental?.nome} />
      <Sheet
        testID="new-project-sheet"
        visible={open}
        onClose={() => setOpen(false)}
        title="Nuovo progetto"
        footer={<Button testID="create-project-submit" label="Crea progetto" loading={create.isPending} disabled={!form.title.trim()} onPress={() => create.mutate()} />}
      >
        <Field testID="project-title-input" label="Titolo" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} placeholder="Il mio film" />
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Tipo</Text>
          <ChipRow>
            {PROJECT_TYPES.map((t) => (
              <Chip key={t} testID={`project-type-${t}`} label={t} selected={form.type === t} onPress={() => setForm({ ...form, type: t })} />
            ))}
          </ChipRow>
        </View>
        <Field testID="project-logline-input" label="Logline" value={form.logline} onChangeText={(t) => setForm({ ...form, logline: t })} multiline minHeight={80} />
        <Field testID="project-genre-input" label="Genere" value={form.genre} onChangeText={(t) => setForm({ ...form, genre: t })} />
        <Field testID="project-director-input" label="Regia" value={form.director} onChangeText={(t) => setForm({ ...form, director: t })} />
        <Field testID="project-client-input" label={form.type === "Social" || form.type === "Spot" ? "Cliente" : "Cliente / Produzione (facoltativo)"} value={form.client} onChangeText={(t) => setForm({ ...form, client: t })} />
      </Sheet>
    </View>
  );
}
