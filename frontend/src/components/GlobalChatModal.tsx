import { useGlobalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useChat } from "../context/ChatContext";
import { api, askAssistantConAzioni, Project } from "../api";
import { strutturaPer } from "../modules";
import { toast } from "../ui";

type Msg = {
  role: "user" | "assistant";
  content: string;
  error?: boolean; // error bubbles are shown but never sent back to the model
};

export default function GlobalChatModal() {
  const { open, setOpen } = useChat();
  // On a project screen, the assistant also receives that project's title, type and logline.
  const params = useGlobalSearchParams<{ id?: string }>();
  const projectId = typeof params.id === "string" ? params.id : null;
  const qc = useQueryClient();

  // La struttura dei moduli va mandata insieme al messaggio: senza, il backend
  // tiene l'assistente in sola lettura. Nella home non c'è un progetto aperto,
  // quindi resta vuota e l'assistente risponde soltanto.
  const progetto = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
  const struttura = progetto.data ? strutturaPer(progetto.data) : [];

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    if (loading) return;

    const userMsg: Msg = {
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const r = await askAssistantConAzioni(
        userMsg.content,
        messages.filter((m) => !m.error),
        projectId,
        struttura
      );

      const assistantMsg: Msg = {
        role: "assistant",
        content: r.reply || "Fatto.",
      };

      setMessages([...newMessages, assistantMsg]);

      // Se l'assistente ha scritto qualcosa, le schermate devono rileggerlo.
      if (r.azioni?.length) {
        if (projectId) {
          void qc.invalidateQueries({ queryKey: ["items", projectId] });
          void qc.invalidateQueries({ queryKey: ["summary", projectId] });
          void qc.invalidateQueries({ queryKey: ["project", projectId] });
        }
        void qc.invalidateQueries({ queryKey: ["projects"] });
        toast(r.azioni[0] + (r.azioni.length > 1 ? ` (+${r.azioni.length - 1})` : ""));
      }
    } catch (e: any) {
      const assistantMsg: Msg = {
        role: "assistant",
        content: e?.message ?? "Errore dell’assistente",
        error: true,
      };

      setMessages([...newMessages, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={() => setOpen(false)}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Assistente IA</Text>
            {progetto.data ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {progetto.data.title}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setOpen(false)}
          >
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{
            padding: 16,
          }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.role === "user"
                  ? styles.user
                  : styles.assistant,
              ]}
            >
              <Text style={styles.text}>
                {item.content}
              </Text>
            </View>
          )}
        />

        {loading && (
          <ActivityIndicator
            style={{ marginBottom: 8 }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={projectId ? "Dimmi cosa mettere e dove..." : "Chiedimi qualcosa..."}
            multiline
          />

          <TouchableOpacity
            style={styles.send}
            onPress={send}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
  },
  close: {
    fontSize: 24,
    color: "#333",
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: "80%",
  },
  user: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
  },
  assistant: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
  },
  text: {
    color: "#111",
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    color: "white",
    fontSize: 20,
  },
});
