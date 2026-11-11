import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, spacing } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

// ── Scheda progetto 3 ────────────────────────────────────────────────────────
// Tutte le voci della scheda progetto originale, rivisitate nel tema della
// Home 3: copertina, fasi in alto e, per ogni fase, le sezioni in schede di
// vetro. I contenuti sono di esempio: serve a vedere struttura e impaginazione.

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
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
];

const FASI = [
  { k: "sviluppo", l: "Sviluppo" },
  { k: "pre", l: "Pre-produzione" },
  { k: "set", l: "Set" },
  { k: "post", l: "Post" },
  { k: "tools", l: "Strumenti" },
];

type Riga = { t: string; s?: string; b?: string; check?: boolean };
type Sezione = {
  k: string;
  l: string;
  icona: IconName;
  fase: string;
  solo?: string;
  speciale?: "budget" | "piano" | "meteo" | "slate" | "luci" | "storyboard" | "copione" | "mood" | "look" | "tempo" | "panoramica";
  righe?: Riga[];
};

const SEZIONI: Sezione[] = [
  { k: "panoramica", l: "Panoramica", icona: "view-dashboard-outline", fase: "sviluppo", speciale: "panoramica" },
  {
    k: "soggetto", l: "Soggetto", icona: "lightbulb-on-outline", fase: "sviluppo",
    righe: [
      { t: "Logline", s: "Una donna aspetta una telefonata che non arriva, in una cucina che non è la sua." },
      { t: "Tema", s: "L'attesa come forma di lutto." },
      { t: "Tono", s: "Notturno, fermo, poco dialogo." },
    ],
  },
  {
    k: "trattamento", l: "Trattamento", icona: "text-box-outline", fase: "sviluppo",
    righe: [
      { t: "Atto I · Impostazione", s: "Elena entra nella casa vuota, prepara la cena per due." },
      { t: "Atto II · Confronto", s: "Il telefono squilla tre volte. Lei non risponde." },
      { t: "Atto III · Risoluzione", s: "Risponde. Non è lui. Esce." },
    ],
  },
  { k: "sceneggiatura", l: "Sceneggiatura", icona: "script-text-outline", fase: "sviluppo", speciale: "copione" },
  {
    k: "personaggi", l: "Personaggi", icona: "drama-masks", fase: "sviluppo",
    righe: [
      { t: "Elena", s: "42 anni · protagonista", b: "Protagonista" },
      { t: "L'uomo al telefono", s: "voce · antagonista", b: "Antagonista" },
      { t: "La vicina", s: "60 anni · secondaria", b: "Secondario" },
    ],
  },
  {
    k: "note", l: "Note", icona: "note-text-outline", fase: "sviluppo",
    righe: [
      { t: "Il frigo deve restare acceso", s: "Regia · scena 14", b: "Regia" },
      { t: "Provare il piano sequenza", s: "Fotografia · scena 15A", b: "Fotografia" },
    ],
  },
  { k: "contenuti", l: "Contenuti social", icona: "cellphone-play", fase: "sviluppo", solo: "social" ,
    righe: [
      { t: "Teaser 15s", s: "Reel Instagram · 9:16 · 0:15", b: "In produzione" },
      { t: "Dietro le quinte", s: "TikTok · 9:16 · 0:30", b: "Idea" },
    ],
  },
  { k: "brief", l: "Brief", icona: "briefcase-outline", fase: "sviluppo", solo: "social/spot",
    righe: [
      { t: "Campagna inverno", s: "target 25-40 · tono notturno", b: "3 deliverable" },
    ],
  },
  { k: "bibbia", l: "Bibbia della serie", icona: "book-open-variant", fase: "sviluppo", solo: "serie",
    righe: [
      { t: "Premessa", s: "Una città che dimentica le persone." },
      { t: "Mondo e regole", s: "Nessuno esce dopo mezzanotte." },
    ],
  },
  { k: "episodi", l: "Stagioni & episodi", icona: "television-play", fase: "sviluppo", solo: "serie",
    righe: [
      { t: "1x01 · La porta", s: "Stagione 1 · 45' · riprese", b: "Riprese" },
      { t: "1x02 · Il rumore", s: "Stagione 1 · 45' · scrittura", b: "Scrittura" },
    ],
  },
  { k: "brano", l: "Brano", icona: "music-circle-outline", fase: "sviluppo", solo: "videoclip",
    righe: [
      { t: "Notturno", s: "Artista · 96 BPM · 3:42", b: "La minore" },
      { t: "Struttura", s: "Intro 0:00 · Strofa 0:12 · Ritornello 0:45" },
    ],
  },
  { k: "scene", l: "Scene", icona: "movie-open-outline", fase: "pre",
    righe: [
      { t: "14 · INT. CUCINA — NOTTE", s: "Elena · Ex Cartiera · 1 3/8", b: "Da girare" },
      { t: "15A · EST. CORTILE — NOTTE", s: "Elena · Ex Cartiera · 2/8", b: "Da girare" },
      { t: "16 · INT. SCALE — NOTTE", s: "Elena, vicina · 1 1/8", b: "Girata" },
    ],
  },
  {
    k: "interviste", l: "Interviste", icona: "microphone-outline", fase: "pre", solo: "documentario",
    righe: [
      { t: "Anna Marchetti", s: "ex operaia · 12 nov · Ex Cartiera", b: "liberatoria", check: true },
      { t: "Piero Landi", s: "storico locale · 14 nov · casa sua" },
    ],
  },
  { k: "shotlist", l: "Shotlist", icona: "format-list-numbered", fase: "pre",
    righe: [
      { t: "14A · Campo largo", s: "Fisso · 32mm · setup notte", b: "Girata", check: true },
      { t: "14B · Dettaglio telefono", s: "Fisso · 85mm · setup notte", b: "MCU" },
      { t: "14C · Primo piano", s: "Dolly lento · 50mm", b: "CU" },
    ],
  },
  { k: "storyboard", l: "Storyboard", icona: "draw", fase: "pre", speciale: "storyboard" },
  {
    k: "location", l: "Location", icona: "map-marker-outline", fase: "pre",
    righe: [
      { t: "Ex Cartiera", s: "Via del Porto 12, Bologna · permessi ottenuti", b: "Ottenuti" },
      { t: "Casa di Elena", s: "Via Mazzini 4 · referente Anna", b: "Richiesti" },
    ],
  },
  { k: "budget", l: "Budget", icona: "cash-multiple", fase: "pre", speciale: "budget" },
  {
    k: "cast", l: "Cast", icona: "account-star-outline", fase: "pre",
    righe: [
      { t: "Giulia Rinaldi", s: "Elena · confermata", b: "Confermato" },
      { t: "Paolo Serra", s: "voce · opzionato", b: "Opzionato" },
    ],
  },
  {
    k: "crew", l: "Troupe", icona: "account-group-outline", fase: "pre",
    righe: [
      { t: "Alessandro Campagna", s: "Regia · 9 giorni", b: "Regia" },
      { t: "Giulia Bernardi", s: "Fotografia · 9 giorni", b: "Fotografia" },
      { t: "Marco Fabbri", s: "Fonico · 7 giorni", b: "Suono" },
    ],
  },
  {
    k: "attrezzatura", l: "Attrezzatura", icona: "camera-outline", fase: "pre",
    righe: [
      { t: "ARRI Alexa Mini", s: "Camera · 1 · pronto", b: "Camera", check: true },
      { t: "Sigma 18-35", s: "Ottiche · 1 · pronto", b: "Ottiche", check: true },
      { t: "Aputure 600D", s: "Luci · 2 · da caricare", b: "Luci" },
    ],
  },
  { k: "piano", l: "Piano di lavorazione", icona: "calendar-month-outline", fase: "pre", speciale: "piano" },
  { k: "moodboard", l: "Moodboard", icona: "image-multiple-outline", fase: "pre", speciale: "mood" },
  {
    k: "reference", l: "Reference", icona: "bookmark-multiple-outline", fase: "pre",
    righe: [
      { t: "In the Mood for Love", s: "Film · luce nei corridoi", b: "Film" },
      { t: "Saul Leiter", s: "Fotografia · colore attraverso il vetro", b: "Fotografia" },
    ],
  },
  { k: "luci", l: "Diagrammi luce", icona: "lightbulb-group-outline", fase: "pre", speciale: "luci" },
  { k: "color", l: "Color & LUT", icona: "palette-outline", fase: "pre", speciale: "look" },
  { k: "slate", l: "Ciak digitale", icona: "movie-open-play-outline", fase: "set", speciale: "slate" },
  {
    k: "checklist", l: "Checklist set", icona: "checkbox-marked-outline", fase: "set",
    righe: [
      { t: "Batterie e schede", s: "Camera · responsabile Giulia", b: "Camera", check: true },
      { t: "Kit filtri ND", s: "Camera · da caricare", b: "Camera" },
      { t: "Liberatorie firmate", s: "Documenti · 4 su 4", b: "Documenti", check: true },
    ],
  },
  {
    k: "supervisor", l: "Script supervisor", icona: "clipboard-text-outline", fase: "set",
    righe: [
      { t: "Sc 14 · 14C · take 3", s: "01:02:03:04 · 50mm · buona", b: "Buona" },
      { t: "Sc 14 · 14B · take 2", s: "00:58:12:19 · 85mm · NG", b: "NG" },
    ],
  },
  { k: "time", l: "Time tracker", icona: "timer-outline", fase: "set", speciale: "tempo" },
  { k: "meteo", l: "Meteo & sole", icona: "weather-partly-cloudy", fase: "set", speciale: "meteo" },
  {
    k: "vfx", l: "VFX", icona: "auto-fix", fase: "post",
    righe: [
      { t: "Sc 15A · pulizia cavi", s: "Clean-up · scadenza 20 nov", b: "In lavorazione" },
      { t: "Sc 16 · titoli", s: "Titoli · da fare", b: "Da fare" },
    ],
  },
  {
    k: "montaggio", l: "Montaggio", icona: "content-cut", fase: "post",
    righe: [
      { t: "Rough cut", s: "00:19:04 · 4 nov", b: "Rough cut" },
      { t: "Fine cut", s: "00:17:52 · 8 nov", b: "Fine cut" },
    ],
  },
  {
    k: "grading", l: "Color grading", icona: "tune-variant", fase: "post",
    righe: [
      { t: "Sequenza notte", s: "look Notte · Kodak 2383", b: "Revisione" },
      { t: "Sequenza alba", s: "look Ambra · Kodak 2383", b: "Da fare" },
    ],
  },
  {
    k: "audio", l: "Suono & musica", icona: "music-note-outline", fase: "post",
    righe: [
      { t: "Dialoghi", s: "Sc 14 · pulizia", b: "Approvato", check: true },
      { t: "Foley", s: "Frigo, pioggia, passi", b: "In lavorazione" },
      { t: "Mix 5.1", s: "master · scadenza 24 nov", b: "Da fare" },
    ],
  },
  {
    k: "consegne", l: "Consegne", icona: "package-variant-closed", fase: "post",
    righe: [
      { t: "DCP 2K Flat", s: "ProRes 4444 · 30 nov · festival", b: "Da consegnare" },
      { t: "Master H.264", s: "16:9 · 30 nov · online", b: "Da consegnare" },
    ],
  },
  { k: "documenti", l: "Documenti & file", icona: "file-document-multiple-outline", fase: "tools",
    righe: [
      { t: "Sceneggiatura v6.pdf", s: "Sceneggiatura · 84 pagine" },
      { t: "Liberatorie.pdf", s: "Liberatoria · 4 firmate" },
      { t: "Preventivo rental.pdf", s: "Preventivo · 9.400 €" },
    ],
  },
  {
    k: "equipment", l: "La mia attrezzatura", icona: "camera-outline", fase: "tools",
    righe: [
      { t: "Alexa Mini", s: "Camera · pronta" },
      { t: "Set ottiche Sigma", s: "Ottiche · 18 / 24 / 35 / 50 / 85" },
    ],
  },
  {
    k: "persone", l: "Persone", icona: "account-multiple-outline", fase: "tools",
    righe: [
      { t: "Giulia Bernardi", s: "Fotografia · 12 progetti insieme" },
      { t: "Marco Fabbri", s: "Suono · 8 progetti insieme" },
    ],
  },
  {
    k: "formats", l: "Formati", icona: "aspect-ratio", fase: "tools",
    righe: [
      { t: "2.39:1", s: "Cinema · ARRI 4.5K" },
      { t: "16:9", s: "Online · 4K" },
      { t: "9:16", s: "Social · 1080×1920" },
    ],
  },
  {
    k: "viewfinder", l: "Director viewfinder", icona: "camera-metering-center", fase: "tools",
    righe: [
      { t: "32mm su Alexa", s: "Campo visivo 2.39:1" },
      { t: "85mm su Alexa", s: "Campo visivo 2.39:1" },
    ],
  },
  {
    k: "lens", l: "Lens calculator", icona: "camera-iris", fase: "tools",
    righe: [
      { t: "50mm · S35", s: "Campo 27° · distanza iperfocale 34 m" },
      { t: "85mm · S35", s: "Campo 16° · iperfocale 98 m" },
    ],
  },
];

const BUDGET = [
  { t: "Troupe", v: 18200 },
  { t: "Attrezzatura", v: 9400 },
  { t: "Location", v: 6100 },
  { t: "Post-produzione", v: 5200 },
  { t: "Varie", v: 2300 },
];

const GIORNATE = [
  { g: "G1", d: "Dom 9", loc: "Casa di Elena", sc: "1 – 4", ore: "08:00 – 18:00", fatto: true },
  { g: "G2", d: "Lun 10", loc: "Ex Cartiera", sc: "5 – 9", ore: "06:30 – 19:00", fatto: true },
  { g: "G3", d: "Mar 11", loc: "Ex Cartiera", sc: "10 – 13", ore: "06:30 – 18:30", fatto: true },
  { g: "G4", d: "Mer 12", loc: "Ex Cartiera", sc: "14 – 16", ore: "06:30 – 19:00", oggi: true },
  { g: "G5", d: "Gio 13", loc: "Ex Cartiera", sc: "17 – 19", ore: "07:00 – 18:00" },
];

const PALETTE = [
  { n: "Notte", h: "#071018" },
  { n: "Teal", h: "#025669" },
  { n: "Ambra", h: "#C8A06A" },
  { n: "Fumo", h: "#8A9499" },
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

function Badge({ testo }: { testo: string }) {
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: BORDO }}>
      <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: "700", color: TENUE }}>{testo}</Text>
    </View>
  );
}

function Righi({ righe }: { righe: Riga[] }) {
  return (
    <View>
      {righe.map((r, i) => (
        <View key={`${r.t}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: i === 0 ? 0 : 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 9 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }} numberOfLines={2}>{r.t}</Text>
            {r.s ? <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }} numberOfLines={2}>{r.s}</Text> : null}
          </View>
          {r.check ? <Icon name="check-circle" size={15} color="rgba(10,143,166,0.75)" /> : null}
          {r.b ? <Badge testo={r.b} /> : null}
        </View>
      ))}
    </View>
  );
}

export default function Progetto3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [fase, setFase] = useState("sviluppo");
  const [ora, setOra] = useState(new Date());
  const [take, setTake] = useState(2);

  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const voci = SEZIONI.filter((s) => s.fase === fase);
  const totale = BUDGET.reduce((acc, b) => acc + b.v, 0);
  const orologio = [ora.getHours(), ora.getMinutes(), ora.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");

  const contenuto = (s: Sezione) => {
    if (s.speciale === "panoramica") {
      return (
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 18, color: "rgba(242,246,247,0.84)" }}>
            In una cucina che non è la sua, Elena aspetta una telefonata. Quando arriva, non è quella che aspettava.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
            {[
              { n: "41", l: "scene" },
              { n: "18", l: "minuti" },
              { n: "14", l: "persone" },
              { n: "62%", l: "avanzamento" },
            ].map((x) => (
              <View key={x.l} style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 24, color: TESTO }}>{x.n}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 8, letterSpacing: 1, color: TENUE }}>{x.l.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 5, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TEAL_CHIARO }}>PROSSIME TAPPE</Text>
            {[
              { q: "MER 12", c: "Giorno 4 · Ex Cartiera · scene 14-16" },
              { q: "GIO 13", c: "Giorno 5 · Ex Cartiera · scene 17-19" },
              { q: "LUN 17", c: "Riprese di recupero · scene 12 e 22" },
            ].map((t) => (
              <View key={t.q} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE, minWidth: 46 }}>{t.q}</Text>
                <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 11, color: TESTO }} numberOfLines={1}>{t.c}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    if (s.speciale === "budget") {
      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: TESTO }}>€ {totale.toLocaleString("it-IT")}</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 10, color: TENUE, paddingBottom: 5 }}>stimato</Text>
          </View>
          {BUDGET.map((b) => (
            <View key={b.t} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 11.5, color: TESTO }}>{b.t}</Text>
                <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>€ {b.v.toLocaleString("it-IT")}</Text>
              </View>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)" }}>
                <View style={{ height: 3, width: `${(b.v / totale) * 100}%`, borderRadius: 2, backgroundColor: TEAL_CHIARO }} />
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
            <View key={g.g} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", backgroundColor: g.oggi ? "rgba(2,86,105,0.25)" : "transparent", borderRadius: 8, paddingHorizontal: g.oggi ? 8 : 0 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, width: 26, color: g.oggi ? TEAL_CHIARO : "rgba(242,246,247,0.5)" }}>{g.g}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: TESTO }} numberOfLines={1}>{g.loc}</Text>
                <Text style={{ fontFamily: fonts.script, fontSize: 9, color: TENUE }}>{g.d} · sc {g.sc} · {g.ore}</Text>
              </View>
              {g.fatto ? <Icon name="check-circle" size={14} color="rgba(10,143,166,0.7)" /> : g.oggi ? <Text style={{ fontFamily: fonts.text, fontSize: 9, fontWeight: "800", color: TEAL_CHIARO }}>OGGI</Text> : null}
            </View>
          ))}
        </View>
      );
    }
    if (s.speciale === "meteo") {
      return (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name="weather-partly-cloudy" size={38} color={TEAL_CHIARO} />
            <View>
              <Text style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 38, color: TESTO }}>9°</Text>
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>Sereno · vento 12 km/h</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
            {[
              { i: "weather-sunset-up" as IconName, l: "Alba", v: "07:21" },
              { i: "weather-sunset-down" as IconName, l: "Tramonto", v: "16:58" },
              { i: "thermometer" as IconName, l: "Minima", v: "6°" },
            ].map((x) => (
              <View key={x.l} style={{ flex: 1, gap: 2 }}>
                <Icon name={x.i} size={13} color={TEAL_CHIARO} />
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1, color: TENUE }}>{x.l.toUpperCase()}</Text>
                <Text style={{ fontFamily: fonts.script, fontSize: 12, color: TESTO }}>{x.v}</Text>
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
            <View style={{ flexDirection: "row", height: 26 }}>
              <View style={{ flex: 1, backgroundColor: "#0B1116" }} />
              <View style={{ flex: 1, backgroundColor: TEAL }} />
              <View style={{ flex: 1, backgroundColor: "#0B1116" }} />
              <View style={{ flex: 1, backgroundColor: TEAL }} />
            </View>
            <View style={{ padding: spacing.sm, gap: 3, backgroundColor: "rgba(5,7,8,0.75)" }}>
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TESTO }}>PROD. Notturno · REGIA A. Campagna</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>SC 14 · INQ 14C · TAKE 3 · 25 fps</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[1, 2, 3].map((t) => (
              <Pressable key={t} onPress={() => setTake(t)} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: take === t ? TEAL_CHIARO : BORDO, backgroundColor: take === t ? "rgba(2,86,105,0.4)" : "transparent" }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: take === t ? TESTO : TENUE }}>Take {t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    if (s.speciale === "luci") {
      return (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { t: "Notte cucina", d: "3 luci · finestra" },
            { t: "Cortile", d: "2 luci · 1 faro" },
            { t: "Scale", d: "1 luce · taglio" },
          ].map((x) => (
            <View key={x.t} style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: BORDO, backgroundColor: "rgba(5,7,8,0.5)", padding: spacing.sm, gap: 3 }}>
              <Icon name="lightbulb-on-outline" size={15} color={TEAL_CHIARO} />
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TESTO }} numberOfLines={1}>{x.t}</Text>
              <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE }} numberOfLines={1}>{x.d}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (s.speciale === "storyboard") {
      return (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {FOTO.slice(0, 3).map((f, i) => (
            <View key={f} style={{ flex: 1, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
              <Image source={{ uri: f }} style={{ width: "100%", height: 70 }} contentFit="cover" />
              <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE, padding: 4 }}>tav. {i + 1} · sc 14</Text>
            </View>
          ))}
        </View>
      );
    }
    if (s.speciale === "copione") {
      return (
        <View style={{ borderRadius: 12, backgroundColor: "rgba(5,7,8,0.55)", borderWidth: 1, borderColor: "rgba(2,86,105,0.5)", padding: spacing.md, gap: 4 }}>
          <Text style={{ fontFamily: fonts.script, fontSize: 9.5, letterSpacing: 1, color: TEAL_CHIARO }}>INT. CUCINA — NOTTE</Text>
          <Text style={{ fontFamily: fonts.script, fontSize: 11, lineHeight: 17, color: "rgba(242,246,247,0.86)" }}>
            Il telefono squilla. ELENA resta immobile davanti al lavandino. Al terzo squillo alza la cornetta, poi la rimette giù.
          </Text>
          <Text style={{ fontFamily: fonts.script, fontSize: 8.5, color: TENUE, paddingTop: 4 }}>pag. 24 · 2/8</Text>
        </View>
      );
    }
    if (s.speciale === "mood") {
      return (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {FOTO.map((f) => (
            <View key={f} style={{ flex: 1, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: BORDO }}>
              <Image source={{ uri: f }} style={{ width: "100%", height: 74 }} contentFit="cover" />
            </View>
          ))}
        </View>
      );
    }
    if (s.speciale === "look") {
      return (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {PALETTE.map((c) => (
              <View key={c.n} style={{ flex: 1, gap: 3 }}>
                <View style={{ height: 34, borderRadius: 8, backgroundColor: c.h, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }} />
                <Text style={{ fontFamily: fonts.script, fontSize: 8, color: TENUE, textAlign: "center" }}>{c.n}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>ARRI LogC4 · LUT Kodak 2383 · 3 scene</Text>
        </View>
      );
    }
    if (s.speciale === "tempo") {
      return (
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 26, color: TESTO }}>{orologio}</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 10, color: TENUE }}>inizio 06:30 · 8h 12m sul set</Text>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(2,86,105,0.4)", borderWidth: 1, borderColor: "rgba(10,143,166,0.5)" }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 9.5, fontWeight: "800", color: TESTO }}>IN CORSO</Text>
          </View>
        </View>
      );
    }
    return <Righi righe={s.righe ?? []} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }} showsVerticalScrollIndicator={false}>
        {/* copertina */}
        <View style={{ height: wide ? 300 : 275 }}>
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

            <View style={{ gap: 5, paddingBottom: spacing.lg }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2, fontWeight: "800", color: TEAL_CHIARO }}>CORTOMETRAGGIO · 2026 · RIPRESE</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: wide ? 48 : 38, lineHeight: wide ? 50 : 40, color: "#FFFFFF" }} numberOfLines={1}>Notturno</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Badge testo="Giorno 4 di 9" />
                <Badge testo="14 persone" />
                <Badge testo={id ? "progetto vero" : "dati di esempio"} />
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: -spacing.xs }}>
          {/* fasi + avanzamento */}
          <Vetro>
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {FASI.map((f, i) => (
                  <View key={f.k} style={{ flex: 1, gap: 4 }}>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: i === 2 ? TEAL_CHIARO : i < 2 ? "rgba(2,86,105,0.85)" : "rgba(255,255,255,0.1)" }} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 7.5, textAlign: "center", color: i === 2 ? TESTO : TENUE }} numberOfLines={1}>{f.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Vetro>

          {/* selettore fase */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: spacing.lg }}>
            {FASI.map((f) => {
              const attiva = fase === f.k;
              const n = SEZIONI.filter((s) => s.fase === f.k).length;
              return (
                <Pressable
                  key={f.k}
                  onPress={() => setFase(f.k)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: attiva ? TEAL : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: attiva ? "rgba(10,143,166,0.9)" : BORDO }}
                >
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: attiva ? "#FFFFFF" : TENUE }}>{f.l}</Text>
                  <Text style={{ fontFamily: fonts.script, fontSize: 9, color: attiva ? "rgba(255,255,255,0.75)" : TENUE }}>{n}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* tutte le voci della fase */}
          <View style={{ gap: spacing.md }}>
            {voci.map((s) => (
              <Vetro key={s.k}>
                <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name={s.icona} size={16} color={TEAL_CHIARO} />
                    <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 18, color: TESTO }} numberOfLines={1}>{s.l}</Text>
                    {s.solo ? <Badge testo={s.solo} /> : null}
                    <Icon name="dots-horizontal" size={16} color={TENUE} />
                  </View>
                  {contenuto(s)}
                </View>
              </Vetro>
            ))}
          </View>

          {/* voci fuori da questa fase */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingTop: 2 }}>
            <Icon name="layers-outline" size={14} color={TEAL_CHIARO} />
            <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TEAL_CHIARO }}>
              {SEZIONI.length} voci in tutto · {voci.length} in questa fase
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (id) router.push(`/project/${id}` as never);
            }}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: BORDO, opacity: pressed ? 0.85 : 1 })}
          >
            <Icon name="arrow-top-right" size={15} color={TEAL_CHIARO} />
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: TESTO }}>{id ? "Apri il progetto vero" : "Questa è una scheda di prova"}</Text>
          </Pressable>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.28)", textAlign: "center" }}>SCHEDA PROGETTO 3 · tutte le voci, dati di esempio</Text>
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
