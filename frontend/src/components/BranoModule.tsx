import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { SongPlayer } from "@/src/components/SongPlayer";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { docHtml, exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Icon, useStyles } from "@/src/ui";

// Il brano è un documento speciale: in cima titolo, artista e player, sotto
// struttura, testo e concept. Salva da solo, come gli altri documenti.
function Scheda({ def, doc }: { def: ModuleDef; doc: Item | null }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Record<string, string>>(() => ({ ...(doc?.data ?? {}) }));
  const [saved, setSaved] = useState(true);
  const idRef = useRef<string | null>(doc?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = async (next: Record<string, string>) => {
    if (idRef.current) await m.update.mutateAsync({ id: idRef.current, data: next });
    else idRef.current = (await m.create.mutateAsync({ title: def.label, data: next })).id;
    setSaved(true);
  };
  const change = (k: string, v: string) => {
    const next = { ...data, [k]: v };
    setData(next);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(next), 1000);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => {
    if (!doc || !saved) return;
    idRef.current = doc.id;
    setData((prev) => ({ ...prev, ...(doc.data ?? {}) }));
  }, [doc?.id, doc?.updated_at, saved]);

  const sezioni = def.sections ?? [];
  const sezione = (k: string) => sezioni.find((x) => x.key === k);
  const resto = sezioni.filter((x) => !["titolo", "bpm", "link"].includes(x.key));

  const campo = (key: string, label: string, hint: string, long?: boolean) => (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        testID={`brano-${key}-input`}
        value={data[key] ?? ""}
        onChangeText={(t) => change(key, t)}
        multiline
        scrollEnabled={false}
        placeholder={hint}
        placeholderTextColor={colors.muted}
        style={{
          fontFamily: long ? fonts.display : fonts.text,
          fontSize: long ? 17 : 16,
          lineHeight: long ? 28 : 24,
          color: colors.onSurface,
          minHeight: long ? 160 : 44,
          textAlignVertical: "top",
          paddingVertical: spacing.xs,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={saved ? "Salvato" : "Salvataggio..."}
        right={<Button testID="brano-export-pdf" icon="file-pdf-box" variant="secondary" onPress={() => exportHtml(def.label, wrap(`${def.label} · ${project.title}`, docHtml(def, { data } as unknown as Item), project.title))} />}
      />
      <KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={{ width: "100%", maxWidth: 760, gap: spacing.lg }}>
          <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="music-circle-outline" size={22} color={colors.brandPrimary} />
              <Text style={s.label}>Il brano</Text>
            </View>
            <TextInput
              testID="brano-titolo-input"
              value={data.titolo ?? ""}
              onChangeText={(t) => change("titolo", t)}
              placeholder="Titolo e artista"
              placeholderTextColor={colors.muted}
              style={{ fontFamily: fonts.display, fontSize: 30, color: colors.onSurface, paddingVertical: spacing.xs }}
            />
            <TextInput
              testID="brano-bpm-input"
              value={data.bpm ?? ""}
              onChangeText={(t) => change("bpm", t)}
              placeholder="BPM, durata, tonalità · es. 96 BPM · 3:42 · La minore"
              placeholderTextColor={colors.muted}
              style={{ fontFamily: fonts.text, fontSize: 15, color: colors.muted, paddingVertical: spacing.xs }}
            />

            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>{sezione("link")?.label ?? "Link audio"}</Text>
              <TextInput
                testID="brano-link-input"
                value={data.link ?? ""}
                onChangeText={(t) => change("link", t)}
                placeholder="https://soundcloud.com/... oppure un file .mp3"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="url"
                style={{ fontFamily: fonts.text, fontSize: 15, color: colors.onSurface, minHeight: 44, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider }}
              />
              <SongPlayer link={data.link} />
            </View>
          </View>

          <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.xl }}>
            {resto.map((sec) => (
              <View key={sec.key}>{campo(sec.key, sec.label, sec.hint ?? "Scrivi qui...", sec.long)}</View>
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export default function BranoModule({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const q = useItems(project.id, def.key);
  const { colors } = useTheme();
  if (q.isLoading)
    return (
      <ScrollView>
        <ActivityIndicator style={{ marginTop: spacing.xxxl }} color={colors.brandPrimary} />
      </ScrollView>
    );
  return <Scheda key={def.key} def={def} doc={q.data?.[0] ?? null} />;
}
