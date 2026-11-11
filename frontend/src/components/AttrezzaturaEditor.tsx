import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { eur, lineTotal, ModuleDef } from "@/src/modules";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const CATEGORIE = ["Camera", "Ottiche", "Luci", "Grip", "Audio", "Monitor", "Media", "Altro"];

export default function AttrezzaturaEditor({
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

  const campo = (key: string) => (def.fields ?? []).find((f) => f.key === key);
  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));
  const tot = lineTotal(def, data);

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica articolo" : "Nuovo articolo"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi articolo"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Articolo", { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Articolo" value={title} onChangeText={setTitle} placeholder="es. Sony FX3" />
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Categoria</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {CATEGORIE.map((c) => (
                <Chip key={c} testID={`attrezzatura-categoria-${c}`} label={c} selected={(data.categoria ?? "Altro") === c} onPress={() => set("categoria", c)} />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              {campo("quantita") ? <Field testID="attrezzatura-quantita-input" label="Quantità" value={String(data.quantita ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("quantita", v)} placeholder="1" /> : null}
            </View>
            <View style={{ flex: 2 }}>
              {campo("noleggio") ? <Field testID="attrezzatura-noleggio-input" label="Noleggio / Rental" value={String(data.noleggio ?? "")} onChangeText={(v) => set("noleggio", v)} /> : null}
            </View>
          </View>
          <Pressable
            testID="attrezzatura-pronto-toggle"
            onPress={() => set("pronto", !data.pronto)}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 }}
          >
            <Icon name={data.pronto ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={22} color={data.pronto ? colors.success : colors.muted} />
            <Text style={{ fontFamily: fonts.text, fontSize: 13.5, color: colors.onSurface }}>{data.pronto ? "Pronto / caricato" : "Da preparare o noleggiare"}</Text>
          </Pressable>
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={s.label}>Costo del noleggio</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.text, fontSize: 16, fontWeight: "700", color: colors.brandPrimary }}>{tot ? eur(tot) : "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              {campo("tariffa") ? <Field testID="attrezzatura-tariffa-input" label="Costo unitario (€)" value={String(data.tariffa ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("tariffa", v)} placeholder="0" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              {campo("durata") ? <Field testID="attrezzatura-durata-input" label="Giorni / ore" value={String(data.durata ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("durata", v)} placeholder="1" /> : null}
            </View>
          </View>
          {campo("unita") ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {(campo("unita")?.options ?? []).map((u) => (
                <Chip key={u} testID={`attrezzatura-unita-${u}`} label={u} selected={data.unita === u} onPress={() => set("unita", u)} />
              ))}
            </View>
          ) : null}
          <Text style={s.muted}>Costo × quantità × durata, con la formula unica del budget.</Text>
        </Glass>

        {campo("date") ? <DateField testID="attrezzatura-date" label="Date di utilizzo" value={data.date} onChange={(v) => set("date", v)} /> : null}
        {campo("link") ? <Field testID="attrezzatura-link-input" label="Link sul sito del rental" value={String(data.link ?? "")} onChangeText={(v) => set("link", v)} placeholder="https://…" autoCapitalize="none" /> : null}

        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "rgba(212,175,55,0.45)", backgroundColor: "rgba(212,175,55,0.1)", padding: spacing.md, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: colors.onSurface, flex: 1 }}>Questa voce nel budget</Text>
          <Text style={{ fontFamily: fonts.script, fontSize: 15, fontWeight: "700", color: colors.brandPrimary }}>{tot ? eur(tot) : "—"}</Text>
        </View>
      </ScrollView>
    </Sheet>
  );
}
