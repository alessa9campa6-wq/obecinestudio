import { Article } from "../types";

export const ATTREZZATURA_ARTICLES: Article[] = [
  {
    id: "tipologie-cineprese",
    slug: "tipologie-cineprese",
    title: "Tipologie di cineprese",
    subtitle: "Cinema, broadcast, mirrorless, action cam.",
    categoryId: "attrezzatura",
    subcategoryId: "camere",
    difficulty: "principiante",
    shortDescription: "Categorie di cineprese e campi d'uso.",
    keywords: ["cinepresa", "camera", "cinema", "broadcast", "mirrorless"],
    synonyms: ["camera types", "cinema camera", "broadcast camera"],
    content: {
      principiante:
        "Le cineprese si dividono in: cinema (ARRI, RED, Sony Venice) con sensori grandi e RAW; broadcast (Sony HDC, Panasonic) per TV live; cinema/mirrorless (Sony FX, Canon C, Panasonic S) ibride; action cam (GoPro) per riprese estreme.",
      intermedio:
        "La scelta dipende dal budget, dal delivery e dal workflow. Le camere cinema richiedono crew e post pesante. Le mirrorless sono versatili e economiche. Le action cam sono complementari.",
      avanzato:
        "Il mercato evolve rapidamente: le mirrorless raggiungono qualità cinema. La scelta va fatta in base al progetto, non alla moda. Il noleggio permette di testare prima dell'acquisto.",
    },
    related: ["sensori-crop", "mount", "codec-video"],
    sources: [{ title: "Manufacturer documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "sensori-crop",
    slug: "sensori-crop-factor",
    title: "Sensori e crop factor",
    subtitle: "Full Frame, Super 35, APS-C, Micro Four Thirds.",
    categoryId: "attrezzatura",
    subcategoryId: "sensori",
    difficulty: "intermedio",
    shortDescription: "Dimensioni sensore e crop factor.",
    keywords: ["crop factor", "full frame", "super 35", "APS-C", "MFT"],
    synonyms: ["crop factor", "sensor size", "full frame", "Super 35"],
    content: {
      principiante:
        "I sensori hanno dimensioni diverse: Full Frame (36×24mm, crop 1.0), Super 35 (~24×13.5mm, crop ~1.5), APS-C (~24×16mm, crop ~1.5), Micro Four Thirds (17.3×13mm, crop 2.0). Il crop factor converte la focale equivalente.",
      intermedio:
        "Focale equivalente = focale × crop factor. Un 50mm su S35 = 75mm FF equivalente. Il sensore più grande dà profondità di campo più ridotta e migliore low light. Il sensore più piccolo dà più profondità e ottiche più leggere.",
      avanzato:
        "Il crop factor influenza anche l'angolo di campo e la vignettatura. Le lenti vanno scelte per coprire il sensore. Il 'full frame look' è una preferenza estetica, non una regola.",
    },
    formulas: ["focale equivalente = focale × crop factor"],
    related: ["focal-length", "profondita-di-campo"],
    tool: "crop",
    sources: [{ title: "Camera specifications" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "mount",
    slug: "mount-attacchi",
    title: "Mount (attacchi)",
    subtitle: "PL, EF, E, RF, MFT e adattatori.",
    categoryId: "attrezzatura",
    subcategoryId: "mount",
    difficulty: "principiante",
    shortDescription: "Attacchi obiettivo e compatibilità.",
    keywords: ["mount", "PL", "EF", "E", "RF", "MFT", "adattatore"],
    synonyms: ["lens mount", "PL mount", "EF mount", "RF mount", "MFT"],
    content: {
      principiante:
        "Il mount è l'attacco tra camera e obiettivo. PL (cinema, meccanico robusto), EF (Canon, reflex/cinema), E (Sony, mirrorless), RF (Canon mirrorless), MFT (Panasonic/Olympus). Gli adattatori permettono di usare lenti su mount diversi, con limitazioni (AF, stabilizzazione).",
      intermedio:
        "Il flange distance (distanza sensore-mount) determina la compatibilità degli adattatori: si può adattare un mount con flange più lungo a uno più corto, non viceversa. Le lenti cinema PL sono le più versatili (adattabili a molti mount).",
      avanzato:
        "Il mount influenza anche la trasmissione dati (metadata, AF, stabilizzazione). Le lenti 'native' sfruttano tutte le funzioni; le adattate possono perdere AF/stabilizzazione. In cinema si usano lenti manuali (no AF) su PL.",
    },
    related: ["tipologie-obiettivi", "tipologie-cineprese"],
    sources: [{ title: "Manufacturer documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "tipologie-obiettivi",
    slug: "tipologie-obiettivi",
    title: "Tipologie di obiettivi",
    subtitle: "Prime, zoom, anamorfici, macro, tilt-shift.",
    categoryId: "attrezzatura",
    subcategoryId: "obiettivi",
    difficulty: "principiante",
    shortDescription: "Prime, zoom, anamorfici e speciali.",
    keywords: ["obiettivo", "prime", "zoom", "anamorfico", "macro", "tilt-shift"],
    synonyms: ["lens types", "prime lens", "zoom lens", "anamorphic"],
    content: {
      principiante:
        "Prime (focale fissa): più luminose, più nitide, più leggere. Zoom (focale variabile): versatili, più pesanti. Anamorfici: comprimono l'immagine orizzontalmente (look cinema, flare). Macro: primi piani estremi. Tilt-shift: controllo della prospettiva e del piano di fuoco.",
      intermedio:
        "Le prime cinema hanno diaframma T-stop e messa a fuoco manuale con throw lungo. I zoom cinema mantengono il fuoco durante lo zoom (parfocal). Le lenti anamorfiche richiedono de-squeeze in post.",
      avanzato:
        "La scelta delle lenti è parte del look del film. Le lenti vintage hanno aberrazioni e flare caratteristici. Le lenti moderne sono 'cliniche'. Il set di lenti deve essere coerente (stesso look).",
    },
    related: ["mount", "profondita-di-campo", "bokeh"],
    sources: [{ title: "Lens manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "filtri-nd-cpl",
    slug: "filtri-nd-cpl",
    title: "Filtri ND e CPL",
    subtitle: "Controllo della luce e polarizzazione.",
    categoryId: "attrezzatura",
    subcategoryId: "obiettivi",
    difficulty: "principiante",
    shortDescription: "ND, CPL, variabile ND, effetti.",
    keywords: ["ND", "CPL", "filtro", "polarizzatore", "variabile ND"],
    synonyms: ["ND filter", "CPL", "variable ND", "polarizer"],
    content: {
      principiante:
        "I filtri ND (neutral density) riducono la luce senza alterare il colore, permettendo di usare aperture larghe in pieno sole. I CPL (circular polarizer) riducono i riflessi e saturano il cielo. I variabile ND combinano due polarizzatori per densità regolabile.",
      intermedio:
        "Gli ND si misurano in stop (0.3 = 1 stop, 0.6 = 2 stop, 0.9 = 3 stop). Gli ND ottici di qualità non alterano il colore; i economici possono avere color cast. I VND possono creare 'X' pattern a densità alte.",
      avanzato:
        "Gli ND vanno usati per mantenere l'apertura desiderata e il 180° shutter. I filtri IR (infrared) correggono il color cast IR delle camere. In post si può simulare ma perde qualità.",
    },
    related: ["esposizione", "diaframma"],
    tool: "nd",
    sources: [{ title: "Filter manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "matte-box",
    slug: "matte-box",
    title: "Matte box",
    subtitle: "Paraluce e porta filtri per lenti cinema.",
    categoryId: "attrezzatura",
    subcategoryId: "obiettivi",
    difficulty: "principiante",
    shortDescription: "Matte box, flag, filtri, rod.",
    keywords: ["matte box", "paraluce", "filtro", "flag", "rod"],
    synonyms: ["matte box", "lens hood"],
    content: {
      principiante:
        "Il matte box è un paraluce professionale che blocca la luce parassita (flare) e ospita filtri (ND, CPL, diffusion). Si monta su rod (barre) davanti alla lente.",
      intermedio:
        "I matte box hanno flag (alettoni) regolabili per bloccare la luce. I filtri si inseriscono in slot (4×5.65, 4×4). I matte box 'swing-away' si aprono per cambiare lente rapidamente.",
      avanzato:
        "Il matte box è essenziale per il look cinema (controllo del flare). Va dimensionato per la focale più corta. I filtri di diffusione (Black Pro Mist, Glimmerglass) si usano nel matte box.",
    },
    related: ["filtri-nd-cpl", "follow-focus"],
    sources: [{ title: "Cinema equipment references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "follow-focus",
    slug: "follow-focus",
    title: "Follow focus",
    subtitle: "La messa a fuoco manuale durante il take.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "intermedio",
    shortDescription: "Follow focus, focus puller, marks, wireless.",
    keywords: ["follow focus", "focus puller", "messa a fuoco", "marks", "wireless"],
    synonyms: ["follow focus", "focus pulling", "1st AC"],
    content: {
      principiante:
        "Il follow focus è il meccanismo che permette di cambiare il fuoco durante il take (focus pull). Si monta sulla lente e si aziona con una ruota. Richiede un focus puller (1° AC) dedicato.",
      intermedio:
        "Il focus puller segna le distanze (marks) sulla ruota e segue il soggetto. I sistemi wireless (Preston, Teradek) permettono di operare a distanza. Il 'focus throw' (angolo di rotazione) influenza la precisione.",
      avanzato:
        "Il focus pulling è un'arte: richiede anticipazione e coordinamento con la camera. Il 'deep focus' (tutto a fuoco) riduce la necessità di pull. Le lenti con throw lungo facilitano il pull.",
    },
    related: ["matte-box", "profondita-di-campo"],
    sources: [{ title: "Camera assistant references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "monitor-esterni",
    slug: "monitor-esterni",
    title: "Monitor esterni",
    subtitle: "Monitoring on-set per regista e crew.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "principiante",
    shortDescription: "Monitor on-set, LUT, false color, zebras.",
    keywords: ["monitor", "on-set", "LUT", "false color", "zebras", "waveform"],
    synonyms: ["on-set monitor", "reference monitor"],
    content: {
      principiante:
        "I monitor esterni permettono al regista e alla crew di vedere l'immagine della camera. Vanno calibrati e configurati con LUT, false color, zebras, waveform per valutare l'esposizione e il colore.",
      intermedio:
        "I monitor professionali (SmallHD, Atomos) supportano LUT, HDR, false color. Il 'client monitor' mostra il look finale. Il 'video assist' registra per il regista. La calibrazione è essenziale.",
      avanzato:
        "Il monitoring è parte del workflow colore: il monitor va calibrato (Rec.709/DCI-P3). Le LUT on-set anticipano il grading. Il 'false color' mappa l'esposizione in colori per valutazione rapida.",
    },
    related: ["gamma-log", "esposizione", "waveform-vectorscope"],
    sources: [{ title: "Monitor manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "registratori-esterni",
    slug: "registratori-esterni",
    title: "Registratori esterni",
    subtitle: "Atomos, Blackmagic e registrazione RAW/ProRes.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "intermedio",
    shortDescription: "Registratori esterni, RAW, ProRes, monitor.",
    keywords: ["registratore", "Atomos", "Blackmagic", "RAW", "ProRes"],
    synonyms: ["external recorder", "Atomos", "Ninja", "Shogun"],
    content: {
      principiante:
        "I registratori esterni (Atomos Ninja/Shogun, Blackmagic Video Assist) registrano il segnale HDMI/SDI della camera in ProRes/RAW, superando i limiti interni della camera (codec, bitrate).",
      intermedio:
        "Permettono di registrare ProRes 422/4444 o RAW da camere che registrano solo H.264 internamente. Richiedono SSD veloci e alimentazione. Alcuni sono anche monitor.",
      avanzato:
        "Il registratore esterno va integrato nel workflow: codec, storage, alimentazione. Il 'dual recording' (interno + esterno) è una sicurezza. Il RAW esterno richiede camere compatibili.",
    },
    related: ["codec-video", "ssd", "connessioni-sdi-hdmi"],
    sources: [{ title: "Atomos/Blackmagic documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "gimbal",
    slug: "gimbal",
    title: "Gimbal",
    subtitle: "Stabilizzazione motorizzata a 3 assi.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "principiante",
    shortDescription: "Gimbal, bilanciamento, modalità, limiti.",
    keywords: ["gimbal", "stabilizzazione", "3 assi", "DJI", "Ronin"],
    synonyms: ["gimbal", "3-axis stabilizer", "Ronin", "RS"],
    content: {
      principiante:
        "Il gimbal è una stabilizzazione motorizzata a 3 assi che mantiene la camera livellata durante il movimento. Permette riprese fluide a mano. Richiede bilanciamento preciso.",
      intermedio:
        "Le modalità: follow (segue pan/tilt), lock (mantiene direzione), FPV (rotazioni libere). Il bilanciamento è critico: una camera sbilanciata affatica i motori. Il peso del setup è limitato.",
      avanzato:
        "Il gimbal non sostituisce la steadicam per movimenti complessi. I movimenti devono essere fluidi (camminata 'ninja'). La stabilizzazione elettronica (IBIS) si combina col gimbal.",
    },
    related: ["steadicam", "treppiedi", "movimenti-macchina"],
    sources: [{ title: "DJI/Ronin documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "steadicam",
    slug: "steadicam",
    title: "Steadicam",
    subtitle: "Stabilizzazione meccanica con operatore.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "avanzato",
    shortDescription: "Steadicam, vest, sled, arm, operatore.",
    keywords: ["steadicam", "stabilizzazione", "vest", "sled", "arm"],
    synonyms: ["steadicam", "Steadicam operator"],
    content: {
      principiante:
        "La steadicam è un sistema di stabilizzazione meccanica (vest + arm + sled) che isola la camera dai movimenti dell'operatore, permettendo riprese fluide camminando/correndo/salendo scale.",
      intermedio:
        "Richiede un operatore addestrato (steadicam operator). Il bilanciamento (dynamic balance) è fondamentale. Il sistema è pesante (30-40 kg) e richiede preparazione fisica.",
      avanzato:
        "La steadicam permette movimenti impossibili con gimbal (scale, terreni irregolari). Il 'low mode' (camera sotto) richiede configurazione speciale. Il movimento è parte della regia.",
    },
    related: ["gimbal", "movimenti-macchina"],
    sources: [{ title: "Steadicam operator manuals" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "treppiedi",
    slug: "treppiedi",
    title: "Treppiedi",
    subtitle: "Supporto stabile per camera.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "principiante",
    shortDescription: "Treppiedi, testa fluida, bowl, capacità.",
    keywords: ["treppiedi", "testa fluida", "bowl", "capacità di carico"],
    synonyms: ["tripod", "fluid head", "bowl"],
    content: {
      principiante:
        "Il treppiedi è il supporto base della camera. La testa fluida (fluid head) permette pan/tilt fluidi. Il bowl (semisfera) permette di livellare rapidamente. La capacità di carico va superiore al peso del setup.",
      intermedio:
        "I treppiedi cinema (Sachtler, O'Connor, Miller) hanno testa fluida con drag regolabile. Le gambe in fibra di carbonio sono leggere. Il 'spread' (apertura delle gambe) influenza la stabilità.",
      avanzato:
        "La scelta del treppiedi dipende dal peso del setup e dal tipo di movimento. Un treppiedi sotto-dimensionato causa vibrazioni. Il 'hi-hat' (treppiedi basso) è usato per low angle.",
    },
    related: ["gimbal", "steadicam"],
    sources: [{ title: "Tripod manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "rig-cinematografici",
    slug: "rig-cinematografici",
    title: "Rig cinematografici",
    subtitle: "Cage, rod, shoulder rig, top handle.",
    categoryId: "attrezzatura",
    subcategoryId: "supporti",
    difficulty: "principiante",
    shortDescription: "Rig, cage, rod, shoulder rig, accessori.",
    keywords: ["rig", "cage", "rod", "shoulder rig", "top handle"],
    synonyms: ["camera rig", "cage", "shoulder rig", "rods"],
    content: {
      principiante:
        "Il rig è l'insieme di accessori che trasforma una camera in un sistema cinema: cage (gabbia protettiva), rod (barre 15/19mm), top handle (maniglia), shoulder pad (spallina), follow focus, matte box, monitor.",
      intermedio:
        "I rod 15mm LWS sono standard per accessori leggeri; i 19mm studio per setup pesanti. Il rig va bilanciato per il comfort dell'operatore. I sistemi modulari (SmallRig, Tilta, Vocas) sono versatili.",
      avanzato:
        "Il rig influenza l'ergonomia e il workflow. Un rig troppo pesante affatica; uno troppo leggero vibra. La configurazione va adattata al tipo di ripresa (spalla, gimbal, treppiedi).",
    },
    related: ["follow-focus", "matte-box", "monitor-esterni"],
    sources: [{ title: "Rig manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "batterie-alimentazione",
    slug: "batterie-alimentazione",
    title: "Batterie e alimentazione",
    subtitle: "V-Mount, Gold Mount, NP-F, runtime.",
    categoryId: "attrezzatura",
    subcategoryId: "connessioni",
    difficulty: "principiante",
    shortDescription: "Tipi di batteria, runtime, caricamento.",
    keywords: ["batteria", "V-Mount", "Gold Mount", "NP-F", "runtime", "alimentazione"],
    synonyms: ["battery", "V-Mount", "Gold Mount", "power"],
    content: {
      principiante:
        "Le batterie cinema: V-Mount e Gold Mount (grandi, per camere cinema), NP-F (piccole, per accessori), LP-E6 (mirrorless). Il runtime dipende dal consumo della camera e degli accessori.",
      intermedio:
        "Il consumo si somma: camera + monitor + registratore + wireless. Prevedere il 30% in più. Le batterie vanno caricate e conservate correttamente. I 'power banks' USB-C alimentano accessori.",
      avanzato:
        "La gestione dell'alimentazione è critica sul set: distribuzione, backup, sicurezza. I sistemi di alimentazione centralizzati (D-Tap, LEMO) semplificano. Le batterie Li-ion hanno limiti di trasporto aereo.",
    },
    related: ["schede-memoria", "ssd"],
    tool: "battery",
    sources: [{ title: "Battery manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "schede-memoria",
    slug: "schede-memoria",
    title: "Schede di memoria",
    subtitle: "SD, CFexpress, CFast e velocità.",
    categoryId: "attrezzatura",
    subcategoryId: "connessioni",
    difficulty: "principiante",
    shortDescription: "Tipi di scheda, velocità, capacità, affidabilità.",
    keywords: ["scheda", "SD", "CFexpress", "CFast", "velocità", "capacità"],
    synonyms: ["memory card", "SD card", "CFexpress", "CFast"],
    content: {
      principiante:
        "Le schede di memoria: SD/SDXC (economiche, mirrorless), CFexpress Type A/B (veloci, cinema), CFast 2.0 (cinema). La velocità di scrittura deve superare il bitrate del codec.",
      intermedio:
        "La velocità si misura in MB/s (scrittura sostenuta, non di picco). Le schede V90/V60/V30 garantiscono bitrate minimi. La capacità va scelta in base al bitrate e alla durata.",
      avanzato:
        "Le schede possono fallire: backup su due schede (dual slot) è raccomandato. La formattazione in-camera è preferibile. Le schede hanno vita limitata (cicli di scrittura).",
    },
    related: ["ssd", "codec-video", "bitrate"],
    tool: "storage",
    sources: [{ title: "SD Association specifications" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "ssd",
    slug: "ssd",
    title: "SSD",
    subtitle: "Storage esterno per registrazione e backup.",
    categoryId: "attrezzatura",
    subcategoryId: "connessioni",
    difficulty: "principiante",
    shortDescription: "SSD, velocità, capacità, affidabilità, backup.",
    keywords: ["SSD", "storage", "velocità", "backup", "NVMe"],
    synonyms: ["SSD", "external drive", "NVMe"],
    content: {
      principiante:
        "Gli SSD (solid state drive) sono usati per registrazione RAW (Atomos, Blackmagic) e backup sul set. Più veloci e resistenti degli HDD. Le velocità (500-2000+ MB/s) devono superare il bitrate.",
      intermedio:
        "Gli SSD NVMe sono i più veloci. Il 'sustained write speed' è il parametro critico. Gli SSD hanno vita limitata (TBW). Il backup su due SSD è raccomandato.",
      avanzato:
        "La gestione dello storage sul set: registrazione, backup, trasferimento. Il 'checksum verification' garantisce l'integrità. Gli SSD vanno formattati e testati prima del set.",
    },
    related: ["schede-memoria", "registratori-esterni"],
    sources: [{ title: "SSD manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "connessioni-sdi-hdmi",
    slug: "connessioni-sdi-hdmi",
    title: "Connessioni SDI e HDMI",
    subtitle: "Trasmissione del segnale video.",
    categoryId: "attrezzatura",
    subcategoryId: "connessioni",
    difficulty: "principiante",
    shortDescription: "SDI, HDMI, connettori, lunghezze, conversioni.",
    keywords: ["SDI", "HDMI", "connessione", "segnale", "cavo"],
    synonyms: ["SDI", "HDMI", "video signal", "BNC"],
    content: {
      principiante:
        "L'HDMI è la connessione consumer (fino a 4K, cavi corti). L'SDI è la connessione professionale (BNC, fino a 12G-SDI per 4K, cavi lunghi fino a 100m). L'SDI è più robusto e affidabile sul set.",
      intermedio:
        "Le varianti SDI: HD-SDI (1.5G), 3G-SDI, 6G-SDI, 12G-SDI. Gli adattatori HDMI-SDI convertono. I cavi SDI sono più robusti ma più costosi. L'HDMI è soggetto a disconnessioni.",
      avanzato:
        "La trasmissione del segnale va progettata: lunghezze, conversioni, backup. I sistemi wireless (Teradek, Hollyland) usano HDMI/SDI. Il 'video village' richiede distribuzione del segnale.",
    },
    related: ["trasmissione-wireless", "monitor-esterni"],
    sources: [{ title: "Video engineering references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "trasmissione-wireless",
    slug: "trasmissione-video-wireless",
    title: "Trasmissione video wireless",
    subtitle: "Teradek, Hollyland e sistemi wireless.",
    categoryId: "attrezzatura",
    subcategoryId: "connessioni",
    difficulty: "intermedio",
    shortDescription: "TX/RX wireless, latenza, range, frequenze.",
    keywords: ["wireless", "Teradek", "Hollyland", "TX", "RX", "latenza"],
    synonyms: ["wireless video", "video transmitter", "Teradek"],
    content: {
      principiante:
        "I sistemi wireless trasmettono il segnale video dalla camera al monitor (TX sulla camera, RX sul monitor). Usati per il monitoring del regista e della crew. Range tipico 100-300m.",
      intermedio:
        "La latenza (delay) è il parametro critico: <1 frame per il monitoring, più alta per il focus pull. Le frequenze (5.8GHz, 6GHz) e le interferenze vanno gestite. I sistemi professionali (Teradek) sono più affidabili.",
      avanzato:
        "La trasmissione wireless è parte del workflow: canali, interferenze, backup cablato. I sistemi digitali hanno qualità superiore agli analogici. La sicurezza (crittografia) è rilevante per produzioni sensibili.",
    },
    related: ["connessioni-sdi-hdmi", "monitor-esterni"],
    sources: [{ title: "Teradek/Hollyland documentation" }],
    lastUpdated: "2026-11-14",
  },
];
