import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { initOfflineSync } from "@/src/api";
import { AuthProvider, useAuth } from "@/src/auth";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { persister, queryClient } from "@/src/query-client";
import { loadColorScheme, useTheme } from "@/src/theme";
import { ToastHost } from "@/src/ui";
import { ChatProvider } from "@/src/context/ChatContext";
import FloatingChatButton from "@/src/components/FloatingChatButton";
import GlobalChatModal from "@/src/components/GlobalChatModal";

LogBox.ignoreAllLogs(true);

function Gate() {
  const { user, loading } = useAuth();
  const { colors, scheme } = useTheme();
  const [fontsLoaded] = useFonts({
    Fraunces: require("../assets/fonts/Fraunces.ttf"),
    Geist: require("../assets/fonts/Geist.ttf"),
    CourierPrime: require("../assets/fonts/CourierPrime.ttf"),
  });
  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="home2" />
          <Stack.Screen name="project/[id]" />
          <Stack.Screen name="account" />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="utente/[id]" />
          <Stack.Screen name="dm/[id]" />
          <Stack.Screen name="strumenti/persone" />
          <Stack.Screen name="strumenti/attrezzatura" />
          <Stack.Screen name="strumenti/viewfinder" />
          <Stack.Screen name="strumenti/formati" />
          <Stack.Screen name="follow/[uid]" />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
      {user ? (
        <>
          <FloatingChatButton />
          <GlobalChatModal />
        </>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    loadColorScheme();
    const unsub = initOfflineSync();
    return () => unsub();
  }, []);
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          <KeyboardProvider>
            <AuthProvider>
              <ChatProvider>
                <Gate />
              </ChatProvider>
            </AuthProvider>
          </KeyboardProvider>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
