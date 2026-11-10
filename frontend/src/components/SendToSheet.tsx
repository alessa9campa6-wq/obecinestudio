import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import PersonAvatar from "@/src/components/PersonAvatar";
import { api } from "@/src/api";
import { nomePersona, Person, Thread } from "@/src/social";
import { spacing, useTheme } from "@/src/theme";
import { Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

// Invia il post a un'altra persona dell'app: si sceglie chi, e nella
// conversazione arriva il post con miniatura e titolo, non una frase copiata.
export default function SendToSheet({
  visible,
  onClose,
  post,
}: {
  visible: boolean;
  onClose: () => void;
  post: { id: string } | null;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const router = useRouter();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const cerca = q.trim();

  const risultati = useQuery({
    queryKey: ["people-search", cerca],
    queryFn: () => api<Person[]>(`/people/search?q=${encodeURIComponent(cerca)}`),
    enabled: visible && cerca.length >= 2,
  });
  const suggeriti = useQuery({
    queryKey: ["people-suggested", "send"],
    queryFn: () => api<Person[]>(`/people/suggested?limit=20`),
    enabled: visible && cerca.length < 2,
  });
  const recenti = useQuery({
    queryKey: ["messages"],
    queryFn: () => api<{ unread: number; threads: Thread[] }>("/messages"),
    enabled: visible && cerca.length < 2,
  });

  const invia = useMutation({
    mutationFn: (uid: string) => api(`/messages/${uid}`, { method: "POST", body: { text: "", post_id: post?.id } }),
    onSuccess: (_r, uid) => {
      void qc.invalidateQueries({ queryKey: ["messages"] });
      void qc.invalidateQueries({ queryKey: ["dms", uid] });
      toast("Post inviato");
      setQ("");
      onClose();
      router.push(`/dm/${uid}`);
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  // Chi ho già sentito compare una volta sola, poi le persone suggerite.
  const visti = new Set<string>();
  const persone: Person[] = [];
  for (const p of [...((recenti.data?.threads ?? []).map((t) => t.user)), ...(suggeriti.data ?? [])]) {
    if (!p?.user_id || visti.has(p.user_id)) continue;
    visti.add(p.user_id);
    persone.push(p);
  }
  const lista = cerca.length >= 2 ? risultati.data ?? [] : persone;
  const caricamento = cerca.length >= 2 ? risultati.isLoading : suggeriti.isLoading || recenti.isLoading;

  const riga = (p: Person) => (
    <Pressable
      key={p.user_id}
      testID={`send-to-${p.user_id}`}
      onPress={() => invia.mutate(p.user_id)}
      disabled={invia.isPending}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: 12,
        backgroundColor: pressed ? colors.surfaceTertiary : "transparent",
        opacity: invia.isPending && invia.variables !== p.user_id ? 0.5 : 1,
      })}
    >
      <PersonAvatar person={p} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 14.5 }} numberOfLines={1}>
          {nomePersona(p)}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12.5 }} numberOfLines={1}>
          @{p.username || "utente"}
        </Text>
      </View>
      {invia.isPending && invia.variables === p.user_id ? (
        <ActivityIndicator color={colors.brandPrimary} />
      ) : (
        <Icon name="send" size={18} color={colors.brandPrimary} />
      )}
    </Pressable>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Invia a…" testID="send-to-sheet">
      <Field testID="send-to-search" label="Cerca una persona" value={q} onChangeText={setQ} placeholder="Nome o @nome utente" autoCapitalize="none" />
      <Text style={s.muted}>Il post arriva nella conversazione, con la sua foto. Chi lo riceve lo apre dal messaggio.</Text>
      {caricamento ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : lista.length === 0 ? (
        <Text style={s.muted}>{cerca.length >= 2 ? "Nessuna persona trovata con questo nome." : "Non c'è ancora nessuno da suggerire: cerca per nome."}</Text>
      ) : (
        <View style={{ gap: 2 }}>
          {cerca.length < 2 && persone.length ? <Text style={s.label}>Conversazioni e persone</Text> : null}
          {lista.map(riga)}
        </View>
      )}
    </Sheet>
  );
}
