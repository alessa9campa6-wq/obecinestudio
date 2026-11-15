import type { Article } from "../../types";

export const MANUALE_SPECIALI: Article = {
  id: "manuale-speciali",
  slug: "manuale-speciali",
  title: "Manuale delle riprese speciali",
  subtitle: "Slow motion, timelapse, drone, green screen e virtual production.",
  categoryId: "speciali",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sulle tecniche speciali: alte velocità, intervalli, droni, chroma key, LED volume e riprese subacquee.",
  keywords: ["manuale", "slow motion", "timelapse", "drone", "green screen", "virtual production"],
  synonyms: ["speciality shots", "VFX plates", "high speed"],
  content: {
    principiante:
      "Le riprese speciali sono tecniche che cambiano il rapporto tra la macchina e il tempo, lo spazio o la realtà. Si usano quando il racconto lo richiede, non perché sono divertenti da fare.",
    intermedio:
      "Ogni tecnica ha un costo nascosto in tempo: lo slow motion richiede luce e memoria, il timelapse richiede attesa, il drone richiede permessi, il green screen richiede luce controllata e post.",
    avanzato:
      "La tecnica si sceglie in pre-produzione insieme a VFX e post. Un piano che sembra semplice sul set può richiedere settimane di compositing: se non è stato progettato, si rifà.",
  },
  inDepth: [
    {
      title: "Alte velocità: come funziona il rallentatore",
      body:
        "Il rallentatore si ottiene girando a più fotogrammi al secondo e proiettando a una velocità inferiore. A 120 fps riprodotti a 24, il tempo scorre cinque volte più lentamente. Non è un effetto di post: è una ripresa diversa, con conseguenze su luce, movimento e durata.\n\nLa luce è il primo problema: il tempo di otturazione si accorcia (a 120 fps con 180 gradi è 1/240), quindi serve molta più luce. Il secondo è la memoria: la stessa scena produce cinque volte i dati. Il terzo è il movimento: a velocità alta i gesti sembrano artificiali se non sono progettati.\n\nLe camere cinema raggiungono 120-240 fps, le camere dedicate (Phantom) superano i 1000. Per il web sono sufficienti 60-120 fps.",
    },
    {
      title: "Timelapse e hyperlapse",
      body:
        "Il timelapse è una sequenza di fotografie scattate a intervalli regolari e riprodotte a 24 fps: un'ora diventa pochi secondi. Richiede un intervallo corretto (in base alla durata dell'evento e alla durata finale), esposizione manuale e un supporto stabile.\n\nIl flicker (variazione di esposizione tra fotogrammi) si combatte con esposizione e bilanciamento manuali, diaframma fisso e, in post, con deflicker. L'hyperlapse aggiunge il movimento della macchina: si sposta il cavalletto di pochi centimetri tra uno scatto e l'altro.\n\nIl calcolo: durata finale (secondi) × 24 = numero di fotogrammi; intervallo = durata reale / numero di fotogrammi.",
    },
    {
      title: "Droni: regole prima di estetica",
      body:
        "Un drone è un aeromobile: in Italia richiede pilota certificato, assicurazione, registrazione e, in molti casi, autorizzazioni ENAC. Le zone vietate (aeroporti, centri abitati, aree militari, parchi) sono definite da mappe ufficiali.\n\nTecnicamente conta la stabilità (gimbal), la qualità del sensore e la gestione della luce: i droni piccoli hanno sensori piccoli e soffrono il controluce. Le riprese migliori sono quelle pianificate: traiettoria, quota, punto di interesse.\n\nLa sicurezza viene prima dell'inquadratura: mai sopra le persone, mai oltre la linea di vista, mai in condizioni di vento oltre i limiti del mezzo.",
    },
    {
      title: "Green screen e chroma key",
      body:
        "Il chroma key funziona quando il fondo è uniforme e separato dal soggetto. Serve luce sul fondo (separata da quella sul soggetto), distanza tra soggetto e fondo (almeno 1,5-2 m per evitare riflessi verdi), e un abbigliamento che non contenga il colore del fondo.\n\nLa luce sul soggetto deve essere coerente con l'ambiente che sarà inserito: se lo sfondo è un esterno soleggiato, il soggetto non può avere una luce morbida da studio. Il colore del key (verde o blu) dipende da ciò che indossa il soggetto e dal tipo di pelle.\n\nIn post contano il matte, il despill (rimozione del riflesso verde) e il match del colore. Un key mediocre costa più di un giorno di ripresa.",
    },
    {
      title: "Virtual production e LED volume",
      body:
        "Il LED volume è uno schermo curvo che mostra l'ambiente in tempo reale, tracciato dalla camera: il soggetto è illuminato dalla scena e vede il mondo intorno a sé. Riduce il lavoro di compositing e restituisce riflessi e luce credibili.\n\nRichiede un pipeline complesso: ambiente 3D in Unreal Engine, tracking della camera, sincronizzazione dei tempi, calibrazione del colore tra schermo e camera. È una tecnologia da produzione strutturata, non da cortometraggio a budget zero.\n\nL'alternativa è il green screen classico con plate girato. La differenza è nel tempo: il LED volume riduce la post ma richiede molto più tempo di preparazione.",
    },
    {
      title: "Riprese subacquee e ambienti difficili",
      body:
        "Sott'acqua la luce cambia: il rosso scompare con la profondità, il contrasto si abbassa, le particelle diffondono. Si usano filtri rossi, luci subacquee o si corregge in grading, sapendo che il colore perso non torna.\n\nLe custodie (housing) costano quanto una camera e vanno testate prima. La pressione, la condensa e la sicurezza dell’operatore sono parte del lavoro. In alternativa si usano action cam con buona resa, accettando limiti di dinamica.\n\nAltri ambienti difficili: polvere, sabbia, pioggia, caldo estremo, freddo. Ogni ambiente richiede protezioni, batterie adeguate e un piano di ripristino.",
    },
  ],
  practical:
    "Prima di scegliere una tecnica speciale, chiediti: che cosa aggiunge alla storia? Se la risposta è 'fa scena', probabilmente costerà molto e aggiungerà poco.",
  formulas: ["fotogrammi totali = durata finale (s) × 24", "intervallo timelapse = durata reale / fotogrammi totali"],
  images: [],
  related: ["slow-motion", "timelapse", "drone", "green-screen"],
  sources: [
    { title: "Regolamento ENAC sui droni (edizione vigente)" },
    { title: "ASC Manual, sezioni su high speed e VFX" },
    { title: "Documentazione Unreal Engine per virtual production" },
  ],
  lastUpdated: "2026-11-15",
};
