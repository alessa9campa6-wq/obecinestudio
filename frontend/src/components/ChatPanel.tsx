import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useChat } from "@/src/context/ChatContext";
import { useHub } from "@/src/hub";
import { MODULES } from "@/src/modules";
import { fonts, radius, spacing, type as t, useTheme } from "@/src/theme";
import { Button, toast } from "@/src/ui";

type Msg = { role: "user" | "assistant"; content: string };
type Risposta = { reply: string; azioni?: string[] };

const MAX_CAMPI = 24;

// Cosa l'assistente può compilare in questo progetto: moduli, sezioni dei
// documenti (soggetto, trattamento...) e campi delle liste (personaggi, scene...).
function strutturaPer(project: { type: string; modules?: string[] }) {
  return MODULES.filter((m) => !m.types || m.types.includes(project.type) || (project.modules ?? []).includes(m.key))
    .filter((m) => m.kind === "doc" || m.kind === "list")
    .map((m) => ({
      modulo: m.key,
      etichetta: m.label,
      tipo: m.kind,
      sezioni: (m.sections ?? []).map((sec) => ({ key: sec.key, label: sec.label })),
      campi: (m.fields ?? []).slice(0, MAX_CAMPI).map((f) => ({ key: f.key, label: f.label, tipo: f.type })),
    }));
}

export default function ChatPanel() {
  const { open, setOpen } = useChat();
  const { project } = useHub();
  const qc = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 768;
  const scroll = useRef<ScrollView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Ciao! Posso scrivere al posto tuo nei moduli di questo progetto. Dimmi cosa mettere e dove, per esempio: «scrivi questa sinossi nella sezione Soggetto» oppure «aggiungi una scena in INT. NOTTE alla location Casa».",
    },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const message = text.trim();
    if (!message || sending) return;
    setText("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);
    try {
      const r = await api<Risposta>("/assistant", {
        method: "POST",
        body: {
          message,
          history: messages.slice(-10),
          project_id: project.id,
          struttura: strutturaPer(project),
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: r.reply || "Fatto." }]);
      if (r.azioni?.length) {
        qc.invalidateQueries({ queryKey: ["items", project.id] });
        qc.invalidateQueries({ queryKey: ["summary", project.id] });
        qc.invalidateQueries({ queryKey: ["project", project.id] });
        toast(r.azioni[0] + (r.azioni.length > 1 ? ` (+${r.azioni.length - 1})` : ""));
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: e?.message ?? "Errore imprevisto" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType={wide ? "fade" : "slide"} onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, flexDirection: wide ? "row" : "column", justifyContent: wide ? "flex-end" : "flex-end", alignItems: wide ? "flex-end" : "stretch", backgroundColor: colors.backdrop }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => setOpen(false)} />
        <View
          testID="chat-panel"
          style={[
            { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
            wide
              ? { width: Math.min(460, width - 48), height: height - 48, margin: spacing.xl, borderRadius: radius.lg }
              : { width: "100%", maxHeight: height * 0.85, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insets.bottom },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: t.lg + 1, fontWeight: "600", color: colors.onSurface }}>Assistente</Text>
              <Text style={{ fontFamily: fonts.text, fontSize: t.sm, color: colors.muted }} numberOfLines={1}>
                {project.title}
              </Text>
            </View>
            <Button testID="chat-close-button" icon="close" variant="secondary" small onPress={() => setOpen(false)} />
          </View>

          <ScrollView
            ref={scroll}
            testID="chat-messages"
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m, i) => (
              <View
                key={`${i}-${m.role}`}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: m.role === "user" ? colors.brandTertiary : colors.surfaceTertiary,
                }}
              >
                <Text style={{ fontFamily: fonts.text, fontSize: t.base + 1, lineHeight: 21, color: m.role === "user" ? colors.onBrandTertiary : colors.onSurface }}>{m.content}</Text>
              </View>
            ))}
            {sending ? (
              <Text testID="chat-sending" style={{ fontFamily: fonts.text, fontSize: t.sm + 1, color: colors.muted }}>
                Sto scrivendo...
              </Text>
            ) : null}
          </ScrollView>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <TextInput
              testID="chat-input"
              value={text}
              onChangeText={setText}
              placeholder="Scrivi cosa devo fare..."
              placeholderTextColor={colors.muted}
              multiline
              onSubmitEditing={() => void send()}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceTertiary,
                color: colors.onSurface,
                paddingHorizontal: spacing.md,
                paddingTop: spacing.md,
                fontFamily: fonts.text,
                fontSize: t.base + 1,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Button testID="chat-send-button" icon="send" onPress={() => void send()} loading={sending} disabled={!text.trim()} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
