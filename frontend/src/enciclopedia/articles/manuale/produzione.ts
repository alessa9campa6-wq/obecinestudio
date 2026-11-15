import type { Article } from "../../types";

export const MANUALE_PRODUZIONE: Article = {
  id: "manuale-produzione",
  slug: "manuale-produzione",
  title: "Manuale di produzione",
  subtitle: "Ruoli, budget, piano di lavorazione e gestione del set.",
  categoryId: "produzione",
  difficulty: "intermedio",
  shortDescription:
    "Il capitolo completo sulla produzione: reparti, catena di comando, budget, piano di lavorazione, permessi, sicurezza e consegna.",
  keywords: ["manuale", "produzione", "budget", "piano di lavorazione", "call sheet"],
  synonyms: ["film production", "line producer", "production management"],
  content: {
    principiante:
      "Produrre significa trasformare un'intenzione in un piano che si può eseguire con le persone, i soldi e i giorni che hai. Un film non finisce perché manca il talento: finisce perché manca il tempo o il denaro.",
    intermedio:
      "Il budget si costruisce dal basso (voci reali) e si controlla dall'alto (percentuali per reparto). Il piano di lavorazione raggruppa le scene per location e per luce, non per ordine narrativo. Il call sheet è il documento che rende tutto eseguibile.",
    avanzato:
      "La produzione è gestione del rischio: meteo, permessi, disponibilità degli attori, sicurezza. Il producer esperto non evita i problemi, li prevede e ha un piano B economico per ognuno.",
  },
  inDepth: [
    {
      title: "La catena di comando e i reparti",
      body:
        "In una produzione professionale i ruoli sono definiti: produttore (soldi e decisioni), regista (visione), direttore della fotografia (immagine), aiuto regista (organizzazione del set), direttore di produzione (logistica e budget), scenografo, costumista, fonico, montatore. Ognuno ha un vice e una responsabilità chiara.\n\nLa catena di comando non è gerarchia fine a se stessa: serve a evitare che ogni decisione venga presa due volte. Sul set l'aiuto regista è il padrone del tempo, il direttore della fotografia del look, il regista della scena. Quando i ruoli si sovrappongono, il set rallenta.\n\nNelle troupe piccole i ruoli si accorpano, ma le funzioni restano: qualcuno deve pensare al tempo, qualcuno all'immagine, qualcuno al suono, qualcuno ai soldi. Se nessuno pensa al tempo, la giornata finisce a metà.",
    },
    {
      title: "Budget: dal basso e dall'alto",
      body:
        "Il budget si costruisce per voci: personale (giornate, cachet, contributi), attrezzatura (noleggio, trasporto, assicurazione), location (affitto, permessi, pulizia), trasporti, vitto e alloggio, post-produzione, musiche, assicurazione, imprevisti.\n\nLa lettura dall'alto dice se il budget è realistico: in un cortometraggio la post può essere il 20-30%, in un documentario il 25-40%. Se l'attrezzatura pesa più del 15% in un progetto a basso budget, probabilmente si sta noleggiando troppo.\n\nGli imprevisti non sono un lusso: si mette da parte il 10-15% per coprire meteo, malattia, permessi negati. Un budget senza imprevisti è un budget che si sfora.",
    },
    {
      title: "Piano di lavorazione: raggruppare per convenienza",
      body:
        "Il piano di lavorazione non segue la sceneggiatura: raggruppa le scene per location, per attori disponibili e per esigenze di luce. Si girano insieme tutte le scene in esterni diurni, poi tutte le notturne, poi gli interni di una location, anche se nella storia sono lontane.\n\nSi contano le pagine di sceneggiatura al giorno (1-3 per un lungometraggio, 4-6 per una fiction veloce), ma il numero vero dipende dai setup: una scena di dialogo con tre inquadrature è più veloce di un piano sequenza di mezza pagina.\n\nIl piano include i tempi di trasferimento, i tempi di trucco e costume, le pause. Un piano che prevede dieci ore di ripresa senza trasferimenti è un piano che esiste solo sulla carta.",
    },
    {
      title: "Permessi, location e sicurezza",
      body:
        "Girare in uno spazio pubblico richiede autorizzazioni comunali, che variano da città a città e hanno tempi diversi. Le location private richiedono contratti con clausole su danni, orari, numero di persone e uso delle immagini.\n\nLa sicurezza non è burocrazia: cavi coperti, estintori, persone formate per le luci, nessuno sopra i limiti di peso dei supporti, attenzione alle riprese con veicoli, droni solo con pilota certificato e assicurazione. Un incidente chiude la produzione e può chiudere la carriera.\n\nLe liberatorie per i volti e per le location vanno raccolte prima, non dopo. Un volto non liberato può impedire la distribuzione del film.",
    },
    {
      title: "Il set: tempo, comunicazione, problemi",
      body:
        "La giornata di ripresa si apre con la call: orari, location, meteo, scene previste, contatti. Il primo ciak arriva dopo il setup, che va preparato dalla squadra mentre gli attori sono in trucco.\n\nLa comunicazione è il vero collo di bottiglia: radio con canali separati, un aiuto regista che filtra le domande, un monitor per la regia. Le decisioni importanti si prendono in pochi, non in assemblea.\n\nI problemi si gestiscono con priorità: sicurezza, poi tempo, poi qualità. Un set che si ferma per una discussione estetica sta perdendo soldi; un set che ignora un problema di sicurezza sta rischiando tutto.",
    },
    {
      title: "Post-produzione e consegna",
      body:
        "La post è parte del budget e del piano, non un'appendice. Si pianificano: backup e archiviazione, montaggio, conform, grading, sound design, mix, musica, VFX, sottotitoli, mastering.\n\nI tempi reali sono più lunghi di quanto sembri: un cortometraggio può richiedere 4-8 settimane di post, un documentario 3-6 mesi. Il montaggio è iterativo: la prima versione non è quella finale.\n\nLa consegna ha specifiche precise (formati, loudness, color space, titoli). Il producer verifica che i file siano apribili e conformi prima di consegnare. Un film rifiutato al delivery è un film non venduto.",
    },
  ],
  tables: [
    {
      title: "Ripartizione indicativa di un budget indipendente",
      columns: ["Voce", "Quota", "Note"],
      rows: [
        ["Personale", "25-35%", "Include contributi"],
        ["Attrezzatura", "10-15%", "Noleggio e trasporto"],
        ["Location e permessi", "10-15%", "Affitti, pulizie"],
        ["Post-produzione", "20-30%", "Montaggio, color, audio"],
        ["Imprevisti", "10-15%", "Non negoziabile"],
      ],
    },
  ],
  practical:
    "Prima di dire sì a una data, chiedi: quante pagine al giorno, quante location, quanti attori, quanti giorni di post. Se una delle quattro risposte non torna, il piano non torna.",
  images: [],
  related: ["ruoli-reparti", "budget-produzione", "piano-lavorazione", "call-sheet"],
  sources: [
    { title: "Eve Light Honthaner, The Complete Film Production Handbook" },
    { title: "Myrl A. Schreibman, The Indie Producer's Handbook" },
    { title: "Normative locali su permessi e sicurezza sul set" },
  ],
  lastUpdated: "2026-11-15",
};
