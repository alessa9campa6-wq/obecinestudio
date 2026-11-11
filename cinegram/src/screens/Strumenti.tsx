import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useApp } from "@/store";
import { Badge, Etichetta, Icon, Page, Testata, Vetro, type IconName } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

type Strumento = { k: string; l: string; d: string; icona: IconName; azione?: "lente" | "formati" | "tempo" | "ciak" };

const SET: Strumento[] = [
  { k: "ciak", l: "Ciak", d: "Suono, vibrazione, lampo", icona: "movie-open-play-outline", azione: "ciak" },
  { k: "tempo", l: "Time tracker", d: "Quanto dura la giornata", icona: "timer-outline", azione: "tempo" },
  { k: "meteo", l: "Meteo & sole", d: "Alba 07:21 · tramonto 16:58", icona: "weather-partly-cloudy" },
  { k: "checklist", l: "Checklist set", d: "3 voci · 2 caricate", icona: "checkbox-marked-outline" },
];

const CALCOLI: Strumento[] = [
  { k: "lente", l: "Lens calculator", d: "Campo visivo da focale e sensore", icona: "camera-iris", azione: "lente" },
  { k: "formati", l: "Formati", d: "2.39:1 · 16:9 · 9:16", icona: "aspect-ratio", azione: "formati" },
  { k: "luci", l: "Diagrammi luce", d: "3 setup pronti", icona: "lightbulb-group-outline" },
];

const REPARTO: Strumento[] = [
  { k: "attrezzatura", l: "Attrezzatura", d: "Camera, ottiche, luci", icona: "camera-outline" },
  { k: "persone", l: "Persone", d: "5 nella rubrica", icona: "account-multiple-outline" },
  { k: "storyboard", l: "Storyboard", d: "12 tavole", icona: "draw" },
];

const FOCALI = [18, 24, 35, 50, 85, 135];
const SENSORI = [
  { l: "S35", w: 24.89 },
  { l: "Full frame", w: 36 },
  { l: "MFT", w: 17.3 },
];

const FORMATI = [
  { l: "2.39:1", w: 2.39 },
  { l: "1.85:1", w: 1.85 },
  { l: "16:9", w: 16 / 9 },
  { l: "4:3", w: 4 / 3 },
  { l: "9:16", w: 9 / 16 },
];

export default function Strumenti() {
  const { go } = useApp();
  const [aperto, setAperto] = useState<null | "lente" | "formati" | "tempo">(null);
  const [focale, setFocale] = useState(35);
  const [sensore, setSensore] = useState(SENSORI[0]);
  const [formato, setFormato] = useState(FORMATI[0]);
  const [start, setStart] = useState<number | null>(null);
  const [adesso, setAdesso] = useState(Date.now());
  const [lampo, setLampo] = useState(false);
  const suono = useAudioPlayer(require("../../assets/sounds/ciak.wav"));

  useEffect(() => {
    if (start === null) return;
    const t = setInterval(() => setAdesso(Date.now()), 1000);
    return () => clearInterval(t);
  }, [start]);

  const ciakFai = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      suono.seekTo(0);
      suono.play();
    } catch {}
    setLampo(true);
    setTimeout(() => setLampo(false), 220);
  };

  const premi = (s: Strumento) => {
    if (s.azione === "ciak") return ciakFai();
    if (s.azione) return setAperto(s.azione);
    void Haptics.selectionAsync();
  };

  const fov = (2 * Math.atan(sensore.w / (2 * focale)) * 180) / Math.PI;
  const fovLabel = fov.toFixed(1).replace(".", ",");
  const larghezzaVideo = formato.w >= 1 ? formato.w : 1 / formato.w;
  const tempo = start ? Math.floor((adesso - start) / 1000) : 0;
  const hh = String(Math.floor(tempo / 3600)).padStart(2, "0");
  const mm = String(Math.floor((tempo % 3600) / 60)).padStart(2, "0");
  const ss = String(tempo % 60).padStart(2, "0");

  const Gruppo = ({ titolo, voci }: { titolo: string; voci: Strumento[] }) => (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Etichetta>{titolo}</Etichetta>
        <View style={{ flex: 1 }} />
        <Badge testo={`${voci.length}`} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {voci.map((s) => (
          <Pressable key={s.k} onPress={() => premi(s)} style={({ pressed }) => ({ flexBasis: "48.8%", flexGrow: 1, minWidth: 240, opacity: pressed ? 0.85 : 1 })}>
            <Vetro>
              <View style={{ padding: spacing.md, gap: spacing.sm }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.4)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
                  <Icon name={s.icona} size={19} color={palette.tealChiaro} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: palette.testo }} numberOfLines={1}>{s.l}</Text>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }} numberOfLines={1}>{s.d}</Text>
                </View>
              </View>
            </Vetro>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Page attivo="strumenti" go={go}>
      <Testata sopra="CINEGRAM" titolo="Strumenti" icona="wrench-outline" />

      <Gruppo titolo="DI SET" voci={SET} />
      <Gruppo titolo="CALCOLI" voci={CALCOLI} />
      <Gruppo titolo="REPARTO" voci={REPARTO} />

      <Pressable onPress={() => go("progetto")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: 20, backgroundColor: "rgba(2,86,105,0.25)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
        <Icon name="folder-open-outline" size={20} color={palette.tealChiaro} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: "700", color: palette.testo }}>Apri la scheda progetto</Text>
          <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tenue }}>tutte le sezioni: scena, budget, piano, post…</Text>
        </View>
        <Icon name="arrow-right" size={17} color={palette.tealChiaro} />
      </Pressable>

      <Modal visible={aperto !== null} transparent animationType="slide" onRequestClose={() => setAperto(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,5,6,0.72)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setAperto(null)} />
          <View style={{ backgroundColor: "#0A0E10", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: palette.bordo, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, color: palette.testo }}>
                {aperto === "lente" ? "Lens calculator" : aperto === "formati" ? "Formati" : "Time tracker"}
              </Text>
              <Pressable onPress={() => setAperto(null)} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
                <Icon name="close" size={15} color={palette.testo} />
              </Pressable>
            </View>

            {aperto === "lente" ? (
              <View style={{ gap: spacing.md }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 36, color: palette.tealChiaro }}>{fovLabel}°</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: palette.tenue }}>campo visivo orizzontale · {focale}mm su {sensore.l}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {FOCALI.map((f) => (
                    <Pressable key={f} onPress={() => setFocale(f)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: focale === f ? palette.tealChiaro : palette.bordo, backgroundColor: focale === f ? "rgba(2,86,105,0.4)" : "transparent" }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: focale === f ? palette.testo : palette.tenue }}>{f}mm</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {SENSORI.map((s) => (
                    <Pressable key={s.l} onPress={() => setSensore(s)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: sensore.l === s.l ? palette.tealChiaro : palette.bordo }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: sensore.l === s.l ? palette.testo : palette.tenue }}>{s.l}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {aperto === "formati" ? (
              <View style={{ gap: spacing.sm }}>
                {FORMATI.map((f) => {
                  const acceso = formato.l === f.l;
                  const base = 1000;
                  return (
                    <Pressable key={f.l} onPress={() => setFormato(f)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", width: 60, color: acceso ? palette.tealChiaro : palette.testo }}>{f.l}</Text>
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <View style={{ width: base * 0.42, height: (base * 0.42) / larghezzaVideo, borderWidth: 1, borderColor: acceso ? palette.tealChiaro : palette.bordo, borderRadius: 3, backgroundColor: acceso ? "rgba(2,86,105,0.35)" : "transparent" }} />
                      </View>
                      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }}>{acceso ? "scelto" : ""}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {aperto === "tempo" ? (
              <View style={{ gap: spacing.md, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 44, color: palette.testo }}>{hh}:{mm}:{ss}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: palette.tenue }}>{start ? "giornata in corso · call 06:30" : "pronto a contare"}</Text>
                <Pressable
                  onPress={() => {
                    setStart(start ? null : Date.now());
                    setAdesso(Date.now());
                  }}
                  style={{ paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999, backgroundColor: start ? "rgba(255,255,255,0.1)" : palette.teal, borderWidth: 1, borderColor: "rgba(10,143,166,0.7)" }}
                >
                  <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "800", color: "#FFFFFF" }}>{start ? "Ferma" : "Inizia"}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {lampo ? <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", opacity: 0.35 }} /> : null}
    </Page>
  );
}
