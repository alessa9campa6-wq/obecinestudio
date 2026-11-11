import type { IconName, Riga } from "@/ui";

// Tutti i contenuti sono di esempio: Cinegram è un prototipo, non legge il backend.

export const FOTO = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop",
];

export const PROGETTO = {
  titolo: "Notturno",
  tipo: "Cortometraggio",
  anno: 2026,
  logline: "In una cucina che non è la sua, Elena aspetta una telefonata. Quando arriva, non è quella che aspettava.",
  fase: "Riprese",
  faseIndice: 2,
  giorniFatti: 4,
  giorniTotali: 9,
  quota: 0.62,
  location: "Ex Cartiera · Bologna",
  persone: 14,
  cover: FOTO[0],
  budget: 48000,
};

export const OGGI = {
  convocazione: "06:30",
  scena: "Scene 14 · 15A · 16",
  location: "Ex Cartiera · Bologna",
  meteo: "Sereno, 9°",
  tramonto: "16:58",
  alba: "07:21",
  ore: 3,
  minuti: 25,
};

export const FASI = ["Sviluppo", "Pre", "Riprese", "Post", "Consegna"];

export type Sezione = {
  k: string;
  l: string;
  icona: IconName;
  fase: "sviluppo" | "pre" | "set" | "post" | "tools";
  solo?: string;
  speciale?: "panoramica" | "budget" | "piano" | "meteo" | "slate" | "luci" | "storyboard" | "copione" | "mood" | "look" | "tempo";
  righe?: Riga[];
};

export const SEZIONI: Sezione[] = [
  { k: "panoramica", l: "Panoramica", icona: "view-dashboard-outline", fase: "sviluppo", speciale: "panoramica" },
  {
    k: "soggetto", l: "Soggetto", icona: "lightbulb-on-outline", fase: "sviluppo",
    righe: [
      { t: "Logline", s: "Una donna aspetta una telefonata che non arriva." },
      { t: "Tema", s: "L’attesa come forma di lutto." },
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
      { t: "L’uomo al telefono", s: "voce · antagonista", b: "Antagonista" },
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
  {
    k: "contenuti", l: "Contenuti social", icona: "cellphone-play", fase: "sviluppo", solo: "social",
    righe: [
      { t: "Teaser 15s", s: "Reel Instagram · 9:16 · 0:15", b: "In produzione" },
      { t: "Dietro le quinte", s: "TikTok · 9:16 · 0:30", b: "Idea" },
    ],
  },
  { k: "brief", l: "Brief", icona: "briefcase-outline", fase: "sviluppo", solo: "social/spot", righe: [{ t: "Campagna inverno", s: "target 25-40 · tono notturno", b: "3 deliverable" }] },
  { k: "bibbia", l: "Bibbia della serie", icona: "book-open-variant", fase: "sviluppo", solo: "serie", righe: [{ t: "Premessa", s: "Una città che dimentica le persone." }, { t: "Mondo e regole", s: "Nessuno esce dopo mezzanotte." }] },
  {
    k: "episodi", l: "Stagioni & episodi", icona: "television-play", fase: "sviluppo", solo: "serie",
    righe: [
      { t: "1x01 · La porta", s: "Stagione 1 · 45' · riprese", b: "Riprese" },
      { t: "1x02 · Il rumore", s: "Stagione 1 · 45' · scrittura", b: "Scrittura" },
    ],
  },
  {
    k: "brano", l: "Brano", icona: "music-circle-outline", fase: "sviluppo", solo: "videoclip",
    righe: [
      { t: "Notturno", s: "Artista · 96 BPM · 3:42", b: "La minore" },
      { t: "Struttura", s: "Intro 0:00 · Strofa 0:12 · Ritornello 0:45" },
    ],
  },
  {
    k: "scene", l: "Scene", icona: "movie-open-outline", fase: "pre",
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
  {
    k: "shotlist", l: "Shotlist", icona: "format-list-numbered", fase: "pre",
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
  {
    k: "documenti", l: "Documenti & file", icona: "file-document-multiple-outline", fase: "tools",
    righe: [
      { t: "Sceneggiatura v6.pdf", s: "Sceneggiatura · 84 pagine" },
      { t: "Liberatorie.pdf", s: "Liberatoria · 4 firmate" },
      { t: "Preventivo rental.pdf", s: "Preventivo · 9.400 €" },
    ],
  },
  { k: "equipment", l: "La mia attrezzatura", icona: "camera-outline", fase: "tools", righe: [{ t: "Alexa Mini", s: "Camera · pronta" }, { t: "Set ottiche Sigma", s: "Ottiche · 18 / 24 / 35 / 50 / 85" }] },
  { k: "persone", l: "Persone", icona: "account-multiple-outline", fase: "tools", righe: [{ t: "Giulia Bernardi", s: "Fotografia · 12 progetti insieme" }, { t: "Marco Fabbri", s: "Suono · 8 progetti insieme" }] },
  {
    k: "formats", l: "Formati", icona: "aspect-ratio", fase: "tools",
    righe: [
      { t: "2.39:1", s: "Cinema · ARRI 4.5K" },
      { t: "16:9", s: "Online · 4K" },
      { t: "9:16", s: "Social · 1080×1920" },
    ],
  },
  { k: "viewfinder", l: "Director viewfinder", icona: "camera-metering-center", fase: "tools", righe: [{ t: "32mm su Alexa", s: "Campo visivo 2.39:1" }, { t: "85mm su Alexa", s: "Campo visivo 2.39:1" }] },
  { k: "lens", l: "Lens calculator", icona: "camera-iris", fase: "tools", righe: [{ t: "50mm · S35", s: "Campo 27° · iperfocale 34 m" }, { t: "85mm · S35", s: "Campo 16° · iperfocale 98 m" }] },
];

export const BUDGET = [
  { t: "Troupe", v: 18200 },
  { t: "Attrezzatura", v: 9400 },
  { t: "Location", v: 6100 },
  { t: "Post-produzione", v: 5200 },
  { t: "Varie", v: 2300 },
];

export const GIORNATE = [
  { g: "G1", d: "Dom 9", loc: "Casa di Elena", sc: "1 – 4", ore: "08:00 – 18:00", fatto: true },
  { g: "G2", d: "Lun 10", loc: "Ex Cartiera", sc: "5 – 9", ore: "06:30 – 19:00", fatto: true },
  { g: "G3", d: "Mar 11", loc: "Ex Cartiera", sc: "10 – 13", ore: "06:30 – 18:30", fatto: true },
  { g: "G4", d: "Mer 12", loc: "Ex Cartiera", sc: "14 – 16", ore: "06:30 – 19:00", oggi: true },
  { g: "G5", d: "Gio 13", loc: "Ex Cartiera", sc: "17 – 19", ore: "07:00 – 18:00" },
];

export const PALETTE = [
  { n: "Notte", h: "#071018" },
  { n: "Teal", h: "#025669" },
  { n: "Ambra", h: "#C8A06A" },
  { n: "Fumo", h: "#8A9499" },
];

export const MESTIERI: { icona: IconName; nome: string; anni: string }[] = [
  { icona: "movie-open-outline", nome: "Regia", anni: "9 anni" },
  { icona: "camera-outline", nome: "Fotografia", anni: "7 anni" },
  { icona: "content-cut", nome: "Montaggio", anni: "6 anni" },
  { icona: "palette-outline", nome: "Color", anni: "4 anni" },
];

export const PERSONE = [
  { n: "Giulia Bernardi", r: "Direttrice della fotografia", c: "Bologna", progetti: 12 },
  { n: "Marco Fabbri", r: "Fonico di presa diretta", c: "Modena", progetti: 8 },
  { n: "Sara Neri", r: "Script supervisor", c: "Bologna", progetti: 5 },
  { n: "Luca Sarti", r: "Elettricista", c: "Ferrara", progetti: 3 },
  { n: "Elena Righi", r: "Costumista", c: "Ravenna", progetti: 4 },
];

export const LUOGHI = [
  { n: "Ex Cartiera", c: "Bologna", t: "Industriale · 1.200 m²", img: FOTO[2], permessi: "Ottenuti" },
  { n: "Casa di Elena", c: "Bologna", t: "Interni anni '70", img: FOTO[3], permessi: "Richiesti" },
  { n: "Cortile del porto", c: "Ravenna", t: "Esterno notte", img: FOTO[1], permessi: "Da richiedere" },
];

export const LAVORI = [
  { id: "l1", titolo: "Notturno", tipo: "Cortometraggio", anno: "2026", img: FOTO[2] },
  { id: "l2", titolo: "Ferro & Fuoco", tipo: "Documentario", anno: "2025", img: FOTO[1] },
  { id: "l3", titolo: "Onde", tipo: "Videoclip", anno: "2024", img: FOTO[4] },
];

export const CONVERSAZIONI = [
  { id: "c1", nome: "Giulia Bernardi", ultimo: "Porto il set di ottiche domani alle 7", quando: "09:42", nonLetti: 2 },
  { id: "c2", nome: "Marco Fabbri", ultimo: "Ho sentito la location, tutto ok per mercoledì", quando: "Ieri", nonLetti: 0 },
  { id: "c3", nome: "Sara Neri", ultimo: "Mi mandi le ultime pagine della 14?", quando: "Ieri", nonLetti: 1 },
  { id: "c4", nome: "Rental Luce Nord", ultimo: "Preventivo aggiornato, 2 Aputure 600D", quando: "Lun", nonLetti: 0 },
  { id: "c5", nome: "Elena Righi", ultimo: "I costumi sono pronti per il provino", quando: "Lun", nonLetti: 0 },
];

export const MESSAGGI: Record<string, { io: boolean; t: string; ora: string }[]> = {
  c1: [
    { io: false, t: "Ciao, per domani mattina ci siamo?", ora: "09:30" },
    { io: true, t: "Sì, call alle 6:30 in cartiera.", ora: "09:35" },
    { io: false, t: "Porto il set di ottiche domani alle 7", ora: "09:42" },
  ],
  c2: [
    { io: false, t: "Ho sentito la location, tutto ok per mercoledì", ora: "18:10" },
    { io: true, t: "Perfetto, grazie Marco.", ora: "18:12" },
  ],
  c3: [{ io: false, t: "Mi mandi le ultime pagine della 14?", ora: "17:20" }],
  c4: [{ io: false, t: "Preventivo aggiornato, 2 Aputure 600D", ora: "11:05" }],
  c5: [{ io: false, t: "I costumi sono pronti per il provino", ora: "10:40" }],
};

export const EVENTI: { id: string; data: string; ora: string; titolo: string; tipo: string }[] = [
  { id: "e1", data: "", ora: "06:30", titolo: "Giorno 4 · riprese", tipo: "Ripresa" },
  { id: "e2", data: "", ora: "18:00", titolo: "Sopralluogo location notte", tipo: "Altro" },
  { id: "e3", data: "", ora: "09:30", titolo: "Prove con il cast", tipo: "Altro" },
  { id: "e4", data: "", ora: "07:00", titolo: "Giorno 5 · riprese", tipo: "Ripresa" },
];
