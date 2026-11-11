import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { ImageField } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useHub } from "@/src/hub";
import { eur, ModuleDef, num, unitTotal } from "@/src/modules";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const STATI = ["Provino", "Opzionato", "Confermato"];

export default function CastEditor({
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
  const [conferma, setConferma] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(item?.title ?? "");
    setData(item?.data ?? {});
    setConferma(false);
  }, [visible, item]);

  const campo = (key: string) => (def.fields ?? []).find((f) => f.key === key);
  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));
  const cachet = unitTotal(num(data.tariffa), data.unita, 1, num(data.durata) || 1);
  const stato = String(data.stato ?? "Provino");

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica attore" : "Nuovo attore"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi attore"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Attore", { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Nome e cognome" value={title} onChangeText={setTitle} placeholder="es. Giulia Bianchi" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "flex-end" }}>
            <View style={{ flexGrow: 1 }}>
              <Text style={s.label}>Foto</Text>
              <ImageField testID="cast-foto" value={data.foto} onChange={(p) => set("foto", p ?? "")} />
            </View>
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={s.label}>Stato</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: 6 }}>
                {STATI.map((st) => (
                  <Chip key={st} testID={`cast-stato-${st}`} label={st} selected={stato === st} onPress={() => set("stato", st)} />
                ))}
              </View>
            </View>
          </View>
          {campo("personaggio") ? <RefInput f={campo("personaggio")!} value={data.personaggio} onChange={(v) => set("personaggio", v)} onGo={(mm) => go(mm)} /> : null}
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="phone-outline" size={13} color={colors.muted} />
            <Text style={s.label}>Contatti</Text>
          </View>
          {campo("telefono") ? <Field testID="cast-telefono-input" label="Telefono" value={String(data.telefono ?? "")} keyboardType="phone-pad" onChangeText={(v) => set("telefono", v)} /> : null}
          {campo("email") ? <Field testID="cast-email-input" label="Email" value={String(data.email ?? "")} autoCapitalize="none" keyboardType="email-address" onChangeText={(v) => set("email", v)} /> : null}
          {campo("agenzia") ? <Field testID="cast-agenzia-input" label="Agenzia" value={String(data.agenzia ?? "")} onChangeText={(v) => set("agenzia", v)} /> : null}
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={s.label}>Cachet</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.text, fontSize: 16, fontWeight: "700", color: colors.brandPrimary }}>{cachet ? eur(cachet) : "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              {campo("tariffa") ? <Field testID="cast-tariffa-input" label="Tariffa (€)" value={String(data.tariffa ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("tariffa", v)} placeholder="0" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              {campo("durata") ? <Field testID="cast-durata-input" label="Giorni / ore / progetti" value={String(data.durata ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("durata", v)} placeholder="1" /> : null}
            </View>
          </View>
          {campo("unita") ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Unità tariffa</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {(campo("unita")?.options ?? []).map((u) => (
                  <Chip key={u} testID={`cast-unita-${u}`} label={u} selected={data.unita === u} onPress={() => set("unita", u)} />
                ))}
              </View>
            </View>
          ) : null}
        </Glass>

        {campo("date") ? <DateField testID="cast-date" label="Date di lavoro" value={data.date} onChange={(v) => set("date", v)} /> : null}
        {campo("note") ? <Field testID="cast-note-input" label="Note (disponibilità, viaggio, look…)" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={90} /> : null}

        <Text style={s.muted}>Il cachet usa la stessa formula del budget, quindi non può divergere dal totale del progetto.</Text>
      </ScrollView>
    </Sheet>
  );
}
