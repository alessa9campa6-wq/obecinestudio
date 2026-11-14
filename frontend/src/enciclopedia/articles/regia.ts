import { Article } from "../types";

export const REGIA_ARTICLES: Article[] = [
  {
    id: "inquadrature-tipi",
    slug: "tipologie-inquadrature",
    title: "Tipologie di inquadrature",
    subtitle: "I piani e i campi che costruiscono il racconto visivo.",
    categoryId: "regia",
    subcategoryId: "inquadrature",
    difficulty: "principiante",
    shortDescription: "Classificazione delle inquadrature per distanza dal soggetto: dal dettaglio al piano generale.",
    keywords: ["inquadratura", "piano", "campo", "primo piano", "piano americano", "full shot"],
    synonyms: ["shot types", "shot size", "framing", "close-up", "wide shot", "medium shot"],
    content: {
      principiante:
        "Un'inquadratura è la porzione di spazio e di soggetto che la camera racconta in un singolo take. La sua dimensione si definisce dalla distanza apparente del soggetto rispetto al bordo del fotogramma. Più il soggetto è grande nel fotogramma, più l'inquadratura è 'stretta' e più intima è la relazione con lo spettatore.\n\nLe inquadrature classiche, dalla più larga alla più stretta, sono: piano generale (o long shot), piano figura intera, piano americano (alla coscia), piano medio (alla vita), primo piano (viso), primissimo piano (dettaglio del viso) e dettaglio (parte del corpo o oggetto).",
      intermedio:
        "La scelta del piano non è solo estetica: comunica gerarchia, emozione e informazione. Il piano generale stabilisce il contesto (dove siamo, quanti siamo, che tempo fa). Il piano medio è quello del dialogo e dell'azione quotidiana. Il primo piano isola l'emozione e il pensiero del personaggio; il dettaglio crea tensione o simbolismo.\n\nIn pratica si costruisce una sequenza alternando piani diversi per evitare la monotonia e per guidare l'attenzione. La continuità richiede che la dimensione del salto tra un piano e l'altro sia sufficiente (regola dei 30°).",
      avanzato:
        "Oltre alla dimensione, contano l'angolazione (punto di vista, controcampo, soggettiva), l'altezza della camera (low angle, high angle, dutch tilt) e la relazione con lo spazio scenico. Un primo piano frontale e uno di profilo comunicano stati psicologici diversi; un low angle amplifica potere o minaccia, un high angle riduce il soggetto.\n\nNei film contemporanei si usano piani intermedi e 'dirty singles' (primi piani con parte del secondo personaggio in fuoco) per mantenere la relazione tra i personaggi anche in primi piani stretti.",
    },
    howItWorks: "La dimensione apparente del soggetto dipende da focale e distanza: a parità di inquadratura, una focale lunga comprime lo sfondo, una corta lo dilata.",
    practical: "Quando giri, segna nello shot list il piano previsto per ogni take. Sul set, la camera operator e il 1° AC devono sapere se il take è un 'clean single' o un 'dirty single' per decidere il fuoco e il posizionamento dei microfoni.",
    examples: [
      "Il piano generale iniziale di 'Lawrence d'Arabia' stabilisce il deserto prima di avvicinarsi al personaggio.",
      "I primi piani stretti di Sergio Leone costruiscono tensione nei western.",
    ],
    commonMistakes: [
      "Saltare tra piani troppo simili (es. medio e medio leggermente diverso) creando 'jump cut' involontari.",
      "Usare solo primi piani perdendo il contesto spaziale.",
    ],
    related: ["campi-piani-cinematografici", "regola-30-gradi", "composizione-immagine"],
    glossary: [
      { term: "Piano generale", def: "Inquadratura che mostra il soggetto in un contesto ampio." },
      { term: "Primo piano", def: "Inquadratura stretta sul viso o su un dettaglio emotivamente rilevante." },
    ],
    sources: [{ title: "Bordwell & Thompson, Film Art: An Introduction" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "movimenti-macchina",
    slug: "movimenti-macchina",
    title: "Movimenti di macchina",
    subtitle: "Pan, tilt, dolly, tracking, crane, steadicam e gimbal.",
    categoryId: "regia",
    subcategoryId: "movimenti",
    difficulty: "principiante",
    shortDescription: "I movimenti della camera e il loro significato narrativo.",
    keywords: ["pan", "tilt", "dolly", "tracking", "crane", "steadicam", "gimbal", "zoom"],
    synonyms: ["camera movement", "panning", "tracking shot", "crane shot", "dolly zoom"],
    content: {
      principiante:
        "I movimenti di macchina sono i cambiamenti di posizione o orientamento della camera durante un take. I principali: pan (rotazione orizzontale su treppiede), tilt (rotazione verticale), dolly (avvicinamento/allontanamento lineare), tracking (inseguimento del soggetto), crane (movimento verticale ampio), steadicam/gimbal (camera a mano stabilizzata), zoom (variazione focale, non movimento fisico).\n\nOgni movimento ha un 'peso' narrativo: un pan lento rivela, un dolly in avvicina allo stato emotivo, un tracking crea tensione.",
      intermedio:
        "Va distinto il movimento della camera dal movimento del soggetto: un pan su un personaggio fermo è una scelta di regia, non un inseguimento. Il dolly in avvicinamento crea intimità e tensione; il dolly out distanzia e allarga il contesto. Il tracking laterale mantiene la parità tra camera e soggetto.\n\nIl gimbal e la steadicam permettono movimenti fluidi a mano, ma richiedono preparazione (bilanciamento, operator skill). Lo zoom è spesso evitato nel cinema classico (effetto 'zoom' associato al video), ma usato intenzionalmente (dolly zoom / vertigo effect).",
      avanzato:
        "La progettazione del movimento parte dallo storyboard e dal blocking: la camera si muove per rivelare informazione al momento giusto. Il 'motivated movement' è giustificato da un elemento della scena (un personaggio che guarda, un veicolo che passa). Movimenti non motivati possono risultare arbitrari.\n\nTecnicamente: velocità costante, accelerazioni dolci (ease in/out), punti di partenza/arrivo precisi, coordinamento con il focus puller. Il dolly zoom richiede sincronizzazione tra zoom e spostamento per mantenere la dimensione del soggetto mentre lo sfondo si deforma.",
    },
    practical: "Prova il movimento a vuoto prima di girare; marca i punti di inizio/fine con nastro adesivo; coordina il focus puller con segnali chiari.",
    examples: [
      "Il dolly zoom in 'Vertigo' di Hitchcock.",
      "Il piano sequenza di 'Touch of Evil' (Welles) con crane e tracking.",
    ],
    commonMistakes: [
      "Movimenti troppo veloci che disorientano.",
      "Zoom usato come scorciatoia al posto di un dolly.",
      "Camera non stabilizzata che distrae.",
    ],
    related: ["blocking-staging", "composizione-immagine", "continuita-cinematografica"],
    sources: [{ title: "The Five C's of Cinematography, Joseph V. Mascelli" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "composizione-immagine",
    slug: "composizione-immagine",
    title: "Composizione dell'immagine",
    subtitle: "Equilibrio, linee, profondità e guida dello sguardo.",
    categoryId: "regia",
    subcategoryId: "composizione",
    difficulty: "principiante",
    shortDescription: "Principi di composizione: terzi, simmetria, profondità, linee guida.",
    keywords: ["composizione", "linee guida", "simmetria", "profondità", "framing", "rule of thirds"],
    synonyms: ["composition", "visual balance", "leading lines", "depth"],
    content: {
      principiante:
        "La composizione è l'organizzazione degli elementi visivi nel fotogramma. I principi base: regola dei terzi (posizionare i soggetti sui punti di forza), linee guida (strade, sguardi, architetture che conducono l'occhio), simmetria/asimmetria, profondità (primi piani, medi, sfondi), bilanciamento (peso visivo degli elementi), cornice (archi, porte, finestre che inquadrano).\n\nUna buona composizione rende l'immagine leggibile e dirige l'attenzione senza che lo spettatore se ne accorga.",
      intermedio:
        "La composizione dialoga con il movimento: un personaggio che entra da sinistra e si ferma sul terzo destro crea un flusso naturale. Lo spazio negativo (empty space) può comunicare isolamento o attesa. Il 'headroom' (spazio sopra la testa) e il 'look room' (spazio nella direzione dello sguardo) vanno calibrati: troppo spazio 'taglia' il soggetto, troppo poco lo comprime.\n\nLa profondità si costruisce con livelli (foreground/midground/background) e con il controllo della profondità di campo.",
      avanzato:
        "Composizione come strumento narrativo: l'asse (axis of action) definisce i lati della scena; romperlo consapevolmente crea disorientamento. Il 'blocking' dei personaggi è parte della composizione. In fase di color grading, il contrasto e la saturazione modificano il peso visivo degli elementi.\n\nNei piani sequenza la composizione evolve: l'operatore deve anticipare le posizioni future e mantenere l'equilibrio visivo durante il movimento.",
    },
    practical: "Usa i terzi della camera come guida, ma non come regola rigida. Controlla i bordi del fotogramma per evitare elementi distraenti (microfoni, cavi, crew).",
    examples: ["La simmetria centrale di Kubrick ('Shining', '2001').", "Le composizioni profonde di Orson Welles ('Quarto potere')."],
    commonMistakes: ["Centrare sempre il soggetto.", "Ignorare lo sfondo.", "Tagliare arti o teste ai bordi."],
    related: ["regola-dei-terzi", "regola-180-gradi", "blocking-staging"],
    diagram: "rule-of-thirds",
    sources: [{ title: "The Filmmaker's Eye, Gustavo Mercado" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "regola-dei-terzi",
    slug: "regola-dei-terzi",
    title: "Regola dei terzi",
    subtitle: "La griglia 3x3 che guida il posizionamento del soggetto.",
    categoryId: "regia",
    subcategoryId: "composizione",
    difficulty: "principiante",
    shortDescription: "Dividere il fotogramma in 9 parti e posizionare i punti di interesse sui terzi.",
    keywords: ["terzi", "griglia", "punti di forza", "composizione"],
    synonyms: ["rule of thirds", "thirds grid"],
    content: {
      principiante:
        "La regola dei terzi divide il fotogramma con due linee verticali e due orizzontali, creando 9 rettangoli. I punti di interesse (occhi, orizzonte, soggetto) vengono posizionati sulle linee o sui loro incroci (punti di forza), anziché al centro.\n\nÈ una guida, non una legge: aiuta a ottenere composizioni dinamiche e bilanciate.",
      intermedio:
        "Applicazioni: l'orizzonte sulla linea superiore o inferiore a seconda di quanto cielo/terra vuoi mostrare; gli occhi del soggetto sul terzo superiore; in un dialogo, il soggetto sul terzo opposto alla direzione dello sguardo per lasciare 'look room'.\n\nLa regola funziona perché l'occhio umano tende a esplorare le immagini in modo asimmetrico; il centro è statico, i terzi creano movimento.",
      avanzato:
        "Nei formati panoramici (2.39:1) i terzi restano validi ma la griglia va adattata. In composizioni simmetriche intenzionali (Kubrick, Wes Anderson) la regola viene consapevolmente rotta. La regola dei terzi va combinata con la profondità di campo e con il movimento della camera.",
    },
    related: ["composizione-immagine", "regola-180-gradi"],
    diagram: "rule-of-thirds",
    sources: [{ title: "Film Art: An Introduction, Bordwell & Thompson" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "regola-180-gradi",
    slug: "regola-180-gradi",
    title: "Regola dei 180°",
    subtitle: "L'asse di azione che mantiene la continuità spaziale.",
    categoryId: "regia",
    subcategoryId: "continuita",
    difficulty: "intermedio",
    shortDescription: "Mantenere la camera sullo stesso lato dell'asse di azione per non disorientare.",
    keywords: ["180 gradi", "asse di azione", "continuità", "linea"],
    synonyms: ["180-degree rule", "axis of action", "line of action"],
    content: {
      principiante:
        "In una scena con due o più personaggi, si immagina una linea immaginaria (asse di azione) che li collega. La camera deve restare sempre dallo stesso lato di questa linea. Se la camera la attraversa, i personaggi sembrano scambiarsi di posto: lo spettatore si disorienta.\n\nÈ il fondamento della continuità nel dialogo (shot/reverse shot).",
      intermedio:
        "L'asse si stabilisce con il primo inquadramento. I controcampi mantengono la posizione relativa: se A è a sinistra e B a destra nel master, A resta a sinistra nei primi piani. Rompere la regola è possibile ma richiede una transizione (movimento della camera che attraversa l'asse, o un piano neutro).",
      avanzato:
        "Il 'crossing the line' intenzionale può comunicare caos, confusione o rottura (es. scene di combattimento, inseguimenti). Alcuni registi (Godard, Anderson) lo usano come stile. La regola va combinata con la direzione dello sguardo e con il movimento dei personaggi: se un personaggio attraversa l'asse fisicamente, anche la camera può seguirlo.",
    },
    practical: "Segna l'asse sul piano di lavorazione; posiziona i monitor in modo che il regista veda la geometria della scena.",
    examples: ["Dialogo classico shot/reverse shot in 'Casablanca'.", "Rottura intenzionale in 'A bout de souffle'."],
    commonMistakes: ["Dimenticare l'asse cambiando setup senza riferimento.", "Confondere asse di azione con asse di sguardo."],
    related: ["regola-30-gradi", "continuita-cinematografica", "blocking-staging"],
    sources: [{ title: "Directing: Film Techniques and Aesthetics, Michael Rabiger" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "regola-30-gradi",
    slug: "regola-30-gradi",
    title: "Regola dei 30°",
    subtitle: "Il salto minimo tra due inquadrature per evitare il jump cut.",
    categoryId: "regia",
    subcategoryId: "continuita",
    difficulty: "intermedio",
    shortDescription: "Tra due inquadrature consecutive la camera deve spostarsi di almeno 30° (o cambiare piano).",
    keywords: ["30 gradi", "jump cut", "continuità", "montaggio"],
    synonyms: ["30-degree rule", "jump cut avoidance"],
    content: {
      principiante:
        "Se due inquadrature consecutive sono troppo simili (stesso angolo, stessa dimensione), il montaggio produce un 'salto' visivo sgradevole: il jump cut. La regola dei 30° dice che la camera deve spostarsi di almeno 30° tra un take e l'altro, oppure cambiare piano (es. da medio a primo piano), per rendere il taglio impercettibile.",
      intermedio:
        "Il salto può essere angolare o dimensionale o entrambi. Un cambio di piano sufficiente (medio → primo piano) maschera il taglio anche senza spostamento angolare. La regola vale anche per i movimenti di macchina: un pan che si ferma e riprende dallo stesso punto crea jump cut.",
      avanzato:
        "Il jump cut può essere usato come stile (Godard, 'A bout de souffle'; serie TV contemporanee). La regola dei 30° è una convenzione della continuità classica, non una legge fisica: la percezione dipende anche dal contenuto dell'immagine e dal ritmo del montaggio.",
    },
    related: ["regola-180-gradi", "continuita-cinematografica", "montaggio-narrativo"],
    sources: [{ title: "In the Blink of an Eye, Walter Murch" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "continuita-cinematografica",
    slug: "continuita-cinematografica",
    title: "Continuità cinematografica",
    subtitle: "Il sistema che rende invisibile il montaggio.",
    categoryId: "regia",
    subcategoryId: "continuita",
    difficulty: "intermedio",
    shortDescription: "Principi di continuità: raccordo di sguardo, azione, posizione, suono.",
    keywords: ["continuità", "raccordo", "eye line", "match on action", "sound bridge"],
    synonyms: ["continuity editing", "eye-line match", "match cut", "continuity"],
    content: {
      principiante:
        "La continuità è il sistema di regole che rende il montaggio 'invisibile': lo spettatore non percepisce i tagli perché lo spazio, il tempo e l'azione sembrano ininterrotti. Comprende: raccordo di sguardo (eye-line match), raccordo sull'azione (match on action), raccordo di posizione (screen direction), raccordo di suono (sound bridge).",
      intermedio:
        "Sul set la continuity supervisor annota posizioni, costumi, accessori, luci e movimenti per garantire la coerenza tra take girati in giorni diversi. Il raccordo sull'azione taglia nel mezzo di un gesto, rendendo il taglio impercettibile perché l'occhio segue il movimento. Il sound bridge (J-cut/L-cut) anticipa o prolunga l'audio per fluidificare la transizione.",
      avanzato:
        "La continuità classica è una convenzione hollywoodiana (sistema di studio). Altri approcci (montaggio sovietico, Godard) la rifiutano deliberatamente. La continuità va progettata in pre-produzione (storyboard, shot list) e verificata in fase di montaggio; gli errori di continuity sono tra i più costosi da correggere.",
    },
    practical: "Assegna un continuity supervisor; fotografa i set e i costumi a fine giornata; usa il video assist per verificare i raccordi.",
    examples: ["Il raccordo sull'azione nella scena della doccia in 'Psycho'."],
    commonMistakes: ["Cambiare accessori tra take.", "Invertire la direzione di sguardo.", "Saltare il tempo senza transizione."],
    related: ["regola-180-gradi", "regola-30-gradi", "montaggio-narrativo"],
    sources: [{ title: "Continuity and Discontinuity in Film, Karen Pearlman" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "blocking-staging",
    slug: "blocking-staging",
    title: "Blocking e staging",
    subtitle: "La coreografia dei personaggi nello spazio scenico.",
    categoryId: "regia",
    subcategoryId: "storytelling",
    difficulty: "intermedio",
    shortDescription: "Progettazione dei movimenti dei personaggi e della camera nello spazio.",
    keywords: ["blocking", "staging", "coreografia", "spazio scenico"],
    synonyms: ["blocking", "staging", "choreography"],
    content: {
      principiante:
        "Il blocking è la disposizione e il movimento dei personaggi nello spazio scenico; lo staging è il modo in cui questo movimento viene ripreso dalla camera. Un buon blocking racconta la relazione tra i personaggi (vicinanza/distanza, potere, intimità) senza dialogo.",
      intermedio:
        "Si progetta a partire dallo script: si segnano le posizioni dei personaggi per ogni battuta (blocking diagram). Si considera la luce, la profondità di campo e il movimento della camera. Il 'rehearsal' (prove) è fondamentale per sincronizzare attori e camera.",
      avanzato:
        "Blocking dinamico: i personaggi si muovono per rivelare informazione (un personaggio che si avvicina = crescente tensione). Il blocking dialoga con l'asse di azione: i movimenti dei personaggi possono ridefinire l'asse. Nei piani sequenza il blocking è parte integrante del movimento della camera.",
    },
    practical: "Fai prove con i segnaposto (nastro) prima di chiamare gli attori; registra il blocking con il telefono per rivederlo.",
    examples: ["Il blocking di 'The Social Network' (Fincher) per le scene di dialogo."],
    commonMistakes: ["Blocking statico e frontale.", "Ignorare la profondità di campo.", "Non coordinare con la luce."],
    related: ["composizione-immagine", "movimenti-macchina", "regola-180-gradi"],
    sources: [{ title: "Directing Actors, Judith Weston" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "storytelling-visivo",
    slug: "storytelling-visivo",
    title: "Storytelling visivo",
    subtitle: "Raccontare con le immagini, non solo con le parole.",
    categoryId: "regia",
    subcategoryId: "storytelling",
    difficulty: "principiante",
    shortDescription: "Uso di immagine, colore, luce e movimento per narrare.",
    keywords: ["storytelling", "narrativa visiva", "simbolismo", "motif"],
    synonyms: ["visual storytelling", "visual narrative"],
    content: {
      principiante:
        "Lo storytelling visivo è l'arte di trasmettere informazioni, emozioni e significati attraverso le immagini: composizione, colore, luce, movimento, montaggio. Un buon film funziona anche senza dialoghi (es. i film muti, i corti Pixar).",
      intermedio:
        "Strumenti: il motivo visivo (ricorrenza di un colore, oggetto, inquadratura), il contrasto (luce/ombra, caldo/freddo), il simbolismo (un oggetto che rappresenta un'idea), la progressione (l'immagine evolve con il personaggio). La coerenza visiva crea un 'mondo' credibile.",
      avanzato:
        "Lo storytelling visivo dialoga con la sceneggiatura: ogni scelta visiva deve essere motivata dalla storia. Il 'show, don't tell' è il principio fondamentale. I registi autoriali (Malick, Tarkovsky) costruiscono significato principalmente per immagini.",
    },
    related: ["composizione-immagine", "generi-cinematografici", "montaggio-narrativo"],
    sources: [{ title: "The Visual Story, Bruce Block" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "campi-piani",
    slug: "campi-piani-cinematografici",
    title: "Campi e piani cinematografici",
    subtitle: "La nomenclatura dei piani per dimensione del soggetto.",
    categoryId: "regia",
    subcategoryId: "inquadrature",
    difficulty: "principiante",
    shortDescription: "Piano generale, figura intera, americano, medio, primo piano, dettaglio.",
    keywords: ["piano generale", "piano americano", "piano medio", "primo piano", "dettaglio"],
    synonyms: ["shot size", "long shot", "full shot", "american shot", "medium shot", "close-up", "extreme close-up"],
    content: {
      principiante:
        "I piani classici: piano generale (PG/LS) mostra il soggetto in un contesto ampio; piano figura intera (PI/FS) mostra il corpo intero; piano americano (PA/MS) taglia alla coscia; piano medio (PM/MCU) alla vita; primo piano (PP/CU) il viso; primissimo piano (PPP/ECU) dettaglio del viso; dettaglio (D/ECU) parte del corpo o oggetto.",
      intermedio:
        "La nomenclatura varia tra paesi (italiano, francese, inglese). Il piano americano deriva dal western (pistola alla coscia). Il 'two-shot' e il 'three-shot' inquadrano 2 o 3 personaggi. Il 'over-the-shoulder' (OTS) è un piano medio sporco usato nel dialogo.",
      avanzato:
        "La scelta del piano dialoga con la focale: un primo piano con 85mm comprime e isola; con 24mm distorce e contestualizza. I piani si combinano in sequenze per creare ritmo e informazione progressiva.",
    },
    related: ["tipologie-inquadrature", "composizione-immagine"],
    sources: [{ title: "Film Art: An Introduction" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "montaggio-narrativo",
    slug: "montaggio-narrativo",
    title: "Montaggio narrativo",
    subtitle: "Costruire la storia attraverso il taglio.",
    categoryId: "regia",
    subcategoryId: "montaggio",
    difficulty: "intermedio",
    shortDescription: "Principi di montaggio narrativo: ritmo, transizioni, ellissi.",
    keywords: ["montaggio", "narrativa", "ritmo", "ellissi", "transizione"],
    synonyms: ["narrative editing", "pacing", "ellipsis"],
    content: {
      principiante:
        "Il montaggio narrativo ordina i take per raccontare una storia. Principi: chiarezza (lo spettatore capisce dove/cosa/quando), continuità (raccordi), ritmo (durata dei take), ellissi (omettere il superfluo), transizioni (taglio secco, dissolvenza, stacco).",
      intermedio:
        "Il ritmo si costruisce con la durata dei take e la densità dell'azione. L'ellissi temporale (salto nel tempo) e l'ellissi spaziale (salto di luogo) comprimono la narrazione. Le transizioni (dissolvenza, stacco a nero, wipe) segnalano cambi di tempo/luogo/stato emotivo.",
      avanzato:
        "Il montaggio può essere 'invisibile' (continuità classica) o 'visibile' (sovietico, Godard). Il 'Kuleshov effect': il significato di un'inquadratura cambia in base a ciò che la precede/succede. Il montaggio dialoga con il suono (sound bridge) e con il colore (match cut cromatico).",
    },
    related: ["continuita-cinematografica", "jump-cut", "ritmo-montaggio"],
    sources: [{ title: "In the Blink of an Eye, Walter Murch" }],
    lastUpdated: "2026-11-14",
  },
  {
    id: "generi-cinematografici",
    slug: "generi-cinematografici",
    title: "Generi cinematografici",
    subtitle: "Le categorie narrative e le loro convenzioni.",
    categoryId: "regia",
    subcategoryId: "storytelling",
    difficulty: "principiante",
    shortDescription: "Dramma, commedia, thriller, horror, sci-fi, western e altri generi.",
    keywords: ["genere", "dramma", "commedia", "thriller", "horror", "sci-fi", "western"],
    synonyms: ["film genres", "genre conventions"],
    content: {
      principiante:
        "I generi cinematografici raggruppano film con convenzioni narrative, tematiche e stilistiche comuni: dramma, commedia, thriller, horror, fantascienza, western, noir, musical, documentario, animazione. I generi aiutano pubblico e industria a classificare e commercializzare.",
      intermedio:
        "Ogni genere ha 'tropes' e aspettative: il western ha il duello al tramonto, l'horror ha il jump scare. I film possono ibridare generi (horror-commedia). Il genere è anche un contratto con lo spettatore: rispettarlo o sovvertirlo è una scelta autoriale.",
      avanzato:
        "La teoria dei generi (Rick Altman) distingue tra 'semantic' (elementi ricorrenti) e 'syntactic' (struttura narrativa). I generi evolvono nel tempo (il western classico vs. il revisionist western). La produzione usa i generi per il marketing e il budgeting.",
    },
    related: ["storytelling-visivo"],
    sources: [{ title: "Film/Genre, Rick Altman" }],
    lastUpdated: "2026-11-14",
  },
];
