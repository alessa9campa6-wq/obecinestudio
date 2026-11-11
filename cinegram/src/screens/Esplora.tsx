import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { LUOGHI, PERSONE, PROGETTO, SEZIONI } from "@/data";
import { useApp } from "@/store";
import { Badge, Etichetta, Icon, Page, Testata, Vetro, type IconName } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

const CATEGORIE: { k: string; l: string; icona: IconName }[] = [
  { k: "tutti", l: "Tutto", icona: "view-grid-outline" },
  { k: "persone", l: "Persone", icona: "account-multiple-outline" },
  { k: "luoghi", l: "Luoghi", icona: "map-marker-outline" },
  { k: "progetti", l: "Progetti", icona: "movie-open-outline" },
  { k: "lavori", l: "Lavori", icona: "image-multiple-outline" },
];

const iniziali = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export default function Esplora() {
  const { go, lavori } = useApp();
  const [cat, setCat] = useState("tutti");
  const [q, setQ] = useState("");
  const [seguiti, setSeguiti] = useState<string[]>([]);

  const testo = q.trim().toLowerCase();
  const persone = PERSONE.filter((p) => !testo || p.n.toLowerCase().includes(testo) || p.r.toLowerCase().includes(testo));
  const luoghi = LUOGHI.filter((l) => !testo || l.n.toLowerCase().includes(testo) || l.c.toLowerCase().includes(testo));
  const progetti = [PROGETTO, { ...PROGETTO, titolo: "Ferro & Fuoco", tipo: "Documentario", logline: "Un paese che vive di ferro, e il rumore che lascia." }, { ...PROGETTO, titolo: "Onde", tipo: "Videoclip", logline: "Una canzone, un molo, tre minuti di luce." }].filter((p) => !testo || p.titolo.toLowerCase().includes(testo));
  const mostrati = lavori.filter((l) => !testo || l.titolo.toLowerCase().includes(testo));
  const nulla = cat === "persone" ? !persone.length : cat === "luoghi" ? !luoghi.length : cat === "progetti" ? !progetti.length : cat === "lavori" ? !mostrati.length : false;

  const mostra = (c: string) => cat === "tutti" || cat === c;

  return (
    <Page attivo="esplora" go={go}>
      <Testata sopra="CINEGRAM" titolo="Esplora" icona="compass-outline" />

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: palette.bordo }}>
        <Icon name="magnify" size={18} color={palette.tenue} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Persone, luoghi, progetti, lavori"
          placeholderTextColor="rgba(242,246,247,0.35)"
          style={{ flex: 1, color: palette.testo, fontFamily: fonts.text, fontSize: 13, paddingVertical: 2 }}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <Icon name="close-circle" size={17} color={palette.tenue} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {CATEGORIE.map((c) => {
          const acceso = cat === c.k;
          return (
            <Pressable
              key={c.k}
              onPress={() => setCat(c.k)}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: acceso ? palette.teal : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: acceso ? "rgba(10,143,166,0.9)" : palette.bordo }}
            >
              <Icon name={c.icona} size={13} color={acceso ? "#FFFFFF" : palette.tenue} />
              <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: acceso ? "#FFFFFF" : palette.tenue }}>{c.l}</Text>
            </Pressable>
          );
        })}
      </View>

      {mostra("persone") && persone.length ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Etichetta>PERSONE</Etichetta>
            <View style={{ flex: 1 }} />
            <Badge testo={`${persone.length}`} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {persone.map((p) => {
              const seguito = seguiti.includes(p.n);
              return (
                <Vetro key={p.n} style={{ flexBasis: "48.8%", flexGrow: 1, minWidth: 260 }}>
                  <View style={{ padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.55)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: "#DCEFF3" }}>{iniziali(p.n)}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: palette.testo }} numberOfLines={1}>{p.n}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }} numberOfLines={1}>{p.r} · {p.c}</Text>
                    </View>
                    <Pressable
                      onPress={() => setSeguiti((a) => (a.includes(p.n) ? a.filter((x) => x !== p.n) : [...a, p.n]))}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: seguito ? palette.tealChiaro : palette.bordo, backgroundColor: seguito ? "rgba(2,86,105,0.4)" : "transparent" }}
                    >
                      <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "800", color: seguito ? palette.testo : palette.tealChiaro }}>{seguito ? "Seguito" : "Segui"}</Text>
                    </Pressable>
                  </View>
                </Vetro>
              );
            })}
          </View>
        </View>
      ) : null}

      {mostra("luoghi") && luoghi.length ? (
        <View style={{ gap: spacing.sm }}>
          <Etichetta>LUOGHI</Etichetta>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {luoghi.map((l) => (
              <View key={l.n} style={{ flexBasis: "48.8%", flexGrow: 1, minWidth: 260, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: palette.bordo, backgroundColor: palette.vetro }}>
                <Image source={{ uri: l.img }} style={{ width: "100%", height: 104 }} contentFit="cover" />
                <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.92)"]} style={{ position: "absolute", left: 0, right: 0, top: 20, bottom: 0 }} />
                <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.sm, gap: 2 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 18, color: palette.testo }} numberOfLines={1}>{l.n}</Text>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue }} numberOfLines={1}>{l.c} · {l.t}</Text>
                </View>
                <View style={{ position: "absolute", top: 8, right: 8 }}>
                  <Badge testo={l.permessi} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {mostra("progetti") && progetti.length ? (
        <View style={{ gap: spacing.sm }}>
          <Etichetta>PROGETTI</Etichetta>
          {progetti.map((p, i) => (
            <Vetro key={p.titolo}>
              <Pressable onPress={() => go("progetto")} style={{ padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, width: 28, color: "rgba(10,143,166,0.75)" }}>{String(i + 1).padStart(2, "0")}</Text>
                <Image source={{ uri: PROGETTO.cover }} style={{ width: 44, height: 56, borderRadius: 10 }} contentFit="cover" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.2, fontWeight: "800", color: palette.tealChiaro }}>{p.tipo.toUpperCase()}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 18, color: palette.testo }} numberOfLines={1}>{p.titolo}</Text>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: palette.tenue }} numberOfLines={1}>{p.logline}</Text>
                </View>
                <Icon name="chevron-right" size={18} color={palette.tenue} />
              </Pressable>
            </Vetro>
          ))}
        </View>
      ) : null}

      {mostra("lavori") && mostrati.length ? (
        <View style={{ gap: spacing.sm }}>
          <Etichetta>LAVORI</Etichetta>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {mostrati.map((l) => (
              <View key={l.id} style={{ flexBasis: "31.5%", flexGrow: 1, minWidth: 150, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: palette.bordo }}>
                <Image source={{ uri: l.img }} style={{ width: "100%", height: 118 }} contentFit="cover" />
                <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.92)"]} style={{ position: "absolute", left: 0, right: 0, top: 40, bottom: 0 }} />
                <View style={{ position: "absolute", left: 8, right: 8, bottom: 7, gap: 1 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: "800", letterSpacing: 1, color: palette.tealChiaro }}>{l.tipo.toUpperCase()}</Text>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: palette.testo }} numberOfLines={1}>{l.titolo}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {nulla ? (
        <Vetro>
          <View style={{ padding: spacing.xl, alignItems: "center", gap: 6 }}>
            <Icon name="magnify-close" size={26} color={palette.tenue} />
            <Text style={{ fontFamily: fonts.display, fontSize: 19, color: palette.testo }}>Nessun risultato</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: palette.tenue, textAlign: "center" }}>Prova un’altra parola o togli la categoria.</Text>
          </View>
        </Vetro>
      ) : null}

      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>
        {SEZIONI.length} sezioni di progetto, {PERSONE.length} persone, {LUOGHI.length} luoghi
      </Text>
    </Page>
  );
}
