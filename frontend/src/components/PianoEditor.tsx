import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { DateField } from "@/src/components/DateField";
import { RefInput } from "@/src/components/ItemEditor";
import { TimeField } from "@/src/components/TimeField";
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const ORARI: { key: string; label: string }[] = [
  { key: "convocazione", label: "Convocazione troupe" },
  { key: "convocazione_cast", label: "Convocazione cast" },
  { key: "inizio", label: "Inizio riprese" },
  { key: "pranzo", label: "Pausa pranzo" },
  { key: "cena", label: "Pausa cena" },
  { key: "fine", label: "Fine giornata" },
];

export default function PianoEditor({
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

  const sezione = (titolo: string, icona: any, contenuto: React.ReactNode) => (
    <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={icona} size={14} color={colors.brandPrimary} />
        <Text style={s.label}>{titolo}</Text>
      </View>
      {contenuto}
    </Glass>
  );

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? `Giornata ${data.numero ?? ""}`.trim() : "Nuova giornata"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi giornata"} icon="check" loading={saving} onPress={() => onSave(title.trim() || `Giornata ${data.numero ?? ""}`.trim(), { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        {sezione(
          "Giornata",
          "calendar-month-outline",
          <>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ width: 100 }}>
                {campo("numero") ? <Field testID="piano-numero-input" label="Numero" value={String(data.numero ?? "")} keyboardType="number-pad" onChangeText={(v) => set("numero", v)} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                {campo("data") ? <DateField testID="piano-data" label="Data" value={data.data} onChange={(v) => set("data", v)} /> : null}
              </View>
            </View>
            {campo("location") ? <RefInput f={campo("location")!} value={data.location} onChange={(v) => set("location", v)} onGo={(mm) => go(mm)} /> : null}
            {campo("ambienti") ? <Field testID="piano-ambienti-input" label="Ambienti / Set" value={String(data.ambienti ?? "")} onChangeText={(v) => set("ambienti", v)} placeholder="Cucina, salotto, terrazzo" /> : null}
            {campo("base") ? <Field testID="piano-base-input" label="Base / Ritrovo troupe" value={String(data.base ?? "")} onChangeText={(v) => set("base", v)} placeholder="Parcheggio via Roma 3" /> : null}
            {campo("parcheggio") ? <Field testID="piano-parcheggio-input" label="Parcheggio e viabilità" value={String(data.parcheggio ?? "")} onChangeText={(v) => set("parcheggio", v)} /> : null}
            {campo("meteo") ? <Field testID="piano-meteo-input" label="Meteo previsto" value={String(data.meteo ?? "")} onChangeText={(v) => set("meteo", v)} placeholder="Sereno, 24°" /> : null}
          </>,
        )}

        {sezione(
          "Orari",
          "clock-outline",
          <>
            {[0, 2, 4].map((i) => (
              <View key={i} style={{ flexDirection: "row", gap: spacing.sm }}>
                {[ORARI[i], ORARI[i + 1]].map((o) =>
                  o && campo(o.key) ? (
                    <View key={o.key} style={{ flex: 1 }}>
                      <TimeField testID={`piano-${o.key}`} label={o.label} value={String(data[o.key] ?? "")} onChange={(v) => set(o.key, v)} />
                    </View>
                  ) : null,
                )}
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {campo("alba") ? (
                <View style={{ flex: 1 }}>
                  <TimeField testID="piano-alba" label="Alba" value={String(data.alba ?? "")} onChange={(v) => set("alba", v)} />
                </View>
              ) : null}
              {campo("tramonto") ? (
                <View style={{ flex: 1 }}>
                  <TimeField testID="piano-tramonto" label="Tramonto" value={String(data.tramonto ?? "")} onChange={(v) => set("tramonto", v)} />
                </View>
              ) : null}
            </View>
            {campo("orari_reparti") ? <Field testID="piano-orari-reparti-input" label="Orari dei reparti" value={String(data.orari_reparti ?? "")} onChangeText={(v) => set("orari_reparti", v)} multiline minHeight={80} placeholder={"Trucco: 07:30\nFonico: 08:00"} /> : null}
          </>,
        )}

        {sezione(
          "Scene del giorno",
          "movie-open-outline",
          <>
            {campo("scene") ? <RefInput f={campo("scene")!} value={data.scene} onChange={(v) => set("scene", v)} onGo={(mm) => go(mm)} /> : null}
            {campo("pagine") ? <Field testID="piano-pagine-input" label="Pagine da girare" value={String(data.pagine ?? "")} onChangeText={(v) => set("pagine", v)} placeholder="3 4/8" /> : null}
          </>,
        )}

        {sezione(
          "Persone convocate",
          "account-group-outline",
          <>
            {campo("troupe") ? <RefInput f={campo("troupe")!} value={data.troupe} onChange={(v) => set("troupe", v)} onGo={(mm) => go(mm)} /> : null}
            {campo("cast") ? <RefInput f={campo("cast")!} value={data.cast} onChange={(v) => set("cast", v)} onGo={(mm) => go(mm)} /> : null}
            {campo("comparse") ? <Field testID="piano-comparse-input" label="Comparse / Figurazioni" value={String(data.comparse ?? "")} onChangeText={(v) => set("comparse", v)} placeholder="6 comparse, 2 figuranti" /> : null}
          </>,
        )}

        {sezione(
          "Sicurezza e note",
          "shield-alert-outline",
          <>
            {campo("fabbisogno") ? <Field testID="piano-fabbisogno-input" label="Fabbisogno tecnico e di scena" value={String(data.fabbisogno ?? "")} onChangeText={(v) => set("fabbisogno", v)} multiline minHeight={80} /> : null}
            {campo("note") ? <Field testID="piano-note-input" label="Ordine del giorno / Note" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={90} /> : null}
            {campo("sicurezza") ? <Field testID="piano-sicurezza-input" label="Note di sicurezza" value={String(data.sicurezza ?? "")} onChangeText={(v) => set("sicurezza", v)} multiline minHeight={70} /> : null}
            {campo("emergenza") ? <Field testID="piano-emergenza-input" label="Contatto di emergenza in set" value={String(data.emergenza ?? "")} onChangeText={(v) => set("emergenza", v)} /> : null}
            {campo("ospedale") ? <Field testID="piano-ospedale-input" label="Ospedale più vicino" value={String(data.ospedale ?? "")} onChangeText={(v) => set("ospedale", v)} /> : null}
          </>,
        )}

        <Text style={[s.muted, { fontSize: 11.5, fontFamily: fonts.text }]}>Gli orari si scrivono con il selettore a scorrimento: trascina per regolare i minuti.</Text>
      </ScrollView>
    </Sheet>
  );
}
