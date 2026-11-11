import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESTIERI, PERSONE, PROGETTO } from "@/data";
import { useApp } from "@/store";
import { Badge, Dock, Etichetta, Icon, Vetro } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

const CONTATTI = [
  { icona: "email-outline" as const, l: "Email", v: "alessandro@cine.studio" },
  { icona: "web" as const, l: "Sito", v: "cine.studio" },
  { icona: "instagram" as const, l: "Instagram", v: "@alessandro.film" },
];

const campo = {
  backgroundColor: "rgba(5,7,8,0.6)",
  borderWidth: 1,
  borderColor: palette.bordo,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: 10,
  color: palette.testo,
  fontFamily: fonts.text,
  fontSize: 13,
} as const;

export default function Profilo() {
  const { go, imp, lavori, pubblica } = useApp();
  const insets = useSafeAreaInsets();
  const [modale, setModale] = useState(false);
  const [titolo, setTitolo] = useState("");
  const [tipo, setTipo] = useState("Cortometraggio");
  const [anno, setAnno] = useState("2026");
  const [foto, setFoto] = useState<string | null>(null);

  const scegliFoto = async () => {
    const permesso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permesso.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!res.canceled) setFoto(res.assets[0].uri);
  };

  const salva = () => {
    if (!titolo.trim()) return;
    pubblica({ titolo: titolo.trim(), tipo, anno, img: foto ?? PROGETTO.cover });
    setModale(false);
    setTitolo("");
    setAnno("2026");
    setFoto(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.nero }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }} showsVerticalScrollIndicator={false}>
        {/* copertina */}
        <View style={{ height: 250 }}>
          <Image source={{ uri: PROGETTO.cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.4)", "rgba(2,86,105,0.6)", palette.nero]} locations={[0, 0.5, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.6, fontWeight: "800", color: "rgba(242,246,247,0.75)" }}>CINEGRAM · PROFILO</Text>
            <Pressable onPress={() => go("impostazioni")} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: palette.bordo }}>
              <Icon name="cog-outline" size={19} color={palette.testo} />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.xxl }}>
          {/* identità */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.7)", borderWidth: 2, borderColor: palette.tealChiaro }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: "#FFFFFF" }}>AC</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: "#FFFFFF" }} numberOfLines={1}>Alessandro Campagna</Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", color: palette.tealChiaro }}>REGIA E FOTOGRAFIA · BOLOGNA</Text>
              <View style={{ flexDirection: "row", gap: 6, paddingTop: 2 }}>
                <Badge testo="3 progetti" />
                <Badge testo="1 condiviso" />
              </View>
            </View>
          </View>

          <Vetro>
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <Etichetta>IN DUE RIGHE</Etichetta>
              <Text style={{ fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: "rgba(242,246,247,0.84)" }}>
                Racconto il lavoro delle persone: corpi, luoghi, notti. Cortometraggi e documentari, dal soggetto alla copia finale.
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                {[{ n: "12", l: "film" }, { n: "38", l: "set" }, { n: "9", l: "anni" }].map((x) => (
                  <View key={x.l} style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: palette.testo }}>{x.n}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1.2, color: palette.tenue }}>{x.l.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Vetro>

          {/* portfolio */}
          {imp.portfolio ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: palette.testo }}>Portfolio</Text>
                <Badge testo={`${lavori.length}`} />
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => setModale(true)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: palette.tealChiaro, opacity: pressed ? 0.85 : 1 })}>
                  <Icon name="plus" size={14} color="#FFFFFF" />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Pubblica</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {lavori.map((l) => (
                  <View key={l.id} style={{ flexBasis: "31.5%", flexGrow: 1, minWidth: 150, height: 170, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: palette.bordo }}>
                    <Image source={{ uri: l.img }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.94)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90 }} />
                    <View style={{ position: "absolute", left: 9, right: 9, bottom: 9, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: "800", letterSpacing: 1, color: palette.tealChiaro }}>{l.tipo.toUpperCase()} · {l.anno}</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: palette.testo }} numberOfLines={2}>{l.titolo}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* progetto */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: palette.testo }}>Progetti</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => go("progetto")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: palette.tealChiaro }}>Apri</Text>
              <Icon name="arrow-right" size={13} color={palette.tealChiaro} />
            </Pressable>
          </View>
          <Vetro>
            <Pressable onPress={() => go("progetto")} style={{ padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Image source={{ uri: PROGETTO.cover }} style={{ width: 46, height: 60, borderRadius: 10 }} contentFit="cover" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1.2, fontWeight: "800", color: palette.tealChiaro }}>{PROGETTO.tipo.toUpperCase()}</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: palette.testo }}>{PROGETTO.titolo}</Text>
                <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }}>giorno {PROGETTO.giorniFatti} di {PROGETTO.giorniTotali} · 62%</Text>
              </View>
              <Icon name="chevron-right" size={17} color={palette.tenue} />
            </Pressable>
          </Vetro>

          {/* mestieri + rental */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <Vetro style={{ flexBasis: "48.8%", flexGrow: 1, minWidth: 250 }}>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <Etichetta>DI COSA MI OCCUPO</Etichetta>
                {MESTIERI.map((m, i) => (
                  <View key={m.nome} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                    <Icon name={m.icona} size={15} color={palette.tealChiaro} />
                    <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: palette.testo }}>{m.nome}</Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }}>{m.anni}</Text>
                  </View>
                ))}
              </View>
            </Vetro>

            <Vetro style={{ flexBasis: "48.8%", flexGrow: 1, minWidth: 250 }}>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <Etichetta>REPARTO E RENTAL</Etichetta>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: palette.testo }}>Luce Nord</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: palette.tenue }}>6 corpi · 11 ottiche · 4 luci</Text>
                {PERSONE.slice(0, 2).map((p) => (
                  <View key={p.n} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 6 }}>
                    <Icon name="account-outline" size={12} color={palette.tealChiaro} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: palette.tenue }} numberOfLines={1}>{p.n} · {p.r}</Text>
                  </View>
                ))}
              </View>
            </Vetro>
          </View>

          {/* contatti */}
          <Vetro>
            <View style={{ paddingVertical: 2 }}>
              {CONTATTI.map((c, i) => (
                <View key={c.l} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                  <Icon name={c.icona} size={16} color={palette.tealChiaro} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.4, color: palette.tenue, width: 76 }}>{c.l.toUpperCase()}</Text>
                  <Text style={{ flex: 1, fontFamily: fonts.script, fontSize: 11.5, color: palette.testo }} numberOfLines={1}>{c.v}</Text>
                </View>
              ))}
            </View>
          </Vetro>

          <Pressable onPress={() => go("impostazioni")}>
            <Vetro>
              <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Icon name="cog-outline" size={17} color={palette.tealChiaro} />
                <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: palette.testo }}>Impostazioni</Text>
                <Icon name="chevron-right" size={17} color={palette.tenue} />
              </View>
            </Vetro>
          </Pressable>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>CINEGRAM · profilo di prova</Text>
        </View>
      </ScrollView>

      <Dock attivo="profilo" go={go} />

      <Modal visible={modale} transparent animationType="slide" onRequestClose={() => setModale(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,5,6,0.72)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setModale(false)} />
          <View style={{ backgroundColor: "#0A0E10", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: palette.bordo, padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, color: palette.testo }}>Pubblica un lavoro</Text>
              <Pressable onPress={() => setModale(false)} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
                <Icon name="close" size={15} color={palette.testo} />
              </Pressable>
            </View>

            <Pressable onPress={scegliFoto} style={{ height: 140, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderStyle: foto ? "solid" : "dashed", borderColor: "rgba(10,143,166,0.45)", backgroundColor: "rgba(2,86,105,0.18)", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {foto ? <Image source={{ uri: foto }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : (
                <>
                  <Icon name="image-plus" size={24} color={palette.tealChiaro} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: palette.tenue }}>Aggiungi una foto</Text>
                </>
              )}
            </Pressable>

            <TextInput value={titolo} onChangeText={setTitolo} placeholder="Titolo del lavoro" placeholderTextColor="rgba(242,246,247,0.35)" style={campo} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {["Cortometraggio", "Documentario", "Videoclip", "Spot"].map((t) => (
                <Pressable key={t} onPress={() => setTipo(t)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: tipo === t ? palette.tealChiaro : palette.bordo, backgroundColor: tipo === t ? "rgba(2,86,105,0.4)" : "transparent" }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: tipo === t ? palette.testo : palette.tenue }}>{t}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={anno} onChangeText={setAnno} placeholder="Anno" keyboardType="number-pad" placeholderTextColor="rgba(242,246,247,0.35)" style={campo} />
            <Pressable onPress={salva} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 999, backgroundColor: palette.tealChiaro }}>
              <Icon name="upload" size={16} color="#FFFFFF" />
              <Text style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>Pubblica nel portfolio</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
