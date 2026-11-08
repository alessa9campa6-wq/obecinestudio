import { Modal, Pressable, useWindowDimensions, View } from "react-native";

import BorisChat from "@/src/components/BorisChat";
import { useChat } from "@/src/context/ChatContext";
import { useHub } from "@/src/hub";
import { radius, spacing, useTheme } from "@/src/theme";

// Contenitore della chat nel dettaglio progetto: scheda laterale su iPad/Mac,
// foglio dal basso su iPhone. Dentro c'è sempre BorisChat.
export default function ChatPanel() {
  const { open, setOpen } = useChat();
  const { project } = useHub();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <Modal visible={open} transparent animationType={wide ? "fade" : "slide"} onRequestClose={() => setOpen(false)}>
      <View
        style={{
          flex: 1,
          flexDirection: wide ? "row" : "column",
          justifyContent: "flex-end",
          alignItems: wide ? "flex-end" : "stretch",
          backgroundColor: colors.backdrop,
        }}
      >
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => setOpen(false)} />
        <View
          testID="chat-panel"
          style={[
            { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
            wide
              ? { width: Math.min(440, width - 48), height: height - 48, margin: spacing.xl, borderRadius: radius.lg }
              : { width: "100%", maxHeight: height * 0.88, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
          ]}
        >
          <BorisChat projectId={project.id} onClose={() => setOpen(false)} />
        </View>
      </View>
    </Modal>
  );
}
