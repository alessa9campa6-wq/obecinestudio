import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "@/src/components/PostCard";
import PostComposer from "@/src/components/PostComposer";
import PersonAvatar from "@/src/components/PersonAvatar";
import { api, fileUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Post, Profile } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Empty, Icon, toast, useStyles } from "@/src/ui";

// Il profilo, stile Instagram: foto e numeri, il noleggio se ce l'hai, la
// griglia dei post (anche privati e non in elenco) e il feed del noleggio.
export default function Profilo() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [composer, setComposer] = useState<null | "post" | "rental">(null);

  const io = user?.user_id ?? "";
  const profilo = useQuery({ queryKey: ["profile", io], queryFn: () => api<Profile>(`/users/${io}`), enabled: !!io });
  const posts = useQuery({ queryKey: ["profile-posts", io], queryFn: () => api<Post[]>(`/users/${io}/posts`), enabled: !!io });

  const like = useMutation({
    mutationFn: (p: Post) => api(`/posts/${p.id}/like`, { method: p.liked ? "DELETE" : "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (!user) return null;
  const dati = profilo.data;
  const rental = dati?.user.rental ?? user.rental ?? {};
  const haNoleggio = !!rental.nome;
  const miei = posts.data ?? [];
  const noleggi = miei.filter((p) => p.kind === "rental");
  const foto = user.picture ? (user.picture.startsWith("http") ? user.picture : fileUrl(user.picture)) : null;
  const categoria = (dati?.user.crew_role || user.crew_role || "").trim();
  const bio = (dati?.user.bio || user.bio || "").trim();
  const link = (dati?.user.link || user.link || "").trim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        testID="profile-scroll"
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={posts.isRefetching} onRefresh={() => { void posts.refetch(); void profilo.refetch(); }} tintColor={colors.brandPrimary} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {foto ? (
            <Image source={{ uri: foto }} style={{ width: 84, height: 84, borderRadius: 42 }} contentFit="cover" />
          ) : (
            <PersonAvatar person={{ user_id: io, username: user.name, name: user.name, picture: null }} size={84} />
          )}
          <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
            {[
              { n: dati?.posts ?? miei.length, label: "post" },
              { n: dati?.followers ?? 0, label: "follower" },
              { n: dati?.following ?? 0, label: "seguiti" },
            ].map((x) => (
              <View key={x.label} style={{ alignItems: "center" }}>
                <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{x.n}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{x.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs }}>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 17 }}>{user.name || "Il tuo nome"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="at" size={13} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 13 }}>{profilo.data?.user.username || user.username || "utente"}</Text>
            </View>
            {categoria ? (
              <View testID="profile-role" style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                <Icon name="movie-open" size={12} color={colors.onBrandTertiary} />
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>{categoria}</Text>
              </View>
            ) : null}
          </View>
          <Text testID="profile-bio" style={{ color: colors.onSurface, fontSize: 13, lineHeight: 19 }}>
            {bio || "Aggiungi una bio: due righe su di te e sul tuo lavoro."}
          </Text>
          {link ? (
            <Pressable testID="profile-link" onPress={() => void Linking.openURL(/^https?:\/\//i.test(link) ? link : `https://${link}`)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="link-variant" size={13} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                {link.replace(/^https?:\/\//i, "")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg }}>
          <Button testID="profile-new-post" label="Nuovo post" icon="plus" onPress={() => setComposer("post")} />
          <Button testID="profile-edit" label="Modifica profilo" variant="secondary" icon="account-edit-outline" onPress={() => router.push("/account")} />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Icon name="video-vintage" size={16} color={colors.brandPrimary} />
            <Text style={s.label}>Il mio noleggio</Text>
          </View>
          {haNoleggio ? (
            <Card testID="profile-rental">
              <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{rental.nome}</Text>
              <Text style={s.muted}>{[rental.citta, rental.telefono, rental.email].filter(Boolean).join(" · ")}</Text>
              {rental.attrezzatura ? <Text style={{ color: colors.onSurface, fontSize: 13, lineHeight: 18 }}>{rental.attrezzatura}</Text> : null}
              {rental.sito ? <Text style={{ color: colors.brandPrimary, fontSize: 13 }}>{rental.sito}</Text> : null}
              <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs }}>
                <Button testID="profile-rental-post" label="Pubblica noleggio" icon="video-vintage" onPress={() => setComposer("rental")} />
                <Button label="Modifica" variant="secondary" icon="pencil-outline" onPress={() => router.push("/account")} />
              </View>
            </Card>
          ) : (
            <Card testID="profile-rental-empty">
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Hai un rental? Fallo vedere.</Text>
              <Text style={s.muted}>Attiva il noleggio nel profilo: diventa una vetrina qui e in Esplora, con quello che affitti e come contattarti.</Text>
              <Button label="Aggiungi il mio noleggio" icon="plus" variant="secondary" onPress={() => router.push("/account")} />
            </Card>
          )}
        </View>

        {noleggi.length > 0 ? (
          <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.sm }}>
            <Text style={s.label}>Post del noleggio</Text>
            {noleggi.map((p) => (
              <PostCard key={p.id} post={p} onOpen={() => router.push(`/post/${p.id}`)} onLike={() => like.mutate(p)} />
            ))}
          </View>
        ) : null}

        <View style={{ padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm }}>
          <Text style={s.label}>I miei post</Text>
          {posts.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : miei.length === 0 ? (
            <Empty icon="image-multiple-outline" title="Ancora niente qui" subtitle="Il primo post può essere un progetto, un set o un'idea." action={<Button label="Crea il primo post" icon="plus" onPress={() => setComposer("post")} />} />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginHorizontal: -spacing.lg }}>
              {miei.map((p) => {
                const prima = p.media[0] ? fileUrl(p.media[0]) : null;
                return (
                  <Pressable
                    key={p.id}
                    testID={`profile-grid-${p.id}`}
                    onPress={() => router.push(`/post/${p.id}`)}
                    style={{ width: "33.33%", aspectRatio: 1, padding: 1 }}
                  >
                    <View style={{ flex: 1, backgroundColor: colors.surfaceTertiary, borderRadius: 4, overflow: "hidden" }}>
                      {prima ? (
                        <Image source={{ uri: prima }} style={{ flex: 1 }} contentFit="cover" />
                      ) : (
                        <Text style={{ color: colors.muted, fontSize: 10, padding: 6 }} numberOfLines={5}>
                          {p.text}
                        </Text>
                      )}
                      {p.privacy !== "public" ? (
                        <View style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, padding: 2 }}>
                          <Icon name={p.privacy === "private" ? "lock" : "eye-off-outline"} size={12} color="#FFF" />
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Button testID="profile-messages" label="Messaggi" variant="secondary" icon="chat-outline" onPress={() => router.push("/messaggi")} />
          <Button testID="profile-logout" label="Esci" variant="secondary" icon="logout" onPress={() => (logout(), toast("A presto"))} />
        </View>
      </ScrollView>

      <PostComposer
        visible={composer !== null}
        defaultKind={composer === "rental" ? "rental" : "post"}
        hasRental={haNoleggio}
        onClose={() => setComposer(null)}
      />
    </View>
  );
}
