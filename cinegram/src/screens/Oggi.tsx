import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import { FASI, FOTO, OGGI, PROGETTO } from "@/data";
import { useApp } from "@/store";
import { Etichetta, Icon, Page, Pill, Vetro, type IconName } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Oggi() {
  const { go, eventi } = useApp();
  const [ora, setOra] = useState(new Date());
  const [mese, setMese] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [giorno, setGiorno] = useState(() => fmt(new Date()));

  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const suono = useAudioPlayer(require("../../assets/sounds/ciak.wav"));
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

  const orologio = [ora.getHours(), ora.getMinutes()].map((n) => String(n).padStart(2, "0")).join(":");
  const perGiorno = new Map<string, { ora: string; titolo: string }[]>();
  for (const e of eventi) {
    const lista = perGiorno.get(e.data) ?? [];
    lista.push({ ora: e.ora, titolo: e.titolo });
    perGiorno.set(e.data, lista);
  }
  const eventiGiorno = perGiorno.get(giorno) ?? [];
  const prossimi = [...eventi].filter((e) => e.data >= fmt(new Date())).sort((a, b) => (a.data + a.ora).localeCompare(b.data + b.ora)).slice(0, 3);

  const primaCell = (new Date(mese.getFullYear(), mese.getMonth(), 1).getDay() + 6) % 7;
  const giorniMese = new Date(mese.getFullYear(), mese.getMonth() + 1, 0).getDate();
  const celle = [...Array(primaCell).fill(0), ...Array.from({ length: giorniMese }, (_, i) => i + 1)];

  const etichettaGiorno = (data: string) => {
    const d = new Date(`${data}T12:00:00`);
    const oggi = new Date();
    const diff = Math.round((d.getTime() - new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()).getTime()) / 86400000);
    if (diff === 0) return `OGGI · ${d.getDate()} ${MESI[d.getMonth()].slice(0, 3).toUpperCase()}`;
    if (diff === 1) return `DOMANI · ${d.getDate()} ${MESI[d.getMonth()].slice(0, 3).toUpperCase()}`;
    return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3).toUpperCase()}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.nero }}>
      <Page attivo="oggi" go={go}>
        {/* copertina */}
        <View style={{ height: 250, borderRadius: 22, overflow: "hidden" }}>
          <Image source={{ uri: PROGETTO.cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.25)", "rgba(2,86,105,0.55)", palette.nero]} locations={[0, 0.55, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ flex: 1, paddingTop: spacing.md, paddingHorizontal: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.6, fontWeight: "800", color: "rgba(242,246,247,0.75)" }}>CINEGRAM</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 12, color: palette.testo }}>{orologio}</Text>
            </View>
            <View style={{ gap: 6, paddingBottom: spacing.lg }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2, fontWeight: "800", color: palette.tealChiaro }}>
                {PROGETTO.tipo.toUpperCase()} · GIORNO {PROGETTO.giorniFatti} DI {PROGETTO.giorniTotali}
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 46, lineHeight: 48, color: "#FFFFFF" }} numberOfLines={1}>{PROGETTO.titolo}</Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: "rgba(242,246,247,0.78)" }} numberOfLines={2}>{PROGETTO.logline}</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", paddingTop: 2 }}>
                <Pill icona="weather-partly-cloudy" testo={OGGI.meteo} />
                <Pill icona="weather-sunset" testo={`Tramonto ${OGGI.tramonto}`} />
                <Pill icona="account-group-outline" testo={`${PROGETTO.persone} persone`} />
              </View>
            </View>
          </View>
        </View>

        {/* oggi si gira */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Etichetta>MERCOLEDÌ 12 NOVEMBRE</Etichetta>
                <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: palette.testo }}>Oggi si gira.</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 12, color: palette.tenue }}>{OGGI.location}</Text>
              </View>
              <View style={{ alignItems: "center", justifyContent: "center", width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: "rgba(2,86,105,0.9)", backgroundColor: "rgba(2,86,105,0.25)" }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 15, fontWeight: "700", color: palette.testo }}>{OGGI.convocazione}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 0.6, color: palette.tenue }}>CALL</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <Pill icona="movie-open-outline" testo={OGGI.scena} />
              <Pill icona="weather-sunset" testo={`Tramonto ${OGGI.tramonto}`} />
              <Pill icona="weather-sunny" testo={OGGI.meteo} />
              <Pill icona="weather-sunset-up" testo={`Alba ${OGGI.alba}`} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.2, color: palette.tenue }}>AL TRAMONTO</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 25, color: palette.testo }}>{OGGI.ore}h {OGGI.minuti}m</Text>
              </View>
              <Pressable
                onPress={batti}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: palette.teal, borderWidth: 1, borderColor: "rgba(10,143,166,0.85)", transform: [{ scale: pressed ? 0.96 : 1 }] })}
              >
                <Icon name="movie-open-play" size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" }}>Batti il ciak</Text>
              </Pressable>
            </View>
          </View>
        </Vetro>

        {/* scena e pellicola */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Etichetta>LA SCENA DI OGGI</Etichetta>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: palette.tenue }}>sc. 14 · take 3</Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 25, color: palette.testo }}>La telefonata</Text>
                <View style={{ borderRadius: 10, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.5)", padding: spacing.sm, gap: 3, marginTop: 4 }}>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9, letterSpacing: 1, color: palette.tealChiaro }}>INT. CUCINA — NOTTE</Text>
                  <Text style={{ fontFamily: fonts.script, fontSize: 10.5, lineHeight: 16, color: "rgba(242,246,247,0.86)" }} numberOfLines={3}>
                    Il telefono squilla. ELENA resta immobile davanti al lavandino. Al terzo squillo alza la cornetta, poi la rimette giù.
                  </Text>
                </View>
              </View>
              <View style={{ width: 86, height: 108, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: palette.bordo }}>
                <Image source={{ uri: FOTO[3] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              </View>
            </View>
            <Pressable onPress={() => go("progetto")} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: palette.bordo }}>
              <Icon name="script-text-outline" size={13} color={palette.testo} />
              <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: palette.testo }}>Apri la scheda progetto</Text>
            </Pressable>
          </View>
        </Vetro>

        {/* film in corso */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Etichetta>IL FILM IN CORSO</Etichetta>
              <View style={{ flex: 1 }} />
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: palette.tenue }}>{PROGETTO.giorniFatti}/{PROGETTO.giorniTotali} giorni</Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              <Image source={{ uri: PROGETTO.cover }} style={{ width: 54, height: 72, borderRadius: 12 }} contentFit="cover" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 21, color: palette.testo }}>{PROGETTO.titolo}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: palette.tenue }}>{PROGETTO.tipo} · 18 min</Text>
                <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tenue }}>budget 78% · {PROGETTO.persone} persone</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {FASI.map((f, i) => (
                <View key={f} style={{ flex: 1, gap: 5 }}>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: i === PROGETTO.faseIndice ? palette.tealChiaro : i < PROGETTO.faseIndice ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 7.5, textAlign: "center", color: i === PROGETTO.faseIndice ? palette.testo : palette.tenue }} numberOfLines={1}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </Vetro>

        {/* calendario */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Etichetta>CALENDARIO</Etichetta>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setMese(new Date(mese.getFullYear(), mese.getMonth() - 1, 1))} hitSlop={6} style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
                <Icon name="chevron-left" size={15} color={palette.testo} />
              </Pressable>
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: palette.testo, minWidth: 92, textAlign: "center" }}>{MESI[mese.getMonth()]} {mese.getFullYear()}</Text>
              <Pressable onPress={() => setMese(new Date(mese.getFullYear(), mese.getMonth() + 1, 1))} hitSlop={6} style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
                <Icon name="chevron-right" size={15} color={palette.testo} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row" }}>
              {GIORNI.map((g, i) => (
                <Text key={`${g}-${i}`} style={{ flex: 1, textAlign: "center", fontFamily: fonts.text, fontSize: 9, color: palette.tenue }}>{g}</Text>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {celle.map((d, idx) => {
                if (!d) return <View key={`v-${idx}`} style={{ width: `${100 / 7}%`, height: 36 }} />;
                const data = `${mese.getFullYear()}-${String(mese.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const sel = data === giorno;
                const oggi = data === fmt(new Date());
                const ev = perGiorno.get(data);
                return (
                  <Pressable key={data} onPress={() => setGiorno(data)} style={{ width: `${100 / 7}%`, height: 36, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 29, height: 29, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: sel ? palette.teal : "transparent", borderWidth: oggi && !sel ? 1 : 0, borderColor: palette.tealChiaro }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: sel || oggi ? "800" : "500", color: sel ? "#FFFFFF" : oggi ? palette.tealChiaro : palette.testo }}>{d}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 2, height: 3 }}>
                      {(ev ?? []).slice(0, 3).map((_, k) => (
                        <View key={k} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: sel ? "#FFFFFF" : palette.tealChiaro }} />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
              <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tealChiaro }}>{etichettaGiorno(giorno)}</Text>
              {eventiGiorno.length ? (
                eventiGiorno.slice(0, 3).map((e, i) => (
                  <View key={`${e.titolo}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 10.5, color: palette.tealChiaro, minWidth: 38 }}>{e.ora}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 12, color: palette.testo, flex: 1 }} numberOfLines={1}>{e.titolo}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: fonts.text, fontSize: 12, color: palette.tenue }}>Niente in programma. Giornata libera.</Text>
              )}
            </View>
          </View>
        </Vetro>

        {/* in arrivo */}
        <Vetro>
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Etichetta>IN ARRIVO</Etichetta>
              <View style={{ flex: 1 }} />
              <Icon name="calendar-blank-outline" size={14} color={palette.tenue} />
            </View>
            {prossimi.map((e, i) => (
              <View key={e.id} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? palette.tealChiaro : palette.tenue, minWidth: 74 }}>{etichettaGiorno(e.data).replace(" · ", " ")} · {e.ora}</Text>
                <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: palette.testo }} numberOfLines={2}>{e.titolo}</Text>
              </View>
            ))}
          </View>
        </Vetro>

        <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>CINEGRAM · prototipo, dati di esempio</Text>
      </Page>

      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", opacity: lampo }} />
    </View>
  );
}
