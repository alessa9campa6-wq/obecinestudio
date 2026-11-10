import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ExportSheet from "@/src/components/ExportSheet";
import GlassSwitch from "@/src/components/GlassSwitch";
import PostComposer from "@/src/components/PostComposer";
import { PortfolioGrid, ProfileHero, RentalShowcase } from "@/src/components/ProfileKit";
import { api, fileUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { categoriePersona, isVideo } from "@/src/modules";
import { Post, Profile } from "@/src/social";
import { spacing, useTheme } from "@/src/theme";
import { Button, Empty, GlassButton, toast } from "@/src/ui";

type Vista = "foto" | "video" | "noleggi";
const VISTE: Vista[] = ["foto", "video", "noleggi"];

// Il profilo è un portfolio diviso come su Instagram: foto da una parte, video
// dall'altra, e la vetrina del noleggio. L'export sta in alto e chiede cosa
// vuoi portarti via.
export default function Profilo() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [composer, setComposer] = useState<null | "post" | "rental">(null);
  const [vista, setVista] = useState<Vista>("foto");
  const [exportOpen, setExportOpen] = useState(false);

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
  const fotoLavori = lavori.filter((p) => !p.media.some((m) => isVideo(m)));
  const videoLavori = lavori.filter((p) => p.media.some((m) => isVideo(m)));
  const foto = user.picture ? (user.picture.startsWith("http") ? user.picture : fileUrl(user.picture)) : null;
  const categoria = categoriePersona({
    crew_role: dati?.user.crew_role || user.crew_role,
    profiles: dati?.user.profiles?.length ? dati.user.profiles : user.profiles,
    view_mode: dati?.user.view_mode || user.view_mode,
  });
  const bio = (dati?.user.bio || user.bio || "").trim();
  const link = (dati?.user.link || user.link || "").trim();
  const coverPath = rental.cover || noleggi.find((n) => n.media[0])?.media[0] || lavori.find((l) => l.media[0])?.media[0] || null;
  const copertina = coverPath ? fileUrl(coverPath) : null;

  const cambiaVista = (v: Vista) => {
    setVista((attuale) => {
      if (attuale === v) return attuale;
      void Haptics.selectionAsync();
      return v;
    });
  };
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-40, 40])
    .failOffsetY([-24, 24])
    .onEnd((e) => {
      const i = VISTE.indexOf(vista);
      if (e.translationX < -60 && i < VISTE.length - 1) cambiaVista(VISTE[i + 1]);
      else if (e.translationX > 60 && i > 0) cambiaVista(VISTE[i - 1]);
    });

  const contatta = () => {
    const tel = (rental.telefono || "").replace(/[^\d+]/g, "");
    if (tel) return void Linking.openURL(`tel:${tel}`);
    toast("Aggiungi telefono o email al noleggio per farti contattare", "error");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GestureDetector gesture={swipe}>
        <ScrollView
          testID="profile-scroll"
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={posts.isRefetching} onRefresh={() => { void posts.refetch(); void profilo.refetch(); }} tintColor={colors.brandPrimary} />}
        >
          <ProfileHero
            nome={user.name || "Il tuo nome"}
            username={dati?.user.username || user.username}
            categoria={categoria}
            bio={bio}
            link={link}
            foto={foto}
            cover={copertina}
            testIDCategoria="profile-role"
            onModifica={() => router.push("/account")}
            top={
              <View style={{ flexDirection: "row", alignItems: "center", paddingTop: insets.top, gap: spacing.sm }}>
                <Text style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }}>PROFILO</Text>
                <GlassButton testID="profile-export" icon="file-export-outline" accessibilityLabel="Esporta in PDF" onPress={() => setExportOpen(true)} />
                <GlassButton testID="profile-edit" icon="account-edit-outline" accessibilityLabel="Modifica profilo" onPress={() => router.push("/account")} />
                <GlassButton testID="profile-logout" icon="logout" accessibilityLabel="Esci" onPress={() => (logout(), toast("A presto"))} />
              </View>
            }
            stats={[
              { n: fotoLavori.length, label: "Foto", forte: true },
              { n: videoLavori.length, label: "Video" },
              { n: dati?.followers ?? 0, label: "Follower", onPress: () => router.push({ pathname: "/follow/[uid]", params: { uid: io, tipo: "followers" } }) },
              { n: dati?.following ?? 0, label: "Seguiti", onPress: () => router.push({ pathname: "/follow/[uid]", params: { uid: io, tipo: "following" } }) },
            ]}
            actions={
              <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: spacing.xs }}>
                <Button testID="profile-new-post" label="Nuovo lavoro" icon="plus" onPress={() => setComposer("post")} />
                <Button testID="profile-new-rental" label="Noleggio" variant="secondary" icon="video-vintage" onPress={() => setComposer("rental")} />
              </View>
            }
          />

          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
            <GlassSwitch
              testID="profile-tab"
              value={vista}
              onChange={cambiaVista}
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
              onOpen={(id) => router.push(`/post/${id}`)}
              vuoto={
                <Empty
                  icon="image-multiple-outline"
                  title="Nessuna foto nel portfolio"
                  subtitle="Pubblica un lavoro con una foto: qui diventa una vetrina pronta da esportare in PDF."
                  action={<Button label="Pubblica una foto" icon="plus" onPress={() => setComposer("post")} />}
                />
              }
            />
          ) : vista === "video" ? (
            <PortfolioGrid
              lavori={videoLavori}
              onOpen={(id) => router.push(`/post/${id}`)}
              vuoto={
                <Empty
                  icon="play-box-multiple-outline"
                  title="Nessun video"
                  subtitle="Carica un video dal pulsante Nuovo lavoro: resta qui, separato dalle foto, e non finisce nel PDF."
                  action={<Button label="Carica un video" icon="video-plus" onPress={() => setComposer("post")} />}
                />
              }
            />
          ) : (
            <RentalShowcase
              rental={rental}
              copertina={copertina}
              noleggi={noleggi}
              onOpen={(id) => router.push(`/post/${id}`)}
              pulsanti={
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button testID="profile-rental-post" label={haNoleggio ? "Pubblica noleggio" : "Aggiungi rental"} icon={haNoleggio ? "video-vintage" : "plus"} onPress={() => (haNoleggio ? setComposer("rental") : router.push("/account"))} />
                  {haNoleggio ? <Button label="Contatta" variant="secondary" icon="phone-outline" onPress={contatta} /> : null}
                </View>
              }
              vuoto={
                <Empty
                  icon="video-vintage"
                  title="Nessun noleggio pubblicato"
                  subtitle="Chi cerca attrezzatura deve vedere subito cosa affitti: prezzo, luogo e come scriverti."
                  action={<Button label="Pubblica un noleggio" icon="plus" onPress={() => setComposer("rental")} />}
                />
              }
            />
          )}
        </ScrollView>
      </GestureDetector>

      <PostComposer visible={composer !== null} defaultKind={composer === "rental" ? "rental" : "post"} hasRental={haNoleggio} onClose={() => setComposer(null)} />

      <ExportSheet
        visible={exportOpen}
        onClose={() => setExportOpen(false)}
        foto={fotoLavori}
        video={videoLavori}
        noleggi={noleggi}
        rental={rental}
        copertina={coverPath}
        profilo={{
          nome: user.name || "Il mio portfolio",
          username: dati?.user.username || user.username,
          categoria,
          bio,
          link,
          foto,
          email: rental.email,
          telefono: rental.telefono,
        }}
      />
    </View>
  );
}
