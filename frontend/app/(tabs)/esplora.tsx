import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import PlacePicker, { Luogo } from "@/src/components/PlacePicker";
import PersonAvatar from "@/src/components/PersonAvatar";
import PostCard from "@/src/components/PostCard";
import { api, fileUrl } from "@/src/api";
import { nomePersona, Person, Post, RentalListItem } from "@/src/social";
import GlassSwitch from "@/src/components/GlassSwitch";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Field, Icon, Sheet, useStyles } from "@/src/ui";
import { storage } from "@/src/utils/storage";

type Vista = "post" | "rental";

// Esplora: in alto cerchi persone, sotto un solo tocco per passare dai post dei
// filmmaker alle attività rental (e ritorno). Nella vista rental si cercano sia
// i rental sia i loro prodotti.
export default function Esplora() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [cerca, setCerca] = useState("");
  const [vista, setVista] = useState<Vista>("post");
  const [posizione, setPosizione] = useState<Luogo | null>(null);
  const [citta, setCitta] = useState<Luogo | null>(null);
  const [scegliDove, setScegliDove] = useState(false);
  const [cittaTesto, setCittaTesto] = useState("");
  const [cittaCerca, setCittaCerca] = useState("");
  const termine = cerca.trim();

  // L'ultima posizione scelta (dal caricamento di un post o da qui) guida
  // l'ordine dei noleggi: prima quelli più vicini.
  useEffect(() => {
    void storage.getItem<string>("my_place", "").then((raw) => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw) as Luogo;
        if (typeof v?.lat === "number" && typeof v?.lng === "number") setPosizione(v);
      } catch {
        // posizione salvata da una versione vecchia: si ignora
      }
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCittaCerca(cittaTesto.trim()), 400);
    return () => clearTimeout(t);
  }, [cittaTesto]);

  const luoghi = useQuery({
    queryKey: ["places-city", cittaCerca],
    queryFn: () => api<Luogo[]>(`/places?q=${encodeURIComponent(cittaCerca)}`),
    enabled: cittaCerca.length >= 3,
    staleTime: 60_000,
  });

  const salvaPosizione = (v: Luogo | null) => {
    setPosizione(v);
    if (v) void storage.setItem("my_place", JSON.stringify(v));
  };

  const persone = useQuery({
    queryKey: ["suggested", termine],
    queryFn: () => api<Person[]>(`/people/suggested?q=${encodeURIComponent(termine)}`),
  });
  const filmmaker = useQuery({ queryKey: ["explore", "post"], queryFn: () => api<Post[]>("/explore?kind=post") });
  const rentals = useQuery({
    queryKey: ["rentals", termine, posizione?.lat ?? null, posizione?.lng ?? null, citta?.city ?? ""],
    queryFn: () => {
      const q = new URLSearchParams();
      if (termine) q.set("q", termine);
      if (posizione) {
        q.set("lat", String(posizione.lat));
        q.set("lng", String(posizione.lng));
      }
      if (citta?.city) q.set("city", citta.city);
      return api<RentalListItem[]>(`/rentals?${q.toString()}`);
    },
    enabled: vista === "rental",
  });

  const post = filmmaker.data ?? [];
  const elencoRental = rentals.data ?? [];

  const like = useMutation({
    mutationFn: (p: Post) => api(`/posts/${p.id}/like`, { method: p.liked ? "DELETE" : "POST" }),
    onSuccess: () => {
      for (const chiave of ["explore", "feed", "post", "profile-posts"]) void qc.invalidateQueries({ queryKey: [chiave] });
    },
  });

  const aggiorna = () => {
    void persone.refetch();
    void filmmaker.refetch();
    void rentals.refetch();
  };

  const interruttore = (
    <GlassSwitch
      testID="explore-tab"
      value={vista}
      onChange={setVista}
      options={[
        { value: "post", label: "Post filmmaker", icon: "movie-open" },
        { value: "rental", label: "Rental", icon: "video-vintage" },
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
        <Field
          testID="explore-search"
          value={cerca}
          onChangeText={setCerca}
          placeholder={
            vista === "rental"
              ? "Cerca un rental o un prodotto: es. Alexa 35, Milano"
              : "Cerca persone: @nome o nome e cognome"
          }
        />
      </View>

      <ScrollView
        testID="explore-scroll"
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={filmmaker.isRefetching || rentals.isRefetching} onRefresh={aggiorna} tintColor={colors.brandPrimary} />}
        keyboardShouldPersistTaps="handled"
      >
        {vista === "post" && termine.length >= 2 ? (
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

            {vista === "rental" ? (
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                  <Icon name="crosshairs-gps" size={18} color={colors.brandPrimary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
                      {citta ? `Rental a ${citta.city || citta.label}` : posizione ? `Rental vicino a ${posizione.city || posizione.label}` : "Rental vicino a te"}
                    </Text>
                    <Text style={s.muted} numberOfLines={1}>
                      {citta ? "Ordinati dal più vicino alla città scelta" : posizione ? "Dal più vicino, con la distanza in km" : "Imposta la posizione per vedere prima i rental vicini"}
                    </Text>
                  </View>
                  <Button testID="explore-place" label={posizione || citta ? "Cambia" : "Imposta"} variant="secondary" small onPress={() => setScegliDove(true)} />
                </View>

                <Field testID="explore-city" value={cittaTesto} onChangeText={setCittaTesto} placeholder="Filtra per città: es. Milano, Torino, Bari" />
                {cittaCerca.length >= 3 ? (
                  <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, overflow: "hidden" }}>
                    {(luoghi.data ?? []).slice(0, 4).map((l, i) => (
                      <Pressable
                        key={`${l.label}-${i}`}
                        testID={`explore-city-result-${i}`}
                        onPress={() => {
                          setCitta(l);
                          setCittaTesto(l.city || l.label);
                        }}
                        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surfaceSecondary, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.divider }}
                      >
                        <Icon name="city-variant-outline" size={16} color={colors.brandPrimary} />
                        <Text style={{ flex: 1, color: colors.onSurface, fontSize: 13 }} numberOfLines={1}>{l.label}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>scegli</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {citta ? (
                  <Pressable testID="explore-city-clear" onPress={() => { setCitta(null); setCittaTesto(""); }} style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Icon name="close-circle-outline" size={14} color={colors.muted} />
                    <Text style={{ color: colors.muted, fontSize: 12 }}>Togli il filtro città</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {vista === "post" ? (
              filmmaker.isLoading ? (
                <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.lg }} />
              ) : post.length === 0 ? (
                <Empty icon="movie-open-outline" title="Ancora nessun post" subtitle="Quando altri filmmaker pubblicano, li trovi qui: un tocco e passi ai rental." />
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
              )
            ) : rentals.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.lg }} />
            ) : elencoRental.length === 0 ? (
              <Empty
                icon="video-vintage"
                title={termine ? "Nessun rental trovato" : "Ancora nessun rental"}
                subtitle={
                  termine
                    ? `Nessun rental o prodotto per “${termine}”. Prova con il nome del prodotto, del rental o della città.`
                    : "Quando un rental attiva la sua vetrina, lo trovi qui con i suoi prodotti."
                }
                action={
                  termine ? (
                    <Pressable onPress={() => setCerca("")}>
                      <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>Togli la ricerca</Text>
                    </Pressable>
                  ) : undefined
                }
              />
            ) : (
              elencoRental.map((r) => (
                <RentalRow
                  key={r.user_id}
                  rental={r}
                  onPress={() => router.push({ pathname: "/utente/[id]", params: { id: r.user_id, tab: "noleggi" } })}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <Sheet
        testID="explore-place-sheet"
        visible={scegliDove}
        onClose={() => setScegliDove(false)}
        title="Da dove cerchi"
        footer={<Button label="Fatto" onPress={() => setScegliDove(false)} />}
      >
        <PlacePicker value={posizione} onChange={(v) => { salvaPosizione(v); if (v) setCitta(null); }} label="La tua posizione" />
        <Text style={[s.muted, { fontSize: 12 }]}>La usiamo solo per ordinare i rental dal più vicino. Puoi cambiarla quando vuoi.</Text>
      </Sheet>
    </View>
  );
}

// Un rental in Esplora: attività, città e i primi prodotti della vetrina.
function RentalRow({ rental, onPress }: { rental: RentalListItem; onPress: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const primo = rental.products.find((p) => p.cover)?.cover;
  const cover = rental.rental.cover || primo || "";
  const dove = [rental.rental.citta, rental.distance_km != null ? `${rental.distance_km} km` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      testID={`explore-rental-${rental.user_id}`}
      onPress={onPress}
      style={{
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ height: 132, backgroundColor: colors.surfaceTertiary }}>
        {cover ? (
          <Image
            source={{ uri: fileUrl(cover) }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : null}
      </View>
      <View style={{ padding: spacing.md, gap: 3 }}>
        <Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
          {rental.rental.nome}
        </Text>
        <Text style={s.muted} numberOfLines={1}>
          {dove || "Posizione non indicata"} · {rental.count} {rental.count === 1 ? "prodotto" : "prodotti"}
        </Text>
        {rental.products.length ? (
          <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12.5 }} numberOfLines={2}>
            {rental.products.map((p) => [p.text, p.price].filter(Boolean).join(" ")).filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
