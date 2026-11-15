// Figure condivise dai capitoli del Manuale.
// Solo foto reali con licenza libera e fonte verificabile: la didascalia dice
// cosa si sta guardando, il credito dice di chi è l'immagine.
import type { ArticleImage } from "../../types";

const thumbs = (path: string, file: string, width = 1280) =>
  `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}/${width}px-${file}`;

const page = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

export const FIG_SET_CREW: ArticleImage = {
  uri: thumbs("a/a2/Film_crew_at_lake_making_movie.jpg", "Film_crew_at_lake_making_movie.jpg"),
  alt: "Troupe cinematografica al lavoro in esterni",
  caption:
    "Una troupe ridotta al lavoro in esterni: camera su cavalletto, operatore, aiuto e regia intorno al monitor. La dimensione della squadra cambia il modo di girare più di quanto cambi la camera.",
  credit: "Wikimedia Commons · pubblico dominio",
  source: page("Film_crew_at_lake_making_movie.jpg"),
};

export const FIG_TOURNAGE: ArticleImage = {
  uri: thumbs("8/80/Tournage_de_film.JPG", "Tournage_de_film.JPG"),
  alt: "Set cinematografico con macchina da presa e troupe",
  caption:
    "Set con macchina da presa su testa fluida. Il treppiedi sembra un dettaglio, ma è ciò che rende possibile un pan fluido e ripetibile.",
  credit: "Wikimedia Commons · CC BY-SA 3.0",
  source: page("Tournage_de_film.JPG"),
};

export const FIG_FX6_SET: ArticleImage = {
  uri: thumbs(
    "c/cd/Fynn_Hoven_und_Laura-Alina_Bl%C3%BCming_mit_der_Kamera_Sony_FX6_am_Filmset_von_%22Unifive%22.jpg",
    "Fynn_Hoven_und_Laura-Alina_Bl%C3%BCming_mit_der_Kamera_Sony_FX6_am_Filmset_von_%22Unifive%22.jpg",
  ),
  alt: "Operatrice con camera Sony FX6 su un set",
  caption:
    "Una FX6 in mano durante una ripresa. Le camere compatte hanno spostato il lavoro: si gira di più a spalla, con meno attrezzatura e più improvvisazione.",
  credit: "Wikimedia Commons · CC BY-SA 4.0",
  source: page(
    'Fynn_Hoven_und_Laura-Alina_Blüming_mit_der_Kamera_Sony_FX6_am_Filmset_von_"Unifive".jpg',
  ),
};

export const FIG_BOOM: ArticleImage = {
  uri: thumbs("b/b6/Avenue_of_Stars_boom_operator.JPG", "Avenue_of_Stars_boom_operator.JPG"),
  alt: "Boom operator con microfono direzionale",
  caption:
    "Il boom operator tiene il microfono fuori campo, il più vicino possibile alla bocca dell'attore senza entrare nell'inquadratura. È la posizione che decide la qualità del dialogo.",
  credit: "Wikimedia Commons · CC BY-SA 3.0",
  source: page("Avenue_of_Stars_boom_operator.JPG"),
};

export const FIG_URSA_RIG: ArticleImage = {
  uri: "https://upload.wikimedia.org/wikipedia/commons/2/27/Blackmagic-URSA-mini-on-a-tripod.jpg",
  alt: "Camera cinema su treppiedi con accessori",
  caption:
    "Una camera cinema montata su treppiedi: matte box, follow focus, monitor e batteria sono parte del sistema, non optional. Il peso finale è quasi sempre il doppio del corpo macchina.",
  credit: "Wikimedia Commons · CC BY-SA 4.0",
  source: page("Blackmagic-URSA-mini-on-a-tripod.jpg"),
};

export const FIG_KINEFINITY: ArticleImage = {
  uri: thumbs(
    "2/2e/Kinefinity_Mavo_LF_Mark2_20260516102205.jpg",
    "Kinefinity_Mavo_LF_Mark2_20260516102205.jpg",
  ),
  alt: "Kinefinity MAVO mark2 LF",
  caption:
    "Una Kinefinity MAVO mark2 LF. Le camere cinesi hanno portato il grande formato in una fascia di prezzo che dieci anni fa non esisteva; il compromesso è nell'assistenza e negli accessori.",
  credit: "Wikimedia Commons · CC BY-SA 4.0",
  source: page("Kinefinity_Mavo_LF_Mark2_20260516102205.jpg"),
};

export const FIG_HMI: ArticleImage = {
  uri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/HMI_ballast_front.jpg",
  alt: "Ballast di una luce HMI",
  caption:
    "Il ballast di una HMI: tra la luce e la presa c'è sempre un alimentatore. Capire la catena elettrica evita di bruciare un set intero.",
  credit: "Wikimedia Commons · CC BY 2.5",
  source: page("HMI_ballast_front.jpg"),
};
