import { Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSegments } from "expo-router";

import { useChat } from "@/src/context/ChatContext";
import { useTheme } from "@/src/theme";
import { Glass } from "@/src/ui";

// Boris galleggia sopra la barra delle tab: prima copriva il tasto Home.
export default function FloatingChatButton() {
  const { setOpen } = useChat();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const nelleTabs = segments[0] === "(tabs)";
  const bottom = insets.bottom + (nelleTabs ? 84 : 16);

  return (
    <Pressable
      testID="chat-open-button"
      accessibilityRole="button"
      accessibilityLabel="Apri Boris, l'assistente"
      onPress={() => setOpen(true)}
      style={({ pressed }) => ({
        position: "absolute",
        right: 16,
        bottom,
        width: 52,
        height: 52,
        borderRadius: 26,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
        zIndex: 999,
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      })}
    >
      <Glass
        style={{
          flex: 1,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.divider,
        }}
      >
        <Image
          source={require("../../assets/images/boris-pesce.png")}
          style={{ width: 30, height: 30 }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Glass>
    </Pressable>
  );
}
