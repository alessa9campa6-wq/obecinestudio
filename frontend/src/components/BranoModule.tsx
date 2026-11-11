import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import { Item } from "@/src/api";
import { SongPlayer } from "@/src/components/SongPlayer";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { docHtml, exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Icon, IconName, useStyles } from "@/src/ui";

// La struttura si scrive "Strofa 0:12 · Ritornello 0:45": qui la leggiamo per
// trasformarla in una linea del tempo, così i timecode non restano testo morto.
const aSecondi = (t: string) => {
  const [m, s] = t.split(":").map((n) => Number(n) || 0);
  return m * 60 + s;
};
const aDurata = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

type Segmento = { nome: string; tempo: string; inizio: number; lunghezza?: number };

function Riga({ icon, titolo, sotto }: { icon: IconName; titolo: string; sotto?: string }) {
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Icon name={icon} size={18} color={colors.brandPrimary} />
      <View style={{ flex: 1 }}>
        <Text style={s.h3}>{titolo}</Text>
        {sotto ? (
          <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>
            {sotto}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Scheda({ def, doc }: { def: ModuleDef; doc: Item | null }) {
  const { project } = useHub();
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dueColonne = width >= 1000;
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

  // Uscendo dalla sezione quello che hai appena scritto non va perso, anche se
  // il salvataggio automatico non è ancora scattato.
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

  const sezione = (k: string) => (def.sections ?? []).find((x) => x.key === k);

  const testo = data.testo ?? "";
  const righe = testo.split("\n").filter((l) => l.trim()).length;
  const parole = testo.trim() ? testo.trim().split(/\s+/).length : 0;

  const segmenti = useMemo<Segmento[]>(() => {
    const parti = (data.struttura ?? "")
      .replace(/\r/g, "")
      .split(/[·\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const out: Segmento[] = [];
    for (const p of parti) {
      const hit = /^(.*?)[\s—–-]*(\d{1,2}:\d{2}(?::\d{2})?)\s*$/.exec(p);
      if (hit) {
        const tempo = hit[2].length === 7 ? hit[2].slice(1) : hit[2];
        out.push({ nome: hit[1].trim() || "Sezione", tempo, inizio: aSecondi(tempo) });
      }
    }
    out.sort((a, b) => a.inizio - b.inizio);
    return out.map((sg, i) => ({ ...sg, lunghezza: out[i + 1] ? out[i + 1].inizio - sg.inizio : undefined }));
  }, [data.struttura]);
  const fineBrano = segmenti.length ? segmenti[segmenti.length - 1].inizio + (segmenti[segmenti.length - 1].lunghezza ?? 0) : 0;

  const campo = (key: string, opzioni: { font?: "display" | "text"; minHeight?: number; placeholder?: string } = {}) => {
    const sec = sezione(key);
    return (
      <TextInput
        testID={`brano-${key}-input`}
        value={data[key] ?? ""}
        onChangeText={(t) => change(key, t)}
        multiline
        scrollEnabled={false}
        placeholder={opzioni.placeholder ?? sec?.hint ?? "Scrivi qui..."}
        placeholderTextColor={colors.muted}
        style={{
          fontFamily: opzioni.font === "display" ? fonts.display : fonts.text,
          fontSize: opzioni.font === "display" ? 16.5 : 14.5,
          lineHeight: opzioni.font === "display" ? 27 : 23,
          color: colors.onSurface,
          minHeight: opzioni.minHeight ?? 120,
          textAlignVertical: "top",
          padding: 0,
        }}
      />
    );
  };

  const info = (icon: IconName, testoInfo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testoInfo}</Text>
    </View>
  );

  const miniCampo = (key: string, etichetta: string, suggerimento: string) => (
    <View style={{ flex: 1, minWidth: 92, gap: 3 }}>
      <Text style={[s.label, { fontSize: 9.5 }]}>{etichetta}</Text>
      <TextInput
        testID={`brano-${key}-input`}
        value={data[key] ?? ""}
        onChangeText={(t) => change(key, t)}
        placeholder={suggerimento}
        placeholderTextColor={colors.muted}
        style={{
          fontFamily: fonts.text,
          fontSize: 14,
          color: colors.onSurface,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.divider,
          borderRadius: radius.sm + 4,
          paddingHorizontal: spacing.sm,
          minHeight: 36,
        }}
      />
    </View>
  );

  const poster = (
    <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
      <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", right: -22, bottom: -26, opacity: 0.1 }} pointerEvents="none">
        <Icon name="music-circle-outline" size={190} color={colors.brandPrimary} />
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name="music-note-eighth" size={14} color={colors.brandPrimary} />
          <Text style={s.label}>Il brano</Text>
        </View>
        <TextInput
          testID="brano-titolo-input"
          value={data.titolo ?? ""}
          onChangeText={(t) => change("titolo", t)}
          placeholder="Titolo e artista"
          placeholderTextColor={colors.muted}
          style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.onSurface, paddingVertical: spacing.xs }}
        />
        <TextInput
          testID="brano-artista-input"
          value={data.artista ?? ""}
          onChangeText={(t) => change("artista", t)}
          placeholder="Artista"
          placeholderTextColor={colors.muted}
          style={{ fontFamily: fonts.text, fontSize: 16, color: colors.onSurfaceSecondary, paddingVertical: 2 }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: spacing.sm }}>
          {miniCampo("bpm", "BPM", "es. 96")}
          {miniCampo("durata", "Durata", "es. 3:42")}
          {miniCampo("tonalita", "Tonalità", "es. La minore")}
        </View>
        {segmenti.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>{info("timeline-clock-outline", `${segmenti.length} sezioni`)}</View>
        ) : null}
      </View>
    </View>
  );

  const ascolto = (
    <Card style={{ gap: spacing.md }}>
      <Riga icon="headphones" titolo="Ascolta" sotto={data.link ? "Il player legge il link qui sotto" : "Incolla il link del brano: si ascolta qui dentro"} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 44 }}>
        <Icon name="link-variant" size={17} color={colors.muted} />
        <TextInput
          testID="brano-link-input"
          value={data.link ?? ""}
          onChangeText={(t) => change("link", t)}
          placeholder="Incolla il link del brano"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="url"
          style={{ flex: 1, fontFamily: fonts.text, fontSize: 14, color: colors.onSurface, paddingVertical: spacing.sm }}
        />
      </View>
      <SongPlayer link={data.link} />
    </Card>
  );

  const testoBlocco = (
    <Card style={{ gap: spacing.md }}>
      <Riga icon="text-box-outline" titolo="Testo con timecode" sotto={`${righe} ${righe === 1 ? "riga" : "righe"} · ${parole} ${parole === 1 ? "parola" : "parole"}`} />
      {campo("testo", { font: "display", minHeight: 280, placeholder: "Scrivi il testo. Se vuoi, metti il timecode all'inizio della riga: [0:12] ..." })}
    </Card>
  );

  const struttura = (
    <Card style={{ gap: spacing.md }}>
      <Riga
        icon="timeline-clock-outline"
        titolo="Struttura"
        sotto={segmenti.length ? `${segmenti.length} sezioni · ${fineBrano ? `circa ${aDurata(fineBrano)}` : "timecode letti"}` : "Una sezione per riga: Strofa 0:12 · Ritornello 0:45"}
      />
      {segmenti.length ? (
        <View style={{ gap: 0, paddingTop: spacing.xs }}>
          {segmenti.map((sg, i) => (
            <View key={`${sg.nome}-${sg.tempo}`} style={{ flexDirection: "row", gap: spacing.md }}>
              <Text style={{ width: 44, fontFamily: fonts.script, fontSize: 12, color: colors.brandPrimary, paddingTop: 3 }}>{sg.tempo}</Text>
              <View style={{ width: 10, alignItems: "center" }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandPrimary, marginTop: 5 }} />
                {i < segmenti.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: colors.border, marginTop: 3 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: i < segmenti.length - 1 ? spacing.md : 0, flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 13.5, fontWeight: "600", color: colors.onSurface }} numberOfLines={1}>{sg.nome}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
                {sg.lunghezza ? <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: colors.muted }}>{aDurata(sg.lunghezza)}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {campo("struttura", { minHeight: segmenti.length ? 96 : 150 })}
    </Card>
  );

  const concept = (
    <Card style={{ gap: spacing.md }}>
      <Riga icon="palette-outline" titolo="Concept visivo" sotto={sezione("concept")?.hint} />
      {campo("concept", { font: "display", minHeight: 150, placeholder: "Immagini, colori, riferimenti: come deve apparire il video" })}
    </Card>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={salvato ? "Salvato · si salva da solo mentre scrivi" : "Salvataggio in corso..."}
        right={<Button testID="brano-export-pdf" icon="file-pdf-box" variant="secondary" small onPress={() => exportHtml(def.label, wrap(`Brano · ${project.title}`, docHtml(def, { data } as unknown as Item), project.title))} />}
      />
      <KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, alignItems: "center", paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={{ width: "100%", maxWidth: dueColonne ? 1040 : 760, gap: spacing.lg }}>
          {dueColonne ? (
            <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}>
              <View style={{ flex: 1.15, gap: spacing.lg }}>
                {poster}
                {testoBlocco}
              </View>
              <View style={{ flex: 1, gap: spacing.lg }}>
                {ascolto}
                {struttura}
                {concept}
              </View>
            </View>
          ) : (
            <>
              {poster}
              {ascolto}
              {testoBlocco}
              {struttura}
              {concept}
            </>
          )}
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
