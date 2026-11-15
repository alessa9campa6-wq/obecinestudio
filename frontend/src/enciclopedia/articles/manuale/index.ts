import type { Article } from "../../types";
import { MANUALE_REGIA } from "./regia";
import { MANUALE_FOTOGRAFIA } from "./fotografia";
import { MANUALE_ATTREZZATURA } from "./attrezzatura";
import { MANUALE_ILLUMINAZIONE } from "./illuminazione";
import { MANUALE_AUDIO } from "./audio";
import { MANUALE_MONTAGGIO } from "./montaggio";
import { MANUALE_COLOR } from "./color";
import { MANUALE_PRODUZIONE } from "./produzione";
import { MANUALE_SCENEGGIATURA } from "./sceneggiatura";
import { MANUALE_SPECIALI } from "./speciali";
import { MANUALE_LEGAL } from "./legal";
import { MANUALE_METODO } from "./metodo";

// Un capitolo per sezione: sono le voci più lunghe dell'enciclopedia,
// pensate per essere lette di seguito come un manuale.
export const MANUALE_ARTICLES: Article[] = [
  MANUALE_REGIA,
  MANUALE_FOTOGRAFIA,
  MANUALE_ATTREZZATURA,
  MANUALE_ILLUMINAZIONE,
  MANUALE_AUDIO,
  MANUALE_MONTAGGIO,
  MANUALE_COLOR,
  MANUALE_PRODUZIONE,
  MANUALE_SCENEGGIATURA,
  MANUALE_SPECIALI,
  MANUALE_LEGAL,
  MANUALE_METODO,
];
