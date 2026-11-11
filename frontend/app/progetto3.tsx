import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, spacing } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

// ── Scheda progetto di prova ─────────────────────────────────────────────────
// Come sarebbe la pagina di un progetto nel linguaggio della Home 3: copertina,
// fasi, e cinque schede interne che cambiano senza cambiare pagina.

const NERO = "#050708";
const TEAL = "#025669";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.05)";
const BORDO = "rgba(255,255,255,0.12)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.56)";

const COPERTINA = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop";
const FOTO = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop",
];

const FASI = ["Sviluppo", "Pre", "Riprese", "Post", "Consegna"];
const SCHEDE: { v: string; l: string; icona: IconName }[] = [
  { v: "panoramica", l: "Panoramica", icona: "view-dashboard-outline" },
  { v: "scena", l: "Scena", icona: "script-text-outline" },
  { v: "troupe", l: "Troupe", icona: "account-group-outline" },
  { v: "budget", l: "Budget", icona: "currency-eur" },
  { v: "piano", l: "Piano", icona: "calendar-clock" },
];

const NUMERI = [
  { n: "41", l: "scene" },
  { n: "18", l: "minuti" },
  { n: "14", l: "persone" },
  { n: "62%", l: "avanzamento" },
];

const TAPPE = [
  { q: "MER 12 · 06:30", c: "Giorno 4 · Ex Cartiera", d: "Scene 14, 15A, 16" },
  { q: "GIO 13 · 07:00", c: "Giorno 5 · Ex Cartiera", d: "Scene 17, 18, 19" },
  { q: "LUN 17 · 09:00", c: "Riprese di recupero", d: "Scene 12 e 22" },
];

const MATERIALI = [
  { t: "Sceneggiatura", d: "84 pagine · v6", quota: 1 },
  { t: "Storyboard", d: "12 tavole su 30", quota: 0.4 },
  { t: "Moodboard", d: "24 immagini", quota: 0.8 },
  { t: "Diagrammi luce", d: "9 setup", quota: 0.55 },
];

const SCENA = {
  numero: "14",
  titolo: "La telefonata",
  interno: "INT. CUCINA — NOTTE",
  testo: "Il telefono squilla. ELENA resta immobile davanti al lavandino.\nAl terzo squillo alza la cornetta, poi la rimette giù.",
  note: "Una sola luce fuori campo, dalla finestra. Rumore del frigo acceso.",
};

const TROUPE = [
  { n: "Alessandro Campagna", r: "Regia", c: true },
  { n: "Giulia Bernardi", r: "Fotografia", c: true },
  { n: "Marco Fabbri", r: "Fonico", c: true },
  { n: "Sara Neri", r: "Script", c: true },
  { n: "Luca Sarti", r: "Elettrico", c: false },
  { n: "Elena Righi", r: "Costumi", c: false },
];

const BUDGET = [
  { t: "Troupe", v: 18200 },
  { t: "Attrezzatura", v: 9400 },
  { t: "Location", v: 6100 },
  { t: "Post-produzione", v: 5200 },
  { t: "Varie", v: 2300 },
];

const PIANO = [
  { g: "G1", d: "Dom 9", loc: "Casa di Elena", sc: "1 – 4", ore: "08:00 – 18:00", fatto: true },
  { g: "G2", d: "Lun 10", loc: "Ex Cartiera", sc: "5 – 9", ore: "06:30 – 19:00", fatto: true },
  { g: "G3", d: "Mar 11", loc: "Ex Cartiera", sc: "10 – 13", ore: "06:30 – 18:30", fatto: true },
  { g: "G4", d: "Mer 12", loc: "Ex Cartiera", sc: "14 – 16", ore: "06:30 – 19:00", oggi: true },
  { g: "G5", d: "Gio 13", loc: "Ex Cartiera", sc: "17 – 19", ore: "07:00 – 18:00" },
];

const DOCK: { icona: IconName; titolo: string; rotta: string }[] = [
  { icona: "view-dashboard", titolo: "Oggi", rotta: "/home3" },
  { icona: "compass-outline", titolo: "Esplora", rotta: "/esplora" },
  { icona: "message-text-outline", titolo: "Messaggi", rotta: "/messaggi" },
  { icona: "wrench-outline", titolo: "Strumenti", rotta: "/strumenti" },
  { icona: "account-circle-outline", titolo: "Profilo", rotta: "/profilo3" },
];

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
      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "600", color: TESTO }}>{testo}</Text>
    </View>
  );
}

export default function Progetto3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [scheda, setScheda] = useState("panoramica");
  const [take, setTake] = useState(2);
  const totale = BUDGET.reduce((s, b) => s + b.v, 0);

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }} showsVerticalScrollIndicator={false}>
        {/* ── copertina ─────────────────────────────────────────────── */}
        <View style={{ height: wide ? 320 : 290 }}>
          <Image source={{ uri: COPERTINA }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.3)", "rgba(2,86,105,0.55)", NERO]} locations={[0, 0.55, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="chevron-left" size={20} color={TESTO} />
              </Pressable>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.4, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>SCHEDA PROGETTO · ESPERIMENTO</Text>
              <Pressable onPress={() => router.push("/profilo3" as never)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="share-variant-outline" size={18} color={TESTO} />
              </Pressable>
            </View>

            <View style={{ gap: 6, paddingBottom: spacing.lg }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2, fontWeight: "800", color: TEAL_CHIARO }}>CORTOMETRAGGIO · 2026 · RIPRESE</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: wide ? 52 : 40, lineHeight: wide ? 54 : 42, color: "#FFFFFF" }} numberOfLines={1}>Notturno</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Pill icona="calendar-blank-outline" testo="Giorno 4 di 9" />
                <Pill icona="account-group-outline" testo="14 persone" />
                <Pill icona="map-marker-outline" testo="Bologna" />
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.sm }}>
          {/* fasi */}
          <Vetro>
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Etichetta>AVANZAMENTO</Etichetta>
                <View style={{ flex: 1 }} />
                <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>4/9 giorni · 62%</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {FASI.map((f, i) => (
                  <View key={f} style={{ flex: 1, gap: 5 }}>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: i === 2 ? TEAL_CHIARO : i < 2 ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 7.5, textAlign: "center", color: i === 2 ? TESTO : TENUE }} numberOfLines={1}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Vetro>

          {/* schede interne */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: spacing.lg }}>
            {SCHEDE.map((s) => {
              const attiva = scheda === s.v;
              return (
                <Pressable
                  key={s.v}
                  onPress={() => setScheda(s.v)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: attiva ? TEAL : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: attiva ? "rgba(10,143,166,0.9)" : BORDO }}
                >
                  <Icon name={s.icona} size={14} color={attiva ? "#FFFFFF" : TENUE} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: attiva ? "#FFFFFF" : TENUE }}>{s.l}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── panoramica ────────────────────────────────────────── */}
          {scheda === "panoramica" ? (
            <View style={{ gap: spacing.lg }}>
              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <Etichetta>DI COSA PARLA</Etichetta>
                  <Text style={{ fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: "rgba(242,246,247,0.84)" }}>
                    In una cucina che non è la sua, Elena aspetta una telefonata. Quando arriva, non è quella che aspettava.
                  </Text>
                  <View style={{ flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                    {NUMERI.map((x) => (
                      <View key={x.l} style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: TESTO }}>{x.n}</Text>
                        <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1.2, color: TENUE }}>{x.l.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Vetro>

              <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "stretch" }}>
                <Vetro style={{ flex: 1 }}>
                  <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                    <Etichetta>PROSSIME TAPPE</Etichetta>
                    {TAPPE.map((t, i) => (
                      <View key={t.q} style={{ flexDirection: "row", gap: spacing.sm, paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                        <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: i === 0 ? TEAL_CHIARO : TENUE, minWidth: 66 }}>{t.q}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }} numberOfLines={1}>{t.c}</Text>
                          <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }} numberOfLines={1}>{t.d}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Vetro>

                <Vetro style={{ flex: 1 }}>
                  <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                    <Etichetta>MATERIALI</Etichetta>
                    {MATERIALI.map((m, i) => (
                      <View key={m.t} style={{ gap: 4, paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: TESTO }}>{m.t}</Text>
                          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE }}>{m.d}</Text>
                        </View>
                        <View style={{ height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.1)" }}>
                          <View style={{ height: 2, width: `${m.quota * 100}%`, borderRadius: 1, backgroundColor: TEAL_CHIARO }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </Vetro>
              </View>
            </View>
          ) : null}

          {/* ── scena ─────────────────────────────────────────────── */}
          {scheda === "scena" ? (
            <View style={{ gap: spacing.lg }}>
              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Etichetta>{`SCENA ${SCENA.numero}`}</Etichetta>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>take {take} di 3</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.display, fontSize: 28, color: TESTO }}>{SCENA.titolo}</Text>
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <View style={{ flex: 1, borderRadius: 12, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.5)", padding: spacing.md, gap: 4 }}>
                      <Text style={{ fontFamily: fonts.script, fontSize: 9.5, letterSpacing: 1, color: TEAL_CHIARO }}>{SCENA.interno}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 11.5, lineHeight: 18, color: "rgba(242,246,247,0.86)" }}>{SCENA.testo}</Text>
                    </View>
                    <View style={{ width: 96, height: 128, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
                      <Image source={{ uri: FOTO[2] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    </View>
                  </View>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, lineHeight: 16, color: TENUE }}>{SCENA.note}</Text>

                  <View style={{ flexDirection: "row", gap: 6, paddingTop: 2 }}>
                    {[1, 2, 3].map((t) => (
                      <Pressable key={t} onPress={() => setTake(t)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: take === t ? TEAL_CHIARO : BORDO, backgroundColor: take === t ? "rgba(2,86,105,0.4)" : "transparent" }}>
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: take === t ? TESTO : TENUE }}>Take {t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Vetro>

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {FOTO.map((f, i) => (
                  <View key={f} style={{ flex: 1, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
                    <Image source={{ uri: f }} style={{ width: "100%", height: 92 }} contentFit="cover" />
                    <Text style={{ position: "absolute", left: 6, bottom: 5, fontFamily: fonts.script, fontSize: 8.5, color: "#FFFFFF" }}>00:14:{20 + i * 7}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── troupe ────────────────────────────────────────────── */}
          {scheda === "troupe" ? (
            <Vetro>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Etichetta>CHI LAVORA AL FILM</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>14 persone</Text>
                </View>
                {TROUPE.map((p, i) => (
                  <View key={p.n} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: i === 0 ? 0 : 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 9 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.55)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", color: "#DCEFF3" }}>
                        {p.n.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }}>{p.n}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE }}>{p.r}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: p.c ? TEAL_CHIARO : "rgba(255,255,255,0.28)" }} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 9.5, color: p.c ? TEAL_CHIARO : TENUE }}>{p.c ? "confermato" : "da confermare"}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Vetro>
          ) : null}

          {/* ── budget ────────────────────────────────────────────── */}
          {scheda === "budget" ? (
            <View style={{ gap: spacing.lg }}>
              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <Etichetta>BUDGET</Etichetta>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: TESTO }}>€ {totale.toLocaleString("it-IT")}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE, paddingBottom: 6 }}>stimato</Text>
                  </View>
                  <View style={{ gap: 8, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                    {BUDGET.map((b) => (
                      <View key={b.t} style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12, fontWeight: "600", color: TESTO }}>{b.t}</Text>
                          <Text style={{ fontFamily: fonts.script, fontSize: 10.5, color: TENUE }}>€ {b.v.toLocaleString("it-IT")}</Text>
                        </View>
                        <View style={{ height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
                          <View style={{ height: 3, width: `${(b.v / totale) * 100}%`, borderRadius: 2, backgroundColor: TEAL_CHIARO }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </Vetro>
              <Vetro>
                <View style={{ padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <Icon name="alert-circle-outline" size={20} color={TEAL_CHIARO} />
                  <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 11.5, lineHeight: 16, color: TENUE }}>
                    Speso finora € 29.700 (62%). Il reparto attrezzatura è la voce che cresce di più.
                  </Text>
                </View>
              </Vetro>
            </View>
          ) : null}

          {/* ── piano ─────────────────────────────────────────────── */}
          {scheda === "piano" ? (
            <Vetro>
              <View style={{ paddingVertical: 2 }}>
                {PIANO.map((g, i) => (
                  <View key={g.g} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", backgroundColor: g.oggi ? "rgba(2,86,105,0.28)" : "transparent" }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 17, color: g.oggi ? TEAL_CHIARO : "rgba(242,246,247,0.5)", width: 30 }}>{g.g}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }} numberOfLines={1}>{g.loc}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>{g.d} · scene {g.sc} · {g.ore}</Text>
                    </View>
                    {g.fatto ? <Icon name="check-circle" size={16} color="rgba(10,143,166,0.7)" /> : g.oggi ? <Text style={{ fontFamily: fonts.text, fontSize: 9.5, fontWeight: "800", color: TEAL_CHIARO }}>OGGI</Text> : null}
                  </View>
                ))}
              </View>
            </Vetro>
          ) : null}

          {/* apri il progetto vero */}
          <Pressable
            onPress={() => {
              if (id) router.push(`/project/${id}` as never);
            }}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO, opacity: pressed ? 0.85 : 1 })}
          >
            <Icon name="arrow-top-right" size={15} color={TEAL_CHIARO} />
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }}>{id ? "Apri il progetto vero" : "Questa è una scheda di prova"}</Text>
          </Pressable>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.28)", textAlign: "center" }}>SCHEDA PROGETTO 3 · concetto, dati di esempio</Text>
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: insets.bottom > 0 ? insets.bottom - 4 : 10 }}>
        <View style={{ height: 62, borderRadius: 31, backgroundColor: "rgba(10,14,16,0.78)", borderWidth: 1, borderColor: BORDO, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
          {DOCK.map((d) => (
            <Pressable key={d.titolo} onPress={() => router.push(d.rotta as never)} style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.7 : 1 })}>
              <Icon name={d.icona} size={21} color="rgba(242,246,247,0.62)" />
              <Text style={{ fontFamily: fonts.text, fontSize: 8.5, color: "rgba(242,246,247,0.62)" }}>{d.titolo}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
