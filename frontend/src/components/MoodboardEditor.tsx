import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Item } from "@/src/api";
import { ImageField } from "@/src/components/Images";
import { RefInput } from "@/src/components/ItemEditor";
import { useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { spacing, useTheme } from "@/src/theme";
import { Button, Field, Glass, Icon, Sheet, useStyles } from "@/src/ui";

export default function MoodboardEditor({
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
      title={item ? "Modifica reference" : "Nuova reference"}
      footer={
        <>
          {item && onDelete ? (
            conferma ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Button testID="item-delete-button" icon="trash-can-outline" label="Elimina" variant="ghost" onPress={() => setConferma(true)} />
            )
          ) : null}
          <Button testID="item-save-button" label={item ? "Salva" : "Aggiungi"} icon="check" loading={saving} onPress={() => onSave(title.trim(), { ...data })} />
        </>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Immagine o video</Text>
          <ImageField testID="moodboard-immagine" value={data.immagine} onChange={(p) => set("immagine", p ?? "")} allowVideo />
          <Text style={s.muted}>Se scegli un video, nel muro compare con il tasto play.</Text>
        </View>

        <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
          <Field testID="item-title-input" label="Titolo (facoltativo)" value={title} onChangeText={setTitle} placeholder="es. Luce finestra, primo pomeriggio" />
          {campo("scena") ? <RefInput f={campo("scena")!} value={data.scena} onChange={(v) => set("scena", v)} onGo={(mm) => go(mm)} /> : null}
          {project.type === "Serie TV" && campo("episodio") ? <RefInput f={campo("episodio")!} value={data.episodio} onChange={(v) => set("episodio", v)} onGo={(mm) => go(mm)} /> : null}
          {project.type === "Social" && campo("contenuto") ? <RefInput f={campo("contenuto")!} value={data.contenuto} onChange={(v) => set("contenuto", v)} onGo={(mm) => go(mm)} /> : null}
          {campo("tipo") ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Tipo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {(campo("tipo")?.options ?? []).map((t) => (
                  <Button key={t} variant={data.tipo === t ? "primary" : "secondary"} label={t} small onPress={() => set("tipo", t)} />
                ))}
              </View>
            </View>
          ) : null}
          {campo("note") ? <Field testID="moodboard-note-input" label="Note" value={String(data.note ?? "")} onChangeText={(v) => set("note", v)} multiline minHeight={90} placeholder="Perché questa immagine serve al film" /> : null}
        </Glass>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Icon name="information-outline" size={13} color={colors.muted} />
          <Text style={[s.muted, { flex: 1 }]}>Le immagini restano nell’ordine di inserimento; il PDF stampa lo stesso muro.</Text>
        </View>
      </ScrollView>
    </Sheet>
  );
}
