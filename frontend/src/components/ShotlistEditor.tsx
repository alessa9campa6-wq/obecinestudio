import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { Item } from "@/src/api";
import { LensInput, RefInput } from "@/src/components/ItemEditor";
import { useLookup } from "@/src/hooks";
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

const COPERTI = new Set(["scena", "tipo", "angolo", "movimento", "ottica", "setup", "descrizione", "girata"]);

export default function ShotlistEditor({
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
  const altri = (def.fields ?? []).filter((f) => !COPERTI.has(f.key));

  const scena = data.scena ? lookup.get(data.scena)?.title : "";
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
            <Chip key={o} testID={`shot-${key}-${o}`} label={o} selected={String(data[key] ?? "") === o} onPress={() => set(key, String(data[key] ?? "") === o ? "" : o)} />
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
      title={item ? "Modifica inquadratura" : "Nuova inquadratura"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi"} icon="check" loading={saving} onPress={() => onSave(title.trim() || data.tipo || "Inquadratura", { ...data })} />
        </>
      }
    >
      <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ minWidth: 58, paddingHorizontal: spacing.sm, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 14, fontWeight: "700", color: colors.brandPrimary }}>{String(data.tipo || "—")}</Text>
          </View>
          <Text style={[s.label, { flex: 1 }]} numberOfLines={1}>
            {scena || "Scena non collegata"}
          </Text>
          <Pressable testID="shot-girata-toggle" onPress={() => set("girata", !data.girata)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: data.girata ? colors.success : colors.divider }}>
            <Icon name={data.girata ? "check-circle" : "circle-outline"} size={13} color={data.girata ? colors.success : colors.muted} />
            <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: data.girata ? colors.success : colors.muted }}>{data.girata ? "Girata" : "Da girare"}</Text>
          </Pressable>
        </View>
        <Text style={[s.label, { paddingTop: spacing.xs }]}>Inquadratura</Text>
        <TextInput
          testID="item-title-input"
          value={title}
          onChangeText={setTitle}
          placeholder="es. Dettaglio mani sul tavolo"
          placeholderTextColor={colors.muted}
          style={{ fontFamily: fonts.text, fontSize: 16, fontWeight: "700", color: colors.onSurface, paddingVertical: spacing.xs }}
        />
      </Glass>

      {campo("scena") ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Scena</Text>
          <RefInput f={campo("scena")!} value={data.scena} onChange={(v) => set("scena", v)} onGo={(mm) => go(mm)} />
        </View>
      ) : null}

      {riga("tipo", "Tipo di campo", "camera-outline")}
      {riga("angolo", "Angolazione", "angle-acute")}
      {riga("movimento", "Movimento", "arrow-left-right")}

      {campo("ottica") ? <LensInput testID="shot-ottica" label="Ottica" value={String(data.ottica ?? "")} onChange={(v) => set("ottica", v)} /> : null}

      {campo("setup") ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Setup luci</Text>
          <RefInput f={campo("setup")!} value={data.setup} onChange={(v) => set("setup", v)} onGo={(mm) => go(mm)} />
        </View>
      ) : null}

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
        <Text style={s.label}>Descrizione</Text>
        <TextInput
          testID="shot-descrizione-input"
          value={String(data.descrizione ?? "")}
          onChangeText={(v) => set("descrizione", v)}
          multiline
          scrollEnabled={false}
          placeholder="Cosa si vede nel campo, con quale luce, cosa serve."
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
