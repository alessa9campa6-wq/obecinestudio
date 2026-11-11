import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { docHtml, exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Icon, IconName, useStyles } from "@/src/ui";

const conta = (t?: string) => {
  const s = (t ?? "").trim();
  return s ? s.split(/\s+/).length : 0;
};
const ROMANI: Record<string, string> = { "Atto I": "I", "Atto II": "II", "Atto III": "III" };

function Scheda({ def, doc }: { def: ModuleDef; doc: Item | null }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const sezioni = def.sections ?? [];
  const gruppi = Array.from(new Set(sezioni.map((x) => x.group).filter(Boolean))) as string[];

  const [data, setData] = useState<Record<string, string>>(() => ({ ...(doc?.data ?? {}) }));
  const [salvato, setSalvato] = useState(true);
  const idRef = useRef<string | null>(doc?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const datiRef = useRef(data);
  const salvatoRef = useRef(true);

  useEffect(() => {
    datiRef.current = data;
  }, [data]);

  const persist = async (next: Record<string, string>) => {
    if (idRef.current) await m.update.mutateAsync({ id: idRef.current, data: next });
    else idRef.current = (await m.create.mutateAsync({ title: def.label, data: next })).id;
    salvatoRef.current = true;
    setSalvato(true);
  };
  const change = (k: string, v: string) => {
    const next = { ...data, [k]: v };
    setData(next);
    salvatoRef.current = false;
    setSalvato(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(next), 900);
  };

  // Quello che stai scrivendo non si perde se esci prima del salvataggio automatico.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (!salvatoRef.current) void persist(datiRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!doc || !salvato) return;
    idRef.current = doc.id;
    setData((prev) => ({ ...prev, ...(doc.data ?? {}) }));
  }, [doc, salvato]);

  const paroleDi = (gruppo?: string) => {
    const lista = gruppo ? sezioni.filter((x) => x.group === gruppo) : sezioni;
    return lista.reduce((n, sec) => n + conta(data[sec.key]), 0);
  };
  const totaleParole = paroleDi();
  const piene = sezioni.filter((sec) => conta(data[sec.key]) > 0).length;
  const minuti = Math.max(1, Math.round(totaleParole / 180));

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const campo = (key: string, lungo?: boolean) => {
    const sec = sezioni.find((x) => x.key === key);
    return (
      <View key={key} style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={s.label}>{sec?.label ?? key}</Text>
          <View style={{ flex: 1 }} />
          {conta(data[key]) ? <Text style={[s.muted, { fontSize: 11 }]}>{conta(data[key])} parole</Text> : null}
        </View>
        <TextInput
          testID={`doc-${key}-input`}
          value={data[key] ?? ""}
          onChangeText={(t) => change(key, t)}
          multiline
          scrollEnabled={false}
          placeholder={sec?.hint ?? "Scrivi qui..."}
          placeholderTextColor={colors.muted}
          style={
            lungo
              ? { fontFamily: fonts.display, fontSize: 16.5, lineHeight: 28, color: colors.onSurface, minHeight: 190, textAlignVertical: "top", padding: 0 }
              : {
                  fontFamily: fonts.text,
                  fontSize: 15,
                  lineHeight: 23,
                  color: colors.onSurface,
                  minHeight: 72,
                  textAlignVertical: "top",
                  backgroundColor: colors.surfaceTertiary,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radius.md,
                  padding: spacing.md,
                }
          }
        />
      </View>
    );
  };

  const poster = (
    <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
      <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", right: -18, bottom: -24, opacity: 0.09 }} pointerEvents="none">
        <Icon name="script-text-outline" size={180} color={colors.brandPrimary} />
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name="text-box-outline" size={14} color={colors.brandPrimary} />
          <Text style={s.label}>Il trattamento</Text>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
          {project.title}
        </Text>
        <Text style={{ fontFamily: fonts.text, fontSize: 13.5, color: colors.onSurfaceSecondary }} numberOfLines={2}>
          {project.logline || "La storia sviluppata atto per atto"}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
          {pillola("format-list-numbered", `${piene}/${sezioni.length} passaggi`)}
          {pillola("book-open-page-variant-outline", `${minuti} ${minuti === 1 ? "minuto" : "minuti"} di lettura`)}
        </View>
      </View>
    </View>
  );

  const nastro = (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="chart-timeline-variant" size={18} color={colors.brandPrimary} />
        <Text style={[s.h3, { flex: 1 }]}>Tre atti</Text>
        <Text style={[s.muted, { fontSize: 12 }]}>{totaleParole} parole</Text>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {gruppi.map((g) => {
          const lista = sezioni.filter((x) => x.group === g);
          const fatti = lista.filter((x) => conta(data[x.key]) > 0).length;
          const quota = lista.length ? fatti / lista.length : 0;
          return (
            <View key={g} style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.brandPrimary }}>{ROMANI[g] ?? g}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: quota === 1 ? colors.brandPrimary : colors.muted }}>
                  {fatti}/{lista.length}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}>
                <LinearGradient
                  colors={[colors.brandSecondary, colors.brandPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 6, width: `${Math.max(3, quota * 100)}%`, borderRadius: radius.pill }}
                />
              </View>
              <Text style={[s.muted, { fontSize: 10.5 }]} numberOfLines={1}>
                {paroleDi(g)} parole
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );

  const atto = (g: string) => {
    const lista = sezioni.filter((x) => x.group === g);
    const fatti = lista.filter((x) => conta(data[x.key]) > 0).length;
    return (
      <Card key={g} style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              borderWidth: 1,
              borderColor: "rgba(212,175,55,0.5)",
              backgroundColor: "rgba(212,175,55,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brandPrimary }}>{ROMANI[g] ?? g}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h3}>{g}</Text>
            <Text style={[s.muted, { fontSize: 12 }]}>
              {fatti}/{lista.length} passaggi · {paroleDi(g)} parole
            </Text>
          </View>
        </View>
        {lista.map((sec) => campo(sec.key, sec.long))}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${totaleParole} parole · ${salvato ? "Salvato · si salva da solo" : "Salvataggio in corso..."}`}
        right={<Button testID="trattamento-export-pdf" icon="file-pdf-box" variant="secondary" small onPress={() => exportHtml(def.label, wrap(`Trattamento · ${project.title}`, docHtml(def, { data } as unknown as Item), project.title))} />}
      />
      <KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + spacing.xxl }}>
        <View testID={`${def.key}-paper`} style={{ width: "100%", maxWidth: 820, gap: spacing.lg }}>
          {poster}
          {nastro}
          {gruppi.map((g) => atto(g))}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export default function TrattamentoModule({ def }: { def: ModuleDef }) {
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
