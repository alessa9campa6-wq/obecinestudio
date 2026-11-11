import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { RowsField } from "@/src/components/RowsField";
import { eur, ModuleDef, num, unitTotal } from "@/src/modules";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

// Stessi valori e stessa formula della sezione; duplicati qui per non creare un
// import circolare fra elenco e scheda.
const REPARTI = ["Regia", "Produzione", "Fotografia", "Elettricisti", "Macchinisti", "Suono", "Scenografia", "Costumi", "Trucco", "Post"];
const costoPersona = (data: Record<string, any>) =>
  unitTotal(num(data.tariffa), data.unita, 1, num(data.durata) || 1) +
  ((data.ruoli ?? []) as any[]).reduce((n, r) => n + unitTotal(num(r?.tariffa), r?.unita, 1, num(r?.durata) || 1), 0);

export default function CrewEditor({
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
  const principale = unitTotal(num(data.tariffa), data.unita, 1, num(data.durata) || 1);
  const totale = costoPersona(data);
  const extra = ((data.ruoli ?? []) as any[]).filter((r) => r && (r.ruolo || r.tariffa)).length;

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica persona" : "Nuova persona"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi persona"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Persona", { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Nome" value={title} onChangeText={setTitle} placeholder="es. Marco Rossi" />
          {campo("ruolo") ? <Field testID="crew-ruolo-input" label="Ruolo principale" value={String(data.ruolo ?? "")} onChangeText={(v) => set("ruolo", v)} placeholder="Direttore della fotografia" /> : null}
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Reparto</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {REPARTI.map((r) => (
                <Chip key={r} testID={`crew-reparto-${r}`} label={r} selected={data.reparto === r} onPress={() => set("reparto", data.reparto === r ? "" : r)} />
              ))}
            </View>
          </View>
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="phone-outline" size={13} color={colors.muted} />
            <Text style={s.label}>Contatti</Text>
          </View>
          {campo("telefono") ? <Field testID="crew-telefono-input" label="Telefono" value={String(data.telefono ?? "")} keyboardType="phone-pad" onChangeText={(v) => set("telefono", v)} /> : null}
          {campo("email") ? <Field testID="crew-email-input" label="Email" value={String(data.email ?? "")} keyboardType="email-address" autoCapitalize="none" onChangeText={(v) => set("email", v)} /> : null}
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={s.label}>Tariffa del ruolo principale</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: colors.brandPrimary }}>{principale ? eur(principale) : "—"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              {campo("tariffa") ? <Field testID="crew-tariffa-input" label="Tariffa (€)" value={String(data.tariffa ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("tariffa", v)} placeholder="0" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              {campo("durata") ? <Field testID="crew-durata-input" label="Giorni / ore" value={String(data.durata ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("durata", v)} placeholder="1" /> : null}
            </View>
          </View>
          {campo("unita") ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {(campo("unita")?.options ?? []).map((u) => (
                <Chip key={u} testID={`crew-unita-${u}`} label={u} selected={data.unita === u} onPress={() => set("unita", u)} />
              ))}
            </View>
          ) : null}
        </Glass>

        {campo("ruoli") ? (
          <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Icon name="account-multiple-plus-outline" size={13} color={colors.muted} />
              <Text style={s.label}>Altri ruoli{extra ? ` (${extra})` : ""}</Text>
            </View>
            <RowsField testID="crew-ruoli" label="" fields={campo("ruoli")!.rows ?? []} value={data.ruoli} onChange={(v) => set("ruoli", v)} />
            <Text style={s.muted}>Ogni ruolo aggiuntivo ha la sua tariffa e si somma al costo della persona.</Text>
          </Glass>
        ) : null}

        {campo("date") ? <DateField testID="crew-date" label="Date di lavoro" value={data.date} onChange={(v) => set("date", v)} /> : null}

        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "rgba(212,175,55,0.45)", backgroundColor: "rgba(212,175,55,0.1)", padding: spacing.md, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: colors.onSurface, flex: 1 }}>Costo totale della persona</Text>
          <Text style={{ fontFamily: fonts.text, fontSize: 16, fontWeight: "700", color: colors.brandPrimary }}>{eur(totale)}</Text>
        </View>
      </ScrollView>
    </Sheet>
  );
}
