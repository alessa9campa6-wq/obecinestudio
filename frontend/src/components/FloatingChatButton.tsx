import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useChat } from "@/src/context/ChatContext";
import { spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

export default function FloatingChatButton() {
  const { setOpen } = useChat();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      testID="chat-open-button"
      accessibilityRole="button"
      accessibilityLabel="Apri assistente IA"
      onPress={() => setOpen(true)}
      style={({ pressed }) => ({
        position: "absolute",
        left: spacing.lg,
        bottom: insets.bottom + spacing.lg,
        minWidth: 48,
        height: 48,
        paddingHorizontal: 14,
        borderRadius: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,

        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,

        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        zIndex: 999,

        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Icon
        name="robot-outline"
        size={22}
        color={colors.brandPrimary}
      />
    </Pressable>
  );
}
