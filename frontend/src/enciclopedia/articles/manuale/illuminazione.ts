import type { Article } from "../../types";
import { FIG_HMI } from "./figures";

export const MANUALE_ILLUMINAZIONE: Article = {
  id: "manuale-illuminazione",
  slug: "manuale-illuminazione",
  title: "Manuale di illuminazione",
  subtitle: "Luce dura e morbida, schemi, fotometria e continuità.",
  categoryId: "illuminazione",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sulla luce: qualità, direzione, rapporto, schemi classici, fotometria, temperatura colore e continuità tra inquadrature.",
  keywords: ["manuale", "illuminazione", "luce", "schema luci", "fotometria", "TLCI"],
  synonyms: ["lighting", "lighting design", "gaffer"],
  content: {
    principiante:
      "Illuminare non significa 'fare luce': significa decidere dove cade l'ombra. La posizione della fonte rispetto al volto racconta il personaggio prima che parli. Tutto il resto è potenza e qualità.",
    intermedio:
      "Una scena si costruisce con poche fonti: una principale (key), una di riempimento (fill), una di stacco (back) e una per lo sfondo. Il rapporto tra key e fill decide il contrasto; la dimensione della fonte decide la morbidezza; la distanza decide la caduta della luce.",
    avanzato:
      "La continuità è la parte difficile: la stessa scena può richiedere tre giorni e tre location diverse. Si tiene con misurazioni, riferimenti e una pianta luci scritta, non con la memoria.",
  },
  inDepth: [
    {
      title: "Durezza e morbidezza: la dimensione apparente della fonte",
      body:
        "Una luce è dura quando la sua dimensione apparente rispetto al soggetto è piccola: il sole, una lampada nuda, una torcia. Produce ombre nette, transizioni brusche e texture marcata. È una luce che rivela la pelle e le rughe, e per questo funziona nel noir, nel western e in tutto ciò che deve sembrare crudo. Una luce è morbida quando la fonte è grande rispetto al soggetto: un pannello, un diffusore ampio, un muro rimbalzato. Le ombre diventano graduali e il volto si ammorbidisce.\n\nLa morbidezza non dipende dalla potenza: dipende dalla dimensione apparente. Una luce potente e lontana è dura; una luce debole e vicina, con un diffusore grande, è morbida. Avvicinare la fonte (o aumentare il diffusore) è quasi sempre più efficace che aumentare la potenza.\n\nIl controllo della morbidezza è anche controllo della caduta: una fonte grande e vicina illumina il soggetto e cade rapidamente sullo sfondo; una fonte grande e lontana illumina in modo più uniforme. Questa differenza è ciò che separa un volto dall'ambiente.",
    },
    {
      title: "Direzione, altezza e rapporto",
      body:
        "La direzione della key rispetto all'asse macchina-soggetto decide il significato. Frontale: appiattisce, elimina le ombre, è la luce della TV e della commedia. Laterale a 45 gradi: modella il volto, è il classico ritratto. Laterale a 90: metà volto in ombra, tensione, dualità. Controluce: il soggetto è una silhouette, mistero o minaccia. Dal basso: inquietudine, perché il nostro cervello non è abituato a quella direzione.\n\nL'altezza conta quanto la direzione: una key troppo alta produce occhiaie, una troppo bassa produce un volto innaturale. La posizione di riferimento per un volto è appena sopra l'altezza degli occhi, leggermente di lato.\n\nIl rapporto key/fill si misura in stop. 1:1 è piatto, 2:1 (un stop) è naturale e leggero, 4:1 (due stop) è deciso, 8:1 (tre stop) è drammatico. In cinema il rapporto si sceglie per scena, ma deve restare coerente all'interno della scena: se il primo piano è 2:1 e il campo lungo 4:1, lo spettatore sente uno stacco senza sapere perché.",
    },
    {
      title: "Gli schemi classici e quando usarli",
      body:
        "Il three-point lighting (key, fill, back) è il punto di partenza, non un dogma. La key illumina il soggetto, il fill alleggerisce le ombre, il back separa il soggetto dallo sfondo. Funziona per interviste, ritratti, scene di dialogo in interni neutri.\n\nLo schema a 'Rembrandt' (key a 45 gradi e in alto, con un piccolo triangolo di luce sulla guancia in ombra) dà un ritratto pittorico e una sensazione di intimità. Il 'loop lighting' è più morbido e moderno. Il 'split lighting' divide il volto a metà ed è potentissimo per i personaggi ambigui. Il controluce con fill minimo è la base della suspense.\n\nPer gli esterni la key è il sole: si sceglie l'ora, si usa un diffusore per ammorbidirlo o un pannello bianco per rimbalzarlo. La regola pratica è non combattere il sole, ma posizionare il soggetto rispetto ad esso. Il resto lo fa il rapporto con l'ambiente.",
    },
    {
      title: "Fotometria: lumen, lux, candele e la distanza",
      body:
        "La luce si misura in lumen (flusso), lux (illuminamento su una superficie) e candele (intensità in una direzione). Per il cinema conta soprattutto l'illuminamento sul soggetto, che cala con il quadrato della distanza: raddoppiare la distanza divide la luce per quattro. È il motivo per cui una luce 'potente' lontana illumina meno di una luce piccola vicina.\n\nLe specifiche dei produttori spesso dichiarano lux a un metro: è un dato utile solo se sai a che distanza lavorerai. Per un volto in primo piano a due metri, la luce sarà un quarto di quella dichiarata a un metro. Il calcolo si fa prima di noleggiare, non sul set.\n\nLa temperatura colore si misura in kelvin: 3200 K tungsteno, 5600 K luce diurna. Mescolare fonti diverse richiede correzioni (gelatina CTO/CTB) o si accetta un mix, che a volte è voluto. Gli indici CRI e TLCI misurano la resa cromatica: sopra 95 sono affidabili, sotto 90 i colori della pelle iniziano a mentire.",
    },
    {
      title: "Pratica: costruire la luce di un volto",
      body:
        "Si parte dal fondo: che cosa deve essere visibile? Poi si posiziona la key rispetto al naso (che è l'ombra più difficile da nascondere) e si decide dove cade. Si controlla l'ombra sul lato opposto: se è troppo chiusa, si aggiunge fill con un pannello bianco o una luce morbida a bassa intensità; se è piatta, si toglie.\n\nIl back light separa il soggetto dallo sfondo e dà tridimensionalità. Va posizionato dietro e fuori dall'inquadratura, controllando che non produca flare nell'ottica. Lo sfondo si tratta a parte: può essere più chiaro del soggetto (alto key) o più scuro (low key), e questo cambia completamente l'atmosfera.\n\nLa regola di igiene: nessuna fonte senza una ragione. Ogni luce in più è un'ombra in più da controllare, un cavo in più da nascondere e un riflesso in più da evitare.",
    },
    {
      title: "Continuità e pianta luci",
      body:
        "La pianta luci è un disegno dall'alto con posizione di ogni fonte, altezza, potenza, diffusore e direzione. Serve a ripetere la scena il giorno dopo, o a far replicare il setup a un altro gaffer. Senza pianta, la continuità dipende dalla memoria, che è la risorsa più fragile di un set.\n\nSi annotano anche i valori: esposizione della key, rapporto col fill, temperatura, gelatine usate, altezza precisa. E si fanno foto del set da più angolazioni. Al cambio di scena si aggiorna la pianta, non si ricomincia da zero.\n\nQuando la luce naturale cambia (il sole si sposta), la continuità si difende con diffusori grandi, negativi e pannelli, oppure si gira in blocco tutto ciò che richiede quella luce. Il piano di lavorazione è anche un piano di luce.",
    },
    {
      title: "Errori frequenti e come si vedono in sala",
      body:
        "Il primo errore è illuminare tutto: un volto senza ombre è un volto senza forma. Il secondo è usare fonti di temperature diverse senza correggerle: la pelle diventa verde da una parte e arancione dall'altra. Il terzo è dimenticare lo sfondo: il soggetto è illuminato e dietro c'è un muro nero senza profondità.\n\nAltri errori: key troppo alta (occhiaie), riflessi negli occhiali non controllati, ombre della macchina o del boom nel quadro, luci visibili nei riflessi delle finestre, flicker dei LED con tempi di otturazione sbagliati. Tutti si vedono meglio su un monitor grande che sul display della camera.\n\nInfine: una scena sovrailluminata si può correggere in grading solo fino a un certo punto. Una scena ben esposta e ben direzionata si corregge quasi sempre.",
    },
  ],
  tables: [
    {
      title: "Rapporto key/fill e sensazione",
      columns: ["Rapporto", "Stop", "Effetto"],
      rows: [
        ["1:1", "0", "Piatto, tv, commedia"],
        ["2:1", "1", "Naturale, leggero"],
        ["4:1", "2", "Deciso, drammatico"],
        ["8:1", "3", "Molto contrastato, noir"],
      ],
    },
  ],
  practical:
    "Per un volto: key a 45 gradi e poco sopra gli occhi, fill al 50% della key, back per separare, sfondo trattato a parte. Misura, fotografa la pianta, annota i valori. Il giorno dopo ringrazierai te stesso.",
  images: [FIG_HMI],
  diagram: "three-point",
  related: ["luce-dura-morbida", "schemi-illuminazione", "temperatura-colore", "esposizione"],
  sources: [
    { title: "Blain Brown, Motion Picture and Video Lighting" },
    { title: "Richard Yot, Light for Visual Artists" },
    { title: "Specifiche fotometriche dei produttori di illuminatori" },
  ],
  lastUpdated: "2026-11-15",
};
