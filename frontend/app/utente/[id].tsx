import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import GlassSwitch from "@/src/components/GlassSwitch";
import { api, fileUrl } from "@/src/api";
import { categoriePersona } from "@/src/modules";
import { nomePersona, Post, Profile } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, Icon } from "@/src/ui";

// Il profilo di un'altra persona, con la stessa divisione del tuo: portfolio da
// una parte, vetrina dei noleggi dall'altra.
export default function ProfiloAltrui() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vista, setVista] = useState<"portfolio" | "rental">("portfolio");

  const profilo = useQuery({ queryKey: ["profile", id], queryFn: () => api<Profile>(`/users/${id}`) });
  const posts = useQuery({ queryKey: ["profile-posts", id], queryFn: () => api<Post[]>(`/users/${id}/posts`) });

  const p = profilo.data;
  const rental = p?.user.rental ?? {};
  const tutti = posts.data ?? [];
  const lavori = tutti.filter((x) => x.kind !== "rental");
  const noleggi = tutti.filter((x) => x.kind === "rental");
  const categoria = p ? categoriePersona(p.user) : "";
  const copertina = (rental.cover ? fileUrl(rental.cover) : null) ?? (noleggi.find((n) => n.media[0]) ? fileUrl(noleggi.find((n) => n.media[0])!.media[0]) : null);
  const bio = (p?.user.bio || "").trim();
  const link = (p?.user.link || "").trim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient colors={[colors.brandTertiary, "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 240, opacity: 0.6 }} pointerEvents="none" />
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg }}>
            <Image source={{ uri: p.user.picture ? (p.user.picture.startsWith("http") ? p.user.picture : fileUrl(p.user.picture)) : "" }} style={{ width: 92, height: 92, borderRadius: 46 }} contentFit="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 25 }} numberOfLines={1}>
                {nomePersona(p.user)}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>@{p.user.username || "utente"}</Text>
              {categoria ? (
                <View testID="user-role" style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: 4 }}>
                  <Icon name="movie-open" size={12} color={colors.onBrandTertiary} />
                  <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>{categoria}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {bio || link ? (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 4 }}>
              {bio ? <Text testID="user-bio" style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 20 }}>{bio}</Text> : null}
              {link ? (
                <Pressable testID="user-link" onPress={() => void Linking.openURL(/^https?:\/\//i.test(link) ? link : `https://${link}`)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="link-variant" size={13} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{link.replace(/^https?:\/\//i, "")}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm }}>
            {[
              { n: lavori.length, label: "portfolio", tipo: null },
              { n: p.followers, label: "follower", tipo: "followers" },
              { n: p.following, label: "seguiti", tipo: "following" },
            ].map((x) => (
              <Glass key={x.label} style={{ flex: 1, borderRadius: radius.lg, alignItems: "center", paddingVertical: spacing.sm }} tint={colors.surfaceSecondary}>
                <Pressable
                  testID={x.tipo ? `user-stat-${x.tipo}` : "user-stat-portfolio"}
                  disabled={!x.tipo}
                  onPress={x.tipo ? () => router.push({ pathname: "/follow/[uid]", params: { uid: p.user.user_id, tipo: String(x.tipo) } }) : undefined}
                  style={{ alignItems: "center" }}
                >
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 21 }}>{x.n}</Text>
                  <Text style={{ color: x.tipo ? colors.brandPrimary : colors.muted, fontSize: 11.5, fontWeight: "600" }}>{x.label}</Text>
                </Pressable>
              </Glass>
            ))}
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

          <View style={{ paddingHorizontal: spacing.lg }}>
            <GlassSwitch
              testID="user-tab"
              value={vista}
              onChange={setVista}
              options={[
                { value: "portfolio", label: `Portfolio (${lavori.length})`, icon: "image-multiple-outline" },
                { value: "rental", label: `Noleggi (${noleggi.length})`, icon: "video-vintage" },
              ]}
            />
          </View>

          {posts.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : vista === "portfolio" ? (
            <View style={{ paddingTop: spacing.md }}>
              {lavori.length === 0 ? (
                <Empty icon="image-multiple-outline" title="Nessun lavoro pubblicato" subtitle="Quando pubblica qualcosa di pubblico, lo trovi qui." />
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", padding: spacing.sm }}>
                  {lavori.map((x, i) => {
                    const prima = x.media[0] ? fileUrl(x.media[0]) : null;
                    const grande = i === 0 && !!prima;
                    return (
                      <Pressable
                        key={x.id}
                        testID={`user-grid-${x.id}`}
                        onPress={() => router.push(`/post/${x.id}`)}
                        style={({ pressed }) => ({ width: grande ? "100%" : "50%", padding: spacing.xs, transform: [{ scale: pressed ? 0.985 : 1 }] })}
                      >
                        <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
                          {prima ? (
                            <Image source={{ uri: prima }} style={{ width: "100%", aspectRatio: grande ? 4 / 3 : 1 }} contentFit="cover" transition={180} />
                          ) : (
                            <View style={{ padding: spacing.md, minHeight: 96, justifyContent: "center" }}>
                              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }} numberOfLines={6}>{x.text}</Text>
                            </View>
                          )}
                          <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, paddingTop: spacing.xl }}>
                            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }} numberOfLines={grande ? 2 : 1}>
                              {x.text.split("\n")[0].slice(0, 80) || "Lavoro"}
                            </Text>
                          </LinearGradient>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View style={{ paddingTop: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
              {p.user.has_rental ? (
                <View testID="user-rental" style={{ borderRadius: 26, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider }}>
                  <View style={{ height: 160, backgroundColor: colors.surfaceTertiary }}>
                    {copertina ? (
                      <>
                        <Image source={{ uri: copertina }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                        <LinearGradient colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.78)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
                      </>
                    ) : null}
                    <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.md, gap: 2 }}>
                      <Text style={{ color: colors.brandPrimary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>Vetrina noleggio</Text>
                      <Text style={{ color: "#FFFFFF", fontFamily: fonts.display, fontSize: 23 }} numberOfLines={1}>{rental.nome}</Text>
                      {rental.citta ? <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>{rental.citta}</Text> : null}
                    </View>
                  </View>
                  <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                    {rental.attrezzatura ? <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19 }} numberOfLines={4}>{rental.attrezzatura}</Text> : null}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                      {[rental.telefono, rental.email, rental.sito].filter(Boolean).map((v) => (
                        <View key={String(v)} style={{ backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11.5 }} numberOfLines={1}>{v}</Text>
                        </View>
                      ))}
                    </View>
                    {!p.is_me && rental.telefono ? (
                      <Button label="Contatta" variant="secondary" icon="whatsapp" onPress={() => void Linking.openURL(`https://wa.me/${String(rental.telefono).replace(/[^\d+]/g, "").replace(/^\+/, "")}`)} />
                    ) : null}
                  </View>
                </View>
              ) : null}

              {noleggi.length === 0 ? (
                <Empty icon="video-vintage" title="Nessun noleggio pubblicato" subtitle="Questa persona non ha una vetrina attiva." />
              ) : (
                noleggi.map((n) => {
                  const prima = n.media[0] ? fileUrl(n.media[0]) : null;
                  return (
                    <Pressable
                      key={n.id}
                      testID={`user-rental-${n.id}`}
                      onPress={() => router.push(`/post/${n.id}`)}
                      style={({ pressed }) => ({ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider, transform: [{ scale: pressed ? 0.99 : 1 }] })}
                    >
                      {prima ? <Image source={{ uri: prima }} style={{ width: "100%", aspectRatio: 16 / 10 }} contentFit="cover" transition={180} /> : null}
                      <View style={{ padding: spacing.md, gap: 4 }}>
                        {n.price ? (
                          <View style={{ alignSelf: "flex-start", backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                            <Text style={{ color: colors.onBrandPrimary, fontSize: 12, fontWeight: "800" }}>{n.price}</Text>
                          </View>
                        ) : null}
                        <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "700" }} numberOfLines={2}>{n.text.split("\n")[0] || "Noleggio"}</Text>
                        {n.place ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Icon name="map-marker-outline" size={13} color={colors.muted} />
                            <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{n.place}</Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
