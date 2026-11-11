import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Item } from "@/src/api";
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

function Scheda({ def, doc }: { def: ModuleDef; doc: Item | null }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, def.key);
  const qc = useQueryClient();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dueColonne = width >= 1000;
  const sezioni = def.sections ?? [];

  const [data, setData] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = { ...(doc?.data ?? {}) };
    // Il testo del vecchio campo "Ambientazione" finisce nel Luogo: non si perde.
    if (base.ambientazione && !base.luogo) base.luogo = base.ambientazione;
    // I vecchi documenti salvavano il corpo della storia in "body".
    const lungo = sezioni.find((x) => x.long)?.key;
    if (doc?.data.body && lungo && !base[lungo]) base[lungo] = doc.data.body;
    if (project.logline && !base.logline) base.logline = project.logline;
    return base;
  });
  const [salvato, setSalvato] = useState(true);
  const idRef = useRef<string | null>(doc?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const datiRef = useRef(data);
  const salvatoRef = useRef(true);

  const syncLogline = useMutation({
    mutationFn: (logline: string) => api(`/projects/${project.id}`, { method: "PUT", body: { ...project, logline } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", project.id] }),
  });

  useEffect(() => {
    datiRef.current = data;
  }, [data]);

  const persist = async (next: Record<string, string>) => {
    if (idRef.current) await m.update.mutateAsync({ id: idRef.current, data: next });
    else idRef.current = (await m.create.mutateAsync({ title: def.label, data: next })).id;
    if (next.logline !== undefined && next.logline !== project.logline) syncLogline.mutate(next.logline);
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

  const totaleParole = sezioni.reduce((n, sec) => n + conta(data[sec.key]), 0);
  const piene = sezioni.filter((sec) => conta(data[sec.key]) > 0).length;
  const minuti = Math.max(1, Math.round(totaleParole / 180));

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const campo = (key: string, opzioni: { carta?: boolean; min?: number } = {}) => {
    const sec = sezioni.find((x) => x.key === key);
    return (
      <View style={{ gap: spacing.xs }}>
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
            opzioni.carta
              ? {
                  fontFamily: fonts.display,
                  fontSize: 17,
                  lineHeight: 29,
                  color: colors.onSurface,
                  minHeight: opzioni.min ?? 260,
                  textAlignVertical: "top",
                  padding: 0,
                }
              : {
                  fontFamily: fonts.text,
                  fontSize: 15.5,
                  lineHeight: 24,
                  color: colors.onSurface,
                  minHeight: opzioni.min ?? 76,
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
      <View style={{ position: "absolute", right: -20, bottom: -24, opacity: 0.09 }} pointerEvents="none">
        <Icon name="movie-open-outline" size={180} color={colors.brandPrimary} />
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name="lightbulb-on-outline" size={14} color={colors.brandPrimary} />
          <Text style={s.label}>Il soggetto</Text>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
          {project.title}
        </Text>
        <Text style={[s.label, { paddingTop: spacing.sm }]}>Logline</Text>
        <TextInput
          testID="doc-logline-input"
          value={data.logline ?? ""}
          onChangeText={(t) => change("logline", t)}
          multiline
          placeholder={sezioni.find((x) => x.key === "logline")?.hint ?? "La storia in una o due frasi"}
          placeholderTextColor={colors.muted}
          style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 27, fontStyle: "italic", color: colors.onSurfaceSecondary, minHeight: 60, textAlignVertical: "top", padding: 0 }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
          {pillola("format-quote-open-outline", `${conta(data.logline)} parole`)}
          {pillola("book-open-page-variant-outline", `${minuti} ${minuti === 1 ? "minuto" : "minuti"} di lettura`)}
          {pillola("check-decagram-outline", `${piene}/${sezioni.length} sezioni`)}
        </View>
      </View>
    </View>
  );

  const storia = (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="book-open-variant" size={18} color={colors.brandPrimary} />
        <Text style={[s.h3, { flex: 1 }]}>La storia</Text>
        <Text style={[s.muted, { fontSize: 12 }]}>{conta(data.soggetto)} parole</Text>
      </View>
      {campo("soggetto", { carta: true, min: 300 })}
    </Card>
  );

  const scheda = (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="card-text-outline" size={18} color={colors.brandPrimary} />
        <Text style={s.h3}>La scheda</Text>
      </View>
      {campo("tema")}
      {campo("tono")}
      <View style={{ flexDirection: dueColonne ? "row" : "column", gap: spacing.md }}>
        <View style={{ flex: 1 }}>{campo("luogo")}</View>
        <View style={{ flex: 1 }}>{campo("epoca")}</View>
      </View>
    </Card>
  );

  const controllo = (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="progress-check" size={18} color={colors.brandPrimary} />
        <Text style={[s.h3, { flex: 1 }]}>A che punto sei</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.brandPrimary }}>{piene}/{sezioni.length}</Text>
      </View>
      {sezioni.map((sec) => {
        const ok = conta(data[sec.key]) > 0;
        return (
          <View key={sec.key} style={{ flexDirection: "row", gap: spacing.sm }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                marginTop: 1,
                borderWidth: 1,
                borderColor: ok ? colors.brandPrimary : colors.borderStrong,
                backgroundColor: ok ? colors.brandPrimary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {ok ? <Icon name="check" size={12} color={colors.onBrandPrimary} /> : null}
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 13.5, fontWeight: "600", color: ok ? colors.onSurface : colors.muted }}>{sec.label}</Text>
              {!ok && sec.hint ? (
                <Text style={[s.muted, { fontSize: 11.5, lineHeight: 15 }]} numberOfLines={2}>
                  {sec.hint}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${totaleParole} parole · ${salvato ? "Salvato · si salva da solo" : "Salvataggio in corso..."}`}
        right={<Button testID="soggetto-export-pdf" icon="file-pdf-box" variant="secondary" small onPress={() => exportHtml(def.label, wrap(`Soggetto · ${project.title}`, docHtml(def, { data } as unknown as Item), project.title))} />}
      />
      <KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + spacing.xxl }}>
        <View testID={`${def.key}-paper`} style={{ width: "100%", maxWidth: dueColonne ? 1040 : 780, gap: spacing.lg }}>
          {dueColonne ? (
            <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}>
              <View style={{ flex: 1.15, gap: spacing.lg }}>
                {poster}
                {storia}
              </View>
              <View style={{ flex: 1, gap: spacing.lg }}>
                {scheda}
                {controllo}
              </View>
            </View>
          ) : (
            <>
              {poster}
              {storia}
              {scheda}
              {controllo}
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

export default function SoggettoModule({ def }: { def: ModuleDef }) {
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
