import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon, Sheet, useStyles } from "@/src/ui";

const iniziali = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const CAMPI_LUNGHI: { key: string; label: string; placeholder: string }[] = [
  { key: "descrizione", label: "Chi è", placeholder: "Aspetto, carattere, cosa si porta dietro..." },
  { key: "obiettivo", label: "Obiettivo", placeholder: "Cosa vuole, e cosa glielo impedisce." },
  { key: "arco", label: "Arco narrativo", placeholder: "Da dove parte e dove arriva alla fine." },
];

// La scheda di un personaggio: prima chi è, poi cosa vuole. Un modulo generico
// chiedeva tutto insieme; qui ogni cosa ha il suo spazio.
export default function PersonaggioEditor({
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

  const ruoli = (def.fields ?? []).find((f) => f.key === "ruolo")?.options ?? [];
  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica personaggio" : "Nuovo personaggio"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi al cast"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Senza nome", data)} />
        </>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(212,175,55,0.16)",
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.45)",
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.brandPrimary }}>{iniziali(title)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.label}>Nome</Text>
          <TextInput
            testID="item-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="es. Elena"
            placeholderTextColor={colors.muted}
            style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.onSurface, paddingVertical: 2 }}
          />
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Ruolo</Text>
        <ChipRow>
          {ruoli.map((r) => (
            <Chip key={r} testID={`personaggio-ruolo-${r}`} label={r} selected={data.ruolo === r} onPress={() => set("ruolo", r)} />
          ))}
        </ChipRow>
      </View>

      <Field testID="personaggio-eta-input" label="Età" value={String(data.eta ?? "")} onChangeText={(v) => set("eta", v)} placeholder="es. 34" />

      {CAMPI_LUNGHI.map((c) => (
        <View key={c.key} style={{ gap: spacing.xs }}>
          <Text style={s.label}>{c.label}</Text>
          <TextInput
            testID={`personaggio-${c.key}-input`}
            value={String(data[c.key] ?? "")}
            onChangeText={(v) => set(c.key, v)}
            multiline
            scrollEnabled={false}
            placeholder={c.placeholder}
            placeholderTextColor={colors.muted}
            style={{
              fontFamily: fonts.text,
              fontSize: 15,
              lineHeight: 23,
              color: colors.onSurface,
              minHeight: c.key === "descrizione" ? 110 : 84,
              textAlignVertical: "top",
              backgroundColor: colors.surfaceTertiary,
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          />
        </View>
      ))}

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.xs }}>
        <Icon name="link-variant" size={15} color={colors.muted} />
        <Text style={[s.muted, { flex: 1, fontSize: 12 }]}>Le battute arrivano da sole: basta che il nome compaia in un blocco Personaggio della sceneggiatura.</Text>
      </View>
    </Sheet>
  );
}
