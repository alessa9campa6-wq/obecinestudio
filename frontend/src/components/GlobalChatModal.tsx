import { useGlobalSearchParams } from "expo-router";
import { Modal } from "react-native";

import BorisChat from "./BorisChat";
import { useChat } from "../context/ChatContext";

// Chat della home (e delle schermate senza progetto): stesso identico componente
// usato nel dettaglio progetto, così Boris ha un solo aspetto in tutta l'app.
export default function GlobalChatModal() {
  const { open, setOpen } = useChat();
  const params = useGlobalSearchParams<{ id?: string }>();
  const projectId = typeof params.id === "string" ? params.id : null;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <BorisChat projectId={projectId} onClose={() => setOpen(false)} fullScreen />
    </Modal>
  );
}
