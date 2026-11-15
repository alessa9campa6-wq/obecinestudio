import type { Article } from "../../types";
import { FIG_SET_CREW } from "./figures";

export const MANUALE_MONTAGGIO: Article = {
  id: "manuale-montaggio",
  slug: "manuale-montaggio",
  title: "Manuale di montaggio",
  subtitle: "Ritmo, continuità, suono e workflow di post-produzione.",
  categoryId: "montaggio",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sul montaggio: ritmo, raccordi, J e L cut, struttura della scena, proxy, conform, esportazione e controllo qualità.",
  keywords: ["manuale", "montaggio", "editing", "ritmo", "conform", "proxy"],
  synonyms: ["film editing", "post-production", "editing workflow"],
  content: {
    principiante:
      "Montare significa scegliere. Del girato si conserva una piccola parte, e quella parte acquista significato per ciò che le sta accanto. Il montatore non 'mette in fila' le scene: costruisce il tempo e il punto di vista dello spettatore.",
    intermedio:
      "Il ritmo nasce dalla durata dei piani e dalla loro relazione: un piano lungo dopo tre corti sembra ancora più lungo. Il suono è metà del montaggio: un J-cut cambia il significato di un taglio più di qualsiasi effetto.",
    avanzato:
      "Il lavoro professionale è anche tecnico: proxy, conform, gestione dei media, verifiche di consegna. Un montaggio creativo eccellente che non arriva al delivery corretto non esiste.",
  },
  inDepth: [
    {
      title: "Che cos'è un taglio, davvero",
      body:
        "Un taglio è un cambio di informazione. Non cambia solo l'immagine: cambia il punto di vista, il tempo, lo spazio o l'attenzione. Se due piani consecutivi danno la stessa informazione, il taglio è superfluo. Se il taglio aggiunge informazione, lo spettatore lo accetta anche se è tecnicamente 'sbagliato'.\n\nIl montaggio classico cerca l'invisibilità: tagli nel movimento, raccordi di sguardo, continuità di direzione. Il montaggio moderno accetta la visibilità: jump cut, ellissi brusche, ritmi sincopati. La differenza non è tecnica ma di contratto con lo spettatore: gli si chiede di notare o di non notare.\n\nLa domanda operativa è sempre la stessa: che cosa sa lo spettatore dopo questo taglio che non sapeva prima? Se la risposta è 'niente', il piano va accorciato o eliminato.",
    },
    {
      title: "Ritmo: durata, respiro e aspettativa",
      body:
        "Il ritmo non è la velocità: è la variazione. Una sequenza di piani tutti da due secondi è monotona quanto una di piani tutti da dieci. Il montatore lavora sulle differenze: accorcia progressivamente per accelerare, allunga per far respirare, inserisce un piano lungo per creare attesa.\n\nIl tempo percepito dipende anche dal contenuto: un piano con movimento interno sembra più corto di un piano statico della stessa durata. Il suono anticipa o ritarda la percezione del taglio: un colpo di porta rende invisibile uno stacco, un silenzio lo evidenzia.\n\nUn esercizio utile è montare la stessa scena in tre versioni: una con piani lunghi, una con piani corti, una alternata. Il testo non cambia, cambia il film.",
    },
    {
      title: "La struttura della scena: entrare tardi, uscire presto",
      body:
        "La regola classica del montaggio narrativo è entrare nella scena il più tardi possibile e uscirne il prima possibile. Non serve vedere il personaggio che apre la porta: serve vederlo entrare. Non serve vedere la reazione completa: serve il tempo per capirla.\n\nOgni scena ha un obiettivo drammaturgico: se il montaggio lo raggiunge, il resto è grasso. Tagliare 'il bello' è la parte più difficile del mestiere, perché il bello è spesso ciò che il regista ha amato girare e che non serve al film.\n\nLa struttura si verifica leggendo la sequenza ad alta voce: se una battuta ripete ciò che l'immagine già dice, è un candidato al taglio.",
    },
    {
      title: "Suono e montaggio: J-cut, L-cut, sound bridge",
      body:
        "Il J-cut anticipa il suono del piano successivo prima dell'immagine; l'L-cut prolunga il suono del piano precedente oltre il taglio. Entrambi rendono la transizione più fluida e, soprattutto, orientano l'attenzione: lo spettatore sente prima di vedere, e questo crea aspettativa.\n\nIl sound bridge collega due scene con un suono continuo: una sirena che passa da un esterno a un interno, una musica che attraversa un'ellissi. È uno degli strumenti più potenti e meno usati del montaggio.\n\nIl silenzio è un suono come gli altri: togliere l'ambiente per un istante può valere più di qualsiasi effetto. Va progettato, non lasciato al caso.",
    },
    {
      title: "Continuità: che cosa controllare e come",
      body:
        "La continuità si controlla su tre livelli: immagine (posizioni, costumi, oggetti, luci), suono (ambiente, livelli, presenza) e tempo (durata percepita delle azioni). Gli errori più comuni sono oggetti che si spostano tra un'inquadratura e l'altra, bicchieri che si riempiono, sigarette che cambiano lunghezza, ombre che girano.\n\nIn montaggio si può mentire: si può tagliare prima dell'errore, si può usare un piano di copertura, si può aggiungere un suono che distrae. Ma non sempre: la regola è che lo spettatore non deve accorgersi. Se si accorge, l'errore è diventato contenuto.\n\nIl montatore esperto guarda la sequenza due volte: una da spettatore, una da tecnico. Le due visioni devono coincidere.",
    },
    {
      title: "Workflow: proxy, conform e media management",
      body:
        "Con materiale 4K, 6K o RAW il montaggio si fa su proxy: copie leggere generate con lo stesso timecode e la stessa struttura di cartelle. Si monta veloce, poi si ricollegano gli originali (conform) per grading, VFX e delivery.\n\nIl media management è la parte noiosa e decisiva: struttura di cartelle coerente, nomi file significativi, backup doppi, progetto con percorsi relativi. Un progetto che dipende da un disco specifico è un progetto che si romperà.\n\nIl conform richiede metadati corretti: timecode, reel name, frame rate. Se mancano, il relink diventa manuale. È il motivo per cui la pipeline si progetta in pre-produzione, non a montaggio iniziato.",
    },
    {
      title: "Esportazione e controllo qualità",
      body:
        "L'esportazione dipende dal delivery: cinema DCP, broadcast MXF, web H.264/H.265, social verticale. Per ogni formato cambiano codec, bitrate, spazio colore, loudness e safe area. Il master è il file di massima qualità da cui derivano le copie.\n\nIl controllo qualità non è opzionale: si verifica che il file si apra, che durata e frame rate siano corretti, che l'audio non abbia clipping, che i neri non siano 'croccanti' (banding), che i sottotitoli siano sincronizzati, che i loghi rispettino le safe area.\n\nUn errore di consegna costa una nuova masterizzazione e, spesso, una nuova giornata di lavoro. Il QC si fa prima di consegnare, non dopo il rifiuto.",
    },
  ],
  tables: [
    {
      title: "Delivery: formati tipici",
      columns: ["Destinazione", "Codec", "Note"],
      rows: [
        ["Cinema", "DCP (JPEG2000)", "Spazio colore DCI-P3"],
        ["Broadcast", "MXF / XDCAM", "Loudness -23 LUFS"],
        ["Web", "H.264 MP4", "Loudness ~-14 LUFS"],
        ["Social", "H.264 verticale", "Safe area centrale"],
      ],
    },
  ],
  practical:
    "Prima di esportare: guarda la sequenza senza audio (l'immagine regge?), poi solo audio (il suono racconta?), poi insieme. Se una delle tre passa, il montaggio è pronto.",
  images: [FIG_SET_CREW],
  related: ["montaggio-narrativo", "j-cut-l-cut", "proxy-workflow", "conform"],
  sources: [
    { title: "Walter Murch, In the Blink of an Eye" },
    { title: "Karen Pearlman, Cutting Rhythms" },
    { title: "Specifiche di delivery delle piattaforme" },
  ],
  lastUpdated: "2026-11-15",
};
