import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GlassSwitch from "@/src/components/GlassSwitch";
import PersonAvatar from "@/src/components/PersonAvatar";
import PostComposer from "@/src/components/PostComposer";
import { api, fileUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { categoriePersona } from "@/src/modules";
import { exportPortfolio, exportRentalSheet } from "@/src/portfolioPdf";
import { Post, Profile } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, GlassButton, Icon, toast, useStyles } from "@/src/ui";

// Il profilo è un portfolio: prima le persone che sei, poi i lavori come
// vetrina (mosaico grande) e il noleggio come scheda da presentare.
export default function Profilo() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [composer, setComposer] = useState<null | "post" | "rental">(null);
  const [vista, setVista] = useState<"portfolio" | "rental">("portfolio");
  const [pdf, setPdf] = useState<null | "portfolio" | "rental">(null);

  const io = user?.user_id ?? "";
  const profilo = useQuery({ queryKey: ["profile", io], queryFn: () => api<Profile>(`/users/${io}`), enabled: !!io });
  const posts = useQuery({ queryKey: ["profile-posts", io], queryFn: () => api<Post[]>(`/users/${io}/posts`), enabled: !!io });

  if (!user) return null;
  const dati = profilo.data;
  const rental = dati?.user.rental ?? user.rental ?? {};
  const haNoleggio = !!rental.nome;
  const miei = posts.data ?? [];
  const noleggi = miei.filter((p) => p.kind === "rental");
  const lavori = miei.filter((p) => p.kind !== "rental");
  const foto = user.picture ? (user.picture.startsWith("http") ? user.picture : fileUrl(user.picture)) : null;
  const categoria = categoriePersona({
    crew_role: dati?.user.crew_role || user.crew_role,
    profiles: dati?.user.profiles?.length ? dati.user.profiles : user.profiles,
    view_mode: dati?.user.view_mode || user.view_mode,
  });
  const bio = (dati?.user.bio || user.bio || "").trim();
  const link = (dati?.user.link || user.link || "").trim();
  const copertina = noleggi.find((n) => n.media[0])?.media[0] ?? lavori.find((l) => l.media[0])?.media[0] ?? null;

  // Swipe a sinistra per i noleggi, a destra per tornare al portfolio.
  const cambiaVista = (v: "portfolio" | "rental") => {
    setVista((attuale) => {
      if (attuale === v) return attuale;
      void Haptics.selectionAsync();
      return v;
    });
  };
  // runOnJS: i callback restano sul thread JS, così il gesto non dipende
  // dai worklet di Reanimated.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-40, 40])
    .failOffsetY([-24, 24])
    .onEnd((e) => {
      if (e.translationX < -60) cambiaVista("rental");
      else if (e.translationX > 60) cambiaVista("portfolio");
    });

  const esportaPortfolio = async () => {
    setPdf("portfolio");
    await exportPortfolio({
      nome: user.name || "Il mio portfolio",
      username: dati?.user.username || user.username,
      categoria,
      bio,
      link,
      foto,
      post: lavori,
      email: rental.email,
      telefono: rental.telefono,
    });
    setPdf(null);
  };

  const esportaNoleggio = async () => {
    setPdf("rental");
    await exportRentalSheet({
      nome: rental.nome || `Noleggio di ${user.name || "CineStudio"}`,
      citta: rental.citta,
      telefono: rental.telefono,
      email: rental.email,
      sito: rental.sito,
      attrezzatura: rental.attrezzatura,
      foto: copertina ? fileUrl(copertina) : foto,
      noleggi,
      proprietario: [user.name, user.username ? `@${user.username}` : ""].filter(Boolean).join(" · "),
    });
    setPdf(null);
  };

  const contatta = () => {
    const tel = (rental.telefono || "").replace(/[^\d+]/g, "");
    if (tel) return Linking.openURL(`https://wa.me/${tel.replace(/^\+/, "")}`);
    if (rental.email) return Linking.openURL(`mailto:${rental.email}`);
    toast("Aggiungi telefono o email al noleggio per farti contattare", "error");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[colors.brandTertiary, "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260, opacity: 0.7 }}
        pointerEvents="none"
      />
      <GestureDetector gesture={swipe}>
        <ScrollView
          testID="profile-scroll"
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={posts.isRefetching} onRefresh={() => { void posts.refetch(); void profilo.refetch(); }} tintColor={colors.brandPrimary} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <Text style={[s.label, { flex: 1 }]}>Profilo</Text>
          <GlassButton testID="profile-edit" icon="account-edit-outline" accessibilityLabel="Modifica profilo" onPress={() => router.push("/account")} />
          <GlassButton testID="profile-logout" icon="logout" accessibilityLabel="Esci" onPress={() => (logout(), toast("A presto"))} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg }}>
          {foto ? (
            <Image source={{ uri: foto }} style={{ width: 92, height: 92, borderRadius: 46 }} contentFit="cover" />
          ) : (
            <PersonAvatar person={{ user_id: io, username: user.name, name: user.name, picture: null }} size={92} />
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 26 }} numberOfLines={1}>
              {user.name || "Il tuo nome"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="at" size={13} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>
                {dati?.user.username || user.username || "utente"}
              </Text>
            </View>
            {categoria ? (
              <View testID="profile-role" style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: 4 }}>
                <Icon name="movie-open" size={12} color={colors.onBrandTertiary} />
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>{categoria}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {bio || link ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: 4 }}>
            {bio ? (
              <Text testID="profile-bio" style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 20 }}>
                {bio}
              </Text>
            ) : null}
            {link ? (
              <Pressable testID="profile-link" onPress={() => void Linking.openURL(/^https?:\/\//i.test(link) ? link : `https://${link}`)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="link-variant" size={13} color={colors.brandPrimary} />
                <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
                  {link.replace(/^https?:\/\//i, "")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Pressable testID="profile-bio" onPress={() => router.push("/account")} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <Text style={[s.muted]}>Aggiungi una bio e un link: due righe su di te, il tuo sito o la tua showreel.</Text>
          </Pressable>
        )}

        <View style={{ flexDirection: "row", paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm }}>
          {[
            { n: lavori.length, label: "portfolio", tipo: null },
            { n: dati?.followers ?? 0, label: "follower", tipo: "followers" },
            { n: dati?.following ?? 0, label: "seguiti", tipo: "following" },
          ].map((x) => (
            <Glass key={x.label} style={{ flex: 1, borderRadius: radius.lg, alignItems: "center", paddingVertical: spacing.sm }} tint={colors.surfaceSecondary}>
              <Pressable
                testID={x.tipo ? `profile-stat-${x.tipo}` : "profile-stat-portfolio"}
                accessibilityRole={x.tipo ? "button" : undefined}
                disabled={!x.tipo}
                onPress={x.tipo ? () => router.push({ pathname: "/follow/[uid]", params: { uid: io, tipo: String(x.tipo) } }) : undefined}
                style={{ alignItems: "center" }}
              >
                <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 21 }}>{x.n}</Text>
                <Text style={{ color: x.tipo ? colors.brandPrimary : colors.muted, fontSize: 11.5, fontWeight: "600" }}>{x.label}</Text>
              </Pressable>
            </Glass>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Button testID="profile-new-post" label="Nuovo lavoro" icon="plus" onPress={() => setComposer("post")} />
          <Button testID="profile-new-rental" label="Noleggio" variant="secondary" icon="video-vintage" onPress={() => setComposer("rental")} />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <GlassSwitch
            testID="profile-tab"
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
          <View style={{ paddingTop: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>Portfolio</Text>
                <Text style={s.muted} numberOfLines={1}>
                  {lavori.length === 0 ? "Ancora vuoto" : `${lavori.length} ${lavori.length === 1 ? "lavoro" : "lavori"} · si aprono uno per uno`}
                </Text>
              </View>
              <Button
                testID="profile-export-portfolio"
                label="PDF"
                icon="file-pdf-box"
                variant="secondary"
                small
                loading={pdf === "portfolio"}
                disabled={lavori.length === 0}
                onPress={() => void esportaPortfolio()}
              />
            </View>

            {lavori.length === 0 ? (
              <Empty
                icon="image-multiple-outline"
                title="Il portfolio è ancora vuoto"
                subtitle="Pubblica i tuoi lavori: qui diventano una vetrina con foto grandi, pronta da esportare in PDF."
                action={<Button label="Pubblica il primo lavoro" icon="plus" onPress={() => setComposer("post")} />}
              />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", padding: spacing.sm }}>
                {lavori.map((p, i) => {
                  const prima = p.media[0] ? fileUrl(p.media[0]) : null;
                  // Il primo lavoro prende due colonne, per aprire il portfolio con un'immagine forte.
                  const grande = i === 0 && !!prima;
                  return (
                    <Pressable
                      key={p.id}
                      testID={`profile-grid-${p.id}`}
                      onPress={() => router.push(`/post/${p.id}`)}
                      style={({ pressed }) => ({ width: grande ? "100%" : "50%", padding: spacing.xs, transform: [{ scale: pressed ? 0.985 : 1 }] })}
                    >
                      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
                        {prima ? (
                          <Image source={{ uri: prima }} style={{ width: "100%", aspectRatio: grande ? 4 / 3 : 1 }} contentFit="cover" transition={180} />
                        ) : (
                          <View style={{ padding: spacing.md, minHeight: 96, justifyContent: "center" }}>
                            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }} numberOfLines={6}>
                              {p.text}
                            </Text>
                          </View>
                        )}
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.72)"]}
                          style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, paddingTop: spacing.xl }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }} numberOfLines={grande ? 2 : 1}>
                            {p.text.split("\n")[0].slice(0, 80) || "Lavoro"}
                          </Text>
                        </LinearGradient>
                        {p.privacy !== "public" ? (
                          <View style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10, padding: 3 }}>
                            <Icon name={p.privacy === "private" ? "lock" : "eye-off-outline"} size={12} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {/* La vetrina: una scheda sola, grande, con i contatti in chiaro. */}
            <View style={{ borderRadius: 26, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider }}>
              <View style={{ height: 170, backgroundColor: colors.surfaceTertiary }}>
                {copertina ? (
                  <>
                    <Image source={{ uri: fileUrl(copertina) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                    <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0 }} />
                  </>
                ) : null}
                <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.md, gap: 2 }}>
                  <Text style={{ color: colors.brandPrimary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>
                    Vetrina noleggio
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontFamily: fonts.display, fontSize: 24 }} numberOfLines={1}>
                    {rental.nome || "Il tuo rental"}
                  </Text>
                  {rental.citta ? <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>{rental.citta}</Text> : null}
                </View>
              </View>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19 }} numberOfLines={3}>
                  {rental.attrezzatura || (haNoleggio ? "Descrivi cosa affitti: corpi macchina, ottiche, luci, audio." : "Hai un rental? Presentalo come una vetrina: attrezzatura, prezzi, contatti.")}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                  {[rental.telefono, rental.email, rental.sito].filter(Boolean).map((v) => (
                    <View key={String(v)} style={{ backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                      <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11.5 }} numberOfLines={1}>{v}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs }}>
                  <Button testID="profile-rental-post" label={haNoleggio ? "Pubblica noleggio" : "Aggiungi rental"} icon={haNoleggio ? "video-vintage" : "plus"} onPress={() => (haNoleggio ? setComposer("rental") : router.push("/account"))} />
                  {haNoleggio ? <Button label="Contatta" variant="secondary" icon="whatsapp" onPress={contatta} /> : null}
                </View>
                <Button
                  testID="profile-export-rental"
                  label="Esporta la vetrina in PDF"
                  icon="file-pdf-box"
                  variant="secondary"
                  loading={pdf === "rental"}
                  disabled={!haNoleggio}
                  onPress={() => void esportaNoleggio()}
                />
              </View>
            </View>

            {noleggi.length === 0 ? (
              <Empty
                icon="video-vintage"
                title="Nessun noleggio pubblicato"
                subtitle="Chi cerca attrezzatura deve vedere subito cosa affitti: prezzo, luogo e come scriverti."
                action={<Button label="Pubblica un noleggio" icon="plus" onPress={() => setComposer("rental")} />}
              />
            ) : (
              noleggi.map((n) => {
                const prima = n.media[0] ? fileUrl(n.media[0]) : null;
                return (
                  <Pressable
                    key={n.id}
                    testID={`profile-rental-${n.id}`}
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
                      <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "700" }} numberOfLines={2}>
                        {n.text.split("\n")[0] || "Noleggio"}
                      </Text>
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
      </GestureDetector>

      <PostComposer
        visible={composer !== null}
        defaultKind={composer === "rental" ? "rental" : "post"}
        hasRental={haNoleggio}
        onClose={() => setComposer(null)}
      />
    </View>
  );
}
