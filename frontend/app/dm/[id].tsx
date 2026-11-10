import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PersonAvatar from "@/src/components/PersonAvatar";
import { api } from "@/src/api";
import { DirectMessage, nomePersona, Profile } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon, toast } from "@/src/ui";

// La conversazione con una persona: bolle a destra e sinistra, si aggiorna da sola.
export default function Conversazione() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const lista = useRef<FlatList<DirectMessage>>(null);
  const [testo, setTesto] = useState("");

  const profilo = useQuery({ queryKey: ["profile", id], queryFn: () => api<Profile>(`/users/${id}`) });
  const filo = useQuery({
    queryKey: ["dms", id],
    queryFn: () => api<DirectMessage[]>(`/messages/${id}`),
    refetchInterval: 4000,
  });

  const invia = useMutation({
    mutationFn: () => api(`/messages/${id}`, { method: "POST", body: { text: testo.trim() } }),
    onSuccess: () => {
      setTesto("");
      void qc.invalidateQueries({ queryKey: ["dms", id] });
      void qc.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  useEffect(() => {
    const n = filo.data?.length ?? 0;
    if (n) setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 60);
  }, [filo.data?.length]);

  const persona = profilo.data?.user;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable testID="dm-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Pressable style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }} onPress={() => router.push(`/utente/${id}`)}>
          <PersonAvatar person={persona} size={36} />
          <View>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700" }} numberOfLines={1}>
              {nomePersona(persona)}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>@{persona?.username || "utente"}</Text>
          </View>
        </Pressable>
      </View>

      {filo.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          ref={lista}
          testID="dm-messages"
          data={filo.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl }}>
              <PersonAvatar person={persona} size={64} />
              <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 18 }}>{nomePersona(persona)}</Text>
              <Text style={{ color: colors.muted, textAlign: "center" }}>Scrivigli il primo messaggio: di cosa hai bisogno?</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.from_me ? "flex-end" : "flex-start",
                maxWidth: "78%",
                backgroundColor: item.from_me ? colors.brandPrimary : colors.surfaceSecondary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.lg,
              }}
            >
              <Text style={{ color: item.from_me ? colors.onBrandPrimary : colors.onSurface, fontSize: 15, lineHeight: 20 }}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.sm, paddingBottom: insets.bottom + spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider }}>
        <TextInput
          testID="dm-input"
          value={testo}
          onChangeText={setTesto}
          placeholder="Scrivi un messaggio…"
          placeholderTextColor={colors.muted}
          multiline
          style={{ flex: 1, maxHeight: 120, color: colors.onSurface, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15 }}
        />
        <Pressable
          testID="dm-send"
          onPress={() => (testo.trim() ? invia.mutate() : null)}
          disabled={!testo.trim() || invia.isPending}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: testo.trim() ? colors.brandPrimary : colors.surfaceTertiary }}
        >
          <Icon name="send" size={20} color={testo.trim() ? colors.onBrandPrimary : colors.muted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
