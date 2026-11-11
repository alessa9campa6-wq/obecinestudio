import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { RefInput } from "@/src/components/ItemEditor";
import { useLookup } from "@/src/hooks";
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const COPERTI = new Set(["numero", "intext", "momento", "location", "personaggi", "pagine", "sinossi", "stato", "sezione"]);

export default function SceneEditor({
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
  const { project, go } = useHub();
  const lookup = useLookup(project.id);
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
  const opzioni = (key: string) => campo(key)?.options ?? [];
  const set = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  const luogo = data.location ? lookup.get(data.location)?.title : "";
  const intestazione = `${data.intext || "INT."} ${luogo || "LOCATION"} – ${String(data.momento || "GIORNO").toUpperCase()}`;
  const altri = (def.fields ?? []).filter((f) => !COPERTI.has(f.key));

  const riga = (key: string, etichetta: string, icona: any) => {
    const opts = opzioni(key);
    if (!opts.length) return null;
    return (
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Icon name={icona} size={13} color={colors.muted} />
          <Text style={s.label}>{etichetta}</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {opts.map((o) => (
            <Chip key={o} testID={`scena-${key}-${o}`} label={o} selected={String(data[key] ?? "") === o} onPress={() => set(key, String(data[key] ?? "") === o ? "" : o)} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? "Modifica scena" : "Nuova scena"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi scena"} icon="check" loading={saving} onPress={() => onSave(title.trim() || intestazione, { ...data })} />
        </>
      }
    >
      <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[s.label, { fontSize: 9.5 }]}>Scena</Text>
            <TextInput
              testID="scena-numero-input"
              value={String(data.numero ?? "")}
              onChangeText={(v) => set("numero", v)}
              placeholder="n."
              placeholderTextColor={colors.muted}
              style={{ minWidth: 34, fontFamily: fonts.script, fontSize: 15, color: colors.brandPrimary, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: colors.divider }}
            />
          </View>
          <View style={{ flex: 1 }} />
          <Icon name="movie-open-outline" size={16} color={colors.brandPrimary} />
        </View>

        <Text style={{ fontFamily: fonts.script, fontSize: 15, letterSpacing: 0.4, color: colors.onSurface }} numberOfLines={2}>
          {intestazione}
        </Text>

        <Text style={[s.label, { paddingTop: spacing.xs }]}>Intestazione scena</Text>
        <TextInput
          testID="item-title-input"
          value={title}
          onChangeText={setTitle}
          placeholder="INT. CUCINA – GIORNO"
          placeholderTextColor={colors.muted}
          style={{ fontFamily: fonts.script, fontSize: 16, color: colors.onSurface, paddingVertical: spacing.xs }}
        />
      </Glass>

      {riga("intext", "Interno o esterno", "home-outline")}
      {riga("momento", "Momento della giornata", "weather-sunset-outline")}
      {riga("stato", "Stato delle riprese", "progress-check")}

      {campo("location") ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Location</Text>
          <RefInput f={campo("location")!} value={data.location} onChange={(v) => set("location", v)} onGo={(mm) => go(mm)} />
        </View>
      ) : null}

      {campo("personaggi") ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Personaggi in scena</Text>
          <RefInput f={campo("personaggi")!} value={data.personaggi} onChange={(v) => set("personaggi", v)} onGo={(mm) => go(mm)} />
        </View>
      ) : null}

      <Field testID="scena-pagine-input" label="Pagine (ottavi)" value={String(data.pagine ?? "")} onChangeText={(v) => set("pagine", v)} placeholder="1 3/8" />

      {altri.map((f) =>
        f.type === "ref" ? (
          <View key={f.key} style={{ gap: spacing.xs }}>
            <Text style={s.label}>{f.label}</Text>
            <RefInput f={f} value={data[f.key]} onChange={(v) => set(f.key, v)} onGo={(mm) => go(mm)} />
          </View>
        ) : f.type === "select" ? (
          <View key={f.key} style={{ gap: spacing.xs }}>
            <Text style={s.label}>{f.label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {(f.options ?? []).map((o) => (
                <Chip key={o} label={o} selected={String(data[f.key] ?? "") === o} onPress={() => set(f.key, o)} />
              ))}
            </View>
          </View>
        ) : (
          <Field key={f.key} label={f.label} value={String(data[f.key] ?? "")} onChangeText={(v) => set(f.key, v)} placeholder={f.placeholder} multiline={f.type === "multiline"} />
        ),
      )}

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Sinossi</Text>
        <TextInput
          testID="scena-sinossi-input"
          value={String(data.sinossi ?? "")}
          onChangeText={(v) => set("sinossi", v)}
          multiline
          scrollEnabled={false}
          placeholder="Cosa succede in questa scena, in due righe."
          placeholderTextColor={colors.muted}
          style={{
            fontFamily: fonts.text,
            fontSize: 15,
            lineHeight: 23,
            color: colors.onSurface,
            minHeight: 96,
            textAlignVertical: "top",
            backgroundColor: colors.surfaceTertiary,
            borderWidth: 1,
            borderColor: colors.divider,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        />
      </View>
    </Sheet>
  );
}
