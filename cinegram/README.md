# Cinegram

Prototipo separato da CineStudio. Stessa idea delle prove fatte in CineStudio (nero,
`#025669`, vetro), ma è un'app a sé: nessun backend, nessun login, dati di esempio.

## Cosa c'è

- **Oggi** — copertina del film, giornata di riprese con call e countdown al tramonto,
  ciak con suono e vibrazione, scena del giorno col copione, film in corso con le fasi,
  calendario del mese con gli eventi e "in arrivo".
- **Esplora** — ricerca, categorie (persone, luoghi, progetti, lavori), follow locale.
- **Messaggi** — conversazioni con non letti, apertura del thread e invio dei messaggi.
- **Strumenti** — ciak, time tracker, meteo, checklist; lens calculator con campo visivo
  calcolato davvero, e formati con proporzioni disegnate.
- **Profilo** — portfolio pubblicabile (foto dal rullino), progetti, mestieri, rental,
  contatti, impostazioni.
- **Scheda progetto** — tutte le 39 voci divise per fase: sviluppo, pre-produzione, set,
  post, strumenti.
- **Impostazioni** — portfolio visibile, chi vede i lavori, notifiche.

In basso, sempre presente, la barra con Oggi · Esplora · Messaggi · Strumenti · Profilo.

## Comandi

```bash
cd cinegram
npm install
npx expo run:ios --configuration Release --device "iPad di Alessandro"
```

Typecheck: `npx tsc --noEmit`

## Note

- I dati sono di esempio: modifiche, follow, messaggi e portfolio restano in memoria e
  spariscono riaprendo l'app.
- Il bundle iOS è `com.alessandrocampagna.cinegram`, quindi Cinegram e CineStudio possono
  stare sullo stesso iPad senza sovrascriversi.
