import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PersonAvatar from "@/src/components/PersonAvatar";
import { api } from "@/src/api";
import { nomePersona, tempoFa, Thread } from "@/src/social";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Icon, useStyles } from "@/src/ui";

// I messaggi con le altre persone: una riga per conversazione, come su Instagram.
export default function Messaggi() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const q = useQuery({
    queryKey: ["messages"],
    queryFn: () => api<{ unread: number; threads: Thread[] }>("/messages"),
    refetchInterval: 15000,
  });
  const threads = q.data?.threads ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text style={[s.h1, { flex: 1, fontSize: 26 }]}>Messaggi</Text>
        {(q.data?.unread ?? 0) > 0 ? (
          <View style={{ backgroundColor: colors.error, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
            <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>{q.data?.unread}</Text>
          </View>
        ) : null}
        <Icon name="chat-outline" size={22} color={colors.brandPrimary} />
      </View>

      {q.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          testID="dm-list"
          data={threads}
          keyExtractor={(t) => t.user_id}
          contentContainerStyle={{ paddingVertical: spacing.sm, paddingBottom: insets.bottom + 90 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <Empty
              icon="message-text-outline"
              title="Nessun messaggio"
              subtitle="Trova un filmmaker in Esplora e scrivigli da qui o dal suo profilo."
              action={<Button label="Vai a Esplora" icon="compass-outline" onPress={() => router.push("/esplora")} />}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`dm-thread-${item.user_id}`}
              onPress={() => router.push(`/dm/${item.user_id}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
            >
              <PersonAvatar person={item.user} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700" }} numberOfLines={1}>
                  {nomePersona(item.user)}
                </Text>
                <Text style={{ color: item.read || item.from_me ? colors.muted : colors.onSurface, fontSize: 13 }} numberOfLines={1}>
                  {item.from_me ? "Tu: " : ""}
                  {item.text}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{tempoFa(item.created_at)}</Text>
                {!item.read && !item.from_me ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary }} /> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
