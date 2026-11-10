import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GlassSwitch from "@/src/components/GlassSwitch";
import PostComposer from "@/src/components/PostComposer";
import PersonAvatar from "@/src/components/PersonAvatar";
import { api, fileUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { categoriePersona } from "@/src/modules";
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
  const [composer, setComposer] = useState<null | "post" | "rental">(null);
  const [vista, setVista] = useState<"post" | "rental">("post");

  const io = user?.user_id ?? "";
  const profilo = useQuery({ queryKey: ["profile", io], queryFn: () => api<Profile>(`/users/${io}`), enabled: !!io });
  const posts = useQuery({ queryKey: ["profile-posts", io], queryFn: () => api<Post[]>(`/users/${io}/posts`), enabled: !!io });


  if (!user) return null;
  const dati = profilo.data;
  const rental = dati?.user.rental ?? user.rental ?? {};
  const haNoleggio = !!rental.nome;
  const miei = posts.data ?? [];
  const noleggi = miei.filter((p) => p.kind === "rental");
  const soloPost = miei.filter((p) => p.kind !== "rental");
  const mostrati = vista === "rental" ? noleggi : soloPost;
  const foto = user.picture ? (user.picture.startsWith("http") ? user.picture : fileUrl(user.picture)) : null;
  const categoria = categoriePersona({
    crew_role: dati?.user.crew_role || user.crew_role,
    profiles: dati?.user.profiles?.length ? dati.user.profiles : user.profiles,
    view_mode: dati?.user.view_mode || user.view_mode,
  });
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
              { n: dati?.posts ?? miei.length, label: "post", tipo: null },
              { n: dati?.followers ?? 0, label: "follower", tipo: "followers" },
              { n: dati?.following ?? 0, label: "seguiti", tipo: "following" },
            ].map((x) =>
              x.tipo ? (
                <Pressable
                  key={x.label}
                  testID={`profile-stat-${x.tipo}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Vedi ${x.label}`}
                  onPress={() => router.push({ pathname: "/follow/[uid]", params: { uid: io, tipo: String(x.tipo) } })}
                  style={({ pressed }) => ({ alignItems: "center", opacity: pressed ? 0.6 : 1 })}
                >
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{x.n}</Text>
                  <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: "600" }}>{x.label}</Text>
                </Pressable>
              ) : (
                <View key={x.label} style={{ alignItems: "center" }}>
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>{x.n}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{x.label}</Text>
                </View>
              )
            )}
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

        <View style={{ padding: spacing.lg, paddingBottom: 0, gap: spacing.md }}>
          <GlassSwitch
            testID="profile-tab"
            value={vista}
            onChange={setVista}
            options={[
              { value: "post", label: `Post (${soloPost.length})`, icon: "movie-open" },
              { value: "rental", label: `Noleggi (${noleggi.length})`, icon: "video-vintage" },
            ]}
          />
          {posts.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : mostrati.length === 0 ? (
            <Empty
              icon={vista === "rental" ? "video-vintage" : "image-multiple-outline"}
              title={vista === "rental" ? "Nessun noleggio pubblicato" : "Ancora niente qui"}
              subtitle={vista === "rental" ? "Chi cerca attrezzatura deve vedere cosa affitti: prezzo, luogo e contatto." : "Il primo post può essere un progetto, un set o un'idea."}
              action={
                <Button
                  label={vista === "rental" ? "Pubblica un noleggio" : "Crea il primo post"}
                  icon="plus"
                  onPress={() => setComposer(vista === "rental" ? "rental" : "post")}
                />
              }
            />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, marginHorizontal: -spacing.lg }}>
              {mostrati.map((p) => {
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
                      {p.kind === "rental" && p.price ? (
                        <View style={{ position: "absolute", left: 4, bottom: 4, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 }}>
                          <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "700" }}>{p.price}</Text>
                        </View>
                      ) : null}
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
