import type { Article } from "../../types";

export const MANUALE_SCENEGGIATURA: Article = {
  id: "manuale-sceneggiatura",
  slug: "manuale-sceneggiatura",
  title: "Manuale di sceneggiatura",
  subtitle: "Struttura, personaggi, dialogo e formati di scrittura.",
  categoryId: "sceneggiatura",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sulla scrittura: idea, struttura in tre atti, personaggi, conflitto, dialogo, formato e revisione.",
  keywords: ["manuale", "sceneggiatura", "struttura", "dialogo", "trattamento"],
  synonyms: ["screenwriting", "script", "story structure"],
  content: {
    principiante:
      "Una sceneggiatura è un documento tecnico che racconta una storia per immagini. Non è letteratura: descrive ciò che si vede e si sente, e lascia fuori ciò che non si può girare.",
    intermedio:
      "La struttura non è una gabbia ma una mappa: un personaggio che vuole qualcosa, un ostacolo che glielo impedisce, una scelta che lo cambia. Il resto è variazione sul tema.",
    avanzato:
      "Il dialogo è l'ultimo rifugio dello scrittore pigro: se la scena si capisce senza battute, le battute sono decorazione. La riscrittura è il lavoro vero, la prima stesura è solo materiale.",
  },
  inDepth: [
    {
      title: "Dall'idea al soggetto: che cosa stai raccontando",
      body:
        "Un'idea non è una storia. 'Un uomo scopre un tradimento' è una situazione; la storia è che cosa fa, che cosa rischia e che cosa cambia. Il soggetto (una o due pagine) deve contenere: chi, che cosa vuole, che cosa lo ostacola, come finisce.\n\nSe non riesci a raccontare il film in tre frasi, il problema non è la sintesi: è che la storia non è ancora chiara. La logline è uno strumento di lavoro, non un esercizio di marketing.\n\nPrima di scrivere scene, scrivi il conflitto centrale. Senza conflitto non c'è dramma: c'è solo descrizione di persone che parlano.",
    },
    {
      title: "Struttura: atti, punti di svolta, ritmo",
      body:
        "La struttura in tre atti è una convenzione, non una legge: impostazione (30%), confronto (50%), risoluzione (20%). Serve a garantire che la storia avanzi: ogni atto chiude con una decisione che cambia la direzione.\n\nI punti di svolta non sono formule: sono momenti in cui il personaggio non può più tornare indietro. Il primo atto finisce quando il protagonista accetta la sfida; il secondo quando la situazione sembra perduta; il terzo quando la affronta con nuove risorse.\n\nIl ritmo si progetta: alternare scene di tensione e scene di respiro, far crescere la posta in gioco, evitare che due scene consecutive facciano la stessa cosa. Il pubblico sente la ripetizione prima di riconoscerla.",
    },
    {
      title: "Personaggi: desiderio, bisogno, ferita",
      body:
        "Un personaggio funziona quando ha un desiderio consapevole (quello che vuole) e un bisogno inconsapevole (quello di cui ha davvero bisogno). Il conflitto tra i due è ciò che rende il finale significativo: se ottiene ciò che vuole ma non ciò di cui ha bisogno, il finale è amaro; se ottiene entrambi, è catartico.\n\nLa 'ferita' è ciò che il personaggio ha subito prima dell'inizio del film e che spiega il suo comportamento. Non serve mostrarla: serve conoscerla per scrivere le sue scelte.\n\nL'antagonista non è 'cattivo': è colui che ha un desiderio incompatibile con quello del protagonista. Se l'antagonista ha ragione dal suo punto di vista, la storia diventa interessante.",
    },
    {
      title: "Scena: obiettivo, conflitto, svolta",
      body:
        "Ogni scena deve avere un obiettivo (chi vuole cosa), un conflitto (chi o cosa lo impedisce) e una svolta (qualcosa cambia rispetto all'inizio). Se una scena non ha svolta, è una scenetta: può essere bella ma non serve.\n\nEntrare tardi e uscire presto vale anche in scrittura: la scena inizia quando il conflitto è già in corso e finisce appena la svolta è avvenuta. Le presentazioni, i saluti, le spiegazioni sono quasi sempre da tagliare.\n\nLa scena si scrive per immagini: che cosa vediamo? Che cosa sentiamo? Che cosa capiamo senza che nessuno lo dica? Se la risposta è solo 'quello che dicono i personaggi', la scena è radio.",
    },
    {
      title: "Dialogo: sottotesto e voce",
      body:
        "Il dialogo buono non dice ciò che i personaggi pensano. Dice qualcosa che nasconde ciò che pensano. Il sottotesto è la distanza tra ciò che si dice e ciò che si intende, e lo spettatore la percepisce dal contesto, dalle azioni, dalle pause.\n\nLa voce di ogni personaggio deve essere riconoscibile anche senza il nome nel copione: vocabolario, ritmo, errori, ossessioni. Se tutti parlano come l'autore, il film ha un solo personaggio.\n\nIl dialogo si legge ad alta voce. Se non si può dire senza imbarazzo, non funziona. E le battute troppo lunghe sono quasi sempre un segno che la scena non è stata risolta.",
    },
    {
      title: "Formato e revisione",
      body:
        "Il formato standard (Courier 12, 12 pt, margini definiti) non è estetica: una pagina equivale a circa un minuto di film. Serve a produrre, a pianificare e a valutare la lunghezza. Slug line (INT./EST., location, giorno/notte), azione, personaggio, dialogo, parentetica.\n\nLa revisione si fa in passaggi separati: prima la struttura, poi le scene, poi il dialogo, poi il taglio. Riscrivere tutto insieme significa non finire mai. Si taglia il 10% a ogni passaggio e si legge tutto di fila.\n\nUn copione si giudica dal numero di pagine che il lettore salta. Se ne salta, il problema è lì.",
    },
    {
      title: "Dalla pagina al set: shot list e storyboard",
      body:
        "La sceneggiatura si traduce in un piano di ripresa: per ogni scena si elencano le inquadrature necessarie (shot list) e, se serve, si disegnano (storyboard). Non tutte le scene hanno bisogno di storyboard: le scene d'azione e gli effetti sì.\n\nLa shot list include: numero scena, tipo di piano, movimento, lente, note di luce, durata stimata. Serve al direttore della fotografia, all'aiuto regista e al montatore.\n\nIl copione tecnico è un documento vivo: cambia sul set, e le modifiche vanno comunicate a tutti. Un set in cui ognuno ha una versione diversa del copione è un set che gira scene diverse.",
    },
  ],
  practical:
    "Scrivi la logline, poi il soggetto di due pagine, poi il trattamento, poi le scene. Se la storia non convince nel soggetto, non migliorerà nella sceneggiatura: cambia storia, non aggettivi.",
  images: [],
  related: ["struttura-tre-atti", "personaggi", "dialogo", "formato-sceneggiatura"],
  sources: [
    { title: "Robert McKee, Story" },
    { title: "Syd Field, Screenplay" },
    { title: "Linda Seger, Making a Good Script Great" },
  ],
  lastUpdated: "2026-11-15",
};
