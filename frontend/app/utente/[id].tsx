import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import PersonAvatar from "@/src/components/PersonAvatar";
import { api, fileUrl } from "@/src/api";
import { nomePersona, Post, Profile } from "@/src/social";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Card, Empty, Icon, useStyles } from "@/src/ui";

// Il profilo di un'altra persona: si vede solo quello che ha pubblicato per tutti.
export default function ProfiloAltrui() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profilo = useQuery({ queryKey: ["profile", id], queryFn: () => api<Profile>(`/users/${id}`) });
  const posts = useQuery({ queryKey: ["profile-posts", id], queryFn: () => api<Post[]>(`/users/${id}/posts`) });

  const p = profilo.data;
  const rental = p?.user.rental ?? {};
  const pubblico = posts.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable testID="user-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 16 }} numberOfLines={1}>
          {p ? `@${p.user.username || "utente"}` : "Profilo"}
        </Text>
      </View>

      {profilo.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : !p ? (
        <Empty icon="account-question-outline" title="Persona non trovata" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg }}>
            <PersonAvatar person={p.user} size={84} />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              {[
                { n: p.posts, label: "post" },
                { n: p.followers, label: "follower" },
                { n: p.following, label: "seguiti" },
              ].map((x) => (
                <View key={x.label} style={{ alignItems: "center" }}>
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{x.n}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{x.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 2 }}>
            <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 16 }}>{nomePersona(p.user)}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              @{p.user.username || "utente"}
              {p.user.crew_role ? ` · ${p.user.crew_role}` : ""}
            </Text>
          </View>

          {p.is_me ? (
            <View style={{ padding: spacing.lg }}>
              <Button label="Questo profilo è tuo" variant="secondary" icon="account-circle-outline" onPress={() => router.push("/profilo")} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg }}>
              <FollowButton userId={p.user.user_id} following={p.following_them} label />
              <Button testID="user-message" label="Messaggia" variant="secondary" icon="chat-outline" onPress={() => router.push(`/dm/${p.user.user_id}`)} />
            </View>
          )}

          {p.user.has_rental ? (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Icon name="video-vintage" size={16} color={colors.brandPrimary} />
                <Text style={s.label}>Noleggio</Text>
              </View>
              <Card testID="user-rental">
                <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{rental.nome}</Text>
                <Text style={s.muted}>{[rental.citta, rental.telefono, rental.email].filter(Boolean).join(" · ")}</Text>
                {rental.attrezzatura ? <Text style={{ color: colors.onSurface, fontSize: 13, lineHeight: 18 }}>{rental.attrezzatura}</Text> : null}
                {rental.sito ? <Text style={{ color: colors.brandPrimary, fontSize: 13 }}>{rental.sito}</Text> : null}
              </Card>
            </View>
          ) : null}

          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <Text style={s.label}>Post</Text>
            {posts.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : pubblico.length === 0 ? (
              <Text style={s.muted}>Nessun post pubblico.</Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginHorizontal: -spacing.lg }}>
                {pubblico.map((post) => {
                  const prima = post.media[0] ? fileUrl(post.media[0]) : null;
                  return (
                    <Pressable key={post.id} testID={`user-grid-${post.id}`} onPress={() => router.push(`/post/${post.id}`)} style={{ width: "33.33%", aspectRatio: 1, padding: 1 }}>
                      <View style={{ flex: 1, backgroundColor: colors.surfaceTertiary, borderRadius: 4, overflow: "hidden" }}>
                        {prima ? (
                          <Image source={{ uri: prima }} style={{ flex: 1 }} contentFit="cover" />
                        ) : (
                          <Text style={{ color: colors.muted, fontSize: 10, padding: 6 }} numberOfLines={5}>
                            {post.text}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
