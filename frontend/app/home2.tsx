import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { fonts, spacing } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

// ── Home 2: un esperimento, slegato dal resto dell'app ───────────────────────
// Nero pieno, teal #025669 e vetro trasparente. Dati finti: serve solo a vedere
// come potrebbe respirare una home diversa, più "regia" e meno gestionale.

const NERO = "#050708";
const TEAL = "#025669";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.055)";
const BORDO = "rgba(255,255,255,0.13)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.58)";

const OGGI = {
  giorno: "GIORNO 4",
  data: "Mercoledì 12 novembre",
  convocazione: "06:30",
  scena: "Scene 14 · 15A · 16",
  location: "Ex Cartiera · Bologna",
  meteo: "Sereno, 9°",
  tramonto: "16:58",
  ore: 3,
  minuti: 25,
};

const FASI = [
  { l: "Sviluppo", fatto: true },
  { l: "Pre", fatto: true },
  { l: "Riprese", attivo: true },
  { l: "Post", fatto: false },
  { l: "Consegna", fatto: false },
];

const AZIONI: { icona: IconName; label: string; sotto: string }[] = [
  { icona: "movie-open-play-outline", label: "Ciak", sotto: "Sc 14 · T3" },
  { icona: "draw", label: "Storyboard", sotto: "12 tavole" },
  { icona: "lightbulb-group-outline", label: "Luci", sotto: "Setup notte" },
  { icona: "weather-partly-cloudy", label: "Meteo", sotto: "Tramonto 16:58" },
];

const PROGETTI = [
  { titolo: "Notturno", tipo: "Cortometraggio", fase: "Riprese", quota: 0.62, cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=900&auto=format&fit=crop" },
  { titolo: "Ferro & Fuoco", tipo: "Documentario", fase: "Montaggio", quota: 0.38, cover: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?q=80&w=900&auto=format&fit=crop" },
  { titolo: "Onde", tipo: "Videoclip", fase: "Pre-produzione", quota: 0.18, cover: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=900&auto=format&fit=crop" },
];

const AGENDA = [
  { quando: "OGGI · 18:00", cosa: "Sopralluogo location notte", dove: "Via del Porto 12" },
  { quando: "DOM · 09:30", cosa: "Prove con il cast", dove: "Sala prove, Bologna" },
  { quando: "LUN · 07:00", cosa: "Giorno 5 · riprese", dove: "Ex Cartiera" },
];

function Vetro({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO, borderRadius: 24, overflow: "hidden" }, style]}>
      <LinearGradient colors={["rgba(255,255,255,0.09)", "rgba(255,255,255,0.01)", "rgba(2,86,105,0.16)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      {children}
    </View>
  );
}

export default function Home2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [ora, setOra] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const orologio = [ora.getHours(), ora.getMinutes(), ora.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  const nome = (user?.name ?? "").split(" ")[0] || "Alessandro";
  const cardW = wide ? 320 : Math.min(300, width * 0.78);

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      {/* bagliori teal, come una fonte di luce fuori campo */}
      <LinearGradient colors={[`${TEAL}88`, "rgba(2,86,105,0.18)", "rgba(5,7,8,0)"]} style={{ position: "absolute", top: -160, left: -80, right: -80, height: 520 }} pointerEvents="none" />
      <View pointerEvents="none" style={{ position: "absolute", top: 120, right: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: TEAL_CHIARO, opacity: 0.16 }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: 120, left: -140, width: 300, height: 300, borderRadius: 150, backgroundColor: TEAL, opacity: 0.2 }} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 130, gap: spacing.lg }}>
        {/* barra alta */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO }}>
            <Icon name="chevron-left" size={20} color={TESTO} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 2, fontWeight: "800", color: TEAL_CHIARO }}>HOME 2 · ESPERIMENTO</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 12, color: TENUE }}>Ciao {nome}, {OGGI.giorno.toLowerCase()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 15, color: TESTO, letterSpacing: 1 }}>{orologio}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#4ADE80" }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, color: TENUE }}>sul set</Text>
            </View>
          </View>
        </View>

        {/* oggi: la giornata che conta */}
        <Vetro>
          <View style={{ padding: spacing.xl, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.6, fontWeight: "800", color: TEAL_CHIARO }}>{OGGI.giorno} · {OGGI.data.toUpperCase()}</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36, color: TESTO }}>Oggi si gira.</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: TENUE }}>{OGGI.location}</Text>
              </View>
              <View style={{ alignItems: "center", justifyContent: "center", width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: `rgba(2,86,105,0.9)`, backgroundColor: "rgba(2,86,105,0.25)" }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 15, color: TESTO, fontWeight: "700" }}>{OGGI.convocazione}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, color: TENUE, letterSpacing: 0.6 }}>CALL</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {[
                { i: "movie-open-outline" as IconName, t: OGGI.scena },
                { i: "weather-sunset" as IconName, t: `Tramonto ${OGGI.tramonto}` },
                { i: "weather-partly-cloudy" as IconName, t: OGGI.meteo },
              ].map((x) => (
                <View key={x.t} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO }}>
                  <Icon name={x.i} size={12} color={TEAL_CHIARO} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "600", color: TESTO }}>{x.t}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.2, color: TENUE }}>AL TRAMONTO</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 26, color: TESTO }}>{OGGI.ore}h {OGGI.minuti}m</Text>
              </View>
              <Pressable
                onPress={() => router.push("/home2" as never)}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 999, backgroundColor: TEAL, borderWidth: 1, borderColor: "rgba(10,143,166,0.8)", opacity: pressed ? 0.85 : 1 })}
              >
                <Icon name="movie-open-play" size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" }}>Apri il piano</Text>
              </Pressable>
            </View>
          </View>
        </Vetro>

        {/* azioni rapide */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.8, fontWeight: "800", color: TENUE }}>UN TOCCO E VIA</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {AZIONI.map((a) => (
              <Vetro key={a.label} style={{ flex: 1, borderRadius: 20 }}>
                <Pressable style={({ pressed }) => ({ padding: spacing.md, gap: spacing.sm, opacity: pressed ? 0.85 : 1, alignItems: "flex-start" })}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.45)", borderWidth: 1, borderColor: "rgba(10,143,166,0.4)" }}>
                    <Icon name={a.icona} size={17} color={TEAL_CHIARO} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: TESTO }} numberOfLines={1}>{a.label}</Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 8.5, color: TENUE }} numberOfLines={1}>{a.sotto}</Text>
                  </View>
                </Pressable>
              </Vetro>
            ))}
          </View>
        </View>

        {/* progetto attivo + fasi */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.6, fontWeight: "800", color: TEAL_CHIARO }}>IL FILM IN CORSO</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>62%</Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              <Image source={{ uri: PROGETTI[0].cover }} style={{ width: 64, height: 84, borderRadius: 14 }} contentFit="cover" />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 24, color: TESTO }}>Notturno</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: TENUE }}>Cortometraggio · 18 min · 4/9 giorni</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 2 }}>
                  <Icon name="account-group-outline" size={11} color={TEAL_CHIARO} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>14 persone · budget 78%</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 4, paddingTop: 2 }}>
              {FASI.map((f) => (
                <View key={f.l} style={{ flex: 1, gap: 5 }}>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: f.attivo ? TEAL_CHIARO : f.fatto ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 8, textAlign: "center", color: f.attivo ? TESTO : TENUE }} numberOfLines={1}>{f.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </Vetro>

        {/* progetti: carosello */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.8, fontWeight: "800", color: TENUE }}>ALTRI PROGETTI</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TEAL_CHIARO, fontWeight: "700" }}>Tutti →</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
            {PROGETTI.slice(1).map((p) => (
              <View key={p.titolo} style={{ width: cardW, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: BORDO, backgroundColor: VETRO }}>
                <Image source={{ uri: p.cover }} style={{ width: "100%", height: 150 }} contentFit="cover" />
                <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.92)"]} style={{ position: "absolute", left: 0, right: 0, top: 60, height: 200 }} />
                <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 5 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.4, fontWeight: "800", color: TEAL_CHIARO }}>{p.fase.toUpperCase()}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 22, color: TESTO }}>{p.titolo}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.16)" }}>
                      <View style={{ height: 3, width: `${p.quota * 100}%`, borderRadius: 2, backgroundColor: TEAL_CHIARO }} />
                    </View>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE }}>{Math.round(p.quota * 100)}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* agenda */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.6, fontWeight: "800", color: TEAL_CHIARO }}>IN ARRIVO</Text>
              <Icon name="calendar-blank-outline" size={14} color={TENUE} />
            </View>
            {AGENDA.map((a, i) => (
              <View key={a.cosa} style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
                <View style={{ alignItems: "center", paddingTop: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i === 0 ? TEAL_CHIARO : "rgba(255,255,255,0.28)" }} />
                  {i < AGENDA.length - 1 ? <View style={{ width: 1, flex: 1, minHeight: 26, backgroundColor: "rgba(255,255,255,0.12)", marginTop: 4 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < AGENDA.length - 1 ? spacing.md : 0 }}>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? TEAL_CHIARO : TENUE }}>{a.quando}</Text>
                  <Text style={{ fontFamily: fonts.text, fontSize: 13.5, fontWeight: "700", color: TESTO }} numberOfLines={1}>{a.cosa}</Text>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11, color: TENUE }} numberOfLines={1}>{a.dove}</Text>
                </View>
              </View>
            ))}
          </View>
        </Vetro>

        <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: "rgba(242,246,247,0.32)", textAlign: "center" }}>HOME 2 · concetto, dati di esempio</Text>
      </ScrollView>

      {/* dock di vetro */}
      <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: insets.bottom > 0 ? insets.bottom + spacing.md : spacing.xl }}>
        <View style={{ height: 64, borderRadius: 32, backgroundColor: "rgba(10,14,16,0.72)", borderWidth: 1, borderColor: BORDO, flexDirection: "row", alignItems: "center", justifyContent: "space-around", overflow: "hidden" }}>
          {([
            { i: "view-dashboard", l: "Oggi" },
            { i: "movie-open-outline", l: "Progetti" },
            { i: "movie-open-play-outline", l: "Ciak" },
            { i: "account-circle-outline", l: "Io" },
          ] as { i: IconName; l: string }[]).map((d, idx) => (
            <Pressable key={d.l} style={{ alignItems: "center", gap: 2, flex: 1 }}>
              <Icon name={d.i} size={21} color={idx === 0 ? TEAL_CHIARO : "rgba(242,246,247,0.55)"} />
              <Text style={{ fontFamily: fonts.text, fontSize: 8.5, color: idx === 0 ? TEAL_CHIARO : "rgba(242,246,247,0.55)" }}>{d.l}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
