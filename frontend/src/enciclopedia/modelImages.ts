// Foto reali dei modelli, da Wikimedia Commons (licenze libere).
// Solo immagini verificate e pertinenti: se un modello non è presente qui,
// la scheda mostra un segnaposto invece di una foto sbagliata.
// Ogni foto porta con sé il credito e la pagina della fonte, mostrati nella scheda.
export type ModelPhoto = {
  uri: string;
  credit: string;
  source: string;
};

const filePage = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

// Costruisce la miniatura ufficiale di Commons a partire dal percorso del file.
const commons = (path: string, width: number, file: string): ModelPhoto => ({
  uri: `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}/${width}px-${file.split("/").pop() as string}`,
  credit: "Wikimedia Commons · licenza libera",
  source: filePage(file),
});

export const MODEL_PHOTOS: Record<string, ModelPhoto> = {
  "arri-alexa-35": commons(
    "7/7a/Alexa_35_%281%29.jpg",
    960,
    "Alexa_35_(1).jpg",
  ),
  "arri-alexa-mini-lf": commons(
    "4/45/ARRI_ALEXA_Mini_LF_with_NiSi_AUREUS_PRIME_50mm_T1.4_20250517131829.jpg",
    960,
    "ARRI_ALEXA_Mini_LF_with_NiSi_AUREUS_PRIME_50mm_T1.4_20250517131829.jpg",
  ),
  "arri-alexa-mini": commons("9/9e/Alexa_Mini.jpg", 960, "Alexa_Mini.jpg"),
  "arri-amira": commons("3/31/ARRI_AMIRA_Camera.jpg", 960, "ARRI_AMIRA_Camera.jpg"),
  "sony-fx9": commons(
    "1/1b/SONY_FX9_camera_and_Sigma_135mm_T2_lens.jpg",
    960,
    "SONY_FX9_camera_and_Sigma_135mm_T2_lens.jpg",
  ),
  "sony-fx3": commons(
    "3/3f/Sony_FX3_with_Sony_FE_24mm_F1.4_GM_-_by_Henry_S%C3%B6derlund_%2851061907312%29.jpg",
    960,
    "Sony_FX3_with_Sony_FE_24mm_F1.4_GM_-_by_Henry_Söderlund_(51061907312).jpg",
  ),
  "sony-a7siii": commons(
    "e/e2/Sony_%CE%B17S_III_21_Oct_2020a.jpg",
    960,
    "Sony_α7S_III_21_Oct_2020a.jpg",
  ),
  "sony-fx6": commons(
    "8/86/Sony_Cinema_line_FX6.jpg",
    1280,
    "Sony_Cinema_line_FX6.jpg",
  ),
  "bmd-pocket-6k-pro": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/2/20/BMPCC_6K.jpg",
    credit: "Wikimedia Commons · licenza libera",
    source: filePage("BMPCC_6K.jpg"),
  },
  "bmd-cinema-6k": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/2/20/BMPCC_6K.jpg",
    credit: "Wikimedia Commons · licenza libera",
    source: filePage("BMPCC_6K.jpg"),
  },
  "bmd-ursa-12k": commons(
    "d/d2/Blackmagic_URSA_Cine_12K_LF_20250726122053.jpg",
    960,
    "Blackmagic_URSA_Cine_12K_LF_20250726122053.jpg",
  ),
  "canon-c300-iii": commons("c/c0/Canon_C_300.JPG", 960, "Canon_C_300.JPG"),
  "canon-r5c": commons("8/88/Canon_EOS_R5.jpg", 960, "Canon_EOS_R5.jpg"),
  "canon-r50": commons(
    "a/ab/Canon_EOS_R50%2BRF-S_55-210mm_f5-7.1_IS_STM.jpg",
    1280,
    "Canon_EOS_R50+RF-S_55-210mm_f5-7.1_IS_STM.jpg",
  ),
  "canon-rf-24-70": commons(
    "a/a7/Canon_EOS_5D_Mark_IV%2B_EF_24-105mm_f4L_IS_II_USM_%26_Canon_EOS_R5_%2B_RF_24-70mm_f2.8L_IS_USM.jpg",
    960,
    "Canon_EOS_5D_Mark_IV+_EF_24-105mm_f4L_IS_II_USM_&_Canon_EOS_R5_+_RF_24-70mm_f2.8L_IS_USM.jpg",
  ),
  "canon-rf-50": commons(
    "9/9e/Canon_EOS_R7_with_RF50mm_F1.8_STM_and_Godox_V860III_flash_20241004120947.jpg",
    960,
    "Canon_EOS_R7_with_RF50mm_F1.8_STM_and_Godox_V860III_flash_20241004120947.jpg",
  ),
  "panasonic-gh7": commons(
    "b/bd/Panasonic_Lumix_DC-GH7_20_apr_2025b.jpg",
    1280,
    "Panasonic_Lumix_DC-GH7_20_apr_2025b.jpg",
  ),
  "kinefinity-mavo-mark2-lf": commons(
    "2/2e/Kinefinity_Mavo_LF_Mark2_20260516102205.jpg",
    1280,
    "Kinefinity_Mavo_LF_Mark2_20260516102205.jpg",
  ),
};

/** @deprecated usa modelPhoto() per avere anche credito e fonte. */
export const MODEL_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(MODEL_PHOTOS).map(([id, p]) => [id, p.uri]),
);

export function modelImage(id: string): string | undefined {
  return MODEL_PHOTOS[id]?.uri;
}

export function modelPhoto(id: string): ModelPhoto | undefined {
  return MODEL_PHOTOS[id];
}
