import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BUDGET, FASI, FOTO, GIORNATE, PALETTE, PROGETTO, SEZIONI, type Sezione } from "@/data";
import { useApp } from "@/store";
import { Badge, Etichetta, Icon, Page, Righi, Vetro } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

const FASi = [
  { k: "sviluppo", l: "Sviluppo" },
  { k: "pre", l: "Pre-produzione" },
  { k: "set", l: "Set" },
  { k: "post", l: "Post" },
  { k: "tools", l: "Strumenti" },
] as const;

function Speciale({ s }: { s: Sezione }) {
  const [take, setTake] = useState(2);
  const [ora, setOra] = useState(new Date());
  useEffect(() => {
    if (s.speciale !== "tempo") return;
    const t = setInterval(() => setOra(new Date()), 1000);
    return () => clearInterval(t);
  }, [s.speciale]);

  if (s.speciale === "panoramica") {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 18, color: "rgba(242,246,247,0.84)" }}>{PROGETTO.logline}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
          {[{ n: "41", l: "scene" }, { n: "18", l: "minuti" }, { n: "14", l: "persone" }, { n: "62%", l: "fatto" }].map((x) => (
            <View key={x.l} style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: palette.testo }}>{x.n}</Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 7.5, letterSpacing: 1, color: palette.tenue }}>{x.l.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <View style={{ gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
          {[{ q: "MER 12", c: "Giorno 4 · Ex Cartiera · scene 14-16" }, { q: "GIO 13", c: "Giorno 5 · Ex Cartiera · scene 17-19" }].map((t) => (
            <View key={t.q} style={{ flexDirection: "row", gap: 8 }}>
              <Text style={{ fontFamily: fonts.script, fontSize: 9, color: palette.tenue, minWidth: 46 }}>{t.q}</Text>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 11, color: palette.testo }} numberOfLines={1}>{t.c}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (s.speciale === "budget") {
    const totale = BUDGET.reduce((a, b) => a + b.v, 0);
    return (
      <View style={{ gap: 8 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, color: palette.testo }}>€ {totale.toLocaleString("it-IT")}</Text>
        {BUDGET.map((b) => (
          <View key={b.t} style={{ gap: 3 }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 11.5, color: palette.testo }}>{b.t}</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: palette.tenue }}>€ {b.v.toLocaleString("it-IT")}</Text>
            </View>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
              <View style={{ height: 3, width: `${(b.v / totale) * 100}%`, borderRadius: 2, backgroundColor: palette.tealChiaro }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (s.speciale === "piano") {
    return (
      <View>
        {GIORNATE.map((g, i) => (
          <View key={g.g} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 7, paddingHorizontal: g.oggi ? 8 : 0, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", backgroundColor: g.oggi ? "rgba(2,86,105,0.28)" : "transparent", borderRadius: 8 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 15, width: 24, color: g.oggi ? palette.tealChiaro : "rgba(242,246,247,0.5)" }}>{g.g}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: palette.testo }} numberOfLines={1}>{g.loc}</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 8.5, color: palette.tenue }}>{g.d} · sc {g.sc} · {g.ore}</Text>
            </View>
            {g.fatto ? <Icon name="check-circle" size={14} color="rgba(10,143,166,0.7)" /> : g.oggi ? <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: "800", color: palette.tealChiaro }}>OGGI</Text> : null}
          </View>
        ))}
      </View>
    );
  }

  if (s.speciale === "meteo") {
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Icon name="weather-partly-cloudy" size={34} color={palette.tealChiaro} />
          <View>
            <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: palette.testo }}>9°</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 10, color: palette.tenue }}>Sereno · vento 12 km/h</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
          {[{ i: "weather-sunset-up" as const, l: "Alba", v: "07:21" }, { i: "weather-sunset-down" as const, l: "Tramonto", v: "16:58" }, { i: "thermometer" as const, l: "Minima", v: "6°" }].map((x) => (
            <View key={x.l} style={{ flex: 1, gap: 2 }}>
              <Icon name={x.i} size={13} color={palette.tealChiaro} />
              <Text style={{ fontFamily: fonts.text, fontSize: 8, letterSpacing: 1, color: palette.tenue }}>{x.l.toUpperCase()}</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 11.5, color: palette.testo }}>{x.v}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (s.speciale === "slate") {
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(10,143,166,0.5)" }}>
          <View style={{ flexDirection: "row", height: 24 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? palette.teal : "#0B1116" }} />
            ))}
          </View>
          <View style={{ padding: spacing.sm, gap: 2, backgroundColor: "rgba(5,7,8,0.75)" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.testo }}>Notturno · REGIA A. Campagna</Text>
            <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tenue }}>SC 14 · INQ 14C · TAKE {take} · 25 fps</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 2, 3].map((t) => (
            <Pressable key={t} onPress={() => setTake(t)} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: take === t ? palette.tealChiaro : palette.bordo, backgroundColor: take === t ? "rgba(2,86,105,0.4)" : "transparent" }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: take === t ? palette.testo : palette.tenue }}>Take {t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (s.speciale === "luci") {
    return (
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[{ t: "Notte cucina", d: "3 luci" }, { t: "Cortile", d: "2 luci" }, { t: "Scale", d: "1 luce" }].map((x) => (
          <View key={x.t} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: palette.bordo, backgroundColor: "rgba(5,7,8,0.5)", padding: spacing.sm, gap: 2 }}>
            <Icon name="lightbulb-on-outline" size={14} color={palette.tealChiaro} />
            <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: palette.testo }} numberOfLines={1}>{x.t}</Text>
            <Text style={{ fontFamily: fonts.script, fontSize: 8, color: palette.tenue }}>{x.d}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (s.speciale === "storyboard" || s.speciale === "mood") {
    return (
      <View style={{ flexDirection: "row", gap: 6 }}>
        {FOTO.slice(1, 4).map((f, i) => (
          <View key={f} style={{ flex: 1, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: palette.bordo }}>
            <Image source={{ uri: f }} style={{ width: "100%", height: 68 }} contentFit="cover" />
            <Text style={{ fontFamily: fonts.script, fontSize: 7.5, color: palette.tenue, padding: 4 }}>{s.speciale === "storyboard" ? `tav. ${i + 1}` : "mood"}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (s.speciale === "copione") {
    return (
      <View style={{ borderRadius: 12, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.5)", padding: spacing.md, gap: 3 }}>
        <Text style={{ fontFamily: fonts.script, fontSize: 9, letterSpacing: 1, color: palette.tealChiaro }}>INT. CUCINA — NOTTE</Text>
        <Text style={{ fontFamily: fonts.script, fontSize: 10.5, lineHeight: 16, color: "rgba(242,246,247,0.86)" }} numberOfLines={4}>
          Il telefono squilla. ELENA resta immobile davanti al lavandino. Al terzo squillo alza la cornetta, poi la rimette giù.
        </Text>
        <Text style={{ fontFamily: fonts.script, fontSize: 8, color: palette.tenue }}>pag. 24 · 2/8</Text>
      </View>
    );
  }

  if (s.speciale === "look") {
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {PALETTE.map((c) => (
            <View key={c.n} style={{ flex: 1, gap: 3 }}>
              <View style={{ height: 32, borderRadius: 8, backgroundColor: c.h, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }} />
              <Text style={{ fontFamily: fonts.script, fontSize: 7.5, color: palette.tenue, textAlign: "center" }}>{c.n}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: fonts.text, fontSize: 10, color: palette.tenue }}>ARRI LogC4 · LUT Kodak 2383 · 3 scene</Text>
      </View>
    );
  }

  if (s.speciale === "tempo") {
    const o = [ora.getHours(), ora.getMinutes(), ora.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.script, fontSize: 24, color: palette.testo }}>{o}</Text>
          <Text style={{ fontFamily: fonts.text, fontSize: 9.5, color: palette.tenue }}>inizio 06:30 · 8h 12m sul set</Text>
        </View>
        <Badge testo="IN CORSO" />
      </View>
    );
  }

  return <Righi righe={s.righe ?? []} />;
}

export default function Progetto() {
  const { go } = useApp();
  const [fase, setFase] = useState<Sezione["fase"]>("sviluppo");
  const voci = SEZIONI.filter((s) => s.fase === fase);

  return (
    <Page attivo="oggi" go={go}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable onPress={() => go("oggi")} hitSlop={8} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
          <Icon name="chevron-left" size={18} color={palette.testo} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.2, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>SCHEDA PROGETTO</Text>
        <Badge testo={`${SEZIONI.length} voci`} />
      </View>

      <View style={{ marginHorizontal: -spacing.lg, height: 150, marginTop: -spacing.sm }}>
        <Image source={{ uri: PROGETTO.cover }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
        <LinearGradient colors={["rgba(5,7,8,0.1)", "rgba(2,86,105,0.55)", palette.nero]} style={{ position: "absolute", width: "100%", height: "100%" }} />
        <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 3 }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 2, fontWeight: "800", color: palette.tealChiaro }}>{PROGETTO.tipo.toUpperCase()} · {PROGETTO.anno} · {PROGETTO.fase.toUpperCase()}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: "#FFFFFF" }} numberOfLines={1}>{PROGETTO.titolo}</Text>
        </View>
      </View>

      <Vetro>
        <View style={{ padding: spacing.md, flexDirection: "row", gap: 4 }}>
          {FASI.map((f, i) => (
            <View key={f} style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: i === PROGETTO.faseIndice ? palette.tealChiaro : i < PROGETTO.faseIndice ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
              <Text style={{ fontFamily: fonts.text, fontSize: 7, textAlign: "center", color: i === PROGETTO.faseIndice ? palette.testo : palette.tenue }} numberOfLines={1}>{f}</Text>
            </View>
          ))}
        </View>
      </Vetro>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {FASi.map((f) => {
          const acceso = fase === f.k;
          const n = SEZIONI.filter((s) => s.fase === f.k).length;
          return (
            <Pressable key={f.k} onPress={() => setFase(f.k)} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: acceso ? palette.teal : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: acceso ? "rgba(10,143,166,0.9)" : palette.bordo }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: acceso ? "#FFFFFF" : palette.tenue }}>{f.l}</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 8.5, color: acceso ? "rgba(255,255,255,0.75)" : palette.tenue }}>{n}</Text>
            </Pressable>
          );
        })}
      </View>

      {voci.map((s) => (
        <Vetro key={s.k}>
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name={s.icona} size={15} color={palette.tealChiaro} />
              <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 17, color: palette.testo }} numberOfLines={1}>{s.l}</Text>
              {s.solo ? <Badge testo={s.solo} /> : null}
            </View>
            <Speciale s={s} />
          </View>
        </Vetro>
      ))}

      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>{voci.length} voci in questa fase · dati di esempio</Text>
    </Page>
  );
}
