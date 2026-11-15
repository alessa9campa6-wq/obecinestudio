import type { Article } from "../types";

// Approfondimenti lunghi per le voci più consultate. Vengono uniti agli articoli
// nel barrel, così il contenuto resta separato e facile da estendere.
export const APPROFONDIMENTI: Record<string, NonNullable<Article["inDepth"]>> = {
  "tipologie-inquadrature": [
    { title: "Scegliere il piano prima di girare", body: "La scelta del piano non è estetica: decide quante informazioni vede lo spettatore e quanto spazio ha l'attore. Un campo lungo racconta l'ambiente e la relazione tra i personaggi; un primo piano elimina il contesto e rende tutto interiore. Sul set conviene chiedersi, per ogni scena, quali informazioni servono in quel momento e quale piano le rende leggibili senza spiegazioni." },
    { title: "La scala dei piani in pratica", body: "Campo lunghissimo, campo lungo, campo medio, figura intera, piano americano, mezzo busto, primo piano, primissimo piano, dettaglio. La sequenza non è rigida, ma aiuta a mantenere coerenza: se una scena alterna continuamente piani molto diversi senza motivo, lo spettatore perde l'orientamento. La regola pratica è coprire ogni scena con almeno un piano d'ambiente e uno di raccordo, poi aggiungere i dettagli emotivi." },
  ],
  "movimenti-macchina": [
    { title: "Movimento motivato", body: "Un movimento di macchina funziona quando ha una ragione: segue un personaggio, rivela qualcosa, cambia il punto di vista. Il pan e il tilt esplorano lo spazio; il dolly avvicina o allontana; il tracking accompagna; la gru cambia quota e prospettiva. Se il movimento non aggiunge informazione o emozione, spesso è meglio un piano fisso ben composto." },
    { title: "Ergonomia e tempi sul set", body: "Ogni movimento richiede preparazione: binari, gimbal, steadycam o testa fluida. I movimenti più semplici sono anche i più veloci da ripetere. Sul set si prova prima il movimento a vuoto, si segnano i riferimenti a terra e si decide il punto di partenza e di arrivo. Un movimento lento e controllato è quasi sempre più elegante di uno veloce e impreciso." },
  ],
  "regola-180-gradi": [
    { title: "Perché l'asse immaginario conta", body: "In una scena di dialogo, la linea immaginaria tra i due personaggi divide lo spazio in due metà. Se la camera resta nella stessa metà, lo spettatore vede sempre A a sinistra e B a destra. Se la attraversa, i due sembrano guardarsi nella stessa direzione e la scena perde senso. Non è una legge fisica, ma una convenzione che il pubblico percepisce come errore." },
    { title: "Come si risolve un attraversamento", body: "Quando serve cambiare lato, si inserisce un piano neutro (frontale, dettaglio, inserto) che giustifica il nuovo punto di vista, oppure si mostra il movimento della camera. In alternativa si può attraversare volutamente la linea per creare disagio, ma deve essere una scelta narrativa riconoscibile e coerente." },
  ],
  esposizione: [
    { title: "Il triangolo dell'esposizione", body: "Apertura, tempo e ISO formano un triangolo: cambiare uno dei tre cambia la luce o il look. Aprire il diaframma aumenta la luce ma riduce la profondità di campo; allungare il tempo aumenta la luce ma introduce motion blur; alzare gli ISO schiarisce ma aggiunge rumore. Sul set si parte dal look desiderato e si adattano gli altri due fattori." },
    { title: "Esporre per il soggetto, non per il monitor", body: "Il monitor della camera non è affidabile per giudicare l'esposizione. Si usano waveform, zebre e false color. In Log si espone più alto del normale per proteggere le alte luci; in RAW si sceglie il punto di esposizione in base all'immagine finale. La regola è semplice: proteggi le alte luci, perché il rumore nelle ombre si recupera meglio di un bianco bruciato." },
  ],
  diaframma: [
    { title: "F-stop e T-stop", body: "Il numero f descrive un rapporto geometrico tra focale e apertura. Il T-stop misura la luce che arriva davvero al sensore, tenendo conto delle perdite delle lenti. Per questo le ottiche cinema si misurano in T: due obiettivi a T2.0 danno la stessa esposizione, anche se il loro f-number è diverso. Nei set professionali si ragiona in T per mantenere coerenza tra le focali." },
    { title: "Scala degli stop", body: "Ogni stop raddoppia o dimezza la luce: f/1.4, f/2, f/2.8, f/4, f/5.6, f/8, f/11, f/16. I mezzi stop e i terzi di stop permettono regolazioni più fini. La scala è geometrica, non lineare: tra f/2 e f/2.8 c'è la stessa quantità di luce che tra f/8 e f/11." },
  ],
  iso: [
    { title: "ISO e doppia sensibilità", body: "Nelle camere digitali l'ISO non cambia la quantità di luce raccolta, ma amplifica il segnale. Molte camere cinema hanno due circuiti di guadagno (dual base ISO): uno per la luce normale e uno per la bassa luce, con rumore più contenuto. Conoscere il secondo ISO nativo della propria camera è uno dei trucchi più utili per girare di notte." },
    { title: "ISO e dynamic range", body: "Alzare l'ISO non aumenta il range dinamico: spesso lo riduce, perché amplifica anche il rumore. In Log si sceglie un ISO di base e si espone per proteggere le alte luci. In RAW si può recuperare molto in post, ma non tutto: un'immagine sottoesposta di tre stop avrà comunque ombre più povere." },
  ],
  "shutter-speed": [
    { title: "Il 180° come punto di partenza", body: "Con shutter a 180° e 24 fps il tempo di esposizione è 1/48 di secondo, che produce un motion blur naturale e vicino a quello del cinema analogico. È la convenzione più diffusa, non un obbligo. Tempi più corti rendono il movimento più secco e innaturale; tempi più lunghi lo sfocano e possono creare scie." },
    { title: "Quando cambiare", body: "Per lo slow motion si aumenta il frame rate e si riduce il tempo di esposizione per evitare blur eccessivo. Per un look più crudo si può scendere a 90° o 45°. Per un effetto sognante si allunga il tempo, ma serve un supporto stabile e attenzione alle luci flicker." },
  ],
  "profondita-di-campo": [
    { title: "I quattro fattori", body: "La profondità di campo dipende da apertura, focale, distanza dal soggetto e dimensione del sensore. A parità di inquadratura, un sensore più grande e una focale più lunga riducono la zona a fuoco. Chiudere il diaframma la allarga, ma riduce la luce e può introdurre diffrazione." },
    { title: "Iperfocale e focus pulling", body: "L'iperfocale è la distanza oltre la quale tutto è a fuoco fino all'infinito. Si usa per i campi lunghi e per le riprese in movimento. Nei primi piani la zona a fuoco può essere di pochi centimetri: serve un focus puller, segnare i riferimenti e provare il movimento prima del ciak. Un fuoco che respira durante il take è difficile da recuperare in post." },
  ],
  "focal-length": [
    { title: "Focale e punto di vista", body: "La focale non cambia solo l'ampiezza dell'inquadratura: cambia la relazione tra soggetto e sfondo. Un grandangolo esagera la prospettiva e allontana lo sfondo; un tele la comprime e avvicina i piani. Per questo la scelta della focale è una scelta narrativa, non solo tecnica." },
    { title: "Equivalenti e crop", body: "Su sensori più piccoli la stessa focale dà un'immagine più stretta. Il crop factor permette di calcolare la focale equivalente in full frame, ma non cambia la prospettiva reale. Per confrontare due camere conviene ragionare sull'angolo di campo, non solo sui millimetri." },
  ],
  "sensori-digitali": [
    { title: "Formati a confronto", body: "Full frame, Super 35, APS-C e Micro Quattro Terzi cambiano profondità di campo, angolo di campo e resa in bassa luce. Il Super 35 resta lo standard del cinema per il rapporto tra dimensione, ottiche disponibili e costi. Il full frame è sempre più diffuso per il look e la sensibilità, ma richiede ottiche e messa a fuoco più precise." },
    { title: "Leggere il sensore", body: "La dimensione fisica del sensore conta più dei megapixel. Un sensore grande con pochi megapixel ha fotodiodi più grandi e spesso migliori prestazioni in bassa luce. La risoluzione utile dipende anche dal codec, dall'ottica e dalla finestra di ripresa: girare in 4K da un sensore 6K permette di ricomporre e rifinire." },
  ],
  "gamma-log": [
    { title: "Perché si gira in Log", body: "La curva Log comprime le alte luci e distribuisce meglio i valori, conservando più informazioni nel range dinamico. L'immagine appare piatta e desaturata sul monitor, ma in post si recupera molto di più. È il modo standard per girare quando il risultato finale richiede grading." },
    { title: "Esporre in Log", body: "In Log si espone più alto del normale, proteggendo le alte luci senza bruciarle. Ogni produttore ha la sua curva e le sue raccomandazioni: S-Log3, V-Log, LogC, BRAW. Le LUT di monitor servono solo a vedere un'anteprima, non a fissare l'esposizione. La trasformazione in Rec.709 o HDR si fa in color grading." },
  ],
  "luce-dura-morbida": [
    { title: "Durezza e dimensione della sorgente", body: "La luce è dura quando la sorgente è piccola rispetto al soggetto, morbida quando è grande. Il sole è una sorgente enorme ma lontanissima: per questo produce ombre nette. Un pannello grande e vicino al volto produce ombre graduali e pelle più liscia. La dimensione apparente, non la potenza, decide la morbidezza." },
    { title: "Usarle insieme", body: "Sul set si combinano: una key dura per definire, un fill morbido per riempire, una luce di taglio per staccare il soggetto dallo sfondo. Il contrasto tra duro e morbido costruisce la profondità. La regola pratica è partire da una sorgente principale e aggiungere solo ciò che serve a raccontare." },
  ],
  "illuminazione-tre-punti": [
    { title: "Key, fill e back", body: "Lo schema a tre punti è la base: la key illumina il soggetto, il fill riempie le ombre, il back stacca il soggetto dallo sfondo. Il rapporto tra key e fill decide il contrasto; la posizione del back decide la separazione. Non è un obbligo, ma un punto di partenza per capire cosa fa ogni luce." },
    { title: "Adattarlo al set", body: "In interni con luce pratica lo schema si adatta: la finestra può essere la key, una parete chiara il fill, una lampada il back. In esterni il sole è la key e si usano diffusori e pannelli per controllarlo. Lo schema serve a ragionare, non a copiare." },
  ],
  "motivated-lighting": [
    { title: "La luce deve avere una fonte", body: "L'illuminazione motivata nasce da una fonte visibile o credibile nella scena: una finestra, una lampada, un neon, il fuoco. Lo spettatore accetta la luce se capisce da dove viene. Anche una luce aggiunta deve rispettare direzione, colore e intensità della fonte immaginaria." },
    { title: "Costruire la motivazione", body: "Si parte dalle fonti pratiche, si misura la loro direzione e si aggiungono luci che le imitano. Se la finestra è a sinistra, la key arriva da sinistra. Se la lampada è calda, il fill è caldo. Le eccezioni esistono, ma vanno giustificate dalla storia." },
  ],
  fotometria: [
    { title: "Misurare la luce", body: "L'esposimetro misura l'illuminamento o la luminanza. In cinema si usano esposimetri incidenti per misurare la luce che arriva al soggetto, oppure si legge il monitor con waveform e false color. La fotometria serve a mantenere coerenza tra le inquadrature e a prevedere il risultato." },
    { title: "Lux e foot-candle", body: "Il lux misura i lumen per metro quadro; il foot-candle i lumen per piede quadro. 1 foot-candle equivale a circa 10,76 lux. Conoscere i valori aiuta a scegliere la potenza delle luci e a confrontare set diversi, ma la percezione dipende anche dal contrasto e dal colore." },
  ],
  "inverse-square-law": [
    { title: "La legge dell'inverso del quadrato", body: "L'illuminamento diminuisce con il quadrato della distanza: raddoppiando la distanza, la luce diventa un quarto. Per questo una luce vicina al soggetto cade molto rapidamente e crea un contrasto forte, mentre una luce lontana è più uniforme. È il principio che spiega perché i pannelli grandi e vicini sono morbidi." },
    { title: "Applicarla sul set", body: "Se una key a 2 metri dà 1000 lux, a 4 metri ne danno 250. Per mantenere la stessa esposizione bisogna quadruplicare la potenza o avvicinare la luce. Nei set grandi si usano luci più potenti e si accettano cadute di luce volute per separation e atmosfera." },
  ],
  "cri-tlci": [
    { title: "Cosa misurano", body: "Il CRI valuta la fedeltà dei colori di una sorgente rispetto a una riferimento; il TLCI è pensato per la televisione e tiene conto anche della risposta delle camere. Un CRI alto non garantisce una resa perfetta: conta lo spettro completo, non solo la media." },
    { title: "Scegliere le luci", body: "Per il cinema servono sorgenti con spettro continuo e buona resa sulle carnagioni. LED economici possono avere CRI alto ma buchi nello spettro, visibili soprattutto sui toni della pelle e sui colori saturi. Meglio testare la luce con la propria camera prima di un set importante." },
  ],
  "microfoni-dinamici-condensatori": [
    { title: "Differenze pratiche", body: "I dinamici sono robusti, resistono a pressioni alte e non richiedono alimentazione; i condensatori sono più sensibili e restituiscono più dettaglio. Sul set il condensatore è la scelta per la voce e gli ambienti controllati; il dinamico per interviste aggressive, strumenti forti e riprese difficili." },
    { title: "Pattern polari", body: "Cardioide, ipercardioide, figura-8, omnidirezionale. Il pattern decide cosa il microfono sente e cosa rifiuta. Per la voce si usa spesso cardioide o ipercardioide; per l'ambiente un omnidirezionale. La scelta va fatta in base al rumore intorno e alla distanza dalla fonte." },
  ],
  shotgun: [
    { title: "Come funziona", body: "Lo shotgun è un condensatore con un tubo che rende il lobo frontale molto stretto. È pensato per distanze brevi e medie, non per captare a grande distanza come si crede. Fuori asse perde rapidamente sensibilità, quindi va puntato con precisione." },
    { title: "Uso sul set", body: "Si monta su asta o su supporto, il più vicino possibile al soggetto e fuori dall'inquadratura. Va orientato verso la bocca, non verso il petto. In interni riverberanti può colorare la voce: in quei casi un lavalier o un cardioide può funzionare meglio." },
  ],
  "gain-staging": [
    { title: "Portare il segnale al livello giusto", body: "Il gain staging è la gestione dei livelli lungo tutta la catena: microfono, preamplificatore, registratore, mixer. Ogni stadio deve lavorare nella sua zona ottimale, senza distorcere e senza alzare troppo il rumore. Si parte dal guadagno del pre, si regola il fader e si controllano i picchi." },
    { title: "Livelli di riferimento", body: "In produzione si usano toni di riferimento per allineare registratore e mixer. I picchi di voce non devono superare i -6/-10 dBFS, lasciando margine per gli imprevisti. Registrare troppo basso e alzare in post aumenta il rumore; registrare troppo alto rischia clipping difficile da recuperare." },
  ],
  timecode: [
    { title: "Sincronizzare più dispositivi", body: "Il timecode è un codice temporale condiviso tra camera, audio e monitor. Serve a ritrovare il punto esatto in post e a sincronizzare più camere. Si genera con un dispositivo master e si distribuisce via cavo o wireless. Il timecode non sincronizza l'immagine, ma rende il sync molto più veloce." },
    { title: "Timecode e frame rate", body: "Il timecode dipende dal frame rate: 24, 25, 30 fps e le loro varianti drop-frame. Se camera e audio usano frame rate diversi, il sync va gestito con attenzione. Registrare un tono o un ciak all'inizio aiuta comunque a verificare l'allineamento." },
  ],
  "montaggio-narrativo": [
    { title: "Il montaggio costruisce il significato", body: "Due inquadrature accostate creano un'idea che nessuna delle due contiene da sola. Il montaggio narrativo sceglie cosa mostrare, quando e per quanto tempo. Il ritmo, la durata dei piani e l'ordine delle informazioni guidano l'attenzione e l'emozione dello spettatore." },
    { title: "Continuità e rottura", body: "La continuità rende invisibile il taglio: sguardi coerenti, movimenti che si completano, suono che attraversa il taglio. La rottura della continuità, quando è voluta, produce straniamento. La differenza tra errore e scelta è la coerenza con il resto del film." },
  ],
  "j-cut-l-cut": [
    { title: "Anticipare e prolungare il suono", body: "Nel J-cut l'audio della scena successiva entra prima dell'immagine; nell'L-cut l'audio della scena precedente continua dopo il taglio. Sono due modi per rendere il montaggio più fluido e per guidare l'attenzione dello spettatore prima ancora che veda." },
    { title: "Quando usarli", body: "Il J-cut è utile per preparare un cambio di scena o per creare attesa; l'L-cut per accompagnare un'uscita o mantenere il commento. In un dialogo, anticipare la voce di chi risponde rende la conversazione più naturale. Sono tecniche semplici ma molto efficaci." },
  ],
  "ritmo-montaggio": [
    { title: "Il ritmo non è velocità", body: "Un montaggio veloce non è automaticamente ritmico. Il ritmo nasce dalla relazione tra durata dei piani, movimento interno, suono e attese. Un piano lungo può essere teso se lo spettatore aspetta qualcosa; un piano breve può essere piatto se non aggiunge informazione." },
    { title: "Costruire l'andamento", body: "Si alternano piani lunghi e brevi, si usano pause e accelerazioni. La musica e il sound design danno una griglia, ma il montaggio non deve diventare schiavo del beat. La regola è provare, guardare e togliere ciò che non serve." },
  ],
  "green-screen": [
    { title: "Preparare lo sfondo", body: "Il green screen deve essere illuminato in modo uniforme, senza ombre e senza hot spot. Il soggetto va distanziato dallo sfondo per evitare spill e ombre proiettate. Il verde è preferibile quando il soggetto non indossa verde; il blu quando ci sono capelli o vestiti verdi." },
    { title: "Girare per il compositing", body: "Servono riferimenti di luce, prospettiva e colore. Il DP e il VFX supervisor concordano direzione e qualità della luce. Il chroma subsampling 4:4:4 e un codec con buon bitrate aiutano il keying. Il risultato finale dipende tanto dalle riprese quanto dal lavoro in post." },
  ],
  "virtual-production": [
    { title: "Il LED volume", body: "La virtual production usa pareti LED che mostrano ambienti 3D in tempo reale, sincronizzati con il movimento della camera. L'ambiente illumina gli attori e diventa parte della scena, riducendo la necessità di green screen e di luce aggiunta in post. Il tracking della camera è essenziale per la parallasse." },
    { title: "Cosa cambia sul set", body: "Serve una pipeline Unreal Engine, un team di virtual art e un LED volume. La luce del wall non sostituisce quella di scena: va integrata. I vantaggi sono il controllo dell'ambiente e la possibilità di vedere il risultato in camera; i limiti sono costo, spazio e complessità tecnica." },
  ],
  copyright: [
    { title: "Cosa protegge", body: "Il copyright protegge l'espressione originale di un'opera: film, musica, testi, fotografie. Non protegge le idee, ma il modo in cui sono espresse. La protezione nasce con la creazione e dura per un periodo che varia per paese; in Europa è generalmente 70 anni dopo la morte dell'autore." },
    { title: "Cosa serve in produzione", body: "Ogni opera usata deve avere una licenza o un'autorizzazione. La 'chain of title' documenta la proprietà dei diritti e serve per la distribuzione. Musica, immagini, footage e location possono avere diritti separati: vanno verificati prima delle riprese, non dopo." },
  ],
};
