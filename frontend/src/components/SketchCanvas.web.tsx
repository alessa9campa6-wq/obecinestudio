// Web app e app Mac: lo stesso motore di pennelli dell'iPad (Skia), compilato
// in WebAssembly (CanvasKit). Skia crea la sua API all'import, quindi il
// componente vero viene importato solo DOPO il caricamento di CanvasKit: se il
// file .wasm non si carica, la tavola resta vuota ma l'app non si rompe.
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

import type { CanvasProps } from "./sketch-shared";

// Il wasm sta in public/canvaskit.wasm (copia fatta con `setup-skia-web`).
const opts = { locateFile: (file: string) => `/${file}` };

export function SketchCanvas(props: CanvasProps) {
  return <WithSkiaWeb opts={opts} getComponent={() => import("./SkiaCanvasWeb")} componentProps={props} fallback={null} />;
}

// Le miniature della griglia restano su SVG: non serve CanvasKit per disegnarle.
export { StrokeThumb } from "./SketchCanvasSvg";
