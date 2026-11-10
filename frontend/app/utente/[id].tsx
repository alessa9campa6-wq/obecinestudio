import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import GlassSwitch from "@/src/components/GlassSwitch";
import { PortfolioGrid, ProfileHero, RentalShowcase } from "@/src/components/ProfileKit";
import { api, fileUrl } from "@/src/api";
import { categoriePersona, isVideo } from "@/src/modules";
import { nomePersona, Post, Profile } from "@/src/social";
import { spacing, useTheme } from "@/src/theme";
import { Button, Empty, GlassButton, Icon } from "@/src/ui";

// Il profilo di un'altra persona: stessa vetrina del tuo, senza i comandi di
// modifica. Si vede solo quello che ha pubblicato per tutti.
export default function ProfiloAltrui() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vista, setVista] = useState<"foto" | "video" | "noleggi">(tab === "noleggi" ? "noleggi" : "foto");

  const profilo = useQuery({ queryKey: ["profile", id], queryFn: () => api<Profile>(`/users/${id}`) });
  const posts = useQuery({ queryKey: ["profile-posts", id], queryFn: () => api<Post[]>(`/users/${id}/posts`) });

  const p = profilo.data;
  const rental = p?.user.rental ?? {};
  const tutti = posts.data ?? [];
  const lavori = tutti.filter((x) => x.kind !== "rental");
  const fotoLavori = lavori.filter((x) => !x.media.some((m) => isVideo(m)));
  const videoLavori = lavori.filter((x) => x.media.some((m) => isVideo(m)));
  const noleggi = tutti.filter((x) => x.kind === "rental");
  const categoria = p ? categoriePersona(p.user) : "";
  const foto = p?.user.picture ? (p.user.picture.startsWith("http") ? p.user.picture : fileUrl(p.user.picture)) : null;
  const coverPath = rental.cover || noleggi.find((n) => n.media[0])?.media[0] || lavori.find((l) => l.media[0])?.media[0] || null;
  const copertina = coverPath ? fileUrl(coverPath) : null;

  if (profilo.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (!p) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md }}>
          <Pressable testID="user-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
            <Icon name="chevron-left" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
        <Empty icon="account-question-outline" title="Persona non trovata" />
      </View>
    );
  }

  const tel = String(rental.telefono || "").replace(/[^\d+]/g, "");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <ProfileHero
          nome={nomePersona(p.user)}
          username={p.user.username}
          categoria={categoria}
          bio={(p.user.bio || "").trim()}
          link={(p.user.link || "").trim()}
          foto={foto}
          cover={copertina}
          testIDCategoria="user-role"
          top={
            <View style={{ flexDirection: "row", alignItems: "center", paddingTop: insets.top, gap: spacing.sm }}>
              <Pressable testID="user-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
                <Icon name="chevron-left" size={26} color="#FFFFFF" />
              </Pressable>
              <Text style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }} numberOfLines={1}>
                @{(p.user.username || "utente").toUpperCase()}
              </Text>
              {p.is_me ? <GlassButton icon="account-circle-outline" accessibilityLabel="Vai al tuo profilo" onPress={() => router.push("/profilo")} /> : null}
            </View>
          }
          stats={[
            { n: fotoLavori.length, label: "Foto", forte: true },
            { n: videoLavori.length, label: "Video" },
            { n: p.followers, label: "Follower", onPress: () => router.push({ pathname: "/follow/[uid]", params: { uid: p.user.user_id, tipo: "followers" } }) },
            { n: p.following, label: "Seguiti", onPress: () => router.push({ pathname: "/follow/[uid]", params: { uid: p.user.user_id, tipo: "following" } }) },
          ]}
          actions={
            <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs }}>
              {p.is_me ? (
                <Button label="Questo profilo è tuo" variant="secondary" icon="account-circle-outline" onPress={() => router.push("/profilo")} />
              ) : (
                <>
                  <FollowButton userId={p.user.user_id} following={p.following_them} label />
                  <Button testID="user-message" label="Messaggia" variant="secondary" icon="chat-outline" onPress={() => router.push(`/dm/${p.user.user_id}`)} />
                </>
              )}
            </View>
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <GlassSwitch
            testID="user-tab"
            value={vista}
            onChange={setVista}
            options={[
              { value: "foto", label: `Foto (${fotoLavori.length})`, icon: "image-multiple-outline" },
              { value: "video", label: `Video (${videoLavori.length})`, icon: "play-box-multiple-outline" },
              { value: "noleggi", label: `Noleggi (${noleggi.length})`, icon: "video-vintage" },
            ]}
          />
        </View>

        {posts.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : vista === "foto" ? (
          <PortfolioGrid
            lavori={fotoLavori}
            onOpen={(postId) => router.push(`/post/${postId}`)}
            vuoto={<Empty icon="image-multiple-outline" title="Nessuna foto pubblicata" subtitle="Quando pubblica una foto pubblica, la trovi qui." />}
          />
        ) : vista === "video" ? (
          <PortfolioGrid
            lavori={videoLavori}
            onOpen={(postId) => router.push(`/post/${postId}`)}
            vuoto={<Empty icon="play-box-multiple-outline" title="Nessun video pubblicato" subtitle="I video di questa persona compaiono qui, separati dalle foto." />}
          />
        ) : (
          <RentalShowcase
            rental={rental}
            copertina={copertina}
            noleggi={noleggi}
            onOpen={(postId) => router.push(`/post/${postId}`)}
            pulsanti={
              !p.is_me && tel ? (
                <Button label="Contatta su WhatsApp" variant="secondary" icon="whatsapp" onPress={() => void Linking.openURL(`https://wa.me/${tel.replace(/^\+/, "")}`)} />
              ) : undefined
            }
            vuoto={<Empty icon="video-vintage" title="Nessun noleggio pubblicato" subtitle="Questa persona non ha una vetrina attiva." />}
          />
        )}
      </ScrollView>
    </View>
  );
}
