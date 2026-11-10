import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { fileUrl } from "@/src/api";
import { isVideo } from "@/src/modules";
import { Post } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

// Pezzi condivisi da "il mio profilo" e "profilo di un'altra persona":
// stessa vetrina, stessi gesti, stesso vetro. Cambiano solo i pulsanti.

export type StatVoce = { n: number; label: string; onPress?: () => void; forte?: boolean };

export function ProfileHero({
  nome,
  username,
  categoria,
  bio,
  link,
  foto,
  cover,
  stats,
  actions,
  top,
  onModifica,
  testIDCategoria,
}: {
  nome: string;
  username?: string;
  categoria?: string;
  bio?: string;
  link?: string;
  foto?: string | null;
  cover?: string | null;
  stats: StatVoce[];
  actions?: ReactNode;
  top?: ReactNode;
  onModifica?: () => void;
  testIDCategoria?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ overflow: "hidden", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
      {/* Sfondo: la foto più rappresentativa, sfocata, con una tendina scura. */}
      {cover ? (
        <Image source={{ uri: cover }} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340 }} contentFit="cover" blurRadius={26} transition={300} />
      ) : null}
      <LinearGradient
        colors={cover ? ["rgba(0,0,0,0.45)", "rgba(0,0,0,0.72)", colors.surface] : [colors.brandTertiary, colors.surface]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 340, opacity: cover ? 1 : 0.5 }}
      />

      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
        {top}

        <View style={{ alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm }}>
          <Pressable onPress={onModifica} disabled={!onModifica}>
            <View style={{ padding: 3, borderRadius: 62, borderWidth: 2, borderColor: colors.brandPrimary, backgroundColor: "rgba(0,0,0,0.25)" }}>
              {foto ? (
                <Image source={{ uri: foto }} style={{ width: 108, height: 108, borderRadius: 54 }} contentFit="cover" transition={200} />
              ) : (
                <View style={{ width: 108, height: 108, borderRadius: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
                  <Icon name="account" size={46} color={colors.muted} />
                </View>
              )}
            </View>
          </Pressable>

          <View style={{ alignItems: "center", gap: 3 }}>
            <Text style={{ color: cover ? "#FFFFFF" : colors.onSurface, fontFamily: fonts.display, fontSize: 30, textAlign: "center" }} numberOfLines={2}>
              {nome}
            </Text>
            <Text style={{ color: cover ? "rgba(255,255,255,0.78)" : colors.muted, fontSize: 13 }} numberOfLines={1}>
              @{username || "utente"}
            </Text>
            {categoria ? (
              <View testID={testIDCategoria} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3, marginTop: 4 }}>
                <Icon name="movie-open" size={12} color={colors.onBrandPrimary} />
                <Text style={{ color: colors.onBrandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" }}>{categoria}</Text>
              </View>
            ) : null}
          </View>

          {bio ? (
            <Text style={{ color: cover ? "rgba(255,255,255,0.9)" : colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 20, textAlign: "center", maxWidth: 460 }} numberOfLines={4}>
              {bio}
            </Text>
          ) : null}
          {link ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="link-variant" size={13} color={colors.brandPrimary} />
              <Text style={{ color: colors.brandPrimary, fontSize: 12.5, fontWeight: "600" }} numberOfLines={1}>
                {link.replace(/^https?:\/\//i, "")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {stats.map((x) => (
            <Pressable
              key={x.label}
              disabled={!x.onPress}
              onPress={x.onPress}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                gap: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.lg,
                backgroundColor: "rgba(20,20,22,0.35)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: fonts.display, fontSize: 23 }}>{x.n}</Text>
              <Text style={{ color: x.forte ? colors.brandPrimary : "rgba(255,255,255,0.65)", fontSize: 10.5, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>{x.label}</Text>
            </Pressable>
          ))}
        </View>

        {actions}
      </View>
    </View>
  );
}

// Il portfolio: prima immagine grande come apertura, poi griglia editoriale.
export function PortfolioGrid({
  lavori,
  onOpen,
  azione,
  vuoto,
}: {
  lavori: Post[];
  onOpen: (id: string) => void;
  azione?: ReactNode;
  vuoto?: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.brandPrimary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.6 }}>PORTFOLIO</Text>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 24 }}>I lavori</Text>
        </View>
        {azione}
      </View>

      {lavori.length === 0 ? (
        vuoto
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {lavori.map((p, i) => {
            const video = p.media.some((m) => isVideo(m));
            const prima = p.media[0] && !isVideo(p.media[0]) ? fileUrl(p.media[0]) : null;
            const apertura = i === 0 && (!!prima || video);
            const ratio = p.ratios?.[0] && p.ratios[0] > 0 ? Math.min(1.8, Math.max(0.65, p.ratios[0])) : apertura ? 16 / 10 : i % 3 === 2 ? 3 / 4 : 1;
            return (
              <Pressable
                key={p.id}
                testID={`portfolio-${p.id}`}
                onPress={() => onOpen(p.id)}
                style={({ pressed }) => ({
                  width: apertura ? "100%" : "48.5%",
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  borderRadius: 22,
                  overflow: "hidden",
                  backgroundColor: colors.surfaceTertiary,
                  borderWidth: 1,
                  borderColor: colors.divider,
                })}
              >
                {prima ? (
                  <Image source={{ uri: prima }} style={{ width: "100%", aspectRatio: ratio }} contentFit="cover" transition={180} />
                ) : video ? (
                  <View style={{ width: "100%", aspectRatio: ratio, backgroundColor: "#0B0B0B", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }}>
                      <Icon name="play" size={26} color="#FFFFFF" />
                    </View>
                  </View>
                ) : (
                  <View style={{ padding: spacing.md, minHeight: 110, justifyContent: "center" }}>
                    <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13 }} numberOfLines={6}>{p.text}</Text>
                  </View>
                )}

                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.82)"]}
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.xxl }}
                >
                  <Text style={{ color: colors.brandPrimary, fontSize: 9.5, fontWeight: "800", letterSpacing: 1.2 }}>
                    {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text style={{ color: "#FFFFFF", fontSize: apertura ? 18 : 12.5, fontWeight: "700" }} numberOfLines={apertura ? 2 : 2}>
                    {p.text.split("\n")[0].slice(0, 80) || "Lavoro"}
                  </Text>
                </LinearGradient>

                {video ? (
                  <View style={{ position: "absolute", top: spacing.sm, right: spacing.sm, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                    <Icon name="play-circle-outline" size={11} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>VIDEO</Text>
                  </View>
                ) : null}

                {p.media.length > 1 ? (
                  <View style={{ position: "absolute", top: spacing.sm, left: spacing.sm, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                    <Icon name="image-multiple-outline" size={11} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{p.media.length}</Text>
                  </View>
                ) : null}

                {p.privacy !== "public" ? (
                  <View style={{ position: "absolute", top: spacing.sm, right: spacing.sm, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10, padding: 3 }}>
                    <Icon name={p.privacy === "private" ? "lock" : "eye-off-outline"} size={12} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export type Vetrina = { nome?: string; citta?: string; telefono?: string; email?: string; sito?: string; attrezzatura?: string; cover?: string };

// La vetrina del noleggio: copertina, prezzo in evidenza, contatti in vetro.
export function RentalShowcase({
  rental,
  copertina,
  noleggi,
  onOpen,
  azioni,
  pulsanti,
  vuoto,
}: {
  rental: Vetrina;
  copertina?: string | null;
  noleggi: Post[];
  onOpen: (id: string) => void;
  azioni?: ReactNode;
  pulsanti?: ReactNode;
  vuoto?: ReactNode;
}) {
  const { colors } = useTheme();
  const contatti = [rental.telefono, rental.email, rental.sito].filter(Boolean) as string[];

  return (
    <View style={{ paddingTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.brandPrimary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.6 }}>VETRINA</Text>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 24 }}>Noleggio</Text>
        </View>
        {azioni}
      </View>

      <View style={{ borderRadius: 28, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ height: 220, backgroundColor: colors.surfaceTertiary }}>
          {copertina ? <Image source={{ uri: copertina }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={250} /> : null}
          <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.9)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg, gap: 4 }}>
            <Text style={{ color: colors.brandPrimary, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.8 }}>RENTAL</Text>
            <Text style={{ color: "#FFFFFF", fontFamily: fonts.display, fontSize: 27 }} numberOfLines={1}>
              {rental.nome || "Il tuo noleggio"}
            </Text>
            {rental.citta ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="map-marker-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5 }}>{rental.citta}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          {rental.attrezzatura ? (
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19 }} numberOfLines={4}>{rental.attrezzatura}</Text>
          ) : null}
          {pulsanti ? <View style={{ paddingTop: spacing.xs }}>{pulsanti}</View> : null}
          {contatti.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {contatti.map((c) => (
                <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.divider }}>
                  <Icon name={c.includes("@") ? "email-outline" : c.includes(".") ? "web" : "phone-outline"} size={11} color={colors.muted} />
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11.5 }} numberOfLines={1}>{c}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {noleggi.length === 0 ? (
        vuoto
      ) : (
        <View style={{ gap: spacing.md }}>
          {noleggi.map((n) => {
            const prima = n.media[0] ? fileUrl(n.media[0]) : null;
            return (
              <Pressable
                key={n.id}
                testID={`vetrina-${n.id}`}
                onPress={() => onOpen(n.id)}
                style={({ pressed }) => ({ borderRadius: 22, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider, transform: [{ scale: pressed ? 0.99 : 1 }] })}
              >
                <View style={{ height: 190, backgroundColor: colors.surfaceTertiary }}>
                  {prima ? <Image source={{ uri: prima }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={180} /> : null}
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90 }} />
                  {n.price ? (
                    <View style={{ position: "absolute", left: spacing.sm, bottom: spacing.sm, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 }}>
                      <Text style={{ color: colors.onBrandPrimary, fontSize: 13, fontWeight: "900" }}>{n.price}</Text>
                    </View>
                  ) : null}
                  {n.media.length > 1 ? (
                    <View style={{ position: "absolute", right: spacing.sm, top: spacing.sm, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                      <Icon name="image-multiple-outline" size={11} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{n.media.length}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ padding: spacing.md, gap: 3 }}>
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
          })}
        </View>
      )}
    </View>
  );
}
