import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl } from "@/src/api";
import { useAuth } from "@/src/auth";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Glass, Icon, IconName } from "@/src/ui";

// Icona piena quando la sezione è attiva, contorno quando no: è quello che dà
// il tocco "moderno" alla barra.
const icona = (piena: IconName, vuota: IconName) =>
  function TabIcon({ color, size, focused }: { color: string; size: number; focused?: boolean }) {
    return <Icon name={focused ? piena : vuota} size={size - 1} color={color} />;
  };

// La scheda Profilo mostra la tua foto, come su Instagram.
function ProfileIcon({ color, size, focused }: { color: string; size: number; focused?: boolean }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const pic = user?.picture ? (/^https?:\/\//i.test(user.picture) ? user.picture : fileUrl(user.picture)) : null;
  if (!pic) return <Icon name={focused ? "account-circle" : "account-circle-outline"} size={size - 1} color={color} />;
  return (
    <View
      style={{
        width: size - 2,
        height: size - 2,
        borderRadius: (size - 2) / 2,
        overflow: "hidden",
        borderWidth: focused ? 2 : 1,
        borderColor: focused ? colors.brandPrimary : colors.divider,
      }}
    >
      <Image source={{ uri: pic }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
    </View>
  );
}

// Le cinque sezioni in basso, come un social: Home, Esplora, Messaggi, Strumenti, Profilo.
export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const messaggi = useQuery({ queryKey: ["messages"], queryFn: () => api<{ unread: number }>("/messages"), refetchInterval: 20000 });
  const nonletti = messaggi.data?.unread ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Cambio sezione con una breve animazione, non uno scatto secco.
        animation: "shift",
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        // Barra flottante di vetro: galleggia sopra il contenuto.
        tabBarStyle: {
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          bottom: Math.max(insets.bottom, 10),
          height: 66,
          borderRadius: radius.pill,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        tabBarBackground: () => (
          <Glass style={{ flex: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider }} intensity={80} />
        ),
        tabBarLabelStyle: { fontFamily: fonts.text, fontSize: 10, fontWeight: "600" },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icona("home-variant", "home-variant-outline"), tabBarButtonTestID: "tab-home" }} />
      <Tabs.Screen name="esplora" options={{ title: "Esplora", tabBarIcon: icona("compass", "compass-outline"), tabBarButtonTestID: "tab-esplora" }} />
      <Tabs.Screen
        name="messaggi"
        options={{
          title: "Messaggi",
          tabBarIcon: icona("message-text", "message-text-outline"),
          tabBarButtonTestID: "tab-messaggi",
          tabBarBadge: nonletti > 0 ? nonletti : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: "#FFF", fontSize: 10 },
        }}
      />
      <Tabs.Screen name="strumenti" options={{ title: "Strumenti", tabBarIcon: icona("toolbox", "toolbox-outline"), tabBarButtonTestID: "tab-strumenti" }} />
      <Tabs.Screen name="profilo" options={{ title: "Profilo", tabBarIcon: ProfileIcon, tabBarButtonTestID: "tab-profilo" }} />
    </Tabs>
  );
}

