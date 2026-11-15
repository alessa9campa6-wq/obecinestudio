import type { Article } from "../../types";

export const MANUALE_COLOR: Article = {
  id: "manuale-color",
  slug: "manuale-color",
  title: "Manuale di colore e grading",
  subtitle: "Spazi colore, bilanciamento, look e consegna.",
  categoryId: "color",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sul colore: spazio colore, log, bilanciamento primario, secondari, LUT, gestione del colore e QC di consegna.",
  keywords: ["manuale", "colore", "grading", "LUT", "Rec.709", "HDR"],
  synonyms: ["color grading", "color correction", "color science"],
  content: {
    principiante:
      "Correggere il colore significa rendere coerenti le inquadrature; fare grading significa dare al film un'identità cromatica. Sono due fasi diverse e si fanno in quest'ordine: prima si sistema, poi si interpreta.",
    intermedio:
      "Il grading lavora su tre livelli: primari (esposizione, bilanciamento, contrasto), secondari (selezioni di aree o colori) e look (curva, saturazione, texture). Ogni intervento va fatto con un monitor calibrato, altrimenti si sta indovinando.",
    avanzato:
      "La gestione del colore è una catena: camera, spazio di lavoro, monitor, delivery. Se un passaggio è sbagliato, il risultato è imprevedibile. Il grading professionale è tanto tecnica quanto gusto.",
  },
  inDepth: [
    {
      title: "Spazi colore: che cosa significa 'lavorare in log'",
      body:
        "Un'immagine log non è un'immagine 'brutta da correggere': è un contenitore che distribuisce i valori in modo da conservare più informazioni. La conversione a uno spazio di visualizzazione (Rec.709 per il web, DCI-P3 per il cinema) avviene in grading, con una trasformazione controllata.\n\nLo spazio di lavoro ideale è lineare o logaritmico ampio (ACES, DaVinci Wide Gamut). Lì si fanno i bilanciamenti; poi si converte al display. Lavorare direttamente in Rec.709 su materiale log significa sacrificare informazione e non poter tornare indietro.\n\nLa regola pratica: la timeline deve sapere quale spazio colore stai trattando. Se il software interpreta male il materiale, i colori sembrano slavati o troppo saturi e ogni correzione peggiora la situazione.",
    },
    {
      title: "Bilanciamento primario: esposizione, temperatura, tinta",
      body:
        "Il primo passaggio è il bilanciamento: portare l'esposizione a un livello coerente e neutralizzare le dominanti. Si usa il waveform per l'esposizione e il vectorscopio per la tinta. Il bilanciamento si fa su un elemento neutro noto: un pannello grigio, un muro bianco, una camicia.\n\nLa temperatura colore sposta l'asse blu-giallo, la tinta l'asse verde-magenta. Un volto corretto ha la pelle sul vettore della linea della pelle, leggermente verso il rosso. Se la pelle è verde o cianotica, nessuna quantità di saturazione la salverà.\n\nSi corregge prima l'intera inquadratura, poi eventualmente le zone. Un errore comune è iniziare dai secondari: si finisce per compensare un problema globale con dieci interventi locali.",
    },
    {
      title: "Contrasto e curva: il carattere dell'immagine",
      body:
        "La curva tonale decide come si distribuiscono le luci e le ombre. Una curva con il punto nero alzato dà un'immagine 'lavata' e moderna; un nero pieno dà contrasto e peso; un roll-off morbido sulle alte luci protegge i bianchi.\n\nIl contrasto si può costruire per canali (curva RGB) o per luminanza. Il primo cambia la saturazione, il secondo la conserva. Per un look cinematografico si lavora spesso sulla luminanza e si aggiunge saturazione con parsimonia.\n\nLe ombre colorate (teal) e le alte luci calde (orange) sono un cliché del blockbuster, non una regola. Il look deve venire dal riferimento del film, non da un preset.",
    },
    {
      title: "Secondari: selezioni, maschere e precisione",
      body:
        "I secondari servono a intervenire su una porzione dell'immagine: il cielo, la pelle, un oggetto, una finestra. Si fanno con qualificatori (HSL), maschere disegnate o tracciati automatici. La regola è che il secondario non deve 'vedersi': se la maschera è visibile, è troppo forte.\n\nLa pelle è il secondario più delicato: si isola con una qualificazione che include rosso e arancione e si controlla sul vettore. Il cielo è il più comune: si abbassa la luminanza, si satura leggermente, si evita il banding. Gli oggetti di scena possono richiedere tracciati in movimento.\n\nOgni maschera va controllata in movimento, non su un frame fermo. Un secondario perfetto su un fotogramma può tremare su ventiquattro.",
    },
    {
      title: "LUT: quando aiutano e quando ingannano",
      body:
        "Una LUT è una tabella di conversione: dato un valore in ingresso, restituisce un valore in uscita. Si usa per convertire log in Rec.709, per simulare una pellicola o per un look condiviso tra set e post. Non 'corregge' un'esposizione sbagliata e non sostituisce il grading.\n\nLe LUT tecniche (trasformazioni di spazio colore) sono affidabili se corrispondono esattamente alla camera e al profilo usato. Le LUT creative sono punti di partenza, spesso troppo contrastate per un uso diretto.\n\nLa LUT di monitoraggio sul set serve a vedere un'approssimazione del risultato: se cambia la percezione dell'esposizione, va sostituita. Se il regista si innamora della LUT di monitoraggio, il grading dovrà replicarla, non ignorarla.",
    },
    {
      title: "Gestione del colore e monitor calibrati",
      body:
        "Un monitor non calibrato è un monitor che mente. La calibrazione si fa con sonda su una superficie neutra, in una stanza con luce controllata e pareti neutre. La frequenza consigliata è trimestrale per un monitor di grading, mensile per un monitor di reference.\n\nLa catena include: scheda video con uscita calibrata, monitor con LUT interna, ambiente a 6500 K e 100 nit (SDR) o 1000 nit (HDR). Le luci della stanza non devono riflettersi sullo schermo e non devono essere colorate.\n\nIl grading 'a occhio' su un portatile in una stanza con finestre è la fonte più comune di consegne sbagliate. Il cliente vede il film su un televisore in modalità vivida: se il grading è stato fatto male, il risultato peggiora ancora.",
    },
    {
      title: "Delivery: SDR, HDR e controllo qualità",
      body:
        "Il delivery SDR (Rec.709, 100 nit) resta lo standard per web e broadcast. Il delivery HDR (PQ o HLG, 1000 nit) richiede un grading separato: non è un upgrade automatico, perché le alte luci e le ombre si distribuiscono diversamente.\n\nPer il cinema il riferimento è DCI-P3 con gamma 2.6 e luminanza 48 nit (standard DCI). Per il web si consegna spesso Rec.709 gamma 2.4 o 2.2 a seconda della piattaforma.\n\nIl QC finale verifica: banding nei cieli e nei gradienti, clipping delle alte luci, coerenza tra inquadrature, pelle naturale, neri non 'croccanti'. Un film può essere tecnicamente corretto e cromaticamente incoerente: il QC guarda entrambe le cose.",
    },
  ],
  tables: [
    {
      title: "Spazi colore e delivery",
      columns: ["Spazio", "Uso", "Luminanza"],
      rows: [
        ["Rec.709", "Web, broadcast SDR", "100 nit"],
        ["DCI-P3", "Cinema", "48 nit"],
        ["Rec.2020 / PQ", "HDR", "1000+ nit"],
        ["ACES", "Spazio di lavoro", "scene-referred"],
      ],
    },
  ],
  practical:
    "Prima del grading: monitor calibrato, stanza neutra, riferimento del film, un fotogramma 'campione' per ogni scena. Correggi nell'ordine: esposizione, bilanciamento, contrasto, secondari, look. Poi guarda tutto di fila.",
  images: [],
  diagram: "color-wheel",
  related: ["spazi-colore", "bilanciamento-colore", "lut", "contrasto"],
  sources: [
    { title: "Alexis Van Hurkman, Color Correction Handbook" },
    { title: "Steve Hullfish, The Art and Technique of Digital Color Correction" },
    { title: "Specifiche ACES e Rec. ITU-R BT.709" },
  ],
  lastUpdated: "2026-11-15",
};
