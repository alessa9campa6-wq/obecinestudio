<<<<<<< HEAD
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Stato della chat dell'assistente: aperta/chiusa e progetto su cui sta lavorando.
type ChatState = {
  open: boolean;
  setOpen: (v: boolean) => void;
  projectId: string | null;
};

const ChatContext = createContext<ChatState>({ open: false, setOpen: () => {}, projectId: null });

export function ChatProvider({ projectId, children }: { projectId: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, projectId }), [open, projectId]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
=======
import React, { createContext, useContext, useState } from "react";
import { ReactNode } from "react";

type ChatContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const ChatContext = createContext<ChatContextType>({
  open: false,
  setOpen: () => {},
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <ChatContext.Provider value={{ open, setOpen }}>
      {children}
    </ChatContext.Provider>
  );
};
>>>>>>> 13428db (Calendario in home)

export const useChat = () => useContext(ChatContext);
