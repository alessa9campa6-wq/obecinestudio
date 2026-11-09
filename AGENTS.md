# CineStudio — note permanenti per l'assistente

App Expo/React Native (frontend in `frontend/`, backend Python in `backend/`).
L'utente NON è tecnico: spiegare sempre in italiano semplice, un passo alla volta,
e dare comandi pronti da incollare nel terminale sul suo Mac.

## Dove lavorare
- Frontend: `frontend/src/`
- Moduli e campi: `frontend/src/modules.ts`
- Export PDF: `frontend/src/pdf.ts`
- Canvas disegno: il motore è `frontend/src/brushes/engine.ts` (Skia).
  `SkiaCanvas.tsx` è il componente che disegna; `SketchCanvas.tsx` sceglie per
  piattaforma e `SketchCanvas.web.tsx` carica **lo stesso motore** sul web con
  CanvasKit. `SketchCanvasSvg.tsx` è solo il ripiego (niente texture).

## Decisioni prese
- Modulo `piano` (Piano di lavorazione): aggiunto il campo `cena` ("Pausa cena", type "time").
- Export PDF: il piano di lavorazione viene reso da `pianoHtml()` in `pdf.ts`
  (scheda a tabella con tutti i campi, non la lista generica).
- Rimosso il footer automatico "Generato con CineStudio ..." da `wrap()`.
- CSS: `.section-break` e `.page-break` per gli stacchi pagina.
- Web e DMG usano lo stesso motore Skia dell'iPad tramite CanvasKit
  (`frontend/public/canvaskit.wasm`, caricato con `WithSkiaWeb` prima di usare
  Skia). Dopo un aggiornamento di Skia va rilanciato `npx setup-skia-web` in
  `frontend/`. Le miniature della griglia restano su SVG.
- Acquerello: l'app deve avere lo stesso aspetto della versione web/DMG
  (velatura piatta al 22%, niente gocce che si sommano, niente bordo scuro).
  È un comportamento voluto: spec in `frontend/src/brushes/specs.ts`.

## Comandi utili
- Typecheck: `cd frontend && npx tsc --noEmit`
- Build release su iPhone: `npx expo run:ios --configuration Release --device "iPhone di Alessandro"`
- IPA: `npx expo export --platform ios`

## Aperto / da fare
- Crash storyboard su iPad in schermo intero: non riproducibile in remoto,
  serve screenshot o log dalla Console del Mac.
- Storyboard: desiderata possibilità di zoom in schermo intero e strumenti di disegno migliori.
- Migliorare l'impaginazione PDF anche delle altre sezioni (non solo piano).
