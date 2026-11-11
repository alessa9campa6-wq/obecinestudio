import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Glass, Icon, IconName, Sheet, useStyles } from "@/src/ui";

const iniziali = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const parole = (t: string) => {
  const s = t.trim();
  return s ? s.split(/\s+/).length : 0;
};

const BLOCCHI: { key: string; label: string; icon: IconName; hint: string; placeholder: string; min: number }[] = [
  { key: "descrizione", label: "Chi è", icon: "account-outline", hint: "Aspetto, carattere, cosa si porta dietro", placeholder: "Aspetto, carattere, cosa si porta dietro...", min: 116 },
  { key: "obiettivo", label: "Cosa vuole", icon: "target", hint: "Il desiderio, e cosa glielo impedisce", placeholder: "Cosa vuole, e cosa glielo impedisce...", min: 88 },
  { key: "arco", label: "Come cambia", icon: "chart-timeline-variant", hint: "Da dove parte, dove arriva", placeholder: "Da dove parte e dove arriva alla fine...", min: 88 },
];

// La scheda di un personaggio: poster con le iniziali, ruolo a pastiglie e tre
// blocchi di vetro per chi è, cosa vuole e come cambia.
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
      {/* Poster: le iniziali crescono insieme al nome. */}
      <View style={{ borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(212,175,55,0.32)" }}>
        <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: "absolute", right: -18, bottom: -26, opacity: 0.1 }} pointerEvents="none">
          <Icon name="drama-masks" size={150} color={colors.brandPrimary} />
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(212,175,55,0.16)",
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.5)",
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.brandPrimary }}>{iniziali(title)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.label}>Nome</Text>
              <TextInput
                testID="item-title-input"
                value={title}
                onChangeText={setTitle}
                placeholder="es. Elena"
                placeholderTextColor={colors.muted}
                style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.onSurface, paddingVertical: 2 }}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.label}>Età</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  height: 40,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surfaceSecondary,
                  paddingHorizontal: spacing.sm,
                }}
              >
                <Icon name="cake-variant-outline" size={15} color={colors.muted} />
                <TextInput
                  testID="personaggio-eta-input"
                  value={String(data.eta ?? "")}
                  onChangeText={(v) => set("eta", v)}
                  placeholder="34"
                  placeholderTextColor={colors.muted}
                  style={{ flex: 1, fontFamily: fonts.text, fontSize: 14.5, color: colors.onSurface, paddingVertical: 0 }}
                />
              </View>
            </View>
            <View style={{ flex: 2, gap: 3 }}>
              <Text style={s.label}>Ruolo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {ruoli.slice(0, 3).map((r) => (
                  <Chip key={r} testID={`personaggio-ruolo-${r}`} label={r} selected={data.ruolo === r} onPress={() => set("ruolo", r)} />
                ))}
              </View>
            </View>
          </View>
          {ruoli.length > 3 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {ruoli.slice(3).map((r) => (
                <Chip key={r} testID={`personaggio-ruolo-${r}`} label={r} selected={data.ruolo === r} onPress={() => set("ruolo", r)} />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {BLOCCHI.map((b) => (
        <Glass
          key={b.key}
          style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(212,175,55,0.14)",
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.4)",
              }}
            >
              <Icon name={b.icon} size={16} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: colors.onSurface }}>{b.label}</Text>
              <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                {b.hint}
              </Text>
            </View>
            {parole(String(data[b.key] ?? "")) ? <Text style={[s.muted, { fontSize: 11 }]}>{parole(String(data[b.key] ?? ""))} parole</Text> : null}
          </View>
          <TextInput
            testID={`personaggio-${b.key}-input`}
            value={String(data[b.key] ?? "")}
            onChangeText={(v) => set(b.key, v)}
            multiline
            scrollEnabled={false}
            placeholder={b.placeholder}
            placeholderTextColor={colors.muted}
            style={{
              fontFamily: fonts.text,
              fontSize: 15,
              lineHeight: 23,
              color: colors.onSurface,
              minHeight: b.min,
              textAlignVertical: "top",
              backgroundColor: colors.surfaceTertiary,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          />
        </Glass>
      ))}

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="link-variant" size={15} color={colors.muted} />
        <Text style={[s.muted, { flex: 1, fontSize: 12 }]}>Le battute arrivano da sole: basta che il nome compaia in un blocco Personaggio della sceneggiatura.</Text>
      </View>
    </Sheet>
  );
}
