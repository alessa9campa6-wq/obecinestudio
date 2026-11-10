import dayjs from "dayjs";

// Un campo data può essere: un giorno solo ("2026-07-12"), un intervallo
// ("2026-07-12|2026-07-15") o più giorni anche non consecutivi
// ("2026-07-12,2026-07-15,2026-07-20").
export type DateModo = "giorno" | "piu" | "intervallo";

export const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export function giornoValido(anno: number, mese: number, giorno: number): string {
  const d = new Date(anno, mese - 1, giorno);
  const giusto = d.getFullYear() === anno && d.getMonth() === mese - 1 && d.getDate() === giorno;
  return giusto ? dayjs(d).format("YYYY-MM-DD") : "";
}

// Legge una data già salvata (ISO) e anche quelle scritte a mano in passato.
export function dataIso(testo: unknown): string {
  const t = String(testo ?? "").trim().toLowerCase();
  if (!t) return "";

  const iso = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return giornoValido(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const italiano = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
  if (italiano) {
    const anno = italiano[3] ? (italiano[3].length === 2 ? 2000 + Number(italiano[3]) : Number(italiano[3])) : dayjs().year();
    return giornoValido(anno, Number(italiano[2]), Number(italiano[1]));
  }

  return "";
}

// "12 lug 2026"
export function dataLeggibile(valore: unknown): string {
  const iso = dataIso(valore);
  if (!iso) return "";
  const d = dayjs(iso);
  return `${d.date()} ${MESI_BREVI[d.month()]} ${d.year()}`;
}

// Legge il valore salvato in modalità + giorni, scartando quello che non è una data.
export function leggiDate(valore: unknown): { modo: DateModo; giorni: string[] } {
  const testo = String(valore ?? "").trim();
  if (!testo) return { modo: "giorno", giorni: [] };

  if (testo.includes("|")) {
    const [da, a] = testo.split("|");
    const giorni = [dataIso(da), dataIso(a)].filter(Boolean);
    return { modo: "intervallo", giorni };
  }

  if (testo.includes(",")) {
    const giorni = Array.from(new Set(testo.split(",").map(dataIso).filter(Boolean))).sort();
    return { modo: giorni.length > 1 ? "piu" : "giorno", giorni };
  }

  const iso = dataIso(testo);
  return { modo: "giorno", giorni: iso ? [iso] : [] };
}

// Scrive nel formato salvato: un giorno, un intervallo o l'elenco dei giorni.
export function scriviDate(modo: DateModo, giorni: string[]): string {
  const puliti = Array.from(new Set(giorni.filter(Boolean))).sort();
  if (!puliti.length) return "";
  if (modo === "giorno") return puliti[0];
  if (modo === "intervallo") {
    if (puliti.length < 2) return puliti[0];
    return `${puliti[0]}|${puliti[puliti.length - 1]}`;
  }
  return puliti.join(",");
}

// Testo leggibile da mostrare nelle schede: "12 lug 2026", "12 → 15 lug 2026",
// "12, 15, 20 lug 2026".
export function descriviDate(valore: unknown): string {
  const { modo, giorni } = leggiDate(valore);
  // Date scritte a mano in passato: si mostrano così come sono.
  if (!giorni.length) return String(valore ?? "").trim();

  if (modo === "giorno") return dataLeggibile(giorni[0]);

  if (modo === "intervallo" && giorni.length >= 2) {
    const da = dayjs(giorni[0]);
    const a = dayjs(giorni[giorni.length - 1]);
    if (da.year() === a.year() && da.month() === a.month()) return `${da.date()} → ${a.date()} ${MESI_BREVI[a.month()]} ${a.year()}`;
    return `${dataLeggibile(giorni[0])} → ${dataLeggibile(giorni[giorni.length - 1])}`;
  }

  const perMese = new Map<string, number[]>();
  giorni.forEach((g) => {
    const d = dayjs(g);
    const k = `${d.month()}-${d.year()}`;
    perMese.set(k, [...(perMese.get(k) ?? []), d.date()]);
  });
  return [...perMese.entries()]
    .map(([k, numeri]) => {
      const [mese, anno] = k.split("-").map(Number);
      return `${numeri.join(", ")} ${MESI_BREVI[mese]} ${anno}`;
    })
    .join(" · ");
}

// Elenco di tutte le date toccate (per controlli tipo "questa giornata è oggi").
export function giorniDi(valore: unknown): string[] {
  return leggiDate(valore).giorni;
}
