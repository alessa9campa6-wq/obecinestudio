import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Project } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PROJECT_TYPES } from "@/src/modules";
import { fonts, radius, setColorScheme, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Sheet, toast, useStyles } from "@/src/ui";

const PLACEHOLDER = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=80&w=900";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { colors, scheme } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const cols = width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const [filter, setFilter] = useState("Tutti");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Film", logline: "", genre: "", director: "", client: "" });

  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
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

  const data = (q.data ?? []).filter((p) => filter === "Tutti" || p.type === filter);
  const cardW = (width - spacing.xl * 2 - spacing.lg * (cols - 1)) / cols;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: colors.brandPrimary }]}>CineStudio</Text>
            <Text testID="dashboard-title" style={s.h1} numberOfLines={1}>
              I tuoi progetti
            </Text>
          </View>
          <Button testID="theme-toggle-button" icon={scheme === "dark" ? "white-balance-sunny" : "weather-night"} variant="secondary" onPress={() => setColorScheme(scheme === "dark" ? "light" : "dark")} />
          <Button testID="logout-button" icon="logout" variant="secondary" onPress={logout} />
          {width >= 600 && <Button testID="new-project-button" icon="plus" label="Nuovo progetto" onPress={() => setOpen(true)} />}
        </View>
        <Text style={s.muted}>Ciao {user?.name || user?.email}. Scegli un progetto o iniziane uno nuovo.</Text>
        <ChipRow>
          {["Tutti", ...PROJECT_TYPES].map((t) => (
            <Chip key={t} testID={`filter-chip-${t}`} label={t} selected={filter === t} onPress={() => setFilter(t)} />
          ))}
        </ChipRow>
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
          key={cols}
          testID="projects-list"
          data={data}
          numColumns={cols}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          columnWrapperStyle={cols > 1 ? { gap: spacing.lg } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + 96 }}
          ListEmptyComponent={
            <Empty icon="movie-open-outline" title="Nessun progetto trovato" subtitle="Crea il tuo primo capolavoro: film, corto, serie o videoclip." action={<Button testID="empty-new-project-button" label="Nuovo progetto" icon="plus" onPress={() => setOpen(true)} />} />
          }
          renderItem={({ item }) => (
            <Pressable testID={`project-card-${item.id}`} onPress={() => router.push(`/project/${item.id}`)} style={({ pressed }) => ({ width: cardW, height: 220, borderRadius: radius.lg, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }], backgroundColor: colors.surfaceTertiary })}>
              <Image source={{ uri: item.cover_path ? fileUrl(item.cover_path) : PLACEHOLDER }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" transition={200} />
              <LinearGradient colors={["transparent", "rgba(28,28,30,0.2)", "rgba(28,28,30,0.8)"]} style={{ flex: 1, justifyContent: "flex-end", padding: spacing.lg, gap: spacing.xs }}>
                <View style={{ alignSelf: "flex-start", backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                  <Text style={{ color: colors.onBrandPrimary, fontFamily: fonts.text, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{item.type}{item.client ? ` · ${item.client}` : ""}</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 24, color: "#FFFFFF" }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.logline ? (
                  <Text style={{ fontFamily: fonts.text, color: "#E6E6E6", fontSize: 13 }} numberOfLines={2}>
                    {item.logline}
                  </Text>
                ) : null}
              </LinearGradient>
            </Pressable>
          )}
        />
      )}
      {width < 600 && (
        <View style={{ position: "absolute", right: spacing.xl, bottom: insets.bottom + 16 }}>
          <Button testID="new-project-fab" icon="plus" label="Nuovo" onPress={() => setOpen(true)} />
        </View>
      )}
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
