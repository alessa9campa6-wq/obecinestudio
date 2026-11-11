import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { fonts, spacing } from "@/src/theme";
import { Icon } from "@/src/ui";

// ── Home 3: secondo esperimento, slegato dal resto dell'app ──────────────────
// Stessa palette della Home 2 (nero, #025669, vetro) ma impaginazione da rivista:
// copertina a tutta pagina, una scena in primo piano col copione, la pellicola
// del giorno come striscia di fotogrammi e una bacheca a due colonne.

const NERO = "#050708";
const TEAL = "#025669";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.05)";
const BORDO = "rgba(255,255,255,0.12)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.56)";

const COPERTINA = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop";

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

const PRESENTI = [
  { nome: "Alessandro", ruolo: "Regia" },
  { nome: "Giulia", ruolo: "Fotografia" },
  { nome: "Marco", ruolo: "Fonico" },
  { nome: "Sara", ruolo: "Script" },
  { nome: "Luca", ruolo: "Elettrico" },
];

const DECISIONI = [
  { t: "Confermare la location di lunedì", da: "Produzione" },
  { t: "Approvare il look notturno", da: "Color" },
  { t: "Scegliere la take della scena 14", da: "Regia" },
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

export default function Home3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const [fatte, setFatte] = useState<number[]>([]);

  const toggle = (i: number) => setFatte((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* copertina a tutta pagina */}
        <View style={{ height: wide ? 420 : 380 }}>
          <Image source={{ uri: COPERTINA }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.25)", "rgba(2,86,105,0.55)", NERO]} locations={[0, 0.55, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="chevron-left" size={20} color={TESTO} />
              </Pressable>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.4, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>HOME 3 · ESPERIMENTO</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: "rgba(242,246,247,0.7)" }}>notte · 9°</Text>
            </View>

            <View style={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2, fontWeight: "800", color: TEAL_CHIARO }}>IN LAVORAZIONE · GIORNO 4 DI 9</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: wide ? 62 : 46, lineHeight: wide ? 64 : 48, color: "#FFFFFF" }} numberOfLines={2}>
                Notturno
              </Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 13, color: "rgba(242,246,247,0.78)", maxWidth: 520 }}>
                Cortometraggio · 18 min · Una donna aspetta una telefonata che non arriva, in una cucina che non è la sua.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap", paddingTop: 4 }}>
                {["Riprese", "Scena 14 di 41", "14 persone"].map((t) => (
                  <View key={t} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(5,7,8,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TESTO }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.md }}>
          {/* colonna principale + spalla laterale */}
          <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "flex-start" }}>
            <View style={{ flex: wide ? 1.65 : undefined, width: wide ? undefined : "100%", gap: spacing.lg }}>
              {/* la scena in primo piano, col copione */}
              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Etichetta>IL MOMENTO</Etichetta>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>sc. 14 · take 3</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: TESTO }}>La telefonata</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12, lineHeight: 17, color: TENUE }}>
                        Il telefono squilla tre volte. Lei non risponde. Fuori piove, dentro il frigo ronza.
                      </Text>
                    </View>
                    <View style={{ width: 96, height: 124, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
                      <Image source={{ uri: FOTOGRAMMI[3].img }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      <LinearGradient colors={["rgba(2,86,105,0)", "rgba(2,86,105,0.55)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 50 }} />
                      <Text style={{ position: "absolute", left: 7, bottom: 6, fontFamily: fonts.script, fontSize: 8.5, color: "#FFFFFF" }}>primo piano</Text>
                    </View>
                  </View>

                  <View style={{ borderRadius: 12, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.55)", padding: spacing.md, gap: 5 }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 10, letterSpacing: 1, color: TEAL_CHIARO }}>INT. CUCINA — NOTTE</Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 12, lineHeight: 19, color: "rgba(242,246,247,0.86)" }}>
                      Il telefono squilla. ELENA resta immobile davanti al lavandino.{"\n"}
                      Al terzo squillo alza la cornetta, poi la rimette giù.
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                    <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: TEAL, borderWidth: 1, borderColor: "rgba(10,143,166,0.85)" }}>
                      <Icon name="movie-open-play" size={14} color="#FFFFFF" />
                      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "800", color: "#FFFFFF" }}>Gira la scena</Text>
                    </Pressable>
                    <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO }}>
                      <Icon name="script-text-outline" size={14} color={TESTO} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: TESTO }}>Apri copione</Text>
                    </Pressable>
                  </View>
                </View>
              </Vetro>

              {/* pellicola del giorno */}
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Etichetta>LA PELLICOLA DI OGGI</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>4 inquadrature · 12 take</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
                  {FOTOGRAMMI.map((f, i) => (
                    <View key={f.tc} style={{ width: 148 }}>
                      <View style={{ borderRadius: 10, overflow: "hidden", backgroundColor: "#0A0D0F", borderWidth: 1, borderColor: BORDO }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 5, paddingVertical: 3, backgroundColor: "rgba(2,86,105,0.35)" }}>
                          {Array.from({ length: 6 }).map((_, k) => (
                            <View key={k} style={{ width: 4, height: 4, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.35)" }} />
                          ))}
                        </View>
                        <Image source={{ uri: f.img }} style={{ width: "100%", height: 92 }} contentFit="cover" />
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
            </View>

            {/* spalla laterale: decisioni, persone, look */}
            <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : "100%", gap: spacing.lg }}>
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
                      <Pressable key={d.t} onPress={() => toggle(i)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                        <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: fatta ? TEAL_CHIARO : "rgba(255,255,255,0.3)", backgroundColor: fatta ? "rgba(10,143,166,0.28)" : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {fatta ? <Icon name="check" size={11} color={TEAL_CHIARO} /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: fatta ? TENUE : TESTO, textDecorationLine: fatta ? "line-through" : "none" }} numberOfLines={2}>{d.t}</Text>
                          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE }}>{d.da}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Vetro>

              <Vetro>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Etichetta>CHI C’È OGGI</Etichetta>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>call 06:30</Text>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {PRESENTI.map((p) => (
                      <View key={p.nome} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 10, paddingLeft: 4, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(2,86,105,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(10,143,166,0.5)" }}>
                          <Text style={{ fontFamily: fonts.text, fontSize: 9, fontWeight: "800", color: "#DCEFF3" }}>{p.nome.slice(0, 2).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TESTO }}>{p.nome}</Text>
                          <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE }}>{p.ruolo}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </Vetro>

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
                        <View style={{ height: 44, borderRadius: 10, backgroundColor: c.hex, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }} />
                        <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE, textAlign: "center" }}>{c.nome}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Vetro>
            </View>
          </View>

          {/* prossima azione, a tutta larghezza */}
          <Vetro>
            <View style={{ padding: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.35)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
                <Icon name="lightbulb-on-outline" size={20} color={TEAL_CHIARO} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TEAL_CHIARO }}>PROSSIMO PASSO</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 13.5, fontWeight: "700", color: TESTO }}>Preparare il setup notte per la scena 15</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: TENUE }}>3 luci · 2 modificatori · ultimo aggiornamento 12 min fa</Text>
              </View>
              <Icon name="arrow-right" size={18} color={TEAL_CHIARO} />
            </View>
          </Vetro>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.28)", textAlign: "center" }}>HOME 3 · concetto, dati di esempio</Text>
        </View>
      </ScrollView>

      {/* azione rotonda, non una barra */}
      <Pressable
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
