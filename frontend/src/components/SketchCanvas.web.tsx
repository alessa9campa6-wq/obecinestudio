// Web: la tavola usa il motore SVG. Skia su web richiede CanvasKit (8 MB di
// wasm) che non sta nel limite di upload dell'app web: il disegno resta
// vettoriale, con gli stessi tratti, zoom e strumenti.
export { SketchCanvas, StrokeThumb } from "./SketchCanvasSvg";
