// Foto reali dei modelli, da Wikimedia Commons (licenze libere).
// Solo immagini verificate e pertinenti: se un modello non è presente qui,
// la scheda mostra un segnaposto invece di una foto sbagliata.
const w = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`;

export const MODEL_IMAGES: Record<string, string> = {
  "arri-alexa-35": w("7/7a/Alexa_35_%281%29.jpg/960px-Alexa_35_%281%29.jpg"),
  "arri-alexa-mini-lf": w("4/45/ARRI_ALEXA_Mini_LF_with_NiSi_AUREUS_PRIME_50mm_T1.4_20250517131829.jpg/960px-ARRI_ALEXA_Mini_LF_with_NiSi_AUREUS_PRIME_50mm_T1.4_20250517131829.jpg"),
  "arri-alexa-mini": w("9/9e/Alexa_Mini.jpg/960px-Alexa_Mini.jpg"),
  "arri-amira": w("3/31/ARRI_AMIRA_Camera.jpg/960px-ARRI_AMIRA_Camera.jpg"),
  "sony-fx9": w("1/1b/SONY_FX9_camera_and_Sigma_135mm_T2_lens.jpg/960px-SONY_FX9_camera_and_Sigma_135mm_T2_lens.jpg"),
  "sony-fx3": w("3/3f/Sony_FX3_with_Sony_FE_24mm_F1.4_GM_-_by_Henry_S%C3%B6derlund_%2851061907312%29.jpg/960px-Sony_FX3_with_Sony_FE_24mm_F1.4_GM_-_by_Henry_S%C3%B6derlund_%2851061907312%29.jpg"),
  "sony-a7siii": w("e/e2/Sony_%CE%B17S_III_21_Oct_2020a.jpg/960px-Sony_%CE%B17S_III_21_Oct_2020a.jpg"),
  "bmd-pocket-6k-pro": "https://upload.wikimedia.org/wikipedia/commons/2/20/BMPCC_6K.jpg",
  "bmd-cinema-6k": "https://upload.wikimedia.org/wikipedia/commons/2/20/BMPCC_6K.jpg",
  "bmd-ursa-12k": w("d/d2/Blackmagic_URSA_Cine_12K_LF_20250726122053.jpg/960px-Blackmagic_URSA_Cine_12K_LF_20250726122053.jpg"),
  "canon-c300-iii": w("c/c0/Canon_C_300.JPG/960px-Canon_C_300.JPG"),
  "canon-r5c": w("8/88/Canon_EOS_R5.jpg/960px-Canon_EOS_R5.jpg"),
  "canon-rf-24-70": w("a/a7/Canon_EOS_5D_Mark_IV%2B_EF_24-105mm_f4L_IS_II_USM_%26_Canon_EOS_R5_%2B_RF_24-70mm_f2.8L_IS_USM.jpg/960px-Canon_EOS_5D_Mark_IV%2B_EF_24-105mm_f4L_IS_II_USM_%26_Canon_EOS_R5_%2B_RF_24-70mm_f2.8L_IS_USM.jpg"),
  "canon-rf-50": w("9/9e/Canon_EOS_R7_with_RF50mm_F1.8_STM_and_Godox_V860III_flash_20241004120947.jpg/960px-Canon_EOS_R7_with_RF50mm_F1.8_STM_and_Godox_V860III_flash_20241004120947.jpg"),
};

export function modelImage(id: string): string | undefined {
  return MODEL_IMAGES[id];
}
