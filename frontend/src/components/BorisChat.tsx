import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, askAssistantConAzioni, Project } from "@/src/api";
import { strutturaPer } from "@/src/modules";
import { fonts, radius, spacing, type as t, useTheme } from "@/src/theme";
import { Icon, toast } from "@/src/ui";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const IDEE_PROGETTO = ["Scrivimi una logline", "Aggiungi un personaggio", "Che cosa manca a questo progetto?"];
const IDEE_HOME = ["Come puoi aiutarmi?", "Dammi un'idea per un corto", "Come funziona il calendario?"];

// Piccola bolla con la B dorata: dà un volto a Boris invece dell'icona robot.
function Avatar({ size = 34 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.5, fontWeight: "700", color: colors.onBrandPrimary }}>B</Text>
    </View>
  );
}

function TypingDots() {
  const { colors } = useTheme();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.25))).current;
  useEffect(() => {
    const runs = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 320, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ]),
      ),
    );
    runs.forEach((r) => r.start());
    return () => runs.forEach((r) => r.stop());
  }, [dots]);
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {dots.map((v, i) => (
        <Animated.View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted, opacity: v }} />
      ))}
    </View>
  );
}

export default function BorisChat({
  projectId,
  onClose,
  fullScreen = false,
}: {
  projectId: string | null;
  onClose: () => void;
  fullScreen?: boolean;
}) {
  const qc = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const progetto = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
  const struttura = progetto.data ? strutturaPer(progetto.data) : [];
  const idee = projectId ? IDEE_PROGETTO : IDEE_HOME;

  const invia = async (testo: string) => {
    const messaggio = testo.trim();
    if (!messaggio || loading) return;
    const nuovi: Msg[] = [...messages, { role: "user", content: messaggio }];
    setMessages(nuovi);
    setInput("");
    setLoading(true);
    try {
      const r = await askAssistantConAzioni(messaggio, messages.filter((m) => !m.error).slice(-10), projectId, struttura);
      setMessages([...nuovi, { role: "assistant", content: r.reply || "Fatto." }]);
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
      setMessages([...nuovi, { role: "assistant", content: e?.message ?? "Boris ha avuto un problema, riprova.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surfaceSecondary }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingTop: (fullScreen ? insets.top : 0) + spacing.md,
          paddingBottom: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          backgroundColor: colors.surfaceSecondary,
        }}
      >
        <Avatar />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: t.xl, fontWeight: "700", color: colors.onSurface }}>Boris</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
            <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.text, fontSize: t.sm, color: colors.muted }}>
              {progetto.data ? progetto.data.title : "Il tuo assistente di produzione"}
            </Text>
          </View>
        </View>
        <Pressable
          testID="chat-close-button"
          accessibilityRole="button"
          accessibilityLabel="Chiudi la chat"
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? colors.surfaceTertiary : "transparent" })}
        >
          <Icon name="close" size={22} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        ref={scroll}
        testID="chat-messages"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
          <Avatar size={30} />
          <View style={{ flex: 1, backgroundColor: colors.brandTertiary, borderRadius: radius.lg, borderTopLeftRadius: 6, padding: spacing.lg, gap: spacing.sm }}>
            <Text style={{ fontFamily: fonts.display, fontSize: t.lg + 1, fontWeight: "700", color: colors.onBrandTertiary }}>
              {messages.length ? "Boris" : "Ciao, sono Boris"}
            </Text>
            <Text style={{ fontFamily: fonts.text, fontSize: t.base + 1, lineHeight: 21, color: colors.onBrandTertiary }}>
              {projectId
                ? "Ti do una mano a mettere le idee al posto giusto. Scrivimi come parleresti a un collega di set: «scrivi questa sinossi nel Soggetto», «aggiungi Marco ai personaggi»."
                : "Posso aiutarti con soggetto, scene, budget, calendario e molto altro. Scrivimi cosa ti serve, oppure parti da una delle idee qui sotto."}
            </Text>
          </View>
        </View>

        {!messages.length && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingLeft: 42 }}>
            {idee.map((idea, i) => (
              <Pressable
                key={idea}
                onPress={() => void invia(idea)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  minHeight: 36,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceTertiary : colors.surface,
                })}
              >
                <Icon
                  name={i === 0 ? "lightbulb-outline" : i === 1 ? "pencil-outline" : "comment-question-outline"}
                  size={14}
                  color={colors.brandPrimary}
                />
                <Text style={{ fontFamily: fonts.text, fontSize: t.sm + 1, color: colors.onSurface }}>{idea}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={`${i}-${m.role}`}
            style={{ flexDirection: m.role === "user" ? "row-reverse" : "row", gap: spacing.sm, alignItems: "flex-end" }}
          >
            {m.role === "assistant" && <Avatar size={26} />}
            <View
              style={{
                maxWidth: "82%",
                paddingHorizontal: spacing.md + 2,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.lg,
                borderTopRightRadius: m.role === "user" ? 6 : radius.lg,
                borderTopLeftRadius: m.role === "assistant" ? 6 : radius.lg,
                backgroundColor: m.role === "user" ? colors.brandPrimary : colors.surfaceTertiary,
                borderWidth: m.error ? 1 : 0,
                borderColor: m.error ? colors.error : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.text,
                  fontSize: t.base + 1,
                  lineHeight: 21,
                  color: m.role === "user" ? colors.onBrandPrimary : m.error ? colors.error : colors.onSurface,
                }}
              >
                {m.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View testID="chat-sending" style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
            <Avatar size={26} />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingHorizontal: spacing.md + 2,
                paddingVertical: spacing.md,
                borderRadius: radius.lg,
                borderTopLeftRadius: 6,
                backgroundColor: colors.surfaceTertiary,
              }}
            >
              <TypingDots />
              <Text style={{ fontFamily: fonts.text, fontSize: t.sm + 1, color: colors.muted }}>Boris sta scrivendo</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          backgroundColor: colors.surfaceSecondary,
        }}
      >
        <TextInput
          testID="chat-input"
          value={input}
          onChangeText={setInput}
          placeholder="Scrivi a Boris…"
          placeholderTextColor={colors.muted}
          multiline
          onSubmitEditing={() => void invia(input)}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 120,
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceTertiary,
            color: colors.onSurface,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            fontFamily: fonts.text,
            fontSize: t.base + 1,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        <Pressable
          testID="chat-send-button"
          accessibilityRole="button"
          accessibilityLabel="Invia a Boris"
          disabled={!input.trim() || loading}
          onPress={() => void invia(input)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.brandPrimary,
            opacity: !input.trim() || loading ? 0.35 : pressed ? 0.85 : 1,
          })}
        >
          <Icon name="send" size={20} color={colors.onBrandPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
