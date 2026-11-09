import type { IconName } from "@/src/ui";

export type FieldType = "text" | "multiline" | "number" | "select" | "image" | "media" | "file" | "url" | "colors" | "check" | "date" | "daterange" | "time" | "ref" | "lens" | "rows";
// Sotto-campi di un campo "rows" (righe ripetibili: es. un ruolo con la sua tariffa).
export type RowField = { key: string; label: string; type: FieldType; options?: string[]; placeholder?: string };
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  ref?: string;
  multi?: boolean;
  types?: string[];
  rows?: RowField[];
};
export type ModuleKind =
  | "list" | "overview" | "doc" | "screenplay" | "storyboard" | "lighting" | "slate" | "time" | "weather"
  | "lens" | "lenses" | "people" | "viewfinder" | "formats" | "guides";
export type DocSection = { key: string; label: string; hint?: string; long?: boolean; group?: string };

export type ModuleDef = {
  key: string;
  label: string;
  icon: IconName;
  phase: string;
  kind: ModuleKind;
  description?: string;
  titleLabel?: string;
  titleOptional?: boolean;
  fields?: FieldDef[];
  subtitle?: string[];
  badge?: string;
  check?: string;
  longText?: string;
  grid?: boolean;
  sum?: { field: string; qty?: string; unit?: string; groupBy?: string };
  sections?: DocSection[];
  budgetCategory?: string;
  types?: string[];
  groupBy?: string[];
};

export const PHASES = [
  { key: "sviluppo", label: "Sviluppo" },
  { key: "pre", label: "Pre-produzione" },
  { key: "set", label: "Set" },
  { key: "post", label: "Post-produzione" },
  { key: "tools", label: "Strumenti" },
];

export const PROJECT_TYPES = ["Film", "Cortometraggio", "Serie TV", "Videoclip", "Social", "Documentario", "Spot"];
export const BUDGET_UNITS = ["Forfait", "Per giorno", "Per ora", "Per settimana", "Per pezzo", "Per progetto"];
// Ordine di produzione: il budget si legge in questo ordine, non alfabetico.
export const BUDGET_CATEGORIE = ["Sopra la linea", "Cast", "Troupe", "Attrezzatura", "Location", "Scenografia", "Costumi", "Trasporti", "Catering", "Post-produzione", "Musica", "Assicurazioni", "Varie"];

// Le prime voci di budget salvavano "Troupe: Alessandro" come titolo: questo
// riconosce quel vecchio prefisso per toglierlo lasciando il solo nome.
export const VECCHIO_PREFISSO = new RegExp(`^(?:${BUDGET_CATEGORIE.join("|")}|Budget)\\s*[:·]\\s*`, "i");
export const PLATFORMS = ["Reel Instagram", "TikTok", "YouTube", "YouTube Shorts", "Stories", "Facebook", "LinkedIn", "Altro"];

const STATUS4 = ["Da fare", "In lavorazione", "Revisione", "Approvato"];
const SCENE_REF: FieldDef = { key: "scena", label: "Scena", type: "ref", ref: "scene" };
// Per-type links: each social content / episode can have its own scenes, moodboard, shots...
const PART_REFS: FieldDef[] = [
  { key: "episodio", label: "Episodio", type: "ref", ref: "episodi", types: ["Serie TV"] },
  { key: "contenuto", label: "Contenuto social", type: "ref", ref: "contenuti", types: ["Social"] },
];
const SERIE = ["Serie TV"];
const SOCIAL = ["Social"];
const RATE: FieldDef[] = [
  { key: "tariffa", label: "Tariffa (€)", type: "number" },
  { key: "unita", label: "Unità tariffa", type: "select", options: BUDGET_UNITS },
  { key: "durata", label: "Per quanti giorni / ore / progetti", type: "number", placeholder: "1" },
  { key: "date", label: "Date di lavoro", type: "daterange", placeholder: "12-15 lug, 20 lug" },
];

export const MODULES: ModuleDef[] = [
  { key: "overview", label: "Panoramica", icon: "view-dashboard-outline", phase: "sviluppo", kind: "overview" },
  {
    key: "contenuti", label: "Contenuti social", icon: "cellphone-play", phase: "sviluppo", kind: "list", types: SOCIAL, titleLabel: "Titolo contenuto",
    description: "Reel, TikTok, YouTube: ognuno con moodboard, scene e shotlist collegate",
    subtitle: ["piattaforma", "formato", "durata", "pubblicazione"], badge: "stato", longText: "hook", groupBy: ["categoria"],
    fields: [
      { key: "categoria", label: "Categoria / Brano / Serie di reel", type: "text", placeholder: "es. Brano 1" },
      { key: "piattaforma", label: "Piattaforma", type: "select", options: PLATFORMS },
      { key: "formato", label: "Formato", type: "select", options: ["9:16", "16:9", "1:1", "4:5"] },
      { key: "durata", label: "Durata", type: "text", placeholder: "0:30" },
      { key: "pubblicazione", label: "Data pubblicazione", type: "date", placeholder: "2026-07-15" },
      { key: "hook", label: "Hook (primi 3 secondi)", type: "multiline" },
      { key: "caption", label: "Caption", type: "multiline" },
      { key: "hashtag", label: "Hashtag", type: "text" },
      { key: "musica", label: "Audio / Trend", type: "text" },
      { key: "stato", label: "Stato", type: "select", options: ["Idea", "Approvato cliente", "In produzione", "Montato", "Pubblicato"] },
    ],
  },
  {
    key: "brief", label: "Brief", icon: "briefcase-outline", phase: "sviluppo", kind: "list", types: ["Social", "Spot"], titleLabel: "Brief",
    description: "Un brief per campagna o per singolo contenuto", subtitle: ["contenuto", "target"], longText: "obiettivo",
    fields: [
      { key: "contenuto", label: "Contenuto social collegato", type: "ref", ref: "contenuti", multi: true },
      { key: "obiettivo", label: "Obiettivo", type: "multiline" },
      { key: "target", label: "Target", type: "text" },
      { key: "messaggio", label: "Messaggio chiave", type: "multiline" },
      { key: "tono", label: "Tono di voce e brand guidelines", type: "multiline" },
      { key: "deliverable", label: "Deliverable e scadenze", type: "multiline" },
    ],
  },
  {
    key: "bibbia", label: "Bibbia della serie", icon: "book-open-variant", phase: "sviluppo", kind: "doc", types: SERIE,
    sections: [
      { key: "premessa", label: "Premessa", hint: "Il motore della serie." },
      { key: "mondo", label: "Mondo e regole" },
      { key: "personaggi", label: "Personaggi principali e archi", long: true },
      { key: "stagione", label: "Arco di stagione", long: true },
      { key: "futuro", label: "Stagioni future" },
    ],
  },
  {
    key: "episodi", label: "Stagioni & episodi", icon: "television-play", phase: "sviluppo", kind: "list", types: SERIE, titleLabel: "Titolo episodio",
    subtitle: ["stagione", "numero", "durata"], badge: "stato", longText: "logline", groupBy: ["stagione"],
    fields: [
      { key: "stagione", label: "Stagione", type: "select", options: ["Stagione 1", "Stagione 2", "Stagione 3", "Stagione 4", "Stagione 5"] },
      { key: "numero", label: "Episodio n.", type: "text", placeholder: "1" },
      { key: "logline", label: "Logline", type: "multiline" },
      { key: "sinossi", label: "Sinossi", type: "multiline" },
      { key: "durata", label: "Durata prevista", type: "text", placeholder: "45'" },
      { key: "regia", label: "Regia", type: "text" },
      { key: "stato", label: "Stato", type: "select", options: ["Scrittura", "Pre-produzione", "Riprese", "Post", "Consegnato"] },
    ],
  },
  {
    key: "brano", label: "Brano", icon: "music-circle-outline", phase: "sviluppo", kind: "doc", types: ["Videoclip"],
    description: "Il brano: info, testo e struttura",
    sections: [
      { key: "titolo", label: "Titolo e artista" },
      { key: "bpm", label: "BPM, durata, tonalità", hint: "es. 96 BPM · 3:42 · La minore" },
      { key: "link", label: "Link audio", hint: "Spotify, SoundCloud, Drive..." },
      { key: "struttura", label: "Struttura", hint: "Intro 0:00 · Strofa 0:12 · Ritornello 0:45 ...", long: true },
      { key: "testo", label: "Testo con timecode", long: true },
      { key: "concept", label: "Concept visivo", long: true },
    ],
  },
  {
    key: "interviste", label: "Interviste", icon: "microphone-outline", phase: "pre", kind: "list", types: ["Documentario"], titleLabel: "Intervistato",
    subtitle: ["ruolo", "data", "location"], check: "liberatoria",
    fields: [
      { key: "ruolo", label: "Ruolo / Chi è", type: "text" },
      { key: "data", label: "Data", type: "date" },
      { key: "location", label: "Location", type: "ref", ref: "location" },
      { key: "domande", label: "Domande", type: "multiline" },
      { key: "liberatoria", label: "Liberatoria firmata", type: "check" },
    ],
  },
  {
    key: "soggetto", label: "Soggetto", icon: "lightbulb-on-outline", phase: "sviluppo", kind: "doc",
    description: "L'idea e la storia in forma narrativa",
    sections: [
      { key: "logline", label: "Logline", hint: "La storia in una o due frasi: chi vuole cosa, e cosa glielo impedisce." },
      { key: "tema", label: "Tema", hint: "Di cosa parla davvero il film, sotto la superficie." },
      { key: "tono", label: "Tono e genere", hint: "Atmosfera, registro, riferimenti." },
      { key: "ambientazione", label: "Ambientazione", hint: "Dove e quando si svolge la storia." },
      { key: "soggetto", label: "Soggetto", hint: "Racconta la storia dall'inizio alla fine, al presente.", long: true },
    ],
  },
  {
    key: "trattamento", label: "Trattamento", icon: "text-box-outline", phase: "sviluppo", kind: "doc",
    description: "La storia sviluppata atto per atto",
    sections: [
      { key: "atto1", label: "Impostazione", group: "Atto I", long: true, hint: "Mondo ordinario, protagonista, equilibrio iniziale." },
      { key: "incidente", label: "Incidente scatenante", group: "Atto I" },
      { key: "svolta1", label: "Primo punto di svolta", group: "Atto I" },
      { key: "atto2", label: "Confronto", group: "Atto II", long: true, hint: "Ostacoli, alleati, nemici, crescita del conflitto." },
      { key: "midpoint", label: "Midpoint", group: "Atto II" },
      { key: "crisi", label: "Crisi / Secondo punto di svolta", group: "Atto II" },
      { key: "atto3", label: "Risoluzione", group: "Atto III", long: true, hint: "Climax e nuovo equilibrio." },
      { key: "climax", label: "Climax", group: "Atto III" },
      { key: "finale", label: "Finale", group: "Atto III" },
    ],
  },
  { key: "sceneggiatura", label: "Sceneggiatura", icon: "script-text-outline", phase: "sviluppo", kind: "screenplay" },
  {
    key: "personaggi", label: "Personaggi", icon: "drama-masks", phase: "sviluppo", kind: "list", titleLabel: "Nome",
    subtitle: ["ruolo", "eta"], badge: "ruolo", longText: "descrizione",
    fields: [
      { key: "ruolo", label: "Ruolo", type: "select", options: ["Protagonista", "Antagonista", "Coprotagonista", "Secondario", "Comparsa"] },
      { key: "eta", label: "Età", type: "text" },
      { key: "descrizione", label: "Descrizione", type: "multiline" },
      { key: "obiettivo", label: "Obiettivo / Bisogno", type: "multiline" },
      { key: "arco", label: "Arco narrativo", type: "multiline" },
    ],
  },
  {
    key: "note", label: "Note", icon: "note-text-outline", phase: "sviluppo", kind: "list", longText: "body", badge: "tag", titleOptional: true,
    fields: [
      { key: "body", label: "Nota", type: "multiline" },
      { key: "tag", label: "Categoria", type: "select", options: ["Idea", "Regia", "Produzione", "Fotografia", "Suono", "Altro"] },
      ...PART_REFS,
      { ...SCENE_REF, label: "Scena collegata" },
    ],
  },
  {
    key: "scene", label: "Scene", icon: "movie-open-outline", phase: "pre", kind: "list", titleLabel: "Intestazione scena",
    description: "Collegate a location, personaggi, shotlist e storyboard",
    subtitle: ["numero", "intext", "momento", "location"], badge: "stato", longText: "sinossi",
    fields: [
      { key: "numero", label: "Numero scena", type: "text", placeholder: "1" },
      ...PART_REFS,
      { key: "sezione", label: "Sezione del brano", type: "select", options: ["Intro", "Strofa", "Pre-ritornello", "Ritornello", "Bridge", "Outro"], types: ["Videoclip"] },
      { key: "intext", label: "INT/EST", type: "select", options: ["INT.", "EST.", "INT./EST."] },
      { key: "momento", label: "Momento", type: "select", options: ["GIORNO", "NOTTE", "ALBA", "TRAMONTO", "CONTINUO"] },
      { key: "location", label: "Location", type: "ref", ref: "location" },
      { key: "personaggi", label: "Personaggi in scena", type: "ref", ref: "personaggi", multi: true },
      { key: "pagine", label: "Pagine (ottavi)", type: "text", placeholder: "1 3/8" },
      { key: "sinossi", label: "Sinossi", type: "multiline" },
      { key: "stato", label: "Stato", type: "select", options: ["Da girare", "Girata", "Tagliata"] },
    ],
  },
  {
    key: "shotlist", label: "Shotlist", icon: "format-list-numbered", phase: "pre", kind: "list", titleLabel: "Inquadratura",
    subtitle: ["scena", "tipo", "movimento", "ottica"], badge: "tipo", check: "girata",
    fields: [
      ...PART_REFS,
      SCENE_REF,
      { key: "tipo", label: "Tipo di campo", type: "select", options: ["ECU", "CU", "MCU", "MS", "MLS", "WS", "EWS", "OTS", "POV", "Insert"] },
      { key: "angolo", label: "Angolazione", type: "select", options: ["Normale", "Plongée", "Contre-plongée", "Dutch", "Dall'alto", "Rasoterra"] },
      { key: "movimento", label: "Movimento", type: "select", options: ["Fisso", "Pan", "Tilt", "Dolly", "Carrello", "Steadicam", "Gimbal", "Spalla", "Drone", "Crane", "Zoom"] },
      { key: "ottica", label: "Ottica", type: "lens" },
      { key: "setup", label: "Setup luci", type: "ref", ref: "luci" },
      { key: "descrizione", label: "Descrizione", type: "multiline" },
      { key: "girata", label: "Girata", type: "check" },
    ],
  },
  { key: "storyboard", label: "Storyboard", icon: "draw", phase: "pre", kind: "storyboard" },
  {
    key: "location", label: "Location", icon: "map-marker-outline", phase: "pre", kind: "list", titleLabel: "Nome location",
    subtitle: ["indirizzo", "contatto"], badge: "permessi", budgetCategory: "Location",
    sum: { field: "tariffa", unit: "unita" },
    fields: [
      { key: "foto", label: "Foto principale", type: "image" },
      { key: "foto2", label: "Foto 2", type: "image" },
      { key: "foto3", label: "Foto 3", type: "image" },
      { key: "indirizzo", label: "Indirizzo / Città", type: "text" },
      { key: "contatto", label: "Referente / Telefono", type: "text" },
      { key: "date", label: "Date di utilizzo", type: "daterange" },
      { key: "tariffa", label: "Costo (€)", type: "number" },
      { key: "unita", label: "Unità", type: "select", options: BUDGET_UNITS },
      { key: "durata", label: "Per quanti giorni / ore", type: "number" },
      { key: "permessi", label: "Permessi", type: "select", options: ["Da richiedere", "Richiesti", "Ottenuti", "Non necessari"] },
      { key: "mappa", label: "Link mappa", type: "url" },
      { key: "note", label: "Note (luce, corrente, parcheggio...)", type: "multiline" },
    ],
  },
  {
    key: "budget", label: "Budget", icon: "cash-multiple", phase: "pre", kind: "list", titleLabel: "Voce",
    subtitle: ["fornitore"], badge: "stato", groupBy: ["categoria"], sum: { field: "importo", qty: "quantita", unit: "unita", groupBy: "categoria" },
    fields: [
      { key: "categoria", label: "Categoria", type: "select", options: BUDGET_CATEGORIE },
      { key: "importo", label: "Costo unitario (€)", type: "number" },
      { key: "unita", label: "Unità", type: "select", options: BUDGET_UNITS },
      { key: "quantita", label: "Quantità (pezzi / persone)", type: "number", placeholder: "1" },
      { key: "durata", label: "Per quanti giorni / ore / settimane / progetti", type: "number", placeholder: "1" },
      { key: "date", label: "Date di utilizzo", type: "daterange" },
      { key: "fornitore", label: "Fornitore / Rental", type: "text" },
      { key: "link", label: "Link articolo sul sito del rental", type: "url" },
      { key: "stato", label: "Stato", type: "select", options: ["Preventivo", "Confermato", "Pagato"] },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "cast", label: "Cast", icon: "account-star-outline", phase: "pre", kind: "list", titleLabel: "Attore / Attrice",
    subtitle: ["personaggio", "telefono"], badge: "stato", budgetCategory: "Cast",
    fields: [
      { key: "foto", label: "Foto", type: "image" },
      { key: "personaggio", label: "Personaggio", type: "ref", ref: "personaggi" },
      { key: "telefono", label: "Telefono", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "agenzia", label: "Agenzia", type: "text" },
      ...RATE,
      { key: "stato", label: "Stato", type: "select", options: ["Provino", "Opzionato", "Confermato"] },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "crew", label: "Troupe", icon: "account-group-outline", phase: "pre", kind: "list", titleLabel: "Nome",
    subtitle: ["ruolo", "reparto", "telefono"], badge: "reparto", budgetCategory: "Troupe",
    fields: [
      { key: "ruolo", label: "Ruolo principale", type: "text", placeholder: "Direttore della fotografia" },
      {
        key: "ruoli",
        label: "Altri ruoli e tariffa per ruolo",
        type: "rows",
        rows: [
          { key: "ruolo", label: "Ruolo", type: "text", placeholder: "Operatore steadicam" },
          { key: "tariffa", label: "Tariffa (€)", type: "number" },
          { key: "unita", label: "Unità", type: "select", options: BUDGET_UNITS },
          { key: "durata", label: "Giorni / ore", type: "number", placeholder: "1" },
        ],
      },
      { key: "reparto", label: "Reparto", type: "select", options: ["Regia", "Produzione", "Fotografia", "Elettricisti", "Macchinisti", "Suono", "Scenografia", "Costumi", "Trucco", "Post"] },
      { key: "telefono", label: "Telefono", type: "text" },
      { key: "email", label: "Email", type: "text" },
      ...RATE,
    ],
  },
  {
    key: "attrezzatura", label: "Attrezzatura", icon: "camera-outline", phase: "pre", kind: "list", titleLabel: "Articolo",
    subtitle: ["categoria", "quantita", "noleggio"], badge: "categoria", check: "pronto", budgetCategory: "Attrezzatura",
    sum: { field: "tariffa", qty: "quantita", unit: "unita", groupBy: "categoria" },
    fields: [
      { key: "categoria", label: "Categoria", type: "select", options: ["Camera", "Ottiche", "Luci", "Grip", "Audio", "Monitor", "Media", "Altro"] },
      { key: "quantita", label: "Quantità", type: "number" },
      { key: "noleggio", label: "Noleggio / Rental", type: "text" },
      { key: "link", label: "Link articolo sul sito del rental", type: "url" },
      { key: "tariffa", label: "Costo unitario (€)", type: "number" },
      { key: "unita", label: "Unità", type: "select", options: BUDGET_UNITS },
      { key: "durata", label: "Per quanti giorni / ore / settimane", type: "number", placeholder: "1" },
      { key: "date", label: "Date di utilizzo", type: "daterange" },
      { key: "pronto", label: "Pronto / Caricato", type: "check" },
    ],
  },
  {
    key: "piano", label: "Piano di lavorazione", icon: "calendar-month-outline", phase: "pre", kind: "list", titleLabel: "Giornata",
    description: "Ordine del giorno: orari, location, scene e persone",
    subtitle: ["data", "convocazione", "inizio", "pranzo", "cena", "fine", "location"], longText: "note",
    fields: [
      { key: "numero", label: "Numero giornata", type: "text", placeholder: "1" },
      { key: "data", label: "Data", type: "date" },

      { key: "convocazione", label: "Convocazione troupe", type: "time" },
      { key: "convocazione_cast", label: "Convocazione cast", type: "time" },
      { key: "inizio", label: "Inizio riprese", type: "time" },
      { key: "pranzo", label: "Pausa pranzo", type: "time" },
      { key: "cena", label: "Pausa cena", type: "time" },
      { key: "fine", label: "Fine giornata", type: "time" },
      { key: "orari_reparti", label: "Orari dei reparti", type: "multiline", placeholder: "Trucco: 07:30\nFonico: 08:00\nElettricisti: 08:15" },

      { key: "location", label: "Location", type: "ref", ref: "location" },
      { key: "ambienti", label: "Ambienti / Set", type: "text", placeholder: "Cucina, salotto, terrazzo" },
      { key: "base", label: "Base / Ritrovo troupe", type: "text", placeholder: "Parcheggio via Roma 3" },
      { key: "parcheggio", label: "Parcheggio e viabilità", type: "text" },
      { key: "meteo", label: "Meteo previsto", type: "text", placeholder: "Sereno, 24°" },
      { key: "alba", label: "Alba", type: "time" },
      { key: "tramonto", label: "Tramonto", type: "time" },

      { key: "scene", label: "Scene del giorno", type: "ref", ref: "scene", multi: true },
      { key: "pagine", label: "Pagine da girare", type: "text", placeholder: "3 4/8" },
      { key: "troupe", label: "Troupe convocata", type: "ref", ref: "crew", multi: true },
      { key: "cast", label: "Cast convocato", type: "ref", ref: "cast", multi: true },
      { key: "comparse", label: "Comparse / Figurazioni", type: "text", placeholder: "6 comparse, 2 figuranti" },
      { key: "fabbisogno", label: "Fabbisogno tecnico e di scena", type: "multiline", placeholder: "Gruppo elettrogeno, automezzo, oggetti di scena, effetti..." },

      { key: "note", label: "Ordine del giorno / Note", type: "multiline" },
      { key: "sicurezza", label: "Note di sicurezza", type: "multiline", placeholder: "Rischi, primo soccorso, viabilità, permessi" },
      { key: "emergenza", label: "Contatto di emergenza in set", type: "text" },
      { key: "ospedale", label: "Ospedale più vicino", type: "text" },
    ],
  },
  {
    key: "moodboard", label: "Moodboard", icon: "image-multiple-outline", phase: "pre", kind: "list", grid: true, titleLabel: "Titolo", titleOptional: true,
    groupBy: ["contenuto", "episodio", "scena"],
    fields: [
      { key: "immagine", label: "Immagine o video", type: "media" },
      ...PART_REFS,
      SCENE_REF,
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "reference", label: "Reference", icon: "bookmark-multiple-outline", phase: "pre", kind: "list", grid: true, titleLabel: "Titolo", titleOptional: true,
    badge: "tipo", groupBy: ["contenuto", "episodio", "scena"],
    fields: [
      { key: "immagine", label: "Immagine o video", type: "media" },
      { key: "tipo", label: "Tipo", type: "select", options: ["Film", "Fotografia", "Viewfinder", "Arte", "Musica", "Video", "Altro"] },
      ...PART_REFS,
      SCENE_REF,
      { key: "link", label: "Link", type: "url" },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  { key: "luci", label: "Diagrammi luce", icon: "lightbulb-group-outline", phase: "pre", kind: "lighting" },
  {
    key: "color", label: "Color & LUT", icon: "palette-outline", phase: "pre", kind: "list", titleLabel: "Look",
    subtitle: ["camera", "lut"], badge: "stato",
    fields: [
      { key: "palette", label: "Palette (HEX separati da virgola)", type: "colors", placeholder: "#1B2A41, #C9A227, #8C1C13" },
      { key: "camera", label: "Camera / Log", type: "text", placeholder: "ARRI LogC4" },
      { key: "lut", label: "LUT", type: "text", placeholder: "Kodak 2383" },
      { key: "scene", label: "Scene con questo look", type: "ref", ref: "scene", multi: true },
      { key: "immagine", label: "Frame di riferimento", type: "image" },
      { key: "stato", label: "Stato", type: "select", options: STATUS4 },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  { key: "slate", label: "Ciak digitale", icon: "movie-open-play-outline", phase: "set", kind: "slate" },
  {
    key: "checklist", label: "Checklist set", icon: "checkbox-marked-outline", phase: "set", kind: "list", titleLabel: "Cosa portare", check: "fatto",
    subtitle: ["categoria", "responsabile"], badge: "categoria",
    fields: [
      { key: "categoria", label: "Categoria", type: "select", options: ["Camera", "Luci", "Audio", "Grip", "Batterie & media", "Documenti", "Costumi", "Trucco", "Catering", "Altro"] },
      { key: "articoli", label: "Attrezzatura collegata", type: "ref", ref: "attrezzatura", multi: true },
      { key: "data_richiesta", label: "Data in cui mi serve", type: "date" },
      { key: "responsabile", label: "Responsabile", type: "ref", ref: "crew" },
      { key: "giornata", label: "Giornata", type: "ref", ref: "piano" },
      { key: "fatto", label: "Caricato", type: "check" },
    ],
  },
  {
    key: "supervisor", label: "Script supervisor", icon: "clipboard-text-outline", phase: "set", kind: "list", titleLabel: "Riferimento", titleOptional: true,
    subtitle: ["scena", "inquadratura", "ciak", "timecode"], badge: "esito", longText: "continuita",
    fields: [
      SCENE_REF,
      { key: "inquadratura", label: "Inquadratura", type: "ref", ref: "shotlist" },
      { key: "ciak", label: "Ciak (take)", type: "text" },
      { key: "timecode", label: "Timecode", type: "text", placeholder: "01:02:03:04" },
      { key: "ottica", label: "Ottica", type: "lens" },
      { key: "esito", label: "Esito", type: "select", options: ["Buona", "Stampa", "NG", "Falso"] },
      { key: "continuita", label: "Note di continuità", type: "multiline" },
      { key: "foto", label: "Foto continuità", type: "image" },
    ],
  },
  { key: "time", label: "Time tracker", icon: "timer-outline", phase: "set", kind: "time" },
  { key: "meteo", label: "Meteo & sole", icon: "weather-partly-cloudy", phase: "set", kind: "weather" },
  {
    key: "vfx", label: "VFX", icon: "auto-fix", phase: "post", kind: "list", titleLabel: "Shot VFX",
    subtitle: ["scena", "tipo", "vendor", "scadenza"], badge: "stato",
    fields: [
      SCENE_REF,
      { key: "inquadratura", label: "Inquadratura", type: "ref", ref: "shotlist" },
      { key: "tipo", label: "Tipo", type: "select", options: ["Green/Blue screen", "Clean-up", "Compositing", "CGI", "Tracking", "Rotoscoping", "Set extension", "Titoli"] },
      { key: "stato", label: "Stato", type: "select", options: STATUS4 },
      { key: "vendor", label: "Artista / Vendor", type: "text" },
      { key: "scadenza", label: "Scadenza", type: "date" },
      { key: "frame", label: "Frame in / out", type: "text" },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "montaggio", label: "Montaggio", icon: "content-cut", phase: "post", kind: "list", titleLabel: "Versione",
    subtitle: ["fase", "durata", "data"], badge: "fase",
    fields: [
      { key: "fase", label: "Fase", type: "select", options: ["Assembly", "Rough cut", "Fine cut", "Picture lock"] },
      { key: "durata", label: "Durata", type: "text", placeholder: "00:14:32" },
      { key: "data", label: "Data", type: "date" },
      { key: "link", label: "Link visione", type: "url" },
      { key: "note", label: "Note / feedback", type: "multiline" },
    ],
  },
  {
    key: "grading", label: "Color grading", icon: "tune-variant", phase: "post", kind: "list", titleLabel: "Sequenza",
    subtitle: ["scena", "look", "lut"], badge: "stato",
    fields: [
      SCENE_REF,
      { key: "look", label: "Look di riferimento", type: "ref", ref: "color" },
      { key: "lut", label: "LUT", type: "text" },
      { key: "stato", label: "Stato", type: "select", options: STATUS4 },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "audio", label: "Suono & musica", icon: "music-note-outline", phase: "post", kind: "list", titleLabel: "Elemento",
    subtitle: ["scena", "tipo"], badge: "stato",
    fields: [
      SCENE_REF,
      { key: "tipo", label: "Tipo", type: "select", options: ["Dialoghi", "ADR", "Foley", "Effetti", "Musica", "Mix"] },
      { key: "stato", label: "Stato", type: "select", options: STATUS4 },
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  {
    key: "consegne", label: "Consegne", icon: "package-variant-closed", phase: "post", kind: "list", titleLabel: "Deliverable",
    subtitle: ["formato", "codec", "scadenza"], check: "consegnato",
    fields: [
      { key: "formato", label: "Formato / Risoluzione", type: "text", placeholder: "DCP 2K Flat" },
      { key: "codec", label: "Codec", type: "text", placeholder: "ProRes 4444" },
      { key: "scadenza", label: "Scadenza", type: "date" },
      { key: "destinatario", label: "Destinatario", type: "text" },
      { key: "consegnato", label: "Consegnato", type: "check" },
    ],
  },
  { key: "viewfinder", label: "Director viewfinder", icon: "camera-metering-center", phase: "tools", kind: "viewfinder" },
  {
    key: "documenti", label: "Documenti & file", icon: "file-document-multiple-outline", phase: "tools", kind: "list", titleLabel: "Nome documento",
    description: "Importa PDF, sceneggiature, soggetti, contratti scritti altrove", subtitle: ["categoria"], badge: "categoria",
    fields: [
      { key: "file", label: "File (PDF, Word, Final Draft, immagini...)", type: "file" },
      { key: "categoria", label: "Categoria", type: "select", options: ["Soggetto", "Trattamento", "Sceneggiatura", "Contratto", "Liberatoria", "Permesso", "Preventivo", "Altro"] },
      { ...SCENE_REF, label: "Scena collegata" },
      ...PART_REFS,
      { key: "note", label: "Note", type: "multiline" },
    ],
  },
  { key: "lens", label: "Lens calculator", icon: "camera-iris", phase: "tools", kind: "lens" },
  { key: "lenses", label: "Le mie ottiche", icon: "database-outline", phase: "tools", kind: "lenses" },
  { key: "persone", label: "Persone", icon: "account-multiple-outline", phase: "tools", kind: "people", description: "La tua rubrica: la troupe che ritrovi in ogni progetto" },
  { key: "formats", label: "Formati", icon: "aspect-ratio", phase: "tools", kind: "formats" },
  { key: "guides", label: "Frame guides", icon: "crop-free", phase: "tools", kind: "guides" },
];

export const moduleByKey = (k: string) => MODULES.find((m) => m.key === k);
export const PROFILES = [
  // compact: the sidebar shows only the featured tools (with a "show all" switch).
  { key: "filmmaker", label: "Regista / Filmmaker", icon: "movie-open-outline", hint: "Tutti gli strumenti, dalla scrittura alla consegna.", compact: false, featured: ["overview", "sceneggiatura", "storyboard", "shotlist", "viewfinder"] },
  { key: "crew", label: "Crew", icon: "account-hard-hat-outline", hint: "Piano di lavorazione, checklist, attrezzatura e strumenti di set in primo piano.", compact: false, featured: ["piano", "checklist", "attrezzatura", "persone", "luci", "slate", "supervisor", "meteo"] },
  { key: "cast", label: "Cast", icon: "drama-masks", hint: "Vista essenziale: i tuoi personaggi, le scene, le convocazioni e il copione.", compact: true, featured: ["overview", "personaggi", "scene", "piano", "sceneggiatura"] },
  { key: "produttore", label: "Produttore", icon: "briefcase-outline", hint: "Budget, piano, cast, crew e consegne sempre a portata di mano.", compact: false, featured: ["budget", "piano", "cast", "crew", "consegne", "documenti"] },
  { key: "cliente", label: "Cliente", icon: "account-tie-outline", hint: "Vista essenziale: brief, contenuti, montaggi e reference da approvare.", compact: true, featured: ["overview", "contenuti", "brief", "montaggio", "reference", "consegne"] },
  { key: "rental", label: "Rental", icon: "warehouse", hint: "Attrezzatura, ottiche, checklist e costi di noleggio.", compact: true, featured: ["overview", "attrezzatura", "lenses", "checklist", "budget"] },
];
export const COUNT_KEY = (k: string) => (k === "slate" ? "slatelog" : k);
export const forType = <T extends { types?: string[] }>(list: T[], projectType: string) => list.filter((x) => !x.types || x.types.includes(projectType));
// Scenes are the unit for most types; social projects revolve around contents.
export const isVideo = (path?: string) => !!path && /\.(mp4|mov|m4v|webm|3gp)$/i.test(path);

export const num = (v: any) => parseFloat(String(v ?? "0").replace(",", ".")) || 0;
export const eur = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Budget line total: unit price x quantity (Forfait / Per progetto count once).
// Unica formula di spesa dell'app: la usano righe del budget, ruoli della
// troupe e export PDF, così i conti non possono divergere.
export function unitTotal(prezzo: number, unita?: string | null, quantita = 1, durata = 1): number {
  if (unita === "Forfait") return prezzo;
  if (unita === "Per progetto") return prezzo * (durata || 1);
  const per = ["Per giorno", "Per ora", "Per settimana"].includes(unita ?? "") ? durata || 1 : 1;
  return prezzo * (quantita || 1) * per;
}

export function lineTotal(def: ModuleDef, data: Record<string, any>) {
  if (!def.sum) return 0;
  const price = num(data[def.sum.field]);
  const unit = def.sum.unit ? data[def.sum.unit] : null;
  const qty = def.sum.qty ? num(data[def.sum.qty]) || 1 : 1;
  return unitTotal(price, unit, qty, num(data.durata) || 1);
}

// ---- ruoli della troupe: ogni ruolo ha la sua tariffa ----------------------
export type Ruolo = { ruolo?: string; tariffa?: any; unita?: string; durata?: any };

export const ruoloVuoto = (): Ruolo => ({ ruolo: "", tariffa: "", unita: "Per giorno", durata: "1" });

// Righe compilate davvero: quelle vuote non sporcano totali e PDF.
export const ruoliDi = (data: Record<string, any>): Ruolo[] =>
  Array.isArray(data?.ruoli) ? (data.ruoli as Ruolo[]).filter((r) => r && (r.ruolo || r.tariffa)) : [];

export const ruoloTotale = (r: Ruolo) => unitTotal(num(r.tariffa), r.unita || "Per giorno", 1, num(r.durata) || 1);

export const ruoliTotale = (data: Record<string, any>) => ruoliDi(data).reduce((t, r) => t + ruoloTotale(r), 0);

// Il vecchio campo era testo libero ("Steadicam: 350€/giorno"): lo si converte
// in righe invece di buttarlo via.
export function parseRoles(text: string): Ruolo[] {
  const UNITA: [RegExp, string][] = [
    [/progett/i, "Per progetto"],
    [/settiman/i, "Per settimana"],
    [/al\s*l['’]?ora|\/?\s*h\b|orari/i, "Per ora"],
    [/giorn|daily/i, "Per giorno"],
  ];

  return String(text ?? "")
    .split(/\n+/)
    .map((riga) => riga.trim())
    .filter(Boolean)
    .map((riga) => {
      // "Steadicam: 350€/giorno" ma anche "Steadicam 350€/giorno" (senza i due punti).
      const separato = /^(.+?)\s*[:\-–—|]\s*(.+)$/.exec(riga);
      const primoNumero = /\d/.exec(riga);
      const ruolo = separato
        ? separato[1].trim()
        : primoNumero
          ? riga.slice(0, primoNumero.index).replace(/[\s\-–—:|,]+$/, "").trim()
          : riga.trim();
      const resto = separato ? separato[2] : primoNumero ? riga.slice(primoNumero.index) : "";
      const cifra = /\d+(?:[.,]\d+)?/.exec(resto);
      const tariffa = cifra ? cifra[0].replace(",", ".") : "";
      const unita = UNITA.find(([re]) => re.test(resto) || re.test(riga))?.[1] ?? "Per giorno";
      const volte = /[×x]\s*(\d+)/.exec(resto)?.[1];

      return { ruolo, tariffa, unita, durata: volte || "1" };
    })
    .filter((r) => r.ruolo);
}

// Cosa deve nascere nel budget quando si preme "Al budget". Per la troupe una
// voce per ruolo: nel budget si legge ogni tariffa, non un totale unico.
export function budgetLines(def: ModuleDef, nome: string, data: Record<string, any>) {
  const persona = nome || "Senza nome";
  const base = {
    categoria: def.budgetCategory ?? "",
    quantita: data.quantita ?? "1",
    date: data.date ?? "",
    link: data.link ?? "",
    fornitore: data.noleggio ?? "",
    stato: "Preventivo",
  };
  // Il titolo non ripete la categoria: quella ha già il suo campo e nel budget
  // fa da gruppo. Resta il nome, con il ruolo solo per la troupe.
  const titolo = (ruolo?: string) => (ruolo ? `${persona} · ${ruolo}` : persona);
  const unica = () => [
    {
      title: def.key === "crew" ? titolo(String(data.ruolo ?? "").trim()) : persona,
      data: {
        ...base,
        importo: data.tariffa ?? "",
        unita: data.unita || (def.key === "crew" || def.key === "cast" ? "Per giorno" : "Forfait"),
        durata: data.durata ?? "1",
      },
    },
  ];

  const righe = def.key === "crew" ? ruoliDi(data).filter((r) => num(r.tariffa) > 0) : [];
  if (!righe.length) return unica();

  const voci = righe.map((r) => ({
    title: titolo(String(r.ruolo ?? "").trim()),
    data: { ...base, importo: r.tariffa, unita: r.unita || "Per giorno", durata: r.durata ?? "1" },
  }));

  if (num(data.tariffa) > 0) {
    voci.unshift({
      title: titolo(String(data.ruolo ?? "").trim() || "Ruolo principale"),
      data: { ...base, importo: data.tariffa, unita: data.unita || "Per giorno", durata: data.durata ?? "1" },
    });
  }

  return voci;
}

// Human readable value of a field, resolving links to other items by title.
export function displayValue(f: FieldDef | undefined, v: any, lookup: Map<string, { title: string }>): string {
  if (v === undefined || v === null || v === "") return "";
  if (f?.type === "ref") {
    const ids: string[] = Array.isArray(v) ? v : [v];
    return ids.map((id) => lookup.get(id)?.title).filter(Boolean).join(", ");
  }
  if (f?.type === "check") return v ? "Sì" : "No";
  if (f?.type === "rows") {
    // Testo scritto dalle versioni precedenti (o dall'assistente): si mostra così com'è.
    if (!Array.isArray(v)) return String(v);

    return (v as Ruolo[])
      .filter((r) => r && (r.ruolo || r.tariffa))
      .map((r) => {
        const prezzo = num(r.tariffa);
        const volte = num(r.durata) > 1 ? ` × ${r.durata}` : "";
        const cifra = prezzo ? `${eur(prezzo)}${volte} ${(r.unita || "").toLowerCase()}`.trim() : "tariffa da definire";
        return `${r.ruolo || "Ruolo"}: ${cifra}`;
      })
      .join(" · ");
  }
  return String(v);
}

// Items in other modules that link to `id` through a ref field.
export function backlinks<T extends { id: string; module: string; data: Record<string, any> }>(id: string, all: T[]): T[] {
  return all.filter((it) => {
    const def = moduleByKey(it.module);
    const refFields = (def?.fields ?? []).filter((f) => f.type === "ref").map((f) => f.key);
    if (it.module === "storyboard") refFields.push("scena", "shot", "contenuto", "episodio");
    if (it.module === "sceneggiatura") refFields.push("parte");
    if (it.module === "luci") refFields.push("location", "scene", "attrezzatura");
    return it.id !== id && refFields.some((k) => (Array.isArray(it.data[k]) ? it.data[k].includes(id) : it.data[k] === id));
  });
}

const MAX_CAMPI_ASSISTENTE = 26;

// Cosa l'assistente può compilare in un progetto: moduli, sezioni dei documenti
// (soggetto, trattamento...) e campi delle liste (personaggi, scene...).
// Una sola copia, condivisa dalla chat dentro il progetto e da quella globale:
// due copie diverse finirebbero per divergere e l'assistente scriverebbe in un
// modo da una finestra e in un altro dall'altra.
export function strutturaPer(project: { type: string; modules?: string[] }) {
  return MODULES.filter((m) => !m.types || m.types.includes(project.type) || (project.modules ?? []).includes(m.key))
    .filter((m) => m.kind === "doc" || m.kind === "list")
    .map((m) => ({
      modulo: m.key,
      etichetta: m.label,
      tipo: m.kind,
      sezioni: (m.sections ?? []).map((sec) => ({ key: sec.key, label: sec.label })),
      campi: (m.fields ?? []).slice(0, MAX_CAMPI_ASSISTENTE).map((f) => ({ key: f.key, label: f.label, tipo: f.type })),
    }));
}
