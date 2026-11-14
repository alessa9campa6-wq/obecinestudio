import { Article } from "../types";

export const FOTOGRAFIA_ARTICLES: Article[] = [
  {
    id: "esposizione",
    slug: "esposizione",
    title: "Esposizione",
    subtitle: "La quantità di luce che raggiunge il sensore.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "principiante",
    shortDescription: "Triangolo dell'esposizione: apertura, tempo, ISO.",
    keywords: ["esposizione", "triangolo", "apertura", "tempo", "ISO"],
    synonyms: ["exposure", "exposure triangle"],
    content: {
      principiante:
        "L'esposizione è la quantità di luce che colpisce il sensore. Si controlla con tre parametri: apertura (diaframma, f/), tempo di otturazione (shutter speed) e sensibilità (ISO). Aumentare uno richiede di diminuire un altro per mantenere la stessa luminosità.",
      intermedio:
        "L'esposizione si misura in stop: ogni stop raddoppia o dimezza la luce. L'istogramma e lo zebras aiutano a valutare l'esposizione. In video si punta a esporre per gli highlights (evitare il clipping) o per i medi (esposizione 'a destra' per massimizzare il segnale).",
      avanzato:
        "L'esposizione determina il rapporto segnale/rumore e il clipping. In RAW si ha più margine. La 'exposure latitude' del sensore (stop recuperabili) varia per camera. L'esposizione va scelta in funzione del workflow di post (log, RAW, Rec.709).",
    },
    howItWorks: "Luce = apertura × tempo × ISO (in stop).",
    practical: "Usa lo zebras a 95-100% per gli highlights; controlla l'istogramma per non clippare.",
    related: ["diaframma", "iso", "shutter-speed", "shutter-angle", "dynamic-range"],
    diagram: "exposure-triangle",
    tool: "exposure",
    sources: [{ title: "The Filmmaker's Handbook" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "diaframma",
    slug: "diaframma",
    title: "Diaframma",
    subtitle: "L'apertura della lente che regola la luce e la profondità di campo.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "principiante",
    shortDescription: "Apertura f/, T-stop, profondità di campo, bokeh.",
    keywords: ["diaframma", "apertura", "f-stop", "T-stop", "profondità di campo"],
    synonyms: ["aperture", "f-number", "iris", "depth of field"],
    content: {
      principiante:
        "Il diaframma è l'apertura della lente, misurata in f-number (f/1.4, f/2.8, f/5.6, f/11...). Numeri più bassi = apertura più larga = più luce e profondità di campo più ridotta. Numeri più alti = meno luce e più profondità.",
      intermedio:
        "Le lenti cinema usano il T-stop (trasmissione effettiva) invece dell'f-stop (apertura geometrica), più preciso. L'apertura influenza anche il bokeh (sfocato) e le aberrazioni. Ogni stop dimezza/raddoppia la luce.",
      avanzato:
        "L'apertura ottimale (sweet spot) di una lente è tipicamente 2-3 stop sotto la massima apertura. A diaframmi molto chiusi (f/16+) si introduce diffrazione. L'apertura dialoga con la profondità di campo e con il look desiderato.",
    },
    related: ["profondita-di-campo", "bokeh", "esposizione"],
    sources: [{ title: "Optics and Optical Instruments" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "iso",
    slug: "iso",
    title: "ISO",
    subtitle: "La sensibilità del sensore alla luce.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "principiante",
    shortDescription: "Sensibilità, rumore, ISO nativo e dual base.",
    keywords: ["ISO", "sensibilità", "rumore", "gain", "dual base"],
    synonyms: ["ISO sensitivity", "gain", "noise"],
    content: {
      principiante:
        "L'ISO misura la sensibilità del sensore alla luce. ISO più alto = immagine più luminosa ma più rumore. ISO basso = immagine più pulita ma richiede più luce. Si usa il valore più basso compatibile con l'esposizione desiderata.",
      intermedio:
        "Le camere cinema hanno ISO nativo (es. 800) che massimizza il rapporto segnale/rumore. Alcune camere hanno dual base ISO (es. 800/3200) con due circuiti di gain ottimizzati. Sopra il base ISO si introduce rumore; sotto si perde range dinamico (clip degli highlights).",
      avanzato:
        "L'ISO è gain digitale sul segnale del sensore. In RAW l'ISO è metadata (non cambia i dati RAW), ma il monitoring cambia. Il noise floor e il dynamic range dipendono dall'ISO. In post si può 'recuperare' esposizione ma il rumore rimane.",
    },
    related: ["esposizione", "dynamic-range", "sensori-digitali"],
    sources: [{ title: "Camera manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "shutter-speed",
    slug: "shutter-speed",
    title: "Shutter speed",
    subtitle: "Il tempo in cui il sensore è esposto alla luce.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "principiante",
    shortDescription: "Tempo di otturazione e motion blur.",
    keywords: ["shutter speed", "tempo di otturazione", "motion blur", "180°"],
    synonyms: ["shutter speed", "exposure time"],
    content: {
      principiante:
        "Lo shutter speed è il tempo in cui il sensore è esposto alla luce (es. 1/50 s). Tempi più lunghi = più luce e più motion blur (mosso). Tempi più corti = meno luce e immagine più 'scattante'.",
      intermedio:
        "In video la regola del 180° dice: shutter speed = 1/(2×fps) (es. 24fps → 1/48 o 1/50). Questo dà un motion blur naturale. Tempi più corti (1/200) creano effetto 'Saving Private Ryan' (scattante, stroboscopico).",
      avanzato:
        "Lo shutter speed è legato allo shutter angle (angolo dell'otturatore rotante). In digitale è simulato elettronicamente. Tempi troppo corti aumentano il rolling shutter e riducono la luce; tempi troppo lunghi creano motion blur eccessivo. La scelta va fatta in base al look e alla post-produzione.",
    },
    related: ["shutter-angle", "frame-rate", "rolling-shutter"],
    tool: "shutter",
    sources: [{ title: "The Filmmaker's Handbook" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "shutter-angle",
    slug: "shutter-angle",
    title: "Shutter angle",
    subtitle: "L'angolo dell'otturatore rotante e il motion blur.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "intermedio",
    shortDescription: "Shutter angle 180°, 360°, motion blur e look.",
    keywords: ["shutter angle", "angolo otturatore", "motion blur"],
    synonyms: ["shutter angle", "rotary shutter"],
    content: {
      principiante:
        "Lo shutter angle è l'angolo dell'otturatore rotante (in gradi). 360° = sensore sempre esposto (massimo motion blur, massima luce). 180° = metà del tempo (motion blur naturale). 90° = un quarto (immagine scattante).",
      intermedio:
        "La relazione con lo shutter speed: shutter speed = 1/(fps × 360/angle). A 24fps e 180° → 1/48 s. Il 180° è lo standard cinema per motion blur naturale. Angoli più piccoli creano effetto stroboscopico (azione, guerra).",
      avanzato:
        "Lo shutter angle è un parametro creativo: 360° per dream sequence o low light; 45° per effetti speciali o action. In digitale è simulato; alcune camere permettono shutter angle variabile. Va considerato con il frame rate e la post-produzione (motion blur sintetico).",
    },
    formulas: ["shutter speed = 1 / (fps × 360 / angle)"],
    related: ["shutter-speed", "frame-rate", "rolling-shutter"],
    tool: "shutter",
    sources: [{ title: "ARRI camera documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "frame-rate",
    slug: "frame-rate",
    title: "Frame rate",
    subtitle: "Il numero di fotogrammi al secondo.",
    categoryId: "fotografia",
    subcategoryId: "esposizione",
    difficulty: "principiante",
    shortDescription: "24fps cinema, 25/30 broadcast, 50/60 sport, slow motion.",
    keywords: ["frame rate", "fps", "24fps", "slow motion", "overcranking"],
    synonyms: ["frames per second", "fps", "overcranking", "undercranking"],
    content: {
      principiante:
        "Il frame rate è il numero di fotogrammi al secondo. 24fps è lo standard cinema (look cinematografico). 25fps (PAL) e 30fps (NTSC) per broadcast. 50/60fps per sport e TV. Frame rate più alto = movimento più fluido ma meno 'cinematografico'.",
      intermedio:
        "Lo slow motion si ottiene girando a frame rate alto (es. 120fps) e riproducendo a 24fps (5x slow). L'overcranking (più fps) rallenta; l'undercranking (meno fps) accelera. Il frame rate va scelto in base al look e al delivery.",
      avanzato:
        "Il frame rate dialoga con lo shutter angle e il motion blur. L'HFR (high frame rate, es. 48fps in 'Lo Hobbit') è controverso. I frame rate variabili (VFR) sono usati in animazione e gaming. Il delivery finale deve essere coerente con il frame rate di progetto.",
    },
    related: ["shutter-speed", "shutter-angle", "slow-motion"],
    tool: "framerate",
    sources: [{ title: "SMPTE standards" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "sensori-digitali",
    slug: "sensori-digitali",
    title: "Sensori digitali",
    subtitle: "CMOS, CCD, dimensioni e caratteristiche.",
    categoryId: "fotografia",
    subcategoryId: "sensore",
    difficulty: "intermedio",
    shortDescription: "Tipi di sensore, dimensioni, rumore, rolling shutter.",
    keywords: ["sensore", "CMOS", "CCD", "full frame", "super 35", "rolling shutter"],
    synonyms: ["image sensor", "CMOS sensor", "CCD", "rolling shutter", "global shutter"],
    content: {
      principiante:
        "Il sensore è il 'film' digitale: converte la luce in segnale elettrico. I sensori moderni sono CMOS (economici, veloci, basso consumo). Il CCD è più vecchio (qualità superiore ma costoso). La dimensione del sensore influisce su profondità di campo, angolo di campo e rumore.",
      intermedio:
        "Le dimensioni comuni: Full Frame (36×24mm), Super 35 (~24×13.5mm), APS-C, Micro Four Thirds (17.3×13mm). Un sensore più grande = profondità di campo più ridotta e migliore performance in bassa luce. Il rolling shutter (lettura riga per riga) causa distorsione con movimenti rapidi; il global shutter (lettura simultanea) la evita.",
      avanzato:
        "Il sensore ha fotositi (pixel) con filtri colore (Bayer) o sensore monocromatico con ruota colore. Il dynamic range è il rapporto tra il segnale massimo e il rumore. La risoluzione (K) non è tutto: il pitch dei pixel e la qualità del filtro colore contano. I sensori moderni raggiungono 14-17 stop di range dinamico.",
    },
    related: ["dynamic-range", "gamma-log", "crop-factor", "rolling-shutter"],
    diagram: "sensor-sizes",
    sources: [{ title: "Image Sensors and Signal Processing for Digital Still Cameras" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "dynamic-range",
    slug: "dynamic-range",
    title: "Dynamic range",
    subtitle: "Il range di luminosità catturabile dal sensore.",
    categoryId: "fotografia",
    subcategoryId: "sensore",
    difficulty: "intermedio",
    shortDescription: "Stop di range dinamico, highlights, shadows, noise floor.",
    keywords: ["dynamic range", "range dinamico", "stop", "highlights", "shadows"],
    synonyms: ["dynamic range", "latitude"],
    content: {
      principiante:
        "Il dynamic range è il range di luminosità che il sensore può catturare, misurato in stop. Un sensore con 14 stop cattura sia le ombre profonde sia le luci intense. Più stop = più flessibilità in post.",
      intermedio:
        "Il dynamic range si divide in highlights (luci) e shadows (ombre). Le camere cinema allocano più stop agli highlights (es. +6 sopra il grigio medio) per evitare il clipping. Il noise floor limita le ombre recuperabili.",
      avanzato:
        "Il dynamic range misurato (SNR=1) differisce da quello percepito. In log si preserva il range; in Rec.709 si comprime. L'esposizione va scelta per massimizzare il segnale utile (expose to the right) senza clippare.",
    },
    related: ["gamma-log", "esposizione", "iso"],
    sources: [{ title: "ARRI white papers" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "gamma-log",
    slug: "gamma-log",
    title: "Gamma Log",
    subtitle: "Le curve logaritmiche per preservare il range dinamico.",
    categoryId: "fotografia",
    subcategoryId: "colore",
    difficulty: "intermedio",
    shortDescription: "S-Log, C-Log, V-Log, BRAW, RAW e grading.",
    keywords: ["log", "S-Log", "C-Log", "V-Log", "gamma", "grading"],
    synonyms: ["log gamma", "log profile", "S-Log3", "C-Log3", "V-Log"],
    content: {
      principiante:
        "I profili log (S-Log, C-Log, V-Log) applicano una curva logaritmica che comprime il range dinamico in un contenitore a 10 bit, preservando più informazione per il grading. L'immagine appare 'piatta' e a basso contrasto.",
      intermedio:
        "Ogni produttore ha il suo log (S-Log3 Sony, C-Log3 Canon, V-Log Panasonic, Log-C ARRI). Il log va esposto correttamente (spesso +1-2 stop rispetto a Rec.709). In post si applica una LUT o un CST per convertire in Rec.709/ACES.",
      avanzato:
        "Il log è una codifica non lineare che massimizza l'efficienza dei bit. In RAW il log è un metadata (il sensore registra linear). Il grading richiede conoscenza dei color space e delle transform. Il 'log to linear' è il primo passo del pipeline colore.",
    },
    related: ["spazi-colore", "lut", "color-space-transform", "dynamic-range"],
    sources: [{ title: "Sony/Canon/Panasonic technical documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "spazi-colore",
    slug: "spazi-colore",
    title: "Spazi colore",
    subtitle: "Rec.709, DCI-P3, Rec.2020, ACES e gamut.",
    categoryId: "fotografia",
    subcategoryId: "colore",
    difficulty: "intermedio",
    shortDescription: "Gamut, spazi colore standard e ACES.",
    keywords: ["spazio colore", "gamut", "Rec.709", "DCI-P3", "Rec.2020", "ACES"],
    synonyms: ["color space", "gamut", "Rec.709", "P3", "Rec.2020", "ACES"],
    content: {
      principiante:
        "Lo spazio colore definisce l'insieme dei colori riproducibili. Rec.709 è lo standard HD (TV). DCI-P3 è lo standard cinema (proiettori). Rec.2020 è lo standard UHD/HDR. ACES è un framework unificato per la gestione del colore in produzione.",
      intermedio:
        "Il gamut è il triangolo dei colori primari. Un sensore può catturare più colori di quanti ne possa riprodurre un display. Il color space transform (CST) converte tra spazi. Il grading va fatto in uno spazio ampio (DaVinci Wide Gamut) e poi si converte al delivery.",
      avanzato:
        "La gestione del colore in produzione richiede coerenza tra camera, monitoring e delivery. L'ACES (Academy Color Encoding System) standardizza il workflow. Il 'color management' include input transform, working space, output transform. Gli errori di gestione colore causano shift cromatici.",
    },
    related: ["gamma-log", "lut", "color-space-transform", "aces"],
    diagram: "color-wheel",
    sources: [{ title: "ACES documentation, Academy of Motion Picture Arts and Sciences" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "bilanciamento-bianco",
    slug: "bilanciamento-del-bianco",
    title: "Bilanciamento del bianco",
    subtitle: "Temperatura colore e tint per un bianco neutro.",
    categoryId: "fotografia",
    subcategoryId: "colore",
    difficulty: "principiante",
    shortDescription: "Kelvin, tint, preset, custom WB.",
    keywords: ["bilanciamento del bianco", "WB", "Kelvin", "tint", "temperatura colore"],
    synonyms: ["white balance", "WB", "color temperature", "Kelvin", "tint"],
    content: {
      principiante:
        "Il bilanciamento del bianco rende il bianco neutro sotto diverse luci. Si misura in Kelvin (temperatura colore) e tint (verde/magenta). Preset: 3200K (tungsteno), 5600K (daylight), 6500K (ombra). Il custom WB si fa con una card grigia.",
      intermedio:
        "In video si imposta il WB manualmente per coerenza tra take. Il 'mixed lighting' (luci diverse) richiede gel o correzione in post. In RAW il WB è metadata e si può cambiare in post senza perdita.",
      avanzato:
        "Il WB dialoga con il color grading: un WB intenzionalmente 'sbagliato' può creare look (es. tungsteno per look freddo). La tint (green/magenta) corregge le luci fluorescenti/LED. In post il WB va impostato prima del grading.",
    },
    related: ["temperatura-colore", "spazi-colore"],
    sources: [{ title: "The Filmmaker's Handbook" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "temperatura-colore",
    slug: "temperatura-colore",
    title: "Temperatura colore",
    subtitle: "Il colore della luce misurato in Kelvin.",
    categoryId: "fotografia",
    subcategoryId: "colore",
    difficulty: "principiante",
    shortDescription: "Kelvin, luce calda/fredda, misti.",
    keywords: ["temperatura colore", "Kelvin", "luce calda", "luce fredda"],
    synonyms: ["color temperature", "Kelvin", "warm/cool light"],
    content: {
      principiante:
        "La temperatura colore misura il colore della luce in Kelvin (K). Bassi K = luce calda (arancione, candela ~1900K, tungsteno ~3200K). Alti K = luce fredda (blu, daylight ~5600K, ombra ~7000K+).",
      intermedio:
        "Le luci si classificano per temperatura: tungsteno 3200K, HMI/daylight 5600K, LED bi-color 2700-6500K. Il 'mixed lighting' (es. interni tungsteno + finestra daylight) crea contrasto caldo/freddo, usato drammaticamente.",
      avanzato:
        "La temperatura colore non descrive il CRI/TLCI (qualità spettrale). Due luci a 5600K possono avere spettri diversi. In post si corregge il WB ma la qualità spettrale (colori saturi) non si recupera.",
    },
    related: ["bilanciamento-del-bianco", "cri-tlci"],
    sources: [{ title: "Lighting for Digital Video and Television" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "profondita-di-campo",
    slug: "profondita-di-campo",
    title: "Profondità di campo",
    subtitle: "Il range di distanza a fuoco nell'immagine.",
    categoryId: "fotografia",
    subcategoryId: "ottica",
    difficulty: "intermedio",
    shortDescription: "DoF, apertura, focale, distanza soggetto, sensore.",
    keywords: ["profondità di campo", "DoF", "sfocato", "bokeh", "iperfocale"],
    synonyms: ["depth of field", "DoF", "bokeh", "hyperfocal"],
    content: {
      principiante:
        "La profondità di campo è il range di distanza a fuoco. Ridotta (sfondo sfocato) con apertura larga, focale lunga, soggetto vicino, sensore grande. Ampia (tutto a fuoco) con apertura chiusa, focale corta, soggetto lontano, sensore piccolo.",
      intermedio:
        "La DoF dipende da: apertura (f/), focale, distanza soggetto, dimensione sensore. Si calcola con la formula della DoF (circolo di confusione). L'iperfocale è la distanza minima per avere tutto a fuoco dall'iperfocale all'infinito.",
      avanzato:
        "La DoF è un effetto ottico: la 'nitidezza' è soggettiva (circolo di confusione). In cinema si preferisce la DoF ridotta per isolare il soggetto. Il 'focus pull' (cambio fuoco durante il take) è una tecnica narrativa. La DoF va considerata con il T-stop e la distanza.",
    },
    formulas: ["DoF ≈ (2 × N × c × s²) / f²  (approssimazione)"],
    related: ["diaframma", "bokeh", "focal-length", "crop-factor"],
    tool: "dof",
    sources: [{ title: "Depth of Field in Motion Picture Photography" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "bokeh",
    slug: "bokeh",
    title: "Bokeh",
    subtitle: "La qualità dello sfocato fuori fuoco.",
    categoryId: "fotografia",
    subcategoryId: "ottica",
    difficulty: "intermedio",
    shortDescription: "Bokeh, forma del diaframma, aberrazioni, look.",
    keywords: ["bokeh", "sfocato", "qualità", "diaframma"],
    synonyms: ["bokeh", "out of focus", "blur quality"],
    content: {
      principiante:
        "Il bokeh è la qualità estetica dello sfocato (parti fuori fuoco dell'immagine). Un bokeh 'piacevole' è morbido e uniforme; uno 'duro' ha bordi netti e anelli. Dipende dalla forma del diaframma, dalle aberrazioni e dal design della lente.",
      intermedio:
        "Le lame del diaframma (numero e forma) influenzano il bokeh: più lame = più rotondo. Le lenti anamorfiche producono bokeh ovale. Le aberrazioni sferiche creano 'swirly bokeh' (es. Helios 44-2).",
      avanzato:
        "Il bokeh è un criterio di scelta delle lenti per il look. Le lenti moderne minimizzano le aberrazioni (bokeh 'clinico'); quelle vintage le esaltano. In post si può simulare il bokeh ma perde naturalezza.",
    },
    related: ["profondita-di-campo", "distorsione-ottica", "aberrazioni-cromatiche"],
    sources: [{ title: "Lens design references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "focal-length",
    slug: "focal-length",
    title: "Focal length",
    subtitle: "La distanza focale e il suo effetto sull'immagine.",
    categoryId: "fotografia",
    subcategoryId: "ottica",
    difficulty: "principiante",
    shortDescription: "Focale, angolo di campo, compressione, prospettiva.",
    keywords: ["focale", "lunghezza focale", "angolo di campo", "compressione", "prospettiva"],
    synonyms: ["focal length", "focal length equivalent", "field of view", "FOV"],
    content: {
      principiante:
        "La focal length (in mm) determina l'angolo di campo: focale corta (wide, es. 24mm) = campo ampio; focale lunga (tele, es. 85mm) = campo stretto. La focale influenza anche la prospettiva apparente: focale lunga comprime, corta dilata.",
      intermedio:
        "La focale equivalente dipende dal crop factor del sensore. La prospettiva reale dipende dalla distanza soggetto, non dalla focale; la focale cambia la dimensione del soggetto nel fotogramma. Il 'look' di una focale è legato alla distanza.",
      avanzato:
        "In cinema si usano focali 'normali' (35-50mm FF equivalente) per un look naturale. Focali estreme (fisheye, super-tele) sono stilistiche. La scelta della focale dialoga con il blocking e la composizione.",
    },
    related: ["crop-factor", "profondita-di-campo", "mount"],
    tool: "focale",
    sources: [{ title: "Optics references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "distorsione-ottica",
    slug: "distorsione-ottica",
    title: "Distorsione ottica",
    subtitle: "Barrel, pincushion e mustache distortion.",
    categoryId: "fotografia",
    subcategoryId: "ottica",
    difficulty: "intermedio",
    shortDescription: "Tipi di distorsione e correzione.",
    keywords: ["distorsione", "barrel", "pincushion", "mustache"],
    synonyms: ["distortion", "barrel distortion", "pincushion"],
    content: {
      principiante:
        "La distorsione è la deformazione geometrica dell'immagine. Barrel (a botte): linee dritte incurvate verso l'esterno (tipico di wide). Pincushion (a cuscinetto): linee incurvate verso l'interno (tipico di tele). Mustache: combinazione.",
      intermedio:
        "La distorsione dipende dalla focale e dal design della lente. Le lenti cinema minimizzano la distorsione. In post si corregge con profili (Lens Correction). Le lenti anamorfiche hanno distorsione caratteristica.",
      avanzato:
        "La distorsione è parte del look: le lenti vintage la esaltano. La correzione in post riduce il campo utile (crop). In VFX la distorsione va misurata (lens grid) per il matchmoving.",
    },
    related: ["aberrazioni-cromatiche", "focal-length"],
    sources: [{ title: "Lens design references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "aberrazioni-cromatiche",
    slug: "aberrazioni-cromatiche",
    title: "Aberrazioni cromatiche",
    subtitle: "Frangiture di colore ai bordi ad alto contrasto.",
    categoryId: "fotografia",
    subcategoryId: "ottica",
    difficulty: "intermedio",
    shortDescription: "CA, aberrazione sferica, coma, astigmatismo.",
    keywords: ["aberrazione cromatica", "CA", "frangiture", "coma", "astigmatismo"],
    synonyms: ["chromatic aberration", "CA", "spherical aberration"],
    content: {
      principiante:
        "L'aberrazione cromatica (CA) è la frangitura di colore (viola/verde) ai bordi ad alto contrasto. È un difetto ottico: le diverse lunghezze d'onda focalizzano in punti diversi.",
      intermedio:
        "Si riduce con lenti apocromatiche (APO) e vetri speciali. In post si corregge con la rimozione CA. Le aberrazioni sferiche, il coma e l'astigmatismo influenzano il bokeh e la nitidezza ai bordi.",
      avanzato:
        "Le aberrazioni sono parte del look: le lenti vintage le esaltano per un look 'organico'. Le lenti moderne le minimizzano per un look 'clinico'. La scelta è estetica, non solo tecnica.",
    },
    related: ["distorsione-ottica", "bokeh"],
    sources: [{ title: "Optics references" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "rolling-shutter",
    slug: "rolling-shutter",
    title: "Rolling shutter",
    subtitle: "La distorsione da lettura riga per riga del sensore.",
    categoryId: "fotografia",
    subcategoryId: "sensore",
    difficulty: "intermedio",
    shortDescription: "Rolling shutter, skew, wobble, global shutter.",
    keywords: ["rolling shutter", "skew", "wobble", "global shutter"],
    synonyms: ["rolling shutter", "skew", "jello effect"],
    content: {
      principiante:
        "Il rolling shutter legge il sensore riga per riga (dall'alto verso il basso). Con movimenti rapidi o flash, l'immagine si deforma ('skew', 'wobble'/'jello'). Il global shutter legge tutto contemporaneamente, evitando la distorsione.",
      intermedio:
        "L'entità del rolling shutter dipende dalla velocità di lettura del sensore (readout speed). Camere cinema moderne hanno readout veloce. Per ridurlo: movimenti più lenti, shutter speed più lungo, o camera con global shutter.",
      avanzato:
        "Il rolling shutter è un compromesso del CMOS. In VFX va misurato per il matchmoving. Alcuni effetti (rotazione eliche, flash) sono problematici. Il global shutter è in arrivo su camere consumer/pro.",
    },
    related: ["sensori-digitali", "shutter-speed"],
    sources: [{ title: "Sensor technical documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "codec-video",
    slug: "codec-video",
    title: "Codec video",
    subtitle: "Compressione e formati di registrazione.",
    categoryId: "fotografia",
    subcategoryId: "codec",
    difficulty: "intermedio",
    shortDescription: "ProRes, RAW, H.264/265, BRAW, REDCODE, X-OCN.",
    keywords: ["codec", "ProRes", "RAW", "H.264", "H.265", "BRAW", "REDCODE"],
    synonyms: ["video codec", "compression", "ProRes", "RAW"],
    content: {
      principiante:
        "Il codec comprime il video per ridurre lo spazio. I codec 'intra-frame' (ProRes, DNxHR) comprimono ogni fotogramma separatamente (più pesanti, più facili da montare). I codec 'inter-frame' (H.264/265) comprimono tra fotogrammi (più leggeri, più pesanti da montare).",
      intermedio:
        "I codec RAW (REDCODE, BRAW, ARRIRAW, X-OCN) registrano i dati del sensore senza debayering, massima flessibilità in post ma file enormi. I codec intermedi (ProRes 422/4444, DNxHR) bilanciano qualità e peso. La scelta dipende dal workflow e dallo storage.",
      avanzato:
        "Il codec influenza il grading, il VFX e il delivery. I codec RAW richiedono computer potenti. Il 'proxy workflow' usa copie leggere per il montaggio e ricompone con i file originali. Il delivery finale usa codec lossy (H.264/265) ottimizzati per la piattaforma.",
    },
    related: ["bitrate", "chroma-subsampling", "raw-compressione"],
    sources: [{ title: "Apple/Blackmagic/RED documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "bitrate",
    slug: "bitrate",
    title: "Bitrate",
    subtitle: "La quantità di dati per secondo del video.",
    categoryId: "fotografia",
    subcategoryId: "codec",
    difficulty: "intermedio",
    shortDescription: "Bitrate, qualità, storage, VBR/CBR.",
    keywords: ["bitrate", "Mbps", "qualità", "storage"],
    synonyms: ["bit rate", "data rate", "Mbps"],
    content: {
      principiante:
        "Il bitrate è la quantità di dati per secondo (Mbps). Più alto = più qualità e più spazio su disco. Il bitrate va scelto in base al codec, alla risoluzione e al delivery.",
      intermedio:
        "CBR (constant bitrate) mantiene il bitrate fisso; VBR (variable) lo adatta alla complessità della scena. I codec RAW hanno bitrate variabile alto. Il delivery (YouTube, TV) ha limiti di bitrate.",
      avanzato:
        "Il bitrate dialoga con il chroma subsampling e la risoluzione. Un bitrate troppo basso causa artefatti (blocking, banding). Il 'target bitrate' del delivery è specifico della piattaforma.",
    },
    related: ["codec-video", "chroma-subsampling"],
    sources: [{ title: "Streaming platform specs" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "raw-compressione",
    slug: "raw-compressione",
    title: "RAW e compressione",
    subtitle: "Dati grezzi del sensore vs. compressione.",
    categoryId: "fotografia",
    subcategoryId: "codec",
    difficulty: "intermedio",
    shortDescription: "RAW, compressed RAW, debayering, flessibilità.",
    keywords: ["RAW", "compressed RAW", "debayering", "flessibilità"],
    synonyms: ["RAW video", "compressed RAW", "BRAW", "REDCODE"],
    content: {
      principiante:
        "Il RAW registra i dati grezzi del sensore senza elaborazione (debayering, WB, gamma). Massima flessibilità in post ma file enormi e workflow pesante.",
      intermedio:
        "I RAW compressi (BRAW, REDCODE, ProRes RAW) bilanciano qualità e peso. Il debayering avviene in post. Il RAW è 'non distruttivo': si può cambiare WB, ISO, gamma senza perdita.",
      avanzato:
        "Il RAW non è 'magico': il dynamic range è quello del sensore. Il noise floor e la qualità spettrale sono fissi. Il workflow RAW richiede computer potenti e storage veloce. La scelta RAW vs. log dipende dal budget e dal delivery.",
    },
    related: ["codec-video", "gamma-log", "spazi-colore"],
    sources: [{ title: "Camera manufacturers' documentation" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "chroma-subsampling",
    slug: "chroma-subsampling",
    title: "Chroma subsampling",
    subtitle: "La riduzione della risoluzione del colore.",
    categoryId: "fotografia",
    subcategoryId: "codec",
    difficulty: "intermedio",
    shortDescription: "4:4:4, 4:2:2, 4:2:0 e impatto sul grading.",
    keywords: ["chroma subsampling", "4:4:4", "4:2:2", "4:2:0", "color"],
    synonyms: ["chroma subsampling", "4:2:2", "4:2:0"],
    content: {
      principiante:
        "Il chroma subsampling riduce la risoluzione del colore rispetto alla luminanza. 4:4:4 = colore pieno. 4:2:2 = colore dimezzato orizzontalmente. 4:2:0 = colore dimezzato in entrambe le direzioni (tipico di delivery).",
      intermedio:
        "Per il grading si preferisce 4:4:4 o 4:2:2 (più margine). Per il delivery 4:2:0 è standard (H.264/265). Il chroma subsampling influenza il keying (green screen) e i titoli.",
      avanzato:
        "Il chroma subsampling è un compromesso qualità/peso. In VFX si richiede 4:4:4. Il 'chroma keying' su 4:2:0 è problematico. Il workflow di post va progettato in base al chroma subsampling.",
    },
    related: ["codec-video", "color-correction"],
    sources: [{ title: "Video engineering references" }],
    lastUpdated: "2026-11-14",
  },
];
