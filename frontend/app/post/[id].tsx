import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "@/src/components/PostCard";
import { api } from "@/src/api";
import { Comment, Post, PRIVACY_HINT, PostPrivacy } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, toast, useStyles } from "@/src/ui";

// Il post aperto: like, commenti, e se è tuo puoi cambiarne la visibilità o eliminarlo.
export default function PostDettaglio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [commento, setCommento] = useState("");

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
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable testID="post-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", flex: 1 }}>Post</Text>
      </View>

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
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 80 }} keyboardShouldPersistTaps="handled">
          <PostCard
            post={post.data}
            onLike={() => like.mutate()}
            onOpen={() => undefined}
            onAuthor={() => router.push(`/utente/${post.data!.author.user_id}`)}
          />

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

          <Text style={s.label}>Commenti {commenti.data?.length ? `(${commenti.data.length})` : ""}</Text>
          {(commenti.data ?? []).map((c) => (
            <View key={c.id} style={{ flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 13 }}>{c.author.name || `@${c.author.username}`}</Text>
              <Text style={{ color: colors.onSurface, fontSize: 13, flex: 1 }}>{c.text}</Text>
            </View>
          ))}
          {commenti.data?.length === 0 ? <Text style={s.muted}>Ancora nessun commento.</Text> : null}
        </ScrollView>
      )}

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.sm, paddingBottom: insets.bottom + spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider }}>
        <TextInput
          testID="comment-input"
          value={commento}
          onChangeText={setCommento}
          placeholder="Scrivi un commento…"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, color: colors.onSurface, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 }}
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
