import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FollowButton from "@/src/components/FollowButton";
import GlassSwitch from "@/src/components/GlassSwitch";
import PersonAvatar from "@/src/components/PersonAvatar";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { categoriePersona } from "@/src/modules";
import { Person } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Empty, Icon } from "@/src/ui";

// Chi mi segue e chi seguo: due elenchi, si passa dall'uno all'altro con un tocco.
export default function FollowList() {
  const { uid, tipo } = useLocalSearchParams<{ uid: string; tipo?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const attivo: "followers" | "following" = tipo === "following" ? "following" : "followers";
  const q = useQuery({
    queryKey: ["follow-list", uid, tipo],
    queryFn: () => api<Person[]>(`/users/${uid}/${attivo}`),
    enabled: !!uid,
  });
  const persone = q.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable testID="follow-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ flex: 1, color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 16 }}>
          {attivo === "followers" ? "Follower" : "Seguiti"}
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <GlassSwitch
          testID="follow-tab"
          value={attivo}
          onChange={(v) => router.setParams({ tipo: v })}
          options={[
            { value: "followers", label: "Follower", icon: "account-heart-outline" },
            { value: "following", label: "Seguiti", icon: "account-multiple-outline" },
          ]}
        />
      </View>

      {q.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          testID="follow-list"
          data={persone}
          keyExtractor={(p) => p.user_id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <Empty
              icon={attivo === "followers" ? "account-heart-outline" : "account-multiple-outline"}
              title={attivo === "followers" ? "Ancora nessun follower" : "Non segui nessuno"}
              subtitle={attivo === "followers" ? "Pubblica e fatti trovare in Esplora: chi ti segue compare qui." : "Cerca filmmaker e rental in Esplora e tocca Segui."}
            />
          }
          renderItem={({ item }) => {
            const categoria = categoriePersona(item);
            return (
              <Pressable
                testID={`follow-row-${item.user_id}`}
                onPress={() => router.push(`/utente/${item.user_id}`)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  padding: spacing.sm,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <PersonAvatar person={item} size={44} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text numberOfLines={1} style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 14 }}>
                    {item.name || item.username || "Utente"}
                  </Text>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>
                    @{item.username || "utente"}
                  </Text>
                  {categoria ? (
                    <Text numberOfLines={1} style={{ color: colors.brandPrimary, fontSize: 11, fontWeight: "700" }}>
                      {categoria}
                    </Text>
                  ) : null}
                </View>
                {item.user_id !== user?.user_id ? (
                  <FollowButton userId={item.user_id} following={!!item.following} />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
