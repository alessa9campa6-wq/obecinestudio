import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { ImageField } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Icon, Sheet, useStyles } from "@/src/ui";

const STATI = ["Da fare", "In lavorazione", "Revisione", "Approvato"];

const PRESET = [
  { nome: "Notte urbana", hex: "#0E1420, #1F3A5F, #FFB347, #E8552F" },
  { nome: "Deserto", hex: "#E8D5B7, #C9A227, #8C5E3C, #3B2F2A" },
  { nome: "Neon", hex: "#120A2A, #FF2D95, #00E5FF, #F9F871" },
  { nome: "Natura", hex: "#1E2A23, #4E6E58, #C2B280, #EDE6D6" },
  { nome: "Bianco e nero", hex: "#0A0A0A, #3A3A3A, #B8B8B8, #F2F2F2" },
];

const COLORI = [
  "#0E1420", "#1F3A5F", "#3B5998", "#6FA8FF", "#BFD9FF", "#F2F2F2",
  "#8C5E3C", "#C9A227", "#E8D5B7", "#FFC46B", "#FFB347", "#E8552F",
  "#8C1C13", "#FF7A6B", "#FF2D95", "#B05BC9", "#4E6E58", "#9BE89B",
  "#00E5FF", "#1E2A23", "#3A3A3A", "#26231C", "#D4AF37", "#FFFFFF",
];

const lista = (v: any) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function ColorEditor({
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
  const { go } = useHub();
  const { colors } = useTheme();
  const s = useStyles();
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [colori, setColori] = useState(false);
  const [conferma, setConferma] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(item?.title ?? "");
    setData(item?.data ?? {});
    setColori(false);
    setConferma(false);
  }, [visible, item]);

  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));
  const palette = lista(data.palette);
  const setPalette = (arr: string[]) => set("palette", arr.join(", "));

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica look" : "Nuovo look"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi"} icon="check" loading={saving} disabled={!title.trim()} onPress={() => onSave(title.trim(), { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Frame di riferimento</Text>
          <ImageField testID="color-immagine" value={data.immagine} onChange={(p) => set("immagine", p ?? "")} />
        </View>

        <Field testID="item-title-input" label="Nome del look" value={title} onChangeText={setTitle} placeholder="es. Notte al porto" />

        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Stato</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {STATI.map((t) => (
              <Chip key={t} testID={`color-stato-${t}`} label={t} selected={(data.stato ?? "Da fare") === t} onPress={() => set("stato", t)} />
            ))}
          </View>
        </View>

        <Field testID="color-camera-input" label="Camera / Log" value={String(data.camera ?? "")} onChangeText={(v) => set("camera", v)} placeholder="ARRI LogC4" />
        <Field testID="color-lut-input" label="LUT" value={String(data.lut ?? "")} onChangeText={(v) => set("lut", v)} placeholder="Kodak 2383" />

        <View style={{ gap: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary, padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={[s.label, { flex: 1 }]}>Palette</Text>
            <Pressable testID="color-add-swatch" onPress={() => setColori((v) => !v)} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.brandPrimary, backgroundColor: colori ? colors.brandPrimary : "transparent" }}>
              <Icon name={colori ? "close" : "plus"} size={13} color={colori ? colors.onBrandPrimary : colors.brandPrimary} />
              <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colori ? colors.onBrandPrimary : colors.brandPrimary }}>{colori ? "Chiudi" : "Aggiungi"}</Text>
            </Pressable>
          </View>

          {palette.length ? (
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {palette.map((c, i) => (
                <Pressable key={`${c}-${i}`} testID={`color-swatch-${i}`} onPress={() => setPalette(palette.filter((_, j) => j !== i))} style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: c, borderWidth: 1, borderColor: "rgba(0,0,0,0.18)", alignItems: "flex-end", justifyContent: "flex-start", padding: 3 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="close" size={9} color="#FFFFFF" />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={s.muted}>Nessun colore: aggiungine qualcuno o scegli una palette pronta.</Text>
          )}

          {colori ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
              {COLORI.map((c) => (
                <Pressable key={c} testID={`color-pick-${c}`} onPress={() => setPalette([...palette, c.toUpperCase()])} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: palette.includes(c.toUpperCase()) ? 3 : 1, borderColor: palette.includes(c.toUpperCase()) ? colors.brandPrimary : "rgba(0,0,0,0.18)" }} />
              ))}
            </View>
          ) : null}

          <View style={{ gap: 6, paddingTop: 4 }}>
            <Text style={[s.muted, { fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700" }]}>Palette pronte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {PRESET.map((p) => {
                const hex = lista(p.hex);
                return (
                  <Pressable key={p.nome} testID={`color-preset-${p.nome}`} onPress={() => setPalette(hex)} style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, width: 118 }}>
                    <View style={{ flexDirection: "row", height: 34 }}>
                      {hex.map((c) => (
                        <View key={c} style={{ flex: 1, backgroundColor: c }} />
                      ))}
                    </View>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "600", color: colors.onSurfaceSecondary, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: colors.surface }}>{p.nome}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <RefInput f={{ key: "scene", label: "Scene con questo look", type: "ref", ref: "scene", multi: true }} value={data.scene ?? []} onChange={(v) => set("scene", v)} onGo={(mm) => go(mm)} />

        <Field testID="color-note-input" label="Note" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={90} placeholder="Riferimenti, temperatura, contrasto, grana…" />
      </ScrollView>
    </Sheet>
  );
}
