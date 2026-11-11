import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Glass, Icon, IconName, Sheet, useStyles } from "@/src/ui";

const parole = (t: string) => {
  const s = t.trim();
  return s ? s.split(/\s+/).length : 0;
};

const ICONE: Record<string, IconName> = {
  Idea: "lightbulb-on-outline",
  Regia: "movie-open-outline",
  Produzione: "briefcase-outline",
  Fotografia: "camera-outline",
  Suono: "microphone-outline",
  Altro: "note-text-outline",
};

// La nota si scrive come su un foglio: prima il testo, poi l'etichetta che dice
// a quale reparto appartiene.
export default function NoteEditor({
  def,
  item,
  visible,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  def: ModuleDef;
  item: Item | null;
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, data: Record<string, any>) => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [conferma, setConferma] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(item?.title ?? "");
    setData(item?.data ?? {});
    setConferma(false);
  }, [visible, item]);

  const campoTag = (def.fields ?? []).find((f) => f.type === "select" && f.options?.length);
  const tagKey = campoTag?.key ?? "tag";
  const tag = String(data[tagKey] ?? "");
  const bodyKey = def.longText ?? "body";
  const testo = String(data[bodyKey] ?? "");

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica nota" : "Nuova nota"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button
            testID="item-save-button"
            label={item ? "Salva" : "Aggiungi nota"}
            icon="check"
            loading={saving}
            disabled={!testo.trim() && !title.trim()}
            onPress={() => onSave(title.trim() || testo.trim().split("\n")[0].slice(0, 48) || "Nota", { ...data, [bodyKey]: testo })}
          />
        </>
      }
    >
      <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(212,175,55,0.14)",
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.4)",
            }}
          >
            <Icon name={ICONE[tag] ?? "note-text-outline"} size={17} color={colors.brandPrimary} />
          </View>
          <TextInput
            testID="item-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="Titolo (facoltativo)"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, lineHeight: 25, color: colors.onSurface, paddingVertical: 2 }}
          />
        </View>

        <TextInput
          testID={`note-${bodyKey}-input`}
          value={testo}
          onChangeText={(v) => setData((d) => ({ ...d, [bodyKey]: v }))}
          multiline
          scrollEnabled={false}
          placeholder="Scrivi la nota: un'idea, una richiesta del cliente, una cosa da non dimenticare sul set..."
          placeholderTextColor={colors.muted}
          style={{
            fontFamily: fonts.display,
            fontSize: 16.5,
            lineHeight: 27,
            color: colors.onSurface,
            minHeight: 210,
            textAlignVertical: "top",
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name="format-align-left" size={13} color={colors.muted} />
          <Text style={[s.muted, { flex: 1, fontSize: 11.5 }]}>
            {parole(testo)} {parole(testo) === 1 ? "parola" : "parole"}
            {tag ? ` · ${tag}` : ""}
          </Text>
          <Text style={[s.muted, { fontSize: 11 }]}>Si salva da sola</Text>
        </View>
      </Glass>

      {campoTag ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>A quale reparto serve</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {(campoTag.options ?? []).map((o) => (
              <Chip
                key={o}
                testID={`note-tag-${o}`}
                icon={ICONE[o] ?? "tag-outline"}
                label={o}
                selected={tag === o}
                onPress={() => setData((d) => ({ ...d, [tagKey]: tag === o ? "" : o }))}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="link-variant" size={15} color={colors.muted} />
        <Text style={[s.muted, { flex: 1, fontSize: 12 }]}>Le note stanno insieme per reparto: con il filtro le ritrovi in un tocco.</Text>
      </View>
    </Sheet>
  );
}
