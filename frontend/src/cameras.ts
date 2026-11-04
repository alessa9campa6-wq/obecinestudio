// Camera bodies grouped by brand. Sensor sizes in mm (max recording area, indicative values).
export type Camera = { brand: string; name: string; w: number; h: number };

const C = (brand: string, list: [string, number, number][]): Camera[] => list.map(([name, w, h]) => ({ brand, name, w, h }));

export const CAMERAS: Camera[] = [
  ...C("Formato", [["Full Frame", 36, 24], ["Super 35", 24.89, 18.66], ["Super 35 16:9", 24.89, 14], ["APS-C", 23.6, 15.6], ["Micro 4/3", 17.3, 13], ["Super 16", 12.52, 7.41], ["1 pollice", 13.2, 8.8], ["Medio formato 44x33", 43.8, 32.9], ["65mm", 54.12, 25.58]]),
  ...C("ARRI", [["Alexa 35", 27.99, 19.22], ["Alexa Mini LF", 36.7, 25.54], ["Alexa LF", 36.7, 25.54], ["Alexa Mini", 28.25, 18.17], ["Alexa 65", 54.12, 25.58], ["Amira", 28.25, 18.17], ["Alexa 265", 54.12, 25.58]]),
  ...C("RED", [["V-Raptor 8K VV", 40.96, 21.6], ["V-Raptor XL 8K VV", 40.96, 21.6], ["V-Raptor 8K S35", 26.21, 13.82], ["Komodo 6K", 27.03, 14.26], ["Komodo-X 6K", 27.03, 14.26], ["Monstro 8K VV", 40.96, 21.6], ["Helium 8K S35", 29.9, 15.77], ["Gemini 5K S35", 30.72, 18]]),
  ...C("Sony", [["Venice 2 8K", 36.2, 24.1], ["Venice 2 6K", 35.9, 24], ["Burano", 35.9, 24], ["FX9", 35.7, 18.8], ["FX6", 35.6, 23.8], ["FX3", 35.6, 23.8], ["FX30", 23.3, 15.5], ["FX2", 35.6, 23.8], ["A7S III", 35.6, 23.8], ["A1 II", 35.9, 24]]),
  ...C("Blackmagic", [["URSA Cine 12K LF", 35.64, 23.32], ["URSA Cine 17K 65", 50.81, 23.32], ["PYXIS 6K", 36, 24], ["Cinema Camera 6K", 36, 24], ["URSA Mini Pro 12K", 27.03, 14.25], ["URSA Mini Pro 4.6K G2", 25.34, 14.25], ["Pocket 6K Pro", 23.1, 12.99], ["Pocket 4K", 18.96, 10]]),
  ...C("Panasonic", [["Varicam LT", 26.68, 14.18], ["EVA1", 24.6, 12.97], ["S1H", 35.6, 23.8], ["S5 II / IIX", 35.6, 23.8], ["S1 II", 35.6, 23.8], ["GH7", 17.3, 13], ["GH6", 17.3, 13], ["BGH1", 17.3, 13]]),
  ...C("Canon", [["EOS C500 Mark II", 38.1, 20.1], ["EOS C400", 36, 19], ["EOS C80", 36, 19], ["EOS C300 Mark III", 26.2, 13.8], ["EOS C70", 26.2, 13.8], ["EOS R5 C", 36, 24], ["EOS R5 Mark II", 36, 24]]),
  ...C("Fujifilm", [["GFX Eterna", 43.8, 32.9], ["GFX100 II", 43.8, 32.9], ["X-H2S", 23.5, 15.6], ["X-H2", 23.5, 15.6], ["X-T5", 23.5, 15.6], ["X-S20", 23.5, 15.6]]),
  ...C("Kinefinity", [["MAVO Edge 8K", 36, 24], ["MAVO Edge 6K", 36, 24], ["MAVO mark2 LF", 36, 24], ["MAVO mark2 S35", 27, 14.3], ["Terra 4K", 23.7, 13.4]]),
  ...C("Nikon", [["Z9", 35.9, 23.9], ["Z8", 35.9, 23.9], ["Z6 III", 35.9, 23.9], ["ZR", 35.9, 23.9]]),
  ...C("DJI", [["Ronin 4D 8K", 36, 24], ["Ronin 4D 6K", 36, 24], ["Inspire 3 (X9-8K)", 36, 24], ["Mavic 3 Pro Cine", 17.3, 13]]),
  ...C("Z CAM", [["E2-F8", 36, 24], ["E2-F6 Pro", 36, 24], ["E2-S6", 23.3, 15.5], ["E2-M4", 17.3, 13]]),
  ...C("Apple", [["iPhone Pro (main)", 9.8, 7.3], ["iPad Pro (wide)", 5.6, 4.2]]),
];

export const BRANDS = Array.from(new Set(CAMERAS.map((c) => c.brand)));
export const cameraId = (c: Camera) => `${c.brand}|${c.name}`;
export const findCamera = (id?: string | null) => CAMERAS.find((c) => cameraId(c) === id) ?? CAMERAS[1];
