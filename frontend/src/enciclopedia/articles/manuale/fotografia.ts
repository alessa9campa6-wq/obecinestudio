import type { Article } from "../../types";
import { FIG_FX6_SET } from "./figures";

export const MANUALE_FOTOGRAFIA: Article = {
  id: "manuale-fotografia",
  slug: "manuale-fotografia",
  title: "Manuale di fotografia cinematografica",
  subtitle: "Esposizione, latitudine, colore e controllo dell'immagine.",
  categoryId: "fotografia",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sull'immagine: triangolo dell'esposizione, ISO nativi, gamma dinamica, log, esposimetri, ND e continuità tra take.",
  keywords: ["manuale", "fotografia", "esposizione", "gamma dinamica", "log", "ND"],
  synonyms: ["cinematography", "director of photography", "exposure"],
  content: {
    principiante:
      "Fotografare per il cinema significa decidere quanta luce arriva al sensore e come quella luce viene interpretata. Tre parametri la controllano: diaframma, tempo di otturazione e sensibilità. Il resto — filtri, luci, colori — serve a rendere quella decisione ripetibile.",
    intermedio:
      "L'esposizione non è un valore unico ma una scelta di compromesso: proteggere le alte luci, conservare il dettaglio nelle ombre, mantenere il diaframma che serve alla messa in scena. Il formato di registrazione (log, RAW) decide quanto margine hai per correggere dopo.",
    avanzato:
      "Il lavoro del direttore della fotografia è la coerenza: la stessa scena girata in tre giorni, con luce che cambia, deve sembrare un unico momento. Si ottiene con misurazioni, riferimenti e un look deciso prima del set, non in grading.",
  },
  inDepth: [
    {
      title: "Il triangolo dell'esposizione, senza miti",
      body:
        "Il diaframma controlla quanta luce passa e quanto è profonda la messa a fuoco. Il tempo di otturazione controlla per quanto tempo il sensore raccoglie luce e quanto movimento viene mosso. L'ISO controlla quanta amplificazione viene applicata al segnale. Sono tre manopole collegate: chiudere di uno stop il diaframma richiede il doppio della luce o il doppio del tempo, e cambiare uno dei due cambia il risultato visivo.\n\nIn cinema il tempo di otturazione non è libero: l'angolo di otturatore standard è 180 gradi, cioè metà del tempo di un fotogramma. A 25 fps significa 1/50 di secondo; a 50 fps, 1/100. Questo produce il motion blur che percepiamo come naturale. Se aumenti la velocità dell'otturatore per recuperare luce, il movimento diventa 'a scatti' come in Saving Private Ryan: è una scelta espressiva, non un espediente.\n\nL'ISO, nelle camere digitali, non è sensibilità del sensore: è un'amplificazione del segnale, e ogni camera ha uno o due valori nativi in cui il rumore è minimo. Esporre 'a ISO alti' non aumenta la luce catturata: la riduce, perché ti obbliga a chiudere o a tempi più brevi. La regola vera è: scegli l'ISO nativo, poi aggiusta con la luce.",
    },
    {
      title: "Gamma dinamica, alte luci e il mito del 'recupero in post'",
      body:
        "La gamma dinamica è la distanza tra il nero più profondo e il bianco più luminoso che il sensore riesce a registrare contemporaneamente. Si misura in stop. Una camera dichiarata a 15 stop non li offre tutti uguali: le alte luci tendono a saturare in modo brusco, le ombre contengono rumore. Sapere dove sta il punto di rottura della propria camera è più utile di qualsiasi specifica.\n\nIn pratica si espone 'verso le alte luci': si proteggono i bianchi, accettando ombre più chiuse che il grading potrà aprire. Il motivo è semplice: un'area completamente bianca ha perso l'informazione, un'area scura no. Il cosiddetto 'recupero' in post funziona entro un margine, e ogni stop recuperato porta con sé rumore e colore sporco.\n\nIl monitor on-set serve a questo: waveform e false color dicono dove stai saturando, non come sarà il film. Il look finale si giudica su un monitor calibrato, non sullo schermo della camera.",
    },
    {
      title: "Log, RAW e spazio colore: che cosa stai davvero registrando",
      body:
        "Un profilo log comprime i contrasti per far stare più informazioni nella registrazione: l'immagine appare piatta e grigia perché i valori sono distribuiti in modo da conservare alte luci e ombre. Non è un difetto, è un contenitore. Il RAW, invece, registra i dati del sensore prima dell'interpretazione: più margine, più spazio, più lavoro in post.\n\nLa scelta dipende dal delivery e dal tempo. Un documentario con 40 ore di girato e una settimana di post non dovrebbe lavorare in RAW: il costo di storage e conform supera il beneficio. Una pubblicità con tre giorni di girato e un mese di post può permetterselo.\n\nLo spazio colore (Rec.709, DCI-P3, Rec.2020) e la curva (S-Log3, LogC, V-Log) vanno decisi prima: le LUT di monitoraggio servono a vedere un'approssimazione del risultato, non a 'sistemare' l'immagine. Se la LUT cambia l'esposizione percepita, la LUT è sbagliata.",
    },
    {
      title: "Misurare la luce: esposimetro, waveform, falsi colori",
      body:
        "L'esposimetro incidente misura la luce che cade sul soggetto ed è il più affidabile per ricostruire un volto: si punta verso la macchina da presa, dalla posizione del viso, e si legge l'illuminamento. L'esposimetro riflesso misura la luce che torna indietro e viene ingannato da superfici chiare o scure.\n\nIl waveform mostra i valori del segnale: la pelle di un volto chiaro sta intorno al 60-70% (in un'immagine Rec.709), un bianco referenza al 90%, il nero al 2-5%. Il false color mappa questi valori in colori: verde per la pelle, giallo per le alte luci, blu per le ombre. Gli zebra segnalano le aree che stanno per saturare.\n\nLa competenza sta nel costruire un riferimento stabile: un pannello grigio 18% nell'inquadratura, una lettura incidente sul volto, un valore di waveform da ripetere take dopo take. Senza riferimento, ogni cambio di luce diventa una nuova esposizione da inventare.",
    },
    {
      title: "Filtri ND e controllo della profondità di campo",
      body:
        "In esterni la luce è spesso troppa per l'apertura che serve. I filtri ND riducono la quantità di luce senza cambiare il colore, permettendo di mantenere il diaframma scelto e l'angolo di otturatore corretto. Senza ND si finisce a chiudere il diaframma, perdendo la separazione dei piani che la scena richiede.\n\nLa densità si misura in stop: ND 0.3 = 1 stop, 0.6 = 2, 0.9 = 3, 1.2 = 4. I filtri variabili sono comodi ma possono introdurre dominanti e il pattern a 'X' ad alte densità; i filtri fissi di qualità sono più affidabili. I filtri IR correggono la deriva verso il magenta dei sensori molto sensibili all'infrarosso.\n\nSul set conviene avere una scala di ND (0.3, 0.6, 0.9, 1.2) e un porta-filtri nel matte box, così il cambio è veloce e non sposta la macchina.",
    },
    {
      title: "Il look si decide prima: luce, lente, colore",
      body:
        "Il 'look' di un film non nasce in grading: nasce dalla combinazione di luce, ottica e trattamento del colore. Una luce morbida e frontale con una lente vintage produce un'immagine completamente diversa da una luce dura laterale con una lente moderna. Il grading può accentuare una direzione, non inventarla.\n\nPrima del set si definiscono tre riferimenti: un'immagine di riferimento per il contrasto, una per il colore della pelle, una per il colore dell'ambiente. Servono a rispondere a una domanda concreta: 'questa scena è più calda o più fredda della precedente?'. Senza riferimenti, ogni reparto tira dalla parte che preferisce.\n\nLa coerenza tra interni ed esterni si costruisce bilanciando la luce artificiale sulla temperatura dell'ambiente o facendo il contrario, ma decidendolo prima. La macchina da presa non 'corregge' la luce: la registra.",
    },
    {
      title: "Errori che costano il girato",
      body:
        "Esporre a occhio sul monitor della camera: il monitor è piccolo, luminoso e non calibrato. Non usare un riferimento grigio: ogni cambio di setup diventa una nuova esposizione. Cambiare ISO invece della luce: il rumore aumenta e la latitudine si restringe. Dimenticare i ND: la profondità di campo cambia tra una scena e l'altra e in montaggio si vede.\n\nAltri errori frequenti: non controllare il flicker delle luci a LED con tempi di otturazione diversi da quelli di rete; non verificare la copertura delle ottiche sul formato scelto (vignettatura); non fare un test di registrazione e backup prima del primo ciak. Il girato non torna indietro.",
    },
  ],
  formulas: [
    "tempo di otturazione = 1 / (fps × 2) con angolo di otturatore 180°",
    "focale equivalente = focale × crop factor",
    "stop di ND: 0.3 = 1 stop, 0.6 = 2, 0.9 = 3, 1.2 = 4",
  ],
  practical:
    "Prima di ogni scena: pannello grigio in quadro, lettura incidente sul volto, waveform tra 60 e 70% sulla pelle, ND che riporta il diaframma al valore deciso. Poi si gira.",
  tables: [
    {
      title: "Riferimenti di esposizione in Rec.709",
      columns: ["Elemento", "Valore waveform", "Note"],
      rows: [
        ["Pelle chiara", "60-70%", "Non superare 75%"],
        ["Bianco referenza", "90%", "Oltre: clipping"],
        ["Grigio 18%", "45-50%", "Riferimento neutro"],
        ["Nero", "2-5%", "Sotto: rumore"],
      ],
    },
  ],
  images: [FIG_FX6_SET],
  diagram: "exposure-triangle",
  related: ["esposizione", "gamma-log", "profondita-di-campo", "filtri-nd-cpl"],
  sources: [
    { title: "Blain Brown, Cinematography: Theory and Practice" },
    { title: "David Stump, Digital Cinematography" },
    { title: "ARRI, Sony, Blackmagic: white paper sui sensori" },
  ],
  lastUpdated: "2026-11-15",
};
