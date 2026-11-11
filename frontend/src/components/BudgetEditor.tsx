import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { BUDGET_CATEGORIE, eur, lineTotal, ModuleDef, num } from "@/src/modules";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

export const BUDGET_STATI = ["Preventivo", "Confermato", "Pagato"];

export default function BudgetEditor({
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
  const totale = lineTotal(def, data);

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica voce" : "Nuova voce di budget"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi voce"} icon="check" loading={saving} onPress={() => onSave(title.trim() || "Voce", { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Voce" value={title} onChangeText={setTitle} placeholder="es. Noleggio camera" />
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Categoria</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {BUDGET_CATEGORIE.map((c) => (
                <Chip key={c} testID={`budget-categoria-${c}`} label={c} selected={data.categoria === c} onPress={() => set("categoria", c)} />
              ))}
            </View>
          </View>
          {campo("fornitore") ? <Field testID="budget-fornitore-input" label="Fornitore / Rental" value={String(data.fornitore ?? "")} onChangeText={(v) => set("fornitore", v)} placeholder="Nome del fornitore" /> : null}
        </Glass>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={s.label}>Quanto costa</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontFamily: fonts.text, fontSize: 16, fontWeight: "700", color: colors.brandPrimary }}>{eur(totale)}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              {campo("importo") ? <Field testID="budget-importo-input" label="Costo unitario (€)" value={String(data.importo ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("importo", v)} placeholder="0" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              {campo("quantita") ? <Field testID="budget-quantita-input" label="Quantità" value={String(data.quantita ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("quantita", v)} placeholder="1" /> : null}
            </View>
            <View style={{ flex: 1 }}>
              {campo("durata") ? <Field testID="budget-durata-input" label="Durata" value={String(data.durata ?? "")} keyboardType="decimal-pad" onChangeText={(v) => set("durata", v)} placeholder="1" /> : null}
            </View>
          </View>
          {campo("unita") ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Unità</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {(campo("unita")?.options ?? []).map((u) => (
                  <Chip key={u} testID={`budget-unita-${u}`} label={u} selected={data.unita === u} onPress={() => set("unita", u)} />
                ))}
              </View>
            </View>
          ) : null}
          <Text style={s.muted}>
            {data.unita === "Forfait"
              ? "Il forfait si conta una volta sola."
              : data.unita === "Per progetto"
                ? "Per progetto si moltiplica solo per la durata."
                : `Costo × quantità × durata = ${eur(totale)}`}
          </Text>
        </Glass>

        {campo("date") ? <DateField testID="budget-date" label="Date di utilizzo" value={data.date} onChange={(v) => set("date", v)} /> : null}

        <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="progress-check" size={13} color={colors.muted} />
            <Text style={s.label}>Stato</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {BUDGET_STATI.map((st) => (
              <Chip key={st} testID={`budget-stato-${st}`} label={st} selected={(data.stato ?? "Preventivo") === st} onPress={() => set("stato", st)} />
            ))}
          </View>
        </Glass>

        {campo("link") ? <Field testID="budget-link-input" label="Link articolo sul sito del rental" value={String(data.link ?? "")} onChangeText={(v) => set("link", v)} placeholder="https://…" autoCapitalize="none" /> : null}
        {campo("note") ? <Field testID="budget-note-input" label="Note" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={80} /> : null}

        {num(data.importo) ? (
          <Text style={[s.muted, { fontSize: 11.5 }]}>Il totale di questa voce entra nella ripartizione per categoria.</Text>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}
