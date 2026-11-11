import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { palette } from "@/theme";
import { StoreProvider } from "@/store";
import Esplora from "@/screens/Esplora";
import Impostazioni from "@/screens/Impostazioni";
import Messaggi from "@/screens/Messaggi";
import Oggi from "@/screens/Oggi";
import Profilo from "@/screens/Profilo";
import Progetto from "@/screens/Progetto";
import Strumenti from "@/screens/Strumenti";
import { useApp } from "@/store";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Contenuto() {
  const { screen } = useApp();
  if (screen === "esplora") return <Esplora />;
  if (screen === "messaggi") return <Messaggi />;
  if (screen === "strumenti") return <Strumenti />;
  if (screen === "profilo") return <Profilo />;
  if (screen === "progetto") return <Progetto />;
  if (screen === "impostazioni") return <Impostazioni />;
  return <Oggi />;
}

export default function App() {
  const [pronti] = useFonts({
    Fraunces: require("./assets/fonts/Fraunces.ttf"),
    Geist: require("./assets/fonts/Geist.ttf"),
    CourierPrime: require("./assets/fonts/CourierPrime.ttf"),
  });

  useEffect(() => {
    if (pronti) SplashScreen.hideAsync().catch(() => {});
  }, [pronti]);

  if (!pronti) return <View style={{ flex: 1, backgroundColor: palette.nero }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>
        <Contenuto />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
