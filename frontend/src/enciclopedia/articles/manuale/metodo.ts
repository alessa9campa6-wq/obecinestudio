import type { Article } from "../../types";

export const MANUALE_METODO: Article = {
  id: "manuale-metodo",
  slug: "manuale-metodo",
  title: "Metodo: come si studia il cinema",
  subtitle: "Un percorso di studio, gli errori di chi impara da solo, le fonti.",
  categoryId: "glossario",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo che tiene insieme tutto: come si studia, in che ordine, con quali esercizi e con quali fonti verificabili.",
  keywords: ["manuale", "metodo", "studio", "esercizi", "fonti"],
  synonyms: ["film studies", "learning path", "study method"],
  content: {
    principiante:
      "Il cinema si impara in tre modi: guardando molto, girando poco ma spesso, e leggendo chi lo fa di mestiere. Guardare senza girare produce critici; girare senza guardare produce imitatori.",
    intermedio:
      "Un percorso efficace parte dalla tecnica di base (esposizione, obiettivi, montaggio), passa dalla pratica (esercizi brevi e completi) e arriva alla specializzazione. Ogni fase richiede un output: un video finito, non un'appunto.",
    avanzato:
      "La competenza si misura sulla capacità di risolvere problemi nuovi con strumenti noti. Chi sa perché una scelta funziona può adattarla; chi sa solo imitare un risultato è bloccato al primo imprevisto.",
  },
  inDepth: [
    {
      title: "L'ordine di studio che funziona",
      body:
        "Si parte dall'immagine: esposizione, obiettivi, luce. Senza queste tre non si può girare nulla di controllato. Poi il suono, che è la competenza più trascurata e la più difficile da recuperare. Poi il montaggio, che insegna a girare meglio. Infine la produzione, che insegna a fare tutto questo nei tempi e nei soldi disponibili.\n\nLa specializzazione viene dopo: regia, fotografia, montaggio, sound design, produzione. Chi si specializza prima di aver capito le altre funzioni passa il resto della carriera a litigare con i reparti che non capisce.\n\nOgni fase dovrebbe durare il tempo di un progetto completo: un cortometraggio di tre minuti girato e finito insegna più di dieci tutorial.",
    },
    {
      title: "Esercizi che producono competenza",
      body:
        "Esercizio 1: un piano sequenza di 60 secondi con un solo movimento di macchina giustificato. Esercizio 2: la stessa scena di dialogo montata in tre ritmi diversi. Esercizio 3: un ritratto in interni con una sola fonte di luce e un pannello. Esercizio 4: un minuto di suono senza immagine (solo ambiente, passi, oggetti).\n\nOgni esercizio ha un vincolo preciso, perché il vincolo è ciò che insegna. 'Gira un corto' non è un esercizio; 'gira un dialogo di 90 secondi con due inquadrature e nessun movimento' lo è.\n\nLa revisione è parte dell'esercizio: si guarda il risultato con qualcuno che non l'ha girato e si annota che cosa non si capisce. Il pubblico non ha la sceneggiatura in mano.",
    },
    {
      title: "Guardare i film in modo utile",
      body:
        "Guardare un film per piacere e guardarlo per studiare sono attività diverse. Per studiare si guarda una sequenza alla volta, si annotano le inquadrature (scala, durata, movimento, luce), si contano i tagli, si ascolta il suono separatamente.\n\nUn metodo utile: scegliere una scena, descriverla in dieci righe senza giudizi, poi riscriverla come la gireresti tu. La differenza tra le due versioni è la lezione.\n\nLe edizioni commentate dai registi e i documentari sul making of sono fonti preziose, ma vanno ascoltate con spirito critico: chi racconta il proprio film tende a razionalizzare a posteriori.",
    },
    {
      title: "Le fonti: come distinguere quelle affidabili",
      body:
        "Le fonti primarie sono i documenti tecnici: manuali delle camere, white paper dei sensori, specifiche delle schede, norme (SMPTE, EBU, ITU). Dicono numeri verificabili. Le fonti secondarie (libri, corsi, video) interpretano quei numeri e possono semplificare o sbagliare.\n\nLe fonti da diffidare sono quelle che promettono risultati senza spiegare il metodo, che confondono 'meglio' con 'più costoso' e che non citano mai una misura. Sul web la regola è: se non c'è un dato o una fonte, è un'opinione.\n\nPer i prezzi valgono solo i listini e i preventivi dei rental: i numeri che circolano nei forum invecchiano in mesi.",
    },
    {
      title: "Errori tipici di chi impara da solo",
      body:
        "Comprare attrezzatura prima di saperla usare. Guardare tutorial senza girare. Cambiare camera ogni sei mesi invece di finire i progetti. Trascurare il suono perché 'si sistema in post'. Montare senza guardare il girato prima di iniziare.\n\nUn altro errore è non chiedere feedback a chi è più avanti: il giudizio di un professionista su cinque minuti di girato vale più di dieci ore di video.\n\nInfine: non documentare il proprio lavoro. Note, piante luci, shot list, budget reali sono la memoria che permette di migliorare. Chi non misura, ripete.",
    },
  ],
  practical:
    "Piano di 8 settimane: 2 settimane di immagine (esercizi su esposizione e luce), 2 di suono, 2 di montaggio, 2 di progetto completo. Ogni settimana un output finito, anche di 30 secondi.",
  images: [],
  related: ["glossario-cinematografico", "manuale-fotografia", "manuale-montaggio"],
  sources: [
    { title: "David Bordwell, Kristin Thompson, Film Art" },
    { title: "Blain Brown, Cinematography: Theory and Practice" },
    { title: "Manuali tecnici dei produttori di camere e illuminatori" },
  ],
  lastUpdated: "2026-11-15",
};
