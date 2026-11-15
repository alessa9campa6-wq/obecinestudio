import type { Article } from "../../types";

export const MANUALE_LEGAL: Article = {
  id: "manuale-legal",
  slug: "manuale-legal",
  title: "Manuale di diritto e produzione",
  subtitle: "Copyright, liberatorie, contratti, privacy e droni.",
  categoryId: "legal",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sugli aspetti legali: diritto d'autore, liberatorie, contratti, musica, privacy, riprese in luoghi pubblici e droni.",
  keywords: ["manuale", "copyright", "liberatoria", "contratto", "privacy", "SIAE"],
  synonyms: ["film law", "clearance", "release form"],
  content: {
    principiante:
      "Ogni film è fatto di diritti: della storia, delle immagini, della musica, dei volti. Un diritto non acquisito è un problema che può impedire la distribuzione, anche a film finito.",
    intermedio:
      "Le liberatorie servono per persone e luoghi; i contratti per le opere e per le persone; le licenze per la musica e per i materiali di archivio. Ogni categoria ha documenti diversi e nessuno è facoltativo.",
    avanzato:
      "La legge varia per paese: un film pensato per il mercato internazionale deve rispettare le norme di ogni territorio di distribuzione. La consulenza legale si fa prima delle riprese, non dopo.",
  },
  inDepth: [
    {
      title: "Diritto d'autore: chi possiede che cosa",
      body:
        "Il diritto d'autore nasce con la creazione dell'opera e comprende diritti morali (paternità, integrità) e patrimoniali (sfruttamento economico). Chi scrive la sceneggiatura, chi compone la musica, chi dirige la fotografia e chi realizza il montaggio possono avere diritti diversi, a seconda del contratto e della legge nazionale.\n\nIl contratto di produzione serve a trasferire i diritti patrimoniali dal creativo al produttore. Senza cessione scritta, il produttore può non avere il diritto di sfruttare l'opera. In Italia la legge sul diritto d'autore (L. 633/1941) disciplina anche i diritti connessi degli artisti e dei produttori.\n\nLe opere derivate (adattamenti di romanzi, remake, biopic) richiedono l'acquisizione dei diritti dell'opera originale. 'Liberamente ispirato a' non è una formula che evita il problema.",
    },
    {
      title: "Liberatorie: persone, luoghi, cose",
      body:
        "La liberatoria (release) per una persona autorizza l'uso della sua immagine e della sua voce. Va firmata prima delle riprese e deve indicare l'uso previsto (film, promozione, durata, territori). Per i minori serve la firma di chi esercita la responsabilità genitoriale.\n\nPer i luoghi serve un contratto di utilizzo che specifichi orari, danni, numero di persone e uso delle immagini. Per gli oggetti di scena protetti (opere d'arte, marchi, prodotti) serve un'autorizzazione o la rimozione del marchio.\n\nLe comparse e le persone riconoscibili in un documentario richiedono attenzione particolare: la liberatoria scritta è la forma più sicura, ma in alcuni casi è sufficiente il consenso informato documentato.",
    },
    {
      title: "Musica e archivio: le licenze",
      body:
        "La musica è protetta da diritto d'autore (compositore ed editore) e da diritti connessi (esecutori, produttore fonografico). Usare un brano richiede entrambe le autorizzazioni, oltre al permesso di sincronizzazione con l'immagine.\n\nLa musica 'royalty free' non è gratis: è soggetta a licenza, che può limitare territori, durata, piattaforme e numero di visualizzazioni. Le librerie professionali specificano tutto nel contratto.\n\nI materiali d'archivio (film, foto, giornali) richiedono licenze specifiche e spesso costano in base all'uso. La ricerca delle fonti e dei diritti va fatta in pre-produzione: un archivio trovato in montaggio può far saltare una scena.",
    },
    {
      title: "Privacy e riprese in luoghi pubblici",
      body:
        "Riprendere in un luogo pubblico è generalmente possibile, ma la pubblicazione delle immagini è soggetta al GDPR e alle norme sulla protezione dei dati personali. Le persone riconoscibili hanno diritto alla propria immagine, soprattutto in contesti sensibili (salute, religione, orientamento sessuale).\n\nNei documentari si usa spesso il consenso informato, con spiegazione dello scopo e delle modalità di diffusione. Le riprese di minori richiedono particolare cautela e autorizzazioni specifiche.\n\nLe telecamere di sorveglianza, i droni e le riprese in luoghi privati hanno regole ulteriori. La domanda da farsi è: il soggetto può essere identificato? Se sì, serve una base giuridica per il trattamento.",
    },
    {
      title: "Contratti e assicurazioni",
      body:
        "I contratti principali: cessione dei diritti sulla sceneggiatura, contratto con il regista e con i capireparto, contratti con gli attori (che includono uso dell'immagine e della voce), contratti di noleggio attrezzatura e di location.\n\nL'assicurazione copre danni a persone e cose, interruzione della produzione, attrezzatura. Per le produzioni con stunt, armi, veicoli o droni serve una copertura specifica. Un incidente non assicurato può chiudere la società di produzione.\n\nLa catena dei diritti va documentata: ogni contratto firmato, ogni liberatoria archiviata, ogni licenza registrata. In fase di vendita il distributore chiederà questa documentazione (chain of title).",
    },
    {
      title: "Droni e riprese aeree: normativa",
      body:
        "In Italia i droni sono aeromobili e ricadono nel regolamento ENAC e nelle norme europee EASA. Le regole principali: registrazione del pilota, certificazione delle competenze, assicurazione RC, limiti di altezza (120 m), divieto di sorvolo di persone non coinvolte, zone geografiche vietate.\n\nPer operazioni in aree urbane o in prossimità di aeroporti serve un'autorizzazione specifica. Le riprese notturne e i voli oltre la linea di vista richiedono procedure dedicate.\n\nLa responsabilità è del pilota e dell'operatore: un volo non autorizzato può comportare sanzioni e la perdita del materiale. La normativa cambia: va verificata prima di ogni produzione.",
    },
  ],
  practical:
    "Prima delle riprese: elenca ogni diritto che stai usando (storia, volti, luoghi, musica, archivio) e per ognuno indica il documento che lo copre. Se manca, acquisiscilo o cambia piano.",
  images: [],
  related: ["copyright", "liberatorie", "musica-licenze", "privacy"],
  sources: [
    { title: "Legge 22 aprile 1941 n. 633 sul diritto d'autore" },
    { title: "Regolamento (UE) 2016/679 (GDPR)" },
    { title: "Regolamento ENAC sui sistemi aeromobili a pilotaggio remoto" },
  ],
  lastUpdated: "2026-11-15",
};
