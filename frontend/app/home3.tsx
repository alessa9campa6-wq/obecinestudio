import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Project } from "@/src/api";
import { useCalendarEvents } from "@/src/components/CalendarCard";
import { fonts, spacing } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

// ── Home 3, versione completa ────────────────────────────────────────────────
// Nasce dall'impaginazione editoriale del primo esperimento (copertina, scena,
// pellicola) e ci innesta dentro le cose che servono davvero: la giornata di
// riprese, il ciak, il meteo, il film in corso, il calendario e i progetti veri.
// Nero, #025669 e vetro: stessa palette delle altre home sperimentali.

const NERO = "#050708";
const TEAL = "#025669";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.05)";
const BORDO = "rgba(255,255,255,0.12)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.56)";

const COPERTINA = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop";
const DEMO_COVER = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop";
const PLACEHOLDER = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=80&w=900";

const FOTOGRAMMI = [
  { tc: "00:14:22", img: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop", nota: "Campo largo" },
  { tc: "00:14:31", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop", nota: "Dettaglio" },
  { tc: "00:14:47", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop", nota: "Controcampo" },
  { tc: "00:15:03", img: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop", nota: "Primo piano" },
];

const PALETTE = [
  { nome: "Notte", hex: "#071018" },
  { nome: "Teal", hex: "#025669" },
  { nome: "Ambra", hex: "#C8A06A" },
  { nome: "Fumo", hex: "#8A9499" },
];

const FASI = ["Sviluppo", "Pre", "Riprese", "Post", "Consegna"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

const DECISIONI = [
  "Confermare la location di lunedì",
  "Approvare il look notturno",
  "Scegliere la take della scena 14",
];

const PORTE: { icona: IconName; titolo: string; sotto: string; rotta: string }[] = [
  { icona: "compass-outline", titolo: "Esplora", sotto: "Persone, luoghi, idee", rotta: "/esplora" },
  { icona: "message-text-outline", titolo: "Messaggi", sotto: "Conversazioni e richieste", rotta: "/messaggi" },
  { icona: "wrench-outline", titolo: "Strumenti", sotto: "Calcolatrici, reparto, formati", rotta: "/strumenti" },
  { icona: "account-circle-outline", titolo: "Profilo", sotto: "Il tuo lavoro e il rental", rotta: "/profilo" },
];

const OGGI = {
  convocazione: "06:30",
  scena: "Scene 14 · 15A · 16",
  location: "Ex Cartiera · Bologna",
  meteo: "Sereno, 9°",
  tramonto: "16:58",
  alba: "07:21",
  ore: 3,
  minuti: 25,
};

function Vetro({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO, borderRadius: 22, overflow: "hidden" }, style]}>
      <LinearGradient colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.01)", "rgba(2,86,105,0.18)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      {children}
    </View>
  );
}

function Etichetta({ children }: { children: string }) {
  return <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.8, fontWeight: "800", color: TEAL_CHIARO }}>{children}</Text>;
}

function Pill({ icona, testo }: { icona: IconName; testo: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO }}>
      <Icon name={icona} size={11} color={TEAL_CHIARO} />
      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "600", color: TESTO }} numberOfLines={1}>{testo}</Text>
    </View>
  );
}

export default function Home3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [ora, setOra] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
  const eventi = useCalendarEvents();
  const progetti = q.data ?? [];
  const attivo = progetti[0];

  const [mese, setMese] = useState(() => dayjs().startOf("month"));
  const [giorno, setGiorno] = useState(() => dayjs().format("YYYY-MM-DD"));
  const [fatte, setFatte] = useState<number[]>([]);

  // ciak: suono, vibrazione e lampo
  const suono = useAudioPlayer(require("../assets/sounds/ciak.wav"));
  const lampo = useRef(new Animated.Value(0)).current;
  const batti = () => {
    lampo.setValue(1);
    Animated.timing(lampo, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      suono.seekTo(0);
      suono.play();
    } catch {}
  };

  const perGiorno = useMemo(() => {
    const m = new Map<string, { ora: string; titolo: string }[]>();
    for (const e of eventi.data ?? []) {
      const lista = m.get(e.date) ?? [];
      lista.push({ ora: e.time || "—", titolo: e.title });
      m.set(e.date, lista);
    }
    return m;
  }, [eventi.data]);

  const prossimi = useMemo(() => {
    const oggiStr = dayjs().format("YYYY-MM-DD");
    return (eventi.data ?? [])
      .filter((e) => e.date >= oggiStr)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 4);
  }, [eventi.data]);

  const primaCell = (mese.day() + 6) % 7;
  const giorniMese = mese.daysInMonth();
  const celle = [...Array(primaCell).fill(0), ...Array.from({ length: giorniMese }, (_, i) => i + 1)];
  const eventiGiorno = perGiorno.get(giorno) ?? [];
  const titolo = attivo?.title ?? "Notturno";
  const logline = attivo?.logline || "Cortometraggio · una donna aspetta una telefonata che non arriva, in una cucina che non è la sua.";
  const cover = attivo?.cover_path ? fileUrl(attivo.cover_path) : COPERTINA;
  const fasiAttive = 2;

  const cardW = wide ? 300 : Math.min(280, width * 0.76);

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        {/* ── copertina ─────────────────────────────────────────────── */}
        <View style={{ height: wide ? 420 : 390 }}>
          <Image source={{ uri: cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.25)", "rgba(2,86,105,0.55)", NERO]} locations={[0, 0.55, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="chevron-left" size={20} color={TESTO} />
              </Pressable>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.4, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>HOME 3 · ESPERIMENTO</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 12, color: TESTO, letterSpacing: 1 }}>
                {[ora.getHours(), ora.getMinutes()].map((n) => String(n).padStart(2, "0")).join(":")}
              </Text>
            </View>

            <View style={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2, fontWeight: "800", color: TEAL_CHIARO }}>
                {attivo ? `${attivo.type.toUpperCase()} · ${progetti.length} PROGETTI` : "CINEMA · IN LAVORAZIONE"}
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: wide ? 60 : 46, lineHeight: wide ? 62 : 48, color: "#FFFFFF" }} numberOfLines={2}>
                {titolo}
              </Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 13, lineHeight: 18, color: "rgba(242,246,247,0.78)", maxWidth: 540 }} numberOfLines={2}>
                {logline}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                <Pill icona="weather-partly-cloudy" testo={OGGI.meteo} />
                <Pill icona="weather-sunset" testo={`Tramonto ${OGGI.tramonto}`} />
                <Pill icona="account-group-outline" testo={`${attivo?.members?.length || 14} persone`} />
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.md }}>
          {/* ── oggi si gira + meteo ────────────────────────────────── */}
          <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "stretch" }}>
            <Vetro style={{ flex: wide ? 1.9 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Etichetta>MERCOLEDÌ 12 NOVEMBRE · GIORNO 4 DI 9</Etichetta>
                    <Text style={{ fontFamily: fonts.display, fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36, color: TESTO }}>Oggi si gira.</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: TENUE }}>{OGGI.location}</Text>
                  </View>
                  <View style={{ alignItems: "center", justifyContent: "center", width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: "rgba(2,86,105,0.9)", backgroundColor: "rgba(2,86,105,0.25)" }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 15, fontWeight: "700", color: TESTO }}>{OGGI.convocazione}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 0.6, color: TENUE }}>CALL</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  <Pill icona="movie-open-outline" testo={OGGI.scena} />
                  <Pill icona="weather-sunset" testo={`Tramonto ${OGGI.tramonto}`} />
                  <Pill icona="weather-sunny" testo={OGGI.meteo} />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.2, color: TENUE }}>AL TRAMONTO</Text>
                    <Text style={{ fontFamily: fonts.display, fontSize: 26, color: TESTO }}>{OGGI.ore}h {OGGI.minuti}m</Text>
                  </View>
                  <Pressable
                    onPress={batti}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: TEAL, borderWidth: 1, borderColor: "rgba(10,143,166,0.85)", transform: [{ scale: pressed ? 0.96 : 1 }] })}
                  >
                    <Icon name="movie-open-play" size={16} color="#FFFFFF" />
                    <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" }}>Batti il ciak</Text>
                  </Pressable>
                </View>
              </View>
            </Vetro>

            {/* meteo */}
            <Vetro style={{ flex: wide ? 1 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Etichetta>METEO SUL SET</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>Bologna</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Icon name="weather-partly-cloudy" size={42} color={TEAL_CHIARO} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 44, color: TESTO }}>9°</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11, color: TENUE }}>Sereno · vento 12 km/h</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 2 }}>
                  {[
                    { i: "weather-sunset-up" as IconName, l: "Alba", v: OGGI.alba },
                    { i: "weather-sunset-down" as IconName, l: "Tramonto", v: OGGI.tramonto },
                    { i: "thermometer" as IconName, l: "Minima", v: "6°" },
                  ].map((x) => (
                    <View key={x.l} style={{ flex: 1, gap: 3, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                      <Icon name={x.i} size={14} color={TEAL_CHIARO} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1, color: TENUE }}>{x.l.toUpperCase()}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 12.5, color: TESTO }}>{x.v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Vetro>
          </View>

          {/* ── scena + film in corso ──────────────────────────────── */}
          <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "stretch" }}>
            <Vetro style={{ flex: wide ? 1.35 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Etichetta>LA SCENA DI OGGI</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>sc. 14 · take 3</Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: TESTO }}>La telefonata</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, lineHeight: 16, color: TENUE }}>
                      Il telefono squilla tre volte. Lei non risponde. Fuori piove, dentro il frigo ronza.
                    </Text>
                  </View>
                  <View style={{ width: 88, height: 112, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
                    <Image source={{ uri: FOTOGRAMMI[3].img }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <LinearGradient colors={["rgba(2,86,105,0)", "rgba(2,86,105,0.6)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44 }} />
                    <Text style={{ position: "absolute", left: 6, bottom: 5, fontFamily: fonts.script, fontSize: 8, color: "#FFFFFF" }}>primo piano</Text>
                  </View>
                </View>
                <View style={{ borderRadius: 12, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.5)", padding: spacing.md, gap: 4 }}>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9.5, letterSpacing: 1, color: TEAL_CHIARO }}>INT. CUCINA — NOTTE</Text>
                  <Text style={{ fontFamily: fonts.script, fontSize: 11.5, lineHeight: 18, color: "rgba(242,246,247,0.86)" }}>
                    Il telefono squilla. ELENA resta immobile davanti al lavandino. Al terzo squillo alza la cornetta, poi la rimette giù.
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Pressable onPress={() => (attivo ? router.push(`/project/${attivo.id}` as never) : undefined)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO }}>
                    <Icon name="script-text-outline" size={13} color={TESTO} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: TESTO }}>Apri il progetto</Text>
                  </Pressable>
                </View>
              </View>
            </Vetro>

            {/* film in corso, con le fasi */}
            <Vetro style={{ flex: wide ? 1 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Etichetta>IL FILM IN CORSO</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>4/9 giorni</Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
                  <Image source={{ uri: cover }} style={{ width: 58, height: 78, borderRadius: 12 }} contentFit="cover" />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 22, color: TESTO }} numberOfLines={1}>{titolo}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11, color: TENUE }} numberOfLines={1}>
                      {attivo ? `${attivo.type}${attivo.genre ? ` · ${attivo.genre}` : ""}` : "Cortometraggio · 18 min"}
                    </Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>budget 78% · 14 persone</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 4, paddingTop: 2 }}>
                  {FASI.map((f, i) => (
                    <View key={f} style={{ flex: 1, gap: 5 }}>
                      <View style={{ height: 3, borderRadius: 2, backgroundColor: i === fasiAttive ? TEAL_CHIARO : i < fasiAttive ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 7.5, textAlign: "center", color: i === fasiAttive ? TESTO : TENUE }} numberOfLines={1}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Vetro>
          </View>

          {/* ── pellicola ──────────────────────────────────────────── */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Etichetta>LA PELLICOLA DI OGGI</Etichetta>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>4 inquadrature · 12 take</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
              {FOTOGRAMMI.map((f, i) => (
                <View key={f.tc} style={{ width: 146 }}>
                  <View style={{ borderRadius: 10, overflow: "hidden", backgroundColor: "#0A0D0F", borderWidth: 1, borderColor: BORDO }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 5, paddingVertical: 3, backgroundColor: "rgba(2,86,105,0.35)" }}>
                      {Array.from({ length: 6 }).map((_, k) => (
                        <View key={k} style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.35)" }} />
                      ))}
                    </View>
                    <Image source={{ uri: f.img }} style={{ width: "100%", height: 90 }} contentFit="cover" />
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 5, paddingVertical: 3, backgroundColor: "rgba(2,86,105,0.35)" }}>
                      {Array.from({ length: 6 }).map((_, k) => (
                        <View key={k} style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.35)" }} />
                      ))}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 5 }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? TEAL_CHIARO : TENUE }}>{f.tc}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 9, color: TENUE }}>· {f.nota}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── calendario + in arrivo ─────────────────────────────── */}
          <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "stretch" }}>
            <Vetro style={{ flex: wide ? 1.35 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Etichetta>CALENDARIO</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => setMese(mese.subtract(1, "month"))} hitSlop={6} style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDO }}>
                    <Icon name="chevron-left" size={16} color={TESTO} />
                  </Pressable>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: TESTO, minWidth: 96, textAlign: "center" }}>
                    {MESI[mese.month()]} {mese.year()}
                  </Text>
                  <Pressable onPress={() => setMese(mese.add(1, "month"))} hitSlop={6} style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDO }}>
                    <Icon name="chevron-right" size={16} color={TESTO} />
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row" }}>
                  {GIORNI.map((g, i) => (
                    <Text key={`${g}-${i}`} style={{ flex: 1, textAlign: "center", fontFamily: fonts.text, fontSize: 9, letterSpacing: 0.5, color: TENUE }}>{g}</Text>
                  ))}
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {celle.map((d, idx) => {
                    if (!d) return <View key={`v-${idx}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
                    const iso = mese.date(d).format("YYYY-MM-DD");
                    const sel = iso === giorno;
                    const oggi = iso === dayjs().format("YYYY-MM-DD");
                    const ev = perGiorno.get(iso);
                    return (
                      <Pressable key={iso} onPress={() => setGiorno(iso)} style={{ width: `${100 / 7}%`, height: 40, alignItems: "center", justifyContent: "center" }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: sel ? TEAL : "transparent", borderWidth: oggi && !sel ? 1 : 0, borderColor: TEAL_CHIARO }}>
                          <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: sel || oggi ? "800" : "500", color: sel ? "#FFFFFF" : oggi ? TEAL_CHIARO : TESTO }}>{d}</Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
                          {(ev ?? []).slice(0, 3).map((e, k) => (
                            <View key={k} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: sel ? "#FFFFFF" : TEAL_CHIARO }} />
                          ))}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ gap: 6, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TEAL_CHIARO }}>{dayjs(giorno).format("DD/MM/YYYY")}</Text>
                  {eventiGiorno.length ? (
                    eventiGiorno.map((e, i) => (
                      <View key={`${e.titolo}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontFamily: fonts.script, fontSize: 10.5, color: TEAL_CHIARO, minWidth: 40 }}>{e.ora}</Text>
                        <Text style={{ fontFamily: fonts.text, fontSize: 12, color: TESTO, flex: 1 }} numberOfLines={1}>{e.titolo}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontFamily: fonts.text, fontSize: 12, color: TENUE }}>Niente in programma. Giornata libera.</Text>
                  )}
                </View>
              </View>
            </Vetro>

            <View style={{ flex: wide ? 1 : undefined, gap: spacing.lg }}>
              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Etichetta>IN ARRIVO</Etichetta>
                    <View style={{ flex: 1 }} />
                    <Icon name="calendar-blank-outline" size={14} color={TENUE} />
                  </View>
                  {prossimi.length ? (
                    prossimi.map((e, i) => (
                      <View key={e.id} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                        <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? TEAL_CHIARO : TENUE, minWidth: 62 }}>
                          {dayjs(e.date).format("DD MMM").toUpperCase()}{e.time ? ` · ${e.time}` : ""}
                        </Text>
                        <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: TESTO }} numberOfLines={2}>{e.title}</Text>
                      </View>
                    ))
                  ) : (
                    <>
                      {[
                        { q: "OGGI · 18:00", c: "Sopralluogo location notte" },
                        { q: "DOM · 09:30", c: "Prove con il cast" },
                        { q: "LUN · 07:00", c: "Giorno 5 · riprese" },
                      ].map((a, i) => (
                        <View key={a.c} style={{ flexDirection: "row", gap: spacing.sm, paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                          <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? TEAL_CHIARO : TENUE, minWidth: 62 }}>{a.q}</Text>
                          <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: TESTO }} numberOfLines={2}>{a.c}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              </Vetro>

              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Etichetta>DA DECIDERE</Etichetta>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>{DECISIONI.length - fatte.length} aperte</Text>
                  </View>
                  {DECISIONI.map((d, i) => {
                    const fatta = fatte.includes(i);
                    return (
                      <Pressable key={d} onPress={() => setFatte((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]))} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                        <View style={{ width: 17, height: 17, borderRadius: 5, borderWidth: 1.5, borderColor: fatta ? TEAL_CHIARO : "rgba(255,255,255,0.3)", backgroundColor: fatta ? "rgba(10,143,166,0.28)" : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {fatta ? <Icon name="check" size={10} color={TEAL_CHIARO} /> : null}
                        </View>
                        <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12, fontWeight: "600", color: fatta ? TENUE : TESTO, textDecorationLine: fatta ? "line-through" : "none" }} numberOfLines={2}>{d}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Vetro>
            </View>
          </View>

          {/* ── progetti: indice + carosello ──────────────────────── */}
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: TESTO }}>Progetti</Text>
              <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: BORDO }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TENUE }}>{progetti.length}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => router.push("/" as never)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TEAL_CHIARO }}>Tutti</Text>
                <Icon name="arrow-right" size={13} color={TEAL_CHIARO} />
              </Pressable>
            </View>

            <Vetro>
              <View style={{ paddingVertical: 4 }}>
                {(progetti.length ? progetti.slice(0, 4) : []).map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push(`/project/${p.id}` as never)}
                    style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 11, paddingHorizontal: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}
                  >
                    <Text style={{ fontFamily: fonts.display, fontSize: 20, color: "rgba(10,143,166,0.75)", width: 30 }}>{String(i + 1).padStart(2, "0")}</Text>
                    <Image source={{ uri: p.cover_path ? fileUrl(p.cover_path) : PLACEHOLDER }} style={{ width: 38, height: 50, borderRadius: 8 }} contentFit="cover" />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.2, fontWeight: "800", color: TEAL_CHIARO }} numberOfLines={1}>{p.type.toUpperCase()}</Text>
                      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: TESTO }} numberOfLines={1}>{p.title}</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }} numberOfLines={1}>{p.logline || "Nessuna logline"}</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={TENUE} />
                  </Pressable>
                ))}
                {progetti.length ? null : (
                  <Text style={{ padding: spacing.lg, fontFamily: fonts.text, fontSize: 12.5, color: TENUE }}>
                    Qui compariranno i tuoi progetti: per ora nessuno.
                  </Text>
                )}
              </View>
            </Vetro>

            {/* vista progetti di Home 2: copertine grandi */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
              {(progetti.length ? progetti.slice(1, 4) : [{ id: "demo", title: "Ferro & Fuoco", type: "Documentario", cover_path: null, logline: "" }]).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => (p.id === "demo" ? undefined : router.push(`/project/${p.id}` as never))}
                  style={({ pressed }) => ({ width: cardW, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: BORDO, backgroundColor: VETRO, opacity: pressed ? 0.9 : 1 })}
                >
                  <Image source={{ uri: p.cover_path ? fileUrl(p.cover_path) : DEMO_COVER }} style={{ width: "100%", height: 150 }} contentFit="cover" />
                  <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.94)"]} style={{ position: "absolute", left: 0, right: 0, top: 54, height: 200 }} />
                  <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 4 }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.4, fontWeight: "800", color: TEAL_CHIARO }}>{p.type.toUpperCase()}</Text>
                    <Text style={{ fontFamily: fonts.display, fontSize: 21, color: TESTO }} numberOfLines={1}>{p.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.16)" }}>
                        <View style={{ height: 3, width: `${40 + ((p.title.length * 7) % 45)}%`, borderRadius: 2, backgroundColor: TEAL_CHIARO }} />
                      </View>
                      <Icon name="arrow-top-right" size={13} color={TEAL_CHIARO} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── le quattro sezioni, come porte ────────────────────── */}
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Etichetta>DOVE ANDARE</Etichetta>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>quattro porte</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {PORTE.map((p, i) => (
                <Pressable
                  key={p.titolo}
                  onPress={() => router.push(p.rotta as never)}
                  style={({ pressed }) => ({ width: wide ? "48.8%" : "100%", opacity: pressed ? 0.9 : 1 })}
                >
                  <Vetro>
                    <View style={{ padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                      <Text style={{ fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: "rgba(10,143,166,0.5)", width: 56 }}>{String(i + 1).padStart(2, "0")}</Text>
                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Icon name={p.icona} size={15} color={TEAL_CHIARO} />
                          <Text style={{ fontFamily: fonts.display, fontSize: 23, color: TESTO }}>{p.titolo}</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: TENUE }}>{p.sotto}</Text>
                      </View>
                      <Icon name="arrow-top-right" size={18} color={TEAL_CHIARO} />
                    </View>
                  </Vetro>
                </Pressable>
              ))}
            </View>
          </View>

          {/* palette del look, in chiusura */}
          <Vetro>
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Etichetta>LOOK DI OGGI</Etichetta>
                <View style={{ flex: 1 }} />
                <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>Kodak 2383</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {PALETTE.map((c) => (
                  <View key={c.nome} style={{ flex: 1, gap: 4 }}>
                    <View style={{ height: 40, borderRadius: 10, backgroundColor: c.hex, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }} />
                    <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE, textAlign: "center" }}>{c.nome}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Vetro>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.28)", textAlign: "center" }}>HOME 3 · concetto, calendario e progetti reali</Text>
        </View>
      </ScrollView>

      {/* lampo del ciak */}
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", opacity: lampo }} />

      {/* ciak rotondo */}
      <Pressable
        onPress={batti}
        style={({ pressed }) => ({
          position: "absolute",
          right: spacing.lg,
          bottom: insets.bottom > 0 ? insets.bottom + spacing.lg : spacing.xl,
          width: 62,
          height: 62,
          borderRadius: 31,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: TEAL,
          borderWidth: 1,
          borderColor: "rgba(10,143,166,0.9)",
          transform: [{ scale: pressed ? 0.94 : 1 }],
          shadowColor: TEAL_CHIARO,
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
        })}
      >
        <Icon name="movie-open-play" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
