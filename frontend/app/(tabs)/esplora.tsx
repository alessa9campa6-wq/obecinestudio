import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import PersonAvatar from "@/src/components/PersonAvatar";
import PostCard from "@/src/components/PostCard";
import { api } from "@/src/api";
import { nomePersona, Person, Post } from "@/src/social";
import GlassSwitch from "@/src/components/GlassSwitch";
import { spacing, useTheme } from "@/src/theme";
import { Empty, Field, Icon, useStyles } from "@/src/ui";

type Vista = "post" | "rental";

// Esplora: in alto cerchi persone, sotto un solo tocco per passare dai post dei
// filmmaker ai noleggi (e ritorno).
export default function Esplora() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [cerca, setCerca] = useState("");
  const [vista, setVista] = useState<Vista>("post");
  const termine = cerca.trim();

  const persone = useQuery({
    queryKey: ["suggested", termine],
    queryFn: () => api<Person[]>(`/people/suggested?q=${encodeURIComponent(termine)}`),
  });
  const filmmaker = useQuery({ queryKey: ["explore", "post"], queryFn: () => api<Post[]>("/explore?kind=post") });
  const noleggi = useQuery({ queryKey: ["explore", "rental"], queryFn: () => api<Post[]>("/explore?kind=rental") });

  const corrente = vista === "post" ? filmmaker : noleggi;
  const post = corrente.data ?? [];

  const like = useMutation({
    mutationFn: (p: Post) => api(`/posts/${p.id}/like`, { method: p.liked ? "DELETE" : "POST" }),
    onSuccess: () => {
      for (const chiave of ["explore", "feed", "post", "profile-posts"]) void qc.invalidateQueries({ queryKey: [chiave] });
    },
  });

  const aggiorna = () => {
    void persone.refetch();
    void filmmaker.refetch();
    void noleggi.refetch();
  };

  const interruttore = (
    <GlassSwitch
      testID="explore-tab"
      value={vista}
      onChange={setVista}
      options={[
        { value: "post", label: "Post filmmaker", icon: "movie-open" },
        { value: "rental", label: "Noleggi", icon: "video-vintage" },
      ]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={[s.h1, { flex: 1, fontSize: 26 }]}>Esplora</Text>
          <Icon name="compass" size={22} color={colors.brandPrimary} />
        </View>
        <Field testID="explore-search" value={cerca} onChangeText={setCerca} placeholder="Cerca persone: @nome o nome e cognome" />
      </View>

      <ScrollView
        testID="explore-scroll"
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={filmmaker.isRefetching || noleggi.isRefetching} onRefresh={aggiorna} tintColor={colors.brandPrimary} />}
        keyboardShouldPersistTaps="handled"
      >
        {termine.length >= 2 ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={s.label}>Persone da seguire</Text>
            {persone.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : (persone.data ?? []).length === 0 ? (
              <Text style={s.muted}>Nessuna persona trovata per “{termine}”.</Text>
            ) : (
              (persone.data ?? []).map((p) => (
                <Pressable
                  key={p.user_id}
                  testID={`explore-person-${p.user_id}`}
                  onPress={() => router.push(`/utente/${p.user_id}`)}
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm }}
                >
                  <PersonAvatar person={p} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.onSurface, fontWeight: "700" }} numberOfLines={1}>{nomePersona(p)}</Text>
                    <Text style={s.muted} numberOfLines={1}>@{p.username || "utente"}{p.crew_role ? ` · ${p.crew_role}` : ""}</Text>
                  </View>
                  <FollowButton userId={p.user_id} following={false} label />
                </Pressable>
              ))
            )}
            <Text style={[s.muted, { fontSize: 12 }]}>Tocca una persona per vedere il profilo e i suoi post.</Text>
          </View>
        ) : (
          <>
            <View style={{ gap: spacing.sm }}>
              <Text style={s.label}>In alto, chi seguire</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {(persone.data ?? []).slice(0, 12).map((p) => (
                  <View key={p.user_id} testID={`explore-suggested-${p.user_id}`} style={{ width: 96, alignItems: "center", gap: 4 }}>
                    <Pressable onPress={() => router.push(`/utente/${p.user_id}`)}>
                      <PersonAvatar person={p} size={58} />
                    </Pressable>
                    <Text style={{ color: colors.onSurface, fontSize: 11, fontWeight: "600", textAlign: "center" }} numberOfLines={1}>
                      {nomePersona(p)}
                    </Text>
                    <FollowButton userId={p.user_id} following={false} />
                  </View>
                ))}
                {(persone.data ?? []).length === 0 ? (
                  <Text style={s.muted}>Ancora nessuno da suggerire: cerca un @nome qui sopra.</Text>
                ) : null}
              </ScrollView>
            </View>

            {interruttore}

            {corrente.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.lg }} />
            ) : post.length === 0 ? (
              vista === "post" ? (
                <Empty icon="movie-open-outline" title="Ancora nessun post" subtitle="Quando altri filmmaker pubblicano, li trovi qui: un tocco e passi ai noleggi." />
              ) : (
                <Empty icon="video-vintage" title="Ancora nessun noleggio" subtitle="Se hai un rental, attivalo nel profilo e pubblica il primo annuncio." action={<Pressable onPress={() => setVista("post")}><Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Torna ai post</Text></Pressable>} />
              )
            ) : (
              post.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onLike={() => like.mutate(p)}
                  onOpen={() => router.push(`/post/${p.id}`)}
                  onAuthor={() => router.push(`/utente/${p.author.user_id}`)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
