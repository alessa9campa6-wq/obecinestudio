import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Stato della chat dell'assistente: aperta/chiusa e progetto su cui sta lavorando.
// projectId è opzionale: in _layout la chat è globale, nel dettaglio progetto
// riceve l'id così l'assistente sa su quale progetto intervenire.
type ChatState = {
  open: boolean;
  setOpen: (v: boolean) => void;
  projectId: string | null;
};

const ChatContext = createContext<ChatState>({ open: false, setOpen: () => {}, projectId: null });

export function ChatProvider({
  projectId = null,
  children,
}: {
  projectId?: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, projectId }), [open, projectId]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
