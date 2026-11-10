import { File } from "expo-file-system";
import { Platform } from "react-native";

// Tutta la matematica del mirino sta qui: la cornice sullo schermo e il ritaglio
// della foto devono nascere dagli stessi numeri, altrimenti si inquadra una cosa
// e se ne salva un'altra.

export const RATIOS = [2.39, 2.0, 1.85, 1.78, 1.66, 1.33, 1, 0.8, 0.5625];

// Focali equivalenti delle ottiche del telefono (35mm).
export const DEVICE = [
  { v: 13, l: "Ultra-wide 13mm" },
  { v: 24, l: "24mm" },
  { v: 26, l: "26mm (iPhone)" },
  { v: 29, l: "29mm (iPad)" },
  { v: 48, l: "48mm (tele)" },
];

export type LogDef = { k: string; l: string; tint: string; o: number; corto: string };

export const LOGS: LogDef[] = [
  { k: "709", l: "Rec.709 (nessun Log)", corto: "709", tint: "transparent", o: 0 },
  { k: "slog3", l: "Sony S-Log3", corto: "S-Log3", tint: "rgb(128,128,128)", o: 0.4 },
  { k: "logc4", l: "ARRI LogC4", corto: "LogC4", tint: "rgb(130,128,124)", o: 0.38 },
  { k: "log3g10", l: "RED Log3G10", corto: "Log3G10", tint: "rgb(126,126,130)", o: 0.42 },
  { k: "bmdfilm", l: "BMD Film Gen5", corto: "BMD Gen5", tint: "rgb(128,126,120)", o: 0.36 },
  { k: "vlog", l: "Panasonic V-Log", corto: "V-Log", tint: "rgb(126,128,128)", o: 0.38 },
  { k: "clog3", l: "Canon C-Log3", corto: "C-Log3", tint: "rgb(128,128,126)", o: 0.34 },
  { k: "flog2", l: "Fuji F-Log2", corto: "F-Log2", tint: "rgb(124,128,126)", o: 0.4 },
  { k: "nlog", l: "Nikon N-Log", corto: "N-Log", tint: "rgb(128,127,125)", o: 0.37 },
  { k: "dlog", l: "DJI D-Log", corto: "D-Log", tint: "rgb(127,127,127)", o: 0.39 },
  { k: "applelog", l: "Apple Log", corto: "Apple Log", tint: "rgb(127,128,129)", o: 0.36 },
];

// Log consigliato in base alla camera del progetto.
export const BRAND_LOG: Record<string, string> = {
  ARRI: "logc4",
  Sony: "slog3",
  RED: "log3g10",
  Blackmagic: "bmdfilm",
  Panasonic: "vlog",
  Canon: "clog3",
  Fujifilm: "flog2",
  Nikon: "nlog",
  DJI: "dlog",
  Apple: "applelog",
};

export type LookDef = { k: string; l: string; tint: string; o: number };

export const LOOKS: LookDef[] = [
  { k: "none", l: "Nessuna LUT", tint: "transparent", o: 0 },
  { k: "teal", l: "Teal & Orange", tint: "rgb(0,128,128)", o: 0.2 },
  { k: "kodak", l: "Kodak 2383", tint: "rgb(255,150,60)", o: 0.2 },
  { k: "bleach", l: "Bleach bypass", tint: "rgb(210,210,200)", o: 0.3 },
  { k: "night", l: "Notte blu", tint: "rgb(20,40,120)", o: 0.3 },
];

export const ratioLabel = (r: number) => (r === 0.5625 ? "9:16" : r === 0.8 ? "4:5" : r === 1 ? "1:1" : `${r.toFixed(2)}:1`);

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type Size = { w: number; h: number };

export type Frame = {
  // rettangolo della cornice dentro l'anteprima
  fw: number;
  fh: number;
  x: number;
  y: number;
  // quante volte la simulazione è più larga di quello che il telefono può vedere
  k: number;
  hfov: number;
};

// La cornice nasce dal confronto fra il campo visivo della camera simulata e
// quello dell'ottica del telefono: se simuli un 50mm su un telefono da 26mm la
// cornice si stringe, se simuli un 12mm diventa più grande del visore.
export function frameGeom({
  size,
  sensorW,
  focal,
  squeeze,
  ratio,
  deviceFocal,
}: {
  size: Size;
  sensorW: number;
  focal: number;
  squeeze: number;
  ratio: number;
  deviceFocal: number;
}): Frame {
  const f = focal > 0 ? focal : 35;
  const sq = squeeze > 0 ? squeeze : 1;
  const k = (sensorW * sq * (deviceFocal > 0 ? deviceFocal : 26)) / (36 * f);
  let fw = Math.min(1, k) * size.w;
  let fh = fw / ratio;
  if (fh > size.h) {
    fh = size.h;
    fw = fh * ratio;
  }
  fw = Math.max(1, fw);
  fh = Math.max(1, fh);
  return {
    fw,
    fh,
    x: (size.w - fw) / 2,
    y: (size.h - fh) / 2,
    k,
    hfov: (2 * Math.atan((sensorW * sq) / (2 * f)) * 180) / Math.PI,
  };
}

// Ritaglio della foto scattata: stessa cornice vista a schermo, riportata sui
// pixel reali dell'immagine (l'anteprima riempie lo schermo in "cover").
export function cropRect(pic: { width: number; height: number }, size: Size, frame: Frame) {
  if (!pic.width || !pic.height || !size.w || !size.h) return null;
  const scale = Math.max(size.w / pic.width, size.h / pic.height);
  const ox = (pic.width * scale - size.w) / 2;
  const oy = (pic.height * scale - size.h) / 2;
  const originX = clamp((frame.x + ox) / scale, 0, pic.width - 1);
  const originY = clamp((frame.y + oy) / scale, 0, pic.height - 1);
  const width = Math.min(frame.fw / scale, pic.width - originX);
  const height = Math.min(frame.fh / scale, pic.height - originY);
  if (width < 2 || height < 2) return null;
  return { originX: Math.round(originX), originY: Math.round(originY), width: Math.round(width), height: Math.round(height) };
}

// Legge una LUT .cube e ricava il colore che dà al grigio medio: serve solo per
// mostrare un'anteprima indicativa della resa.
export async function readCube(uri: string) {
  const text = Platform.OS === "web" ? await (await fetch(uri)).text() : await new File(uri).text();
  const size = parseInt(text.match(/LUT_3D_SIZE\s+(\d+)/)?.[1] ?? "0", 10);
  const rows = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-\d.]/.test(l))
    .map((l) => l.split(/\s+/).map(Number))
    .filter((v) => v.length === 3);
  if (!size || rows.length < size ** 3) throw new Error("File .cube non valido");
  const mid = Math.floor((size - 1) / 2);
  const v = rows[mid + mid * size + mid * size * size];
  if (!v) throw new Error("File .cube non valido");
  return `rgb(${v.map((x) => Math.round(clamp(x, 0, 1) * 255)).join(",")})`;
}
