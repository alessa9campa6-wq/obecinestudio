import type { Article } from "../../types";
import { FIG_KINEFINITY, FIG_URSA_RIG } from "./figures";

export const MANUALE_ATTREZZATURA: Article = {
  id: "manuale-attrezzatura",
  slug: "manuale-attrezzatura",
  title: "Manuale di attrezzatura",
  subtitle: "Scegliere camera, ottiche e supporti partendo dal lavoro.",
  categoryId: "attrezzatura",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sull'attrezzatura: formati sensore, mount, codec, storage, alimentazione, supporti e criteri di scelta tra acquisto e noleggio.",
  keywords: ["manuale", "attrezzatura", "camera", "sensore", "mount", "storage", "rig"],
  synonyms: ["camera gear", "equipment", "production kit"],
  content: {
    principiante:
      "L'attrezzatura non fa il film, ma un'attrezzatura sbagliata lo impedisce. La domanda giusta non è 'qual è la camera migliore', ma 'che cosa devo consegnare, in quanto tempo, con quante persone'. Da quelle tre risposte discende quasi tutto il resto.",
    intermedio:
      "Ogni pezzo ha un costo nascosto: la camera chiede storage, la storage chiede backup, il backup chiede tempo, il tempo chiede persone. Un kit si progetta a catena, non per singoli acquisti. Il noleggio è spesso la scelta razionale per ciò che si usa poche volte l'anno.",
    avanzato:
      "La competenza è sapere dove stanno i colli di bottiglia: bitrate contro velocità di scrittura, peso contro capacità della testa fluida, consumo contro batterie, risoluzione contro tempo di post. Il resto è preferenza.",
  },
  inDepth: [
    {
      title: "Formati del sensore: che cosa cambia davvero",
      body:
        "Il formato del sensore determina tre cose: l'angolo di campo a parità di focale, la profondità di campo a parità di inquadratura e la resa in bassa luce. Full frame (36×24 mm) dà più separazione dei piani e più luce raccolta; Super 35 (circa 24×13,5 mm) è lo standard storico del cinema e permette ottiche più piccole e leggere; Micro Quattro Terzi (17,3×13 mm) dà grande profondità di campo e corpi compatti; i formati grandi (Alexa 65, sensori VV) spingono la separazione all'estremo.\n\nIl 'crop factor' serve a confrontare gli angoli di campo, non a stabilire la qualità. Un 25 mm su Super 35 inquadra come un 37 mm su full frame. Chi passa da un formato all'altro deve rifare la mappa delle focali, altrimenti continuerà a girare con lo stesso angolo di campo di prima e non capirà perché il look è cambiato.\n\nAttenzione alla copertura delle ottiche: molte lenti Super 35 vignettano su full frame, e molte lenti full frame diventano inutilmente grandi su Super 35. Il formato va scelto insieme al parco ottiche, non dopo.",
    },
    {
      title: "Mount e adattatori: la compatibilità non è scontata",
      body:
        "Il mount è l'interfaccia meccanica ed elettrica tra camera e ottica. PL è lo standard cinema, robusto e senza contatti elettrici; EF è l'eredità Canon reflex; E, RF, L e Z sono i mount mirrorless, con comunicazione completa tra lente e corpo; MFT è il formato aperto di Panasonic e Olympus.\n\nLa regola della distanza di flange: si può adattare un'ottica con flange più lunga su un corpo con flange più corta, non il contrario. Per questo le ottiche PL si adattano quasi a tutto, mentre un'ottica E non andrà mai su un corpo EF senza lenti correttive, che degradano l'immagine.\n\nGli adattatori possono trasferire autofocus, stabilizzazione, dati e aperture elettroniche, oppure essere semplici tubi meccanici. Un adattatore economico introduce gioco, disallineamento e infiltrazioni di luce. Su un set, un adattatore che si muove di mezzo millimetro rovina la messa a fuoco di tutta la giornata.",
    },
    {
      title: "Codec, bitrate e la matematica dello storage",
      body:
        "Il bitrate è la quantità di dati al secondo. Da solo non dice la qualità: conta il codec, la profondità di colore, il campionamento (4:2:2 contro 4:2:0) e il tipo di compressione (intra-frame contro long-GOP). Un ProRes 422 HQ a 4K ha un bitrate alto ma è facile da montare; un H.265 a 4K ha un bitrate basso ed è pesante da decodificare.\n\nIl conto dello storage si fa prima del set: bitrate (Mb/s) × secondi ÷ 8 = megabyte. Un'ora a 880 Mb/s sono circa 396 GB. Moltiplicato per le ore di girato previste, per le copie di backup (almeno due) e per i giorni di produzione, dà la dimensione reale del lavoro. È il calcolo che fa saltare i budget quando viene fatto dopo.\n\nLa velocità di scrittura sostenuta del supporto deve superare il bitrate con margine. Le schede dichiarano un picco, non la velocità continua: una scheda 'V90' garantisce 90 MB/s minimi, che è il dato da confrontare col codec.",
    },
    {
      title: "Alimentazione: il reparto che nessuno progetta",
      body:
        "Una camera cinema consuma tra 30 e 90 watt, un monitor 10-20, un trasmettitore wireless 5-10, un follow focus wireless 3-5, una luce LED tra 60 e 600. Il totale è ciò che deve stare su una batteria o su una presa, e va calcolato prima di scegliere il formato delle batterie.\n\nV-Mount e Gold Mount sono gli standard per le camere cinema: si agganciano, si cambiano in secondi e si distribuiscono con piastre D-Tap. Le NP-F alimentano monitor e accessori leggeri; le batterie interne delle mirrorless durano poco e vanno sostituite da alimentatori dummy quando si gira a lungo.\n\nLa sicurezza elettrica è parte del mestiere: mai superare la capacità di una presa, mai collegare luci potenti a ciabatte civili, sempre verificare la messa a terra. Un set che salta la corrente a metà take costa più di un generatore.",
    },
    {
      title: "Supporti: treppiedi, testa fluida, gimbal, steadicam",
      body:
        "Il treppiedi è il supporto più sottovalutato. Deve reggere il peso del setup con margine (almeno il 50% in più), avere una testa fluida con resistenza regolabile e una semisfera per livellare in pochi secondi. Una testa sottodimensionata produce micro-vibrazioni che si vedono solo in proiezione.\n\nIl gimbal stabilizza elettronicamente su tre assi e richiede bilanciamento meccanico: se la camera non è bilanciata, i motori lavorano al massimo e consumano batteria. È perfetto per movimenti fluidi a mano, meno per salite, scale o terreni irregolari, dove la steadicam meccanica resta superiore.\n\nLa steadicam è un sistema vest-arm-sled: isola la camera dal corpo dell'operatore e permette di camminare, correre e salire gradini. Richiede un operatore specializzato e una preparazione fisica. Non è un accessorio: è una figura professionale.",
    },
    {
      title: "Acquistare o noleggiare: il conto che nessuno fa",
      body:
        "Un'attrezzatura si ammortizza in tre-cinque anni, ma solo se lavora abbastanza. Il costo reale non è il prezzo di listino: è prezzo diviso utilizzi, più manutenzione, assicurazione, svalutazione e spazio di magazzino. Una camera da 10.000 euro usata dieci volte l'anno costa 1.000 euro a utilizzo, senza contare tutto il resto; noleggiarla a 150 euro al giorno per dieci giorni costa 1.500 e include assistenza e sostituzione in caso di guasto.\n\nIl noleggio conviene per ciò che è specialistico (ottiche anamorfiche, luci grandi, camera 65 mm), per i picchi di lavoro e per i test prima dell'acquisto. L'acquisto conviene per ciò che si usa ogni settimana e per ciò che deve essere sempre disponibile: monitor, supporti, cavi, batterie, un corpo macchina di fiducia.\n\nLa scelta strategica è ibrida: corpo e ottiche di base propri, tutto il resto a noleggio. Ed è sempre meglio noleggiare una cosa in più che comprare una cosa che non basta.",
    },
    {
      title: "Checklist prima di partire",
      body:
        "Prima di lasciare la sede: corpo macchina aggiornato, due supporti di memoria formattati, batterie cariche e una di riserva, alimentatore, cavi di riserva, monitor e staffa, cuffie, strumenti (multimetro, nastro, brugole), panno e soffietto per la lente.\n\nSul set, prima del primo ciak: verifica che la registrazione parta davvero e che il file si apra, controlla che l'audio arrivi alla camera o al registratore, misura l'esposizione con riferimento, controlla la copertura dell'ottica e il fuoco su un monitor grande, non sul display della camera.\n\nA fine giornata: backup doppio con verifica checksum, non formattare nessun supporto finché il backup non è verificato, etichettare tutto con data, scena e take. Il girato è l'unica cosa che non si può rigirare.",
    },
  ],
  practical:
    "Scrivi il tuo kit in tre colonne: 'essenziale' (senza non giri), 'utile' (migliora il lavoro), 'di nicchia' (noleggio). Se la colonna essenziale supera quello che puoi portare in due borse, il progetto è troppo grande per la troupe che hai.",
  tables: [
    {
      title: "Formati del sensore a confronto",
      columns: ["Formato", "Dimensione", "Crop", "Uso tipico"],
      rows: [
        ["Full frame", "36×24 mm", "1.0", "Narrativo, ritratti, bassa luce"],
        ["Super 35", "24×13,5 mm", "1.5", "Cinema, ottiche PL"],
        ["APS-C", "24×16 mm", "1.5", "Ibride, documentario"],
        ["MFT", "17,3×13 mm", "2.0", "Run-and-gun, stabilizzazione"],
      ],
    },
  ],
  images: [FIG_URSA_RIG, FIG_KINEFINITY],
  diagram: "sensor-sizes",
  related: ["tipologie-cineprese", "sensori-crop-factor", "mount-attacchi", "schede-memoria"],
  sources: [
    { title: "Blain Brown, Cinematography: Theory and Practice" },
    { title: "Specifiche tecniche dei produttori (ARRI, Sony, Canon, Blackmagic, Kinefinity)" },
    { title: "SD Association, specifiche di velocità delle schede" },
  ],
  lastUpdated: "2026-11-15",
};
