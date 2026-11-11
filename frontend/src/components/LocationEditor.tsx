import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { ImageField } from "@/src/components/Images";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const PERMESSI = ["Da richiedere", "Richiesti", "Ottenuti", "Non necessari"];

export default function LocationEditor({
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

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica location" : "Nuova location"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi location"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Location", { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Nome location" value={title} onChangeText={setTitle} placeholder="es. Villa sul lago" />
          {campo("indirizzo") ? <Field testID="location-indirizzo-input" label="Indirizzo / Città" value={String(data.indirizzo ?? "")} onChangeText={(v) => set("indirizzo", v)} placeholder="Via, numero, città" /> : null}
          {campo("contatto") ? <Field testID="location-contatto-input" label="Referente / Telefono" value={String(data.contatto ?? "")} onChangeText={(v) => set("contatto", v)} placeholder="Nome e numero" /> : null}
        </Glass>

        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Foto della location</Text>
          <ImageField testID="location-foto" value={data.foto} onChange={(p) => set("foto", p ?? "")} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <ImageField testID="location-foto2" value={data.foto2} onChange={(p) => set("foto2", p ?? "")} />
            </View>
            <View style={{ flex: 1 }}>
              <ImageField testID="location-foto3" value={data.foto3} onChange={(p) => set("foto3", p ?? "")} />
            </View>
          </View>
        </View>

        {campo("date") ? <DateField testID="location-date" label="Date di utilizzo" value={data.date} onChange={(v) => set("date", v)} /> : null}

        <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="map-marker-check-outline" size={13} color={colors.muted} />
            <Text style={s.label}>Permessi</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {PERMESSI.map((p) => (
              <Chip key={p} testID={`location-permesso-${p}`} label={p} selected={String(data.permessi ?? "") === p} onPress={() => set("permessi", p)} />
            ))}
          </View>
        </Glass>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            {campo("tariffa") ? <Field testID="location-tariffa-input" label="Costo (€)" value={String(data.tariffa ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("tariffa", v)} placeholder="0" /> : null}
          </View>
          <View style={{ flex: 1 }}>
            {campo("durata") ? <Field testID="location-durata-input" label="Per quanti giorni / ore" value={String(data.durata ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("durata", v)} placeholder="1" /> : null}
          </View>
        </View>

        {campo("unita") ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Unità</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {(campo("unita")?.options ?? []).map((u) => (
                <Chip key={u} testID={`location-unita-${u}`} label={u} selected={String(data.unita ?? "") === u} onPress={() => set("unita", u)} />
              ))}
            </View>
          </View>
        ) : null}

        {campo("mappa") ? <Field testID="location-mappa-input" label="Link mappa" value={String(data.mappa ?? "")} onChangeText={(v) => set("mappa", v)} placeholder="https://maps.apple.com/…" autoCapitalize="none" /> : null}
        {campo("note") ? <Field testID="location-note-input" label="Note (luce, corrente, parcheggio…)" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={90} /> : null}

        <View style={{ height: 1, backgroundColor: colors.divider }} />
        <Text style={s.muted}>Le scene si collegano alla location dalla scheda della scena; qui vedi quante la usano.</Text>
      </ScrollView>
    </Sheet>
  );
}
