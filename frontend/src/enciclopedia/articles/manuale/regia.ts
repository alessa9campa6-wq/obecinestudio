import type { Article } from "../../types";
import { FIG_SET_CREW, FIG_TOURNAGE } from "./figures";

export const MANUALE_REGIA: Article = {
  id: "manuale-regia",
  slug: "manuale-regia",
  title: "Manuale di regia",
  subtitle: "Come si costruisce un film inquadratura per inquadratura.",
  categoryId: "regia",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sulla regia: piano di ripresa, scala dei piani, obiettivi, movimento, raccordi e direzione degli attori.",
  keywords: ["manuale", "regia", "messa in scena", "piano di ripresa", "raccordi"],
  synonyms: ["directing", "mise en scène", "film direction"],
  content: {
    principiante:
      "La regia non è 'scegliere una bella inquadratura': è decidere che cosa lo spettatore deve sapere, quando e da quale punto di vista. Ogni scelta — dove metti la macchina, che obiettivo usi, se ti muovi o stai fermo — è un'informazione data al pubblico prima ancora che l'attore parli.",
    intermedio:
      "Il lavoro si divide in tre momenti: la preparazione (decidere il punto di vista della scena), il set (proteggere quella decisione dal caos) e il montaggio (accettare che il film si riscrive in sala). Un regista che non sa cosa stanno guardando i suoi collaboratori ha già perso la scena.",
    avanzato:
      "La competenza tecnica serve a rendere invisibile la decisione: se lo spettatore nota il movimento di macchina, il movimento non sta raccontando nulla. Il criterio per giudicare un'inquadratura non è la sua bellezza isolata, ma la sua funzione nella sequenza.",
  },
  inDepth: [
    {
      title: "Il punto di vista prima dell'inquadratura",
      body:
        "Prima di scegliere un obiettivo si decide da dove si racconta la scena. Un marito che scopre un tradimento può essere ripreso dal suo punto di vista (soggettiva, lo spettatore sa quello che sa lui), dal punto di vista della moglie (drammatica ironia: sappiamo più di lui) o da una posizione neutra che non appartiene a nessuno (sguardo del narratore). Sono tre film diversi con la stessa sceneggiatura.\n\nIl punto di vista si decide leggendo la scena, non guardando il set. La domanda da farsi è: che cosa deve provare lo spettatore in questo momento? Se la risposta è 'deve capire che lei mente', la macchina non può stare dalla parte di lui. Se la risposta è 'deve temere che lui se ne accorga', la macchina sta con lui e l'informazione arriva dallo sfondo, da un dettaglio che lo spettatore vede e il personaggio no.\n\nQuesta è la differenza tra regia e decorazione: l'inquadratura è un atto di informazione. Il resto — luci, lenti, movimento — è il modo in cui quell'informazione viene resa credibile.",
    },
    {
      title: "La scala dei piani e il suo significato",
      body:
        "La scala dei piani non è una tassonomia da imparare a memoria: è una scala di intimità e di informazione. Il campo lunghissimo colloca il personaggio nel mondo e lo rende piccolo; il campo lungo descrive l'ambiente e l'azione; il piano medio è la misura del dialogo; il primo piano isola un volto e obbliga lo spettatore a leggere un'emozione; il dettaglio (una mano, un occhio, un oggetto) dice che quell'elemento conta più di tutto il resto.\n\nIl passaggio da un piano all'altro ha un costo: ogni volta che ti avvicini, rinunci all'ambiente; ogni volta che ti allontani, rinunci all'emozione. Il montaggio classico alterna i due movimenti per non perdere né l'uno né l'altra. Un film che resta sempre nel piano medio è un film che non ha mai deciso che cosa conta.\n\nNella pratica si parte dal piano che racconta meglio l'azione e si costruisce intorno la copertura: un campo per stabilire il luogo, un paio di piani medi per il dialogo, i primi piani per le reazioni. La copertura non è un dovere burocratico: è la rete che permette al montatore di salvare la scena se la performance migliore arriva al terzo take.",
    },
    {
      title: "Obiettivi, distanza e prospettiva",
      body:
        "La focale non cambia solo il campo visivo: cambia i rapporti tra le cose. Un grandangolo (14-24 mm su full frame) esagera la profondità, allunga le linee, fa sembrare gli spazi più grandi e i volti più larghi se li avvicini ai bordi. Un teleobiettivo (85-200 mm) comprime i piani, fa sembrare lo sfondo più vicino e lusinga i volti. Un 50 mm è vicino alla percezione umana, e per questo è spesso il più 'neutro' e il più difficile: non nasconde niente.\n\nLa distanza dalla macchina è parte della stessa scelta. Lo stesso primo piano ottenuto con un 24 mm a 30 cm e con un 85 mm a due metri non è lo stesso primo piano: il grandangolo deforma il naso e allarga gli occhi, il tele comprime i lineamenti. Il 'look cinematografico' che molti cercano non viene dalla lente costosa, ma dalla distanza giusta e dal rapporto tra soggetto e sfondo.\n\nLa profondità di campo è la conseguenza: dipende da apertura, focale e distanza. Chi vuole separare il soggetto dallo sfondo lavora con aperture aperte e focali lunghe; chi vuole il deep focus (tutto leggibile, come in Citizen Kane) chiude il diaframma e accetta più luce.",
    },
    {
      title: "Il movimento: quando aggiunge e quando distrae",
      body:
        "Un movimento di macchina si giustifica in tre casi: segue un'azione che non si può fermare, rivela un'informazione che la staticità nasconderebbe, oppure esprime uno stato d'animo che il corpo della macchina può raccontare meglio di un volto. Fuori da questi casi è decorazione, e lo spettatore lo sente.\n\nLa carrellata laterale (tracking) accompagna un personaggio e costruisce continuità. La panoramica (pan) esplora o collega. Il dolly in avvicina emotivamente, il dolly out allontana e chiude. La gru sale e cambia scala: dal dettaglio al mondo. La steadicam e il gimbal seguono senza scossoni; la macchina a mano introduce instabilità, che è un'informazione emotiva, non un difetto. La macchina fissa, infine, è una scelta forte: dice che il mondo non si sposta per il personaggio.\n\nRegola pratica: un movimento deve avere un inizio, una fine e una ragione. Se non sai dove finisce, non iniziarlo. E se la scena funziona con la macchina ferma, probabilmente è la scena a funzionare, non il movimento.",
    },
    {
      title: "Raccordi, asse e continuità",
      body:
        "La continuità classica esiste per rendere invisibile il montaggio. Tre regole fanno il 90% del lavoro: la regola dei 180 gradi (tieni la macchina da una parte dell'asse tra i due personaggi, altrimenti gli sguardi si invertono), la regola dei 30 gradi (tra due inquadrature dello stesso soggetto cambia angolo di almeno 30 gradi, altrimenti sembra un salto) e il raccordo sull'azione (taglia nel mezzo di un gesto, così l'occhio non vede il taglio).\n\nA queste si aggiungono il raccordo di sguardo (chi guarda e che cosa), il raccordo di direzione (un personaggio che esce a destra deve rientrare a sinistra), il raccordo sonoro e il match cut. Sono convenzioni, non leggi di natura: Godard le ha violate per decenni e il suo cinema funziona proprio perché le violazioni sono leggibili come scelte.\n\nLa continuità non si improvvisa: serve un copione tecnico, note di posizione, foto di riferimento e qualcuno che la controlli. Sul set la memoria è la risorsa più scarsa.",
    },
    {
      title: "Dirigere gli attori: che cosa chiedi davvero",
      body:
        "Un attore non ha bisogno di sapere dove sono le luci; ha bisogno di sapere che cosa vuole nella scena. La direzione utile è concreta e giocabile: 'entra convinto che lui ti crederà' funziona, 'sii più intenso' no. Il verbo d'azione ('supplica', 'nasconde', 'provoca') dà all'attore una partitura fisica; l'aggettivo ('triste', 'teso') gli chiede di recitare un risultato.\n\nIl regista protegge anche il silenzio: molte delle migliori interpretazioni nascono da un take in cui nessuno parla. E protegge il numero di take: la stanchezza produce falsità, e un attore che si sente osservato mentre viene giudicato recita per il regista, non per la scena.\n\nSul set la macchina è un testimone, non il capo. Se l'inquadratura obbliga l'attore a un movimento innaturale, spesso è l'inquadratura da cambiare.",
    },
    {
      title: "Errori da manuale",
      body:
        "Il primo errore è girare senza sapere quale sarà il primo piano del montaggio: si accumulano metri di girato e nessuna scena. Il secondo è coprire tutto con la stessa focale e la stessa altezza di macchina, producendo un film piatto anche quando la storia è forte. Il terzo è usare il movimento per nascondere una scena vuota: il pubblico non si distrae, si annoia più in fretta.\n\nIl quarto è dimenticare l'altezza della macchina: all'altezza degli occhi è neutra, dal basso dà potere, dall'alto lo toglie. Spesso si gira tutto a un metro e mezzo per abitudine, e ogni scena ha lo stesso punto di vista. Il quinto è non guardare il monitor con l'occhio del montatore: se un'inquadratura non ha un taglio d'ingresso e uno d'uscita, in sala sarà un problema.",
    },
  ],
  practical:
    "Prima di girare una scena, disegna tre inquadrature: quella che apre, quella che racconta l'azione, quella che chiude. Se non riesci a far stare la scena in tre, probabilmente la scena ha troppe idee. Poi decidi il punto di vista e solo dopo la focale.",
  examples: [
    "Citizen Kane (1941): deep focus e angolazioni dal basso come strumento narrativo, non come stile.",
    "2001: Odissea nello spazio (1968): il match cut osso-astronave come ellissi di milioni di anni.",
    "Il buono, il brutto, il cattivo (1966): i primi piani larghissimi nei duelli, il paesaggio come personaggio.",
    "Roma (2018): piani sequenza e macchina che si muove lateralmente per raccontare un mondo, non un'azione.",
  ],
  commonMistakes: [
    "Scegliere la focale prima del punto di vista.",
    "Girare tutti i piani alla stessa altezza di macchina.",
    "Usare il movimento per rendere 'cinematografico' ciò che non è scritto.",
    "Non girare inserti e reazioni: in montaggio mancheranno.",
  ],
  tables: [
    {
      title: "Scala dei piani: che cosa dice e che cosa costa",
      columns: ["Piano", "Informazione", "Costo"],
      rows: [
        ["Campo lunghissimo", "Il personaggio nel mondo", "Perdi il volto"],
        ["Campo lungo", "Ambiente e azione", "Perdi il dettaglio"],
        ["Piano medio", "Dialogo e relazione", "Perdi l'ambiente"],
        ["Primo piano", "Emozione e pensiero", "Perdi lo spazio"],
        ["Dettaglio", "Un oggetto che conta", "Perdi il contesto"],
      ],
    },
  ],
  images: [FIG_TOURNAGE, FIG_SET_CREW],
  diagram: "shot-sizes",
  related: ["tipologie-inquadrature", "movimenti-macchina", "regola-180-gradi", "composizione-regola-terzi"],
  sources: [
    { title: "David Bordwell, Janet Staiger, Kristin Thompson, The Classical Hollywood Cinema" },
    { title: "Alexander Mackendrick, On Film-making" },
    { title: "Steven Katz, Film Directing Shot by Shot" },
  ],
  lastUpdated: "2026-11-15",
};
