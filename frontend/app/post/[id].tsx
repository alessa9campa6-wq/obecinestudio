import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlacePicker, { Luogo } from "@/src/components/PlacePicker";
import PersonAvatar from "@/src/components/PersonAvatar";
import PostCard from "@/src/components/PostCard";
import { api } from "@/src/api";
import { Comment, Post, PRIVACY_HINT, PostPrivacy, tempoFa } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Glass, Icon, Sheet, toast, useStyles } from "@/src/ui";

// Il post aperto: foto grandi, commenti leggibili, e se è tuo la matita per
// modificarlo senza cancellarlo.
export default function PostDettaglio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [commento, setCommento] = useState("");
  const [modifica, setModifica] = useState(false);
  const [bozza, setBozza] = useState({ testo: "", prezzo: "", privacy: "public" as PostPrivacy, luogo: null as Luogo | null });

  const post = useQuery({ queryKey: ["post", id], queryFn: () => api<Post>(`/posts/${id}`) });
  const commenti = useQuery({ queryKey: ["comments", id], queryFn: () => api<Comment[]>(`/posts/${id}/comments`) });

  const aggiorna = () => {
    for (const chiave of ["post", "comments", "feed", "explore", "profile-posts"]) void qc.invalidateQueries({ queryKey: [chiave] });
  };

  const like = useMutation({
    mutationFn: () => api(`/posts/${id}/like`, { method: post.data?.liked ? "DELETE" : "POST" }),
    onSuccess: aggiorna,
  });
  const invia = useMutation({
    mutationFn: () => api(`/posts/${id}/comments`, { method: "POST", body: { text: commento.trim() } }),
    onSuccess: () => (setCommento(""), aggiorna()),
    onError: (e: Error) => toast(e.message, "error"),
  });
  const cambiaPrivacy = useMutation({
    mutationFn: (privacy: PostPrivacy) =>
      api(`/posts/${id}`, {
        method: "PUT",
        body: { text: post.data?.text ?? "", media: post.data?.media ?? [], kind: post.data?.kind ?? "post", privacy },
      }),
    onSuccess: () => (toast("Visibilità aggiornata"), aggiorna()),
    onError: (e: Error) => toast(e.message, "error"),
  });

  const apriModifica = () => {
    const p = post.data;
    if (!p) return;
    setBozza({
      testo: p.text,
      prezzo: p.price ?? "",
      privacy: p.privacy,
      luogo: p.place && p.lat != null && p.lng != null ? { label: p.place, place: p.place, city: p.city ?? "", lat: p.lat, lng: p.lng } : null,
    });
    setModifica(true);
  };

  const salva = useMutation({
    mutationFn: () =>
      api(`/posts/${id}`, {
        method: "PUT",
        body: {
          text: bozza.testo.trim(),
          media: post.data?.media ?? [],
          kind: post.data?.kind ?? "post",
          privacy: bozza.privacy,
          price: bozza.prezzo.trim(),
          place: bozza.luogo?.place ?? "",
          city: bozza.luogo?.city ?? "",
          lat: bozza.luogo?.lat ?? null,
          lng: bozza.luogo?.lng ?? null,
          ratios: post.data?.ratios ?? [],
        },
      }),
    onSuccess: () => {
      toast("Modifiche salvate");
      setModifica(false);
      aggiorna();
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const elimina = useMutation({
    mutationFn: () => api(`/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      aggiorna();
      toast("Post eliminato");
      router.back();
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Glass style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider }}>
        <Pressable testID="post-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", flex: 1 }}>Post</Text>
        {post.data?.is_mine ? (
          <Pressable testID="post-edit" onPress={apriModifica} hitSlop={10} style={{ padding: 4 }}>
            <Icon name="pencil-outline" size={21} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </Glass>

      {post.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : !post.data ? (
        <View style={{ padding: spacing.xl, gap: spacing.sm }}>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 20 }}>Post non disponibile</Text>
          <Text style={s.muted}>Potrebbe essere stato eliminato o non essere visibile a te.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 90 }} keyboardShouldPersistTaps="handled">
          <PostCard post={post.data} onLike={() => like.mutate()} onOpen={() => undefined} onAuthor={() => router.push(`/utente/${post.data!.author.user_id}`)} />

          {post.data.is_mine ? (
            <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
              <Text style={s.label}>Chi può vederlo</Text>
              <ChipRow>
                {(["public", "unlisted", "private"] as PostPrivacy[]).map((p) => (
                  <Chip key={p} testID={`post-privacy-change-${p}`} label={p === "public" ? "Pubblico" : p === "unlisted" ? "Non in elenco" : "Solo io"} selected={post.data!.privacy === p} onPress={() => cambiaPrivacy.mutate(p)} />
                ))}
              </ChipRow>
              <Text style={s.muted}>{PRIVACY_HINT[post.data.privacy]}</Text>
              <Button testID="post-delete" label="Elimina post" variant="secondary" icon="trash-can-outline" loading={elimina.isPending} onPress={() => elimina.mutate()} />
            </View>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingBottom: spacing.sm }}>
            <Text style={s.label}>Commenti</Text>
            {commenti.data?.length ? (
              <View style={{ backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1 }}>
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "800" }}>{commenti.data.length}</Text>
              </View>
            ) : null}
          </View>

          {(commenti.data ?? []).map((c) => (
            <View key={c.id} style={{ flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider }}>
              <PersonAvatar person={c.author} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 13 }}>
                  {c.author.name || `@${c.author.username}`}
                  <Text style={{ color: colors.muted, fontWeight: "400", fontSize: 11 }}>  · {tempoFa(c.created_at)}</Text>
                </Text>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 19, paddingTop: 2 }}>{c.text}</Text>
              </View>
            </View>
          ))}
          {commenti.data?.length === 0 ? <Text style={s.muted}>Ancora nessun commento: scrivi il primo.</Text> : null}
        </ScrollView>
      )}

      <Sheet
        testID="post-edit-sheet"
        visible={modifica}
        onClose={() => setModifica(false)}
        title="Modifica"
        footer={<Button testID="post-edit-save" label="Salva" loading={salva.isPending} onPress={() => salva.mutate()} />}
      >
        <Field testID="post-edit-text" label="Testo" value={bozza.testo} onChangeText={(v) => setBozza({ ...bozza, testo: v })} multiline minHeight={100} />
        {post.data?.kind === "rental" ? (
          <Field testID="post-edit-price" label="Prezzo" value={bozza.prezzo} onChangeText={(v) => setBozza({ ...bozza, prezzo: v })} placeholder="es. 350 €/giorno" />
        ) : null}
        <PlacePicker value={bozza.luogo} onChange={(v) => setBozza({ ...bozza, luogo: v })} label="Posizione" />
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Chi può vederlo</Text>
          <ChipRow>
            {(["public", "unlisted", "private"] as PostPrivacy[]).map((p) => (
              <Chip
                key={p}
                testID={`post-edit-privacy-${p}`}
                label={p === "public" ? "Pubblico" : p === "unlisted" ? "Non in elenco" : "Solo io"}
                selected={bozza.privacy === p}
                onPress={() => setBozza({ ...bozza, privacy: p })}
              />
            ))}
          </ChipRow>
          <Text style={s.muted}>{PRIVACY_HINT[bozza.privacy]}</Text>
        </View>
      </Sheet>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.sm, paddingBottom: insets.bottom + spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
        <TextInput
          testID="comment-input"
          value={commento}
          onChangeText={setCommento}
          placeholder="Scrivi un commento…"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.border }}
        />
        <Pressable
          testID="comment-send"
          onPress={() => (commento.trim() ? invia.mutate() : null)}
          disabled={!commento.trim()}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: commento.trim() ? colors.brandPrimary : colors.surfaceTertiary }}
        >
          <Icon name="send" size={20} color={commento.trim() ? colors.onBrandPrimary : colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}
