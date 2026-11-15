import type { Article } from "../../types";
import { FIG_BOOM } from "./figures";

export const MANUALE_AUDIO: Article = {
  id: "manuale-audio",
  slug: "manuale-audio",
  title: "Manuale di audio e presa diretta",
  subtitle: "Microfoni, livelli, timecode e post-produzione sonora.",
  categoryId: "audio",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sul suono: scelta dei microfoni, posizionamento, gain staging, sample rate, timecode, room tone e catena di post.",
  keywords: ["manuale", "audio", "microfono", "gain staging", "timecode", "room tone"],
  synonyms: ["production sound", "sound recording", "audio post"],
  content: {
    principiante:
      "Il suono è metà del film e quasi sempre la metà dimenticata. Lo spettatore perdona un'immagine morbida, non perdona un dialogo incomprensibile. La regola è semplice: microfono vicino alla bocca, livelli senza clipping, ambiente registrato.",
    intermedio:
      "Una presa diretta si costruisce con tre elementi: il microfono giusto per la scena, un preamplificatore silenzioso e una sincronizzazione affidabile. Il resto è organizzazione: sapere quale take è buono e dove si trova.",
    avanzato:
      "La qualità del suono in post dipende da ciò che è stato registrato sul set. Nessun plug-in ricostruisce un dialogo coperto dal rumore. Il lavoro del sound recordist è prevedere i problemi: rumore di fondo, riverbero, frequenze radio occupate.",
  },
  inDepth: [
    {
      title: "Microfoni: direzionalità prima di tutto",
      body:
        "Il pattern polare descrive da dove il microfono 'sente'. Omnidirezionale prende tutto intorno, compreso l'ambiente: è naturale ma poco selettivo. Cardioide prende davanti e rifiuta dietro. Supercardioide e ipercardioide restringono ancora il lobo frontale e aggiungono un lobo posteriore. Il fucile (shotgun) è un interferenza a tubo che aumenta la direttività sulle alte frequenze.\n\nNel cinema si usano tre famiglie: lo shotgun su asta per il dialogo in esterni e interni ampi, il lavalier per le scene con movimento o quando l'asta non entra, il microfono panoramico o i plant mic per ambienti e scene complesse. Il tipo di capsula conta più del prezzo: un condensatore a piccolo diaframma con buon rapporto segnale/rumore batte un modello blasonato mal posizionato.\n\nLa direttività non è 'zoom': un fucile lontano cattura più riverbero e meno voce. La distanza resta il fattore più importante.",
    },
    {
      title: "Posizionamento: dove metti il microfono",
      body:
        "Per il dialogo la posizione ideale è fuori campo, appena sopra la testa dell'attore, inclinata verso la bocca: 30-40 cm in interni trattati, 50-60 in esterni. Più vicino significa più voce e meno ambiente; più lontano significa più riverbero e più rumore. Il boom operator deve muoversi con l'attore senza entrare nel quadro e senza proiettare ombre.\n\nIl lavalier si nasconde nei vestiti, ma il tessuto che sfrega produce rumore: si usa nastro, feltro, gommapiuma e un 'tunnel' di tessuto. La posizione sul petto è standard; sotto il colletto suona più cupo; sull'attaccatura della camicia è più naturale. Va sempre verificato con le cuffie, non a occhio.\n\nIn una scena con due attori si registra su due canali separati, non su un mix: in post la separazione vale oro.",
    },
    {
      title: "Livelli, headroom e il gain staging",
      body:
        "Il gain staging è la gestione dei livelli lungo la catena: microfono, preamplificatore, convertitore, registrazione. L'obiettivo è un segnale forte ma con margine. In pratica si impostano i picchi del dialogo intorno a -12/-10 dBFS, lasciando 10 dB di headroom per gli imprevisti (un colpo di tosse, una risata).\n\nIl clipping digitale è irreversibile: un picco oltre 0 dBFS produce distorsione che non si corregge. Il rumore, invece, si accumula: ogni stadio con guadagno alto aggiunge il proprio rumore di fondo. Per questo si alza il gain il prima possibile nella catena e si tiene basso il resto.\n\nIl registratore a 32 bit float elimina il rischio di clipping in registrazione, ma non il rischio di un microfono saturo o di un preamplificatore in overload. La tecnologia aiuta, non sostituisce l'attenzione.",
    },
    {
      title: "Sample rate, bit depth e formati",
      body:
        "48 kHz è lo standard per il video: copre fino a 24 kHz, sufficiente per l'udito umano e coerente con il frame rate. 96 kHz si usa per sound design e registrazioni destinate al pitch shift estremo, non per il dialogo. Registrare a 44,1 kHz per un progetto video crea un resampling inutile.\n\n24 bit è lo standard di produzione: offre 144 dB di dinamica teorica e rende il gain staging molto tollerante. Il 16 bit (96 dB) è il formato di consegna per il CD e per alcune piattaforme, non quello di registrazione. Il 32 bit float è utile quando il livello è imprevedibile.\n\nIl formato file conta meno del flusso di lavoro: WAV non compresso per la registrazione, BWF con metadati di timecode per la post. Gli MP3 registrati sul set sono da evitare.",
    },
    {
      title: "Timecode e sincronizzazione",
      body:
        "Il timecode è un codice orario (ore:minuti:secondi:fotogrammi) che permette di allineare in automatico audio e video. Si può generare dalla camera, da un registratore o da un piccolo generatore wireless. I sistemi moderni (Tentacle Sync, Deity, UltraSync) sincronizzano più dispositivi senza cavi.\n\nIl 'jam sync' consiste nel far leggere lo stesso timecode a tutti i dispositivi all'inizio della giornata. Il 'free run' fa avanzare il timecode anche a camera spenta. Se il timecode non è disponibile, resta il ciak: il battito delle mani o del ciak va registrato da entrambi i dispositivi e serve da riferimento visivo e sonoro.\n\nLa sincronizzazione non è un dettaglio da post: un timecode sbagliato significa allineare a mano centinaia di clip, e in un documentario può costare giorni.",
    },
    {
      title: "Room tone, wild track e materiale di scorta",
      body:
        "Il room tone è il suono dell'ambiente senza dialoghi, registrato 30-60 secondi per ogni location e configurazione di microfono. Serve a riempire i vuoti tra un take e l'altro e a mascherare i tagli. Senza room tone, ogni stacco del dialogo suona come un salto nel silenzio.\n\nLe wild track sono suoni registrati senza camera: passi, vestiti, oggetti, atmosfere. Vanno annotati con la scena a cui appartengono. Un buon recordist consegna anche questi, non solo il dialogo.\n\nPrima di smontare, si controlla di avere: dialogo per ogni scena, room tone per ogni location, wild track per gli effetti principali, e un backup verificato. Il materiale mancante non si recupera.",
    },
    {
      title: "Dalla presa diretta al mix",
      body:
        "In post il dialogo viene pulito (rumore, click, respiri), equalizzato e compresso con delicatezza. Si aggiungono Foley (passi, vestiti, oggetti), effetti e atmosfere, poi musica. Il mix bilancia tutto: il dialogo resta intelligibile, gli effetti costruiscono lo spazio, la musica sostiene l'emozione senza coprire la voce.\n\nI formati di consegna (stereo, 5.1, Atmos) richiedono mix separati, non un semplice 'upmix'. Il loudness standard per broadcast è -23 LUFS (EBU R128) con true peak a -1 dBTP; per il web le piattaforme normalizzano a circa -14 LUFS.\n\nLa regola d'oro: il suono si progetta insieme all'immagine. Un film pensato a tavolino come 'immagini + musica' suona sempre povero.",
    },
  ],
  practical:
    "Prima di girare: microfono a 40 cm dalla bocca, picchi a -12 dBFS, cuffie, timecode sincronizzato, room tone a fine scena. Se il dialogo non è comprensibile in cuffia, non lo sarà in sala.",
  formulas: ["picchi dialogo: -12 / -10 dBFS", "loudness broadcast: -23 LUFS, true peak -1 dBTP"],
  images: [FIG_BOOM],
  related: ["shotgun", "lavalier", "gain-staging", "timecode"],
  sources: [
    { title: "David Sonnenschein, Sound Design" },
    { title: "Ric Viers, The Sound Effects Bible" },
    { title: "EBU R128, specifiche di loudness" },
  ],
  lastUpdated: "2026-11-15",
};
