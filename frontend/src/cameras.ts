// Camere raggruppate per marca. Sensor sizes in mm (max recording area, indicative values).
// I campi tecnici sono facoltativi: dove non sono sicuro restano vuoti e la scheda
// mostra solo quello che c'è. Nessuna foto: il catalogo è testuale.
export type Camera = {
  brand: string;
  name: string;
  w: number;
  h: number;
  format?: string; // Super 35, Full Frame, 65mm...
  mount?: string; // LPL, PL, EF, E, RF, L...
  res?: string; // risoluzione massima
  raw?: string; // codec raw / log
  codec?: string; // codec interno principale
  weight?: number; // solo corpo, kg
  year?: string;
  note?: string;
};

type Extra = Omit<Camera, "brand" | "name" | "w" | "h">;

const C = (brand: string, list: [string, number, number, Extra?][]): Camera[] =>
  list.map(([name, w, h, extra]) => ({ brand, name, w, h, ...(extra ?? {}) }));

export const CAMERAS: Camera[] = [
  ...C("Formato", [
    ["Full Frame", 36, 24, { format: "Full Frame", note: "Sensore grande quanto la pellicola 35mm" }],
    ["Super 35", 24.89, 18.66, { format: "Super 35", note: "Formato classico del cinema" }],
    ["Super 35 16:9", 24.89, 14, { format: "Super 35" }],
    ["APS-C", 23.6, 15.6, { format: "APS-C" }],
    ["Micro 4/3", 17.3, 13, { format: "Micro 4/3" }],
    ["Super 16", 12.52, 7.41, { format: "Super 16" }],
    ["1 pollice", 13.2, 8.8, { format: "1\"" }],
    ["Medio formato 44x33", 43.8, 32.9, { format: "Medio formato" }],
    ["65mm", 54.12, 25.58, { format: "65mm" }],
  ]),
  ...C("ARRI", [
    ["Alexa 35", 27.99, 19.22, { format: "Super 35", mount: "LPL", res: "4.6K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", weight: 3.0, year: "2022" }],
    ["Alexa Mini LF", 36.7, 25.54, { format: "Large Format", mount: "LPL", res: "4.5K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", weight: 2.6, year: "2019" }],
    ["Alexa LF", 36.7, 25.54, { format: "Large Format", mount: "LPL", res: "4.5K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", weight: 7.8, year: "2018" }],
    ["Alexa Mini", 28.25, 18.17, { format: "Super 35", mount: "PL", res: "3.4K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", weight: 2.3, year: "2015" }],
    ["Alexa 65", 54.12, 25.58, { format: "65mm", mount: "LPL", res: "6.5K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", weight: 9.2, year: "2015" }],
    ["Amira", 28.25, 18.17, { format: "Super 35", mount: "PL", res: "3.4K", raw: "ARRIRAW", codec: "ProRes 4444", weight: 4.1, year: "2013" }],
    ["Alexa 265", 54.12, 25.58, { format: "65mm", mount: "LPL", res: "6.5K", raw: "ARRIRAW", codec: "ProRes 4444 XQ", year: "2024" }],
  ]),
  ...C("RED", [
    ["V-Raptor 8K VV", 40.96, 21.6, { format: "Vista Vision", mount: "RF / PL adattatore", res: "8K", raw: "REDCODE RAW", weight: 1.5, year: "2021" }],
    ["V-Raptor XL 8K VV", 40.96, 21.6, { format: "Vista Vision", mount: "RF / PL adattatore", res: "8K", raw: "REDCODE RAW", weight: 3.3, year: "2022" }],
    ["V-Raptor 8K S35", 26.21, 13.82, { format: "Super 35", mount: "RF / PL adattatore", res: "8K", raw: "REDCODE RAW", weight: 1.5 }],
    ["Komodo 6K", 27.03, 14.26, { format: "Super 35", mount: "RF", res: "6K", raw: "REDCODE RAW", weight: 1.0, year: "2020" }],
    ["Komodo-X 6K", 27.03, 14.26, { format: "Super 35", mount: "RF", res: "6K", raw: "REDCODE RAW", weight: 1.3, year: "2023" }],
    ["Monstro 8K VV", 40.96, 21.6, { format: "Vista Vision", mount: "PL", res: "8K", raw: "REDCODE RAW", weight: 3.6 }],
    ["Helium 8K S35", 29.9, 15.77, { format: "Super 35", mount: "PL", res: "8K", raw: "REDCODE RAW", weight: 3.6 }],
    ["Gemini 5K S35", 30.72, 18, { format: "Super 35", mount: "PL", res: "5K", raw: "REDCODE RAW", weight: 3.4 }],
  ]),
  ...C("Sony", [
    ["Venice 2 8K", 36.2, 24.1, { format: "Full Frame", mount: "E / PL", res: "8K", raw: "X-OCN", codec: "XAVC", weight: 3.6, year: "2022" }],
    ["Venice 2 6K", 35.9, 24, { format: "Full Frame", mount: "E / PL", res: "6K", raw: "X-OCN", codec: "XAVC", weight: 3.4, year: "2021" }],
    ["Burano", 35.9, 24, { format: "Full Frame", mount: "E / PL", res: "8.6K", raw: "X-OCN", codec: "XAVC", weight: 2.9, year: "2023" }],
    ["FX9", 35.7, 18.8, { format: "Full Frame", mount: "E", res: "6K", raw: "—", codec: "XAVC-I", weight: 2.0, year: "2019" }],
    ["FX6", 35.6, 23.8, { format: "Full Frame", mount: "E", res: "4K", raw: "—", codec: "XAVC-I", weight: 0.9, year: "2020" }],
    ["FX3", 35.6, 23.8, { format: "Full Frame", mount: "E", res: "4K", raw: "—", codec: "XAVC S-I", weight: 0.7, year: "2021" }],
    ["FX30", 23.3, 15.5, { format: "Super 35", mount: "E", res: "4K", raw: "—", codec: "XAVC S-I", weight: 0.6, year: "2022" }],
    ["FX2", 35.6, 23.8, { format: "Full Frame", mount: "E", res: "4K", raw: "—", codec: "XAVC", weight: 0.7, year: "2025" }],
    ["A7S III", 35.6, 23.8, { format: "Full Frame", mount: "E", res: "4K", raw: "—", codec: "XAVC S-I", weight: 0.7, year: "2020" }],
    ["A1 II", 35.9, 24, { format: "Full Frame", mount: "E", res: "8K", raw: "—", codec: "XAVC", weight: 0.7, year: "2024" }],
  ]),
  ...C("Blackmagic", [
    ["URSA Cine 12K LF", 35.64, 23.32, { format: "Large Format", mount: "PL", res: "12K", raw: "BRAW", codec: "ProRes", weight: 3.0, year: "2024" }],
    ["URSA Cine 17K 65", 50.81, 23.32, { format: "65mm", mount: "PL", res: "17K", raw: "BRAW", codec: "ProRes", year: "2024" }],
    ["PYXIS 6K", 36, 24, { format: "Full Frame", mount: "PL / EF / L", res: "6K", raw: "BRAW", codec: "ProRes", weight: 1.5, year: "2024" }],
    ["Cinema Camera 6K", 36, 24, { format: "Full Frame", mount: "L", res: "6K", raw: "BRAW", codec: "ProRes", year: "2023" }],
    ["URSA Mini Pro 12K", 27.03, 14.25, { format: "Super 35", mount: "PL", res: "12K", raw: "BRAW", codec: "ProRes", weight: 2.6, year: "2020" }],
    ["URSA Mini Pro 4.6K G2", 25.34, 14.25, { format: "Super 35", mount: "EF / PL", res: "4.6K", raw: "BRAW", codec: "ProRes", weight: 2.5 }],
    ["Pocket 6K Pro", 23.1, 12.99, { format: "Super 35", mount: "EF", res: "6K", raw: "BRAW", codec: "ProRes", weight: 1.2, year: "2021" }],
    ["Pocket 4K", 18.96, 10, { format: "Micro 4/3", mount: "MFT", res: "4K", raw: "BRAW", codec: "ProRes", weight: 0.7, year: "2018" }],
  ]),
  ...C("Panasonic", [
    ["Varicam LT", 26.68, 14.18, { format: "Super 35", mount: "EF / PL", res: "4K", raw: "—", codec: "ProRes / AVC-Intra", weight: 2.7 }],
    ["EVA1", 24.6, 12.97, { format: "Super 35", mount: "EF", res: "5.7K", raw: "—", codec: "ProRes / LongGOP", weight: 1.2 }],
    ["S1H", 35.6, 23.8, { format: "Full Frame", mount: "L", res: "6K", raw: "ProRes RAW esterno", codec: "H.265 / H.264", weight: 1.1, year: "2019" }],
    ["S5 II / IIX", 35.6, 23.8, { format: "Full Frame", mount: "L", res: "6K", raw: "ProRes RAW esterno", codec: "H.265", weight: 0.7, year: "2023" }],
    ["S1 II", 35.6, 23.8, { format: "Full Frame", mount: "L", res: "6K", raw: "ProRes RAW", codec: "H.265", weight: 0.8, year: "2025" }],
    ["GH7", 17.3, 13, { format: "Micro 4/3", mount: "MFT", res: "5.7K", raw: "ProRes RAW HQ interno", codec: "ProRes / H.265", weight: 0.7, year: "2024" }],
    ["GH6", 17.3, 13, { format: "Micro 4/3", mount: "MFT", res: "5.7K", raw: "ProRes RAW esterno", codec: "ProRes / H.265", weight: 0.8, year: "2022" }],
    ["BGH1", 17.3, 13, { format: "Micro 4/3", mount: "MFT", res: "4K", raw: "—", codec: "H.265", weight: 0.5 }],
  ]),
  ...C("Canon", [
    ["EOS C500 Mark II", 38.1, 20.1, { format: "Full Frame", mount: "EF", res: "5.9K", raw: "Cinema RAW Light", codec: "XF-AVC", weight: 1.8, year: "2019" }],
    ["EOS C400", 36, 19, { format: "Full Frame", mount: "RF", res: "6K", raw: "Cinema RAW Light", codec: "XF-AVC", weight: 1.8, year: "2024" }],
    ["EOS C80", 36, 19, { format: "Full Frame", mount: "RF", res: "6K", raw: "Cinema RAW Light", codec: "XF-AVC", weight: 1.4, year: "2024" }],
    ["EOS C300 Mark III", 26.2, 13.8, { format: "Super 35", mount: "EF", res: "4K", raw: "Cinema RAW Light", codec: "XF-AVC", weight: 1.8, year: "2020" }],
    ["EOS C70", 26.2, 13.8, { format: "Super 35", mount: "RF", res: "4K", raw: "—", codec: "XF-AVC", weight: 1.2, year: "2020" }],
    ["EOS R5 C", 36, 24, { format: "Full Frame", mount: "RF", res: "8K", raw: "Cinema RAW Light", codec: "XF-AVC / MP4", weight: 0.8, year: "2022" }],
    ["EOS R5 Mark II", 36, 24, { format: "Full Frame", mount: "RF", res: "8K", raw: "—", codec: "XF-AVC / MP4", weight: 0.7, year: "2024" }],
  ]),
  ...C("Fujifilm", [
    ["GFX Eterna", 43.8, 32.9, { format: "Medio formato", mount: "G", res: "8K", raw: "—", codec: "ProRes / H.265", year: "2025" }],
    ["GFX100 II", 43.8, 32.9, { format: "Medio formato", mount: "G", res: "8K", raw: "—", codec: "ProRes / H.265", weight: 1.0, year: "2023" }],
    ["X-H2S", 23.5, 15.6, { format: "APS-C", mount: "X", res: "6.2K", raw: "—", codec: "ProRes / H.265", weight: 0.7, year: "2022" }],
    ["X-H2", 23.5, 15.6, { format: "APS-C", mount: "X", res: "8K", raw: "—", codec: "ProRes / H.265", weight: 0.7, year: "2022" }],
    ["X-T5", 23.5, 15.6, { format: "APS-C", mount: "X", res: "6.2K", raw: "—", codec: "H.265", weight: 0.6, year: "2022" }],
    ["X-S20", 23.5, 15.6, { format: "APS-C", mount: "X", res: "6.2K", raw: "—", codec: "H.265", weight: 0.5, year: "2023" }],
  ]),
  ...C("Kinefinity", [
    ["MAVO Edge 8K", 36, 24, { format: "Full Frame", mount: "KineMOUNT", res: "8K", raw: "ProRes RAW", codec: "ProRes", weight: 1.4 }],
    ["MAVO Edge 6K", 36, 24, { format: "Full Frame", mount: "KineMOUNT", res: "6K", raw: "ProRes RAW", codec: "ProRes", weight: 1.4 }],
    ["MAVO mark2 LF", 36, 24, { format: "Full Frame", mount: "KineMOUNT", res: "6K", raw: "ProRes RAW", codec: "ProRes", weight: 1.5 }],
    ["MAVO mark2 S35", 27, 14.3, { format: "Super 35", mount: "KineMOUNT", res: "6K", raw: "ProRes RAW", codec: "ProRes", weight: 1.4 }],
    ["Terra 4K", 23.7, 13.4, { format: "Super 35", mount: "KineMOUNT", res: "4K", raw: "—", codec: "ProRes / Cineform", weight: 1.1 }],
  ]),
  ...C("Nikon", [
    ["Z9", 35.9, 23.9, { format: "Full Frame", mount: "Z", res: "8K", raw: "N-RAW", codec: "ProRes / H.265", weight: 1.3, year: "2021" }],
    ["Z8", 35.9, 23.9, { format: "Full Frame", mount: "Z", res: "8K", raw: "N-RAW", codec: "ProRes / H.265", weight: 0.9, year: "2023" }],
    ["Z6 III", 35.9, 23.9, { format: "Full Frame", mount: "Z", res: "6K", raw: "N-RAW", codec: "ProRes / H.265", weight: 0.8, year: "2024" }],
    ["ZR", 35.9, 23.9, { format: "Full Frame", mount: "Z", res: "6K", raw: "N-RAW", codec: "ProRes / H.265", weight: 0.6, year: "2025" }],
  ]),
  ...C("DJI", [
    ["Ronin 4D 8K", 36, 24, { format: "Full Frame", mount: "DL", res: "8K", raw: "ProRes RAW", codec: "ProRes / H.264", weight: 4.7, year: "2022" }],
    ["Ronin 4D 6K", 36, 24, { format: "Full Frame", mount: "DL", res: "6K", raw: "—", codec: "ProRes / H.264", weight: 4.7, year: "2021" }],
    ["Inspire 3 (X9-8K)", 36, 24, { format: "Full Frame", mount: "DL", res: "8K", raw: "CinemaDNG / ProRes RAW", codec: "ProRes", year: "2023" }],
    ["Mavic 3 Pro Cine", 17.3, 13, { format: "Micro 4/3", mount: "fisso", res: "5.1K", raw: "—", codec: "ProRes / H.264", weight: 1.0, year: "2023" }],
  ]),
  ...C("Z CAM", [
    ["E2-F8", 36, 24, { format: "Full Frame", mount: "EF / PL / E", res: "8K", raw: "—", codec: "ProRes / H.265", weight: 1.2 }],
    ["E2-F6 Pro", 36, 24, { format: "Full Frame", mount: "EF / PL / E", res: "6K", raw: "—", codec: "ProRes / H.265", weight: 1.1 }],
    ["E2-S6", 23.3, 15.5, { format: "Super 35", mount: "EF / PL / E", res: "6K", raw: "—", codec: "ProRes / H.265", weight: 1.0 }],
    ["E2-M4", 17.3, 13, { format: "Micro 4/3", mount: "MFT", res: "4K", raw: "—", codec: "ProRes / H.265", weight: 0.9 }],
  ]),
  ...C("Apple", [
    ["iPhone Pro (main)", 9.8, 7.3, { format: "1/1.28\"", mount: "fisso", res: "4K", raw: "Apple Log", codec: "ProRes / HEVC", note: "Sensore del modulo principale" }],
    ["iPad Pro (wide)", 5.6, 4.2, { format: "1/3.4\"", mount: "fisso", res: "4K", codec: "HEVC" }],
  ]),
];

export const BRANDS = Array.from(new Set(CAMERAS.map((c) => c.brand)));
export const cameraId = (c: Camera) => `${c.brand}|${c.name}`;
export const findCamera = (id?: string | null) => CAMERAS.find((c) => cameraId(c) === id) ?? CAMERAS[1];

// Riga compatta con i dati tecnici disponibili, per cataloghi e schede.
export function cameraSpecs(c: Camera): { label: string; value: string }[] {
  return [
    { label: "Sensore", value: `${c.w}×${c.h} mm` },
    { label: "Formato", value: c.format ?? "" },
    { label: "Attacco", value: c.mount ?? "" },
    { label: "Risoluzione", value: c.res ?? "" },
    { label: "Raw", value: c.raw && c.raw !== "—" ? c.raw : "" },
    { label: "Codec", value: c.codec ?? "" },
    { label: "Peso corpo", value: c.weight ? `${c.weight} kg` : "" },
    { label: "Uscita", value: c.year ?? "" },
  ].filter((x) => x.value);
}
