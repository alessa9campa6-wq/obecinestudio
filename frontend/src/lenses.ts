// Known cinema lens sets. Users add whole sets or single lenses to their personal kit.
export type LensPreset = { brand: string; series: string; focals: (number | string)[]; tstop: string; mount: string; squeeze?: number; format: string };

export const LENS_PRESETS: LensPreset[] = [
  { brand: "ARRI", series: "Signature Prime", focals: [18, 25, 35, 47, 58, 75, 95, 125], tstop: "T1.8", mount: "LPL", format: "LF" },
  { brand: "ARRI/Zeiss", series: "Ultra Prime", focals: [16, 20, 24, 32, 40, 50, 65, 85, 100, 135], tstop: "T1.9", mount: "PL", format: "S35" },
  { brand: "Cooke", series: "S4/i", focals: [18, 25, 32, 40, 50, 75, 100, 135], tstop: "T2", mount: "PL", format: "S35" },
  { brand: "Cooke", series: "Panchro/i Classic FF", focals: [18, 25, 32, 40, 50, 75, 100, 135], tstop: "T2.2", mount: "PL", format: "FF" },
  { brand: "Zeiss", series: "Supreme Prime", focals: [21, 25, 29, 35, 50, 65, 85, 100, 135], tstop: "T1.5", mount: "PL", format: "FF" },
  { brand: "Zeiss", series: "CP.3", focals: [15, 18, 21, 25, 28, 35, 50, 85, 100, 135], tstop: "T2.1", mount: "PL/EF", format: "FF" },
  { brand: "Leica", series: "Summilux-C", focals: [16, 18, 21, 25, 29, 35, 40, 50, 65, 75, 100], tstop: "T1.4", mount: "PL", format: "S35" },
  { brand: "Sigma", series: "Cine FF High Speed", focals: [14, 20, 24, 28, 35, 40, 50, 85, 105, 135], tstop: "T1.5", mount: "PL/EF/E", format: "FF" },
  { brand: "Canon", series: "CN-E Prime", focals: [14, 24, 35, 50, 85, 135], tstop: "T1.3", mount: "EF", format: "FF" },
  { brand: "DZOFilm", series: "Vespid", focals: [16, 25, 35, 50, 75, 100, 125], tstop: "T2.1", mount: "PL/EF", format: "FF" },
  { brand: "Samyang/Xeen", series: "Xeen CF", focals: [16, 24, 35, 50, 85], tstop: "T1.5", mount: "PL/EF/E", format: "FF" },
  { brand: "Atlas", series: "Orion Anamorphic 2x", focals: [32, 40, 50, 65, 80, 100], tstop: "T2", mount: "PL", squeeze: 2, format: "S35" },
  { brand: "Laowa", series: "Nanomorph 1.5x", focals: [27, 35, 50, 65, 80], tstop: "T2.4", mount: "PL/EF/E", squeeze: 1.5, format: "S35" },
  { brand: "Sirui", series: "Venus 1.6x FF", focals: [35, 50, 75, 100, 135], tstop: "T2.9", mount: "E/RF/L", squeeze: 1.6, format: "FF" },
  { brand: "Angénieux", series: "Optimo Zoom", focals: ["24-290", "28-76", "45-120"], tstop: "T2.8", mount: "PL", format: "S35" },
  { brand: "Fujinon", series: "Premista Zoom", focals: ["19-45", "28-100", "80-250"], tstop: "T2.9", mount: "PL", format: "LF" },
];

export type Lens = { brand: string; series: string; focal: string; tstop: string; mount: string; squeeze?: string; note?: string };

// Numeric focal for calculations; zooms use the wide end unless a value is given.
export const focalNum = (f: string | number) => parseFloat(String(f).split("-")[0].replace(",", ".")) || 0;
export const lensLabel = (l: Lens) => `${l.focal}mm ${l.series}`.trim();
