import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PersonAvatar from "@/src/components/PersonAvatar";
import { HeroCard } from "@/src/components/SectionHero";
import { api } from "@/src/api";
import { nomePersona, tempoFa, Thread } from "@/src/social";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, Icon, useStyles } from "@/src/ui";

// I messaggi con le altre persone: una scheda per conversazione, come su Instagram.
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
  const nonletti = q.data?.unread ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {q.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          testID="dm-list"
          data={threads}
          keyExtractor={(t) => t.user_id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120, gap: spacing.sm }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} />}
          ListHeaderComponent={
            <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm }}>
              <HeroCard
                icon="chat-outline"
                eyebrow="Messaggi"
                title="Le tue conversazioni"
                pills={[
                  { icon: "chat-outline", text: `${threads.length} ${threads.length === 1 ? "conversazione" : "conversazioni"}` },
                  ...(nonletti ? [{ icon: "email-outline" as const, text: `${nonletti} da leggere` }] : []),
                ]}
              />
              {threads.length ? <Text style={s.label}>Conversazioni</Text> : null}
            </View>
          }
          ListEmptyComponent={
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Empty
                icon="message-text-outline"
                title="Nessun messaggio"
                subtitle="Trova un filmmaker in Esplora e scrivigli da qui o dal suo profilo."
                action={<Button label="Vai a Esplora" icon="compass-outline" onPress={() => router.push("/esplora")} />}
              />
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Pressable testID={`dm-thread-${item.user_id}`} onPress={() => router.push(`/dm/${item.user_id}`)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}>
                <Glass style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: colors.divider }}>
                  <PersonAvatar person={item.user} size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700" }} numberOfLines={1}>
                      {nomePersona(item.user)}
                    </Text>
                    <Text style={{ color: item.read || item.from_me ? colors.muted : colors.onSurface, fontSize: 12.5 }} numberOfLines={1}>
                      {item.from_me ? "Tu: " : ""}
                      {item.text || (item.post_id ? "Ha condiviso un post" : "")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ color: colors.muted, fontSize: 10.5 }}>{tempoFa(item.created_at)}</Text>
                    {!item.read && !item.from_me ? (
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
                        <Icon name="email" size={10} color={colors.onBrandPrimary} />
                      </View>
                    ) : (
                      <Icon name="chevron-right" size={16} color={colors.muted} />
                    )}
                  </View>
                </Glass>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
