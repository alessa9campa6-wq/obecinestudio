import { useQuery } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { api } from "@/src/api";
import { fonts, useTheme } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

const icona = (name: IconName) =>
  function TabIcon({ color, size }: { color: string; size: number }) {
    return <Icon name={name} size={size} color={color} />;
  };

// Le cinque sezioni in basso, come un social: Home, Esplora, Messaggi, Strumenti, Profilo.
export default function TabsLayout() {
  const { colors } = useTheme();
  const messaggi = useQuery({ queryKey: ["messages"], queryFn: () => api<{ unread: number }>("/messages"), refetchInterval: 20000 });
  const nonletti = messaggi.data?.unread ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          height: Platform.OS === "ios" ? 84 : 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.text, fontSize: 10, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icona("home-variant-outline"), tabBarButtonTestID: "tab-home" }} />
      <Tabs.Screen name="esplora" options={{ title: "Esplora", tabBarIcon: icona("compass-outline"), tabBarButtonTestID: "tab-esplora" }} />
      <Tabs.Screen
        name="messaggi"
        options={{
          title: "Messaggi",
          tabBarIcon: icona("chat-outline"),
          tabBarButtonTestID: "tab-messaggi",
          tabBarBadge: nonletti > 0 ? nonletti : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: "#FFF", fontSize: 10 },
        }}
      />
      <Tabs.Screen name="strumenti" options={{ title: "Strumenti", tabBarIcon: icona("toolbox-outline"), tabBarButtonTestID: "tab-strumenti" }} />
      <Tabs.Screen name="profilo" options={{ title: "Profilo", tabBarIcon: icona("account-circle-outline"), tabBarButtonTestID: "tab-profilo" }} />
    </Tabs>
  );
}
