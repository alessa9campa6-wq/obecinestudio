import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { fileUrl, Item, Project } from "@/src/api";
import { displayValue, eur, FieldDef, lineTotal, ModuleDef, MODULES, PHASES } from "@/src/modules";
import { Stroke, strokeAttrs, viewH, VW } from "@/src/strokes";
import { toast } from "@/src/ui";

type Lookup = Map<string, { title: string }>;

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

// Print stylesheet: cinematic but clean (black, warm gold accent, generous white space).
const CSS = `
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;color:#1A1A1A;margin:0;font-size:11.5px;line-height:1.5}
  .hdr{border-bottom:3px solid #D4AF37;padding:0 0 14px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end}
  .kicker{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#8A6D1C;font-weight:700;margin-bottom:4px}
  h1{font-family:Georgia,"Times New Roman",serif;font-size:30px;line-height:1.1;margin:0;font-weight:normal}
  .meta{color:#777;font-size:10px;text-align:right;white-space:nowrap}
  h2{font-family:Georgia,serif;font-weight:normal;font-size:20px;margin:34px 0 12px;padding:8px 12px;background:#111;color:#fff;border-left:5px solid #D4AF37;page-break-after:avoid}
  h2 small{font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;display:block}
  h3{font-family:Georgia,serif;font-weight:normal;font-size:15px;margin:0 0 8px}
  h4{font-size:10px;margin:18px 0 6px;color:#8A6D1C;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #EADFC4;padding-bottom:3px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#F6F0E2;text-align:left;padding:7px 8px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#6B5418}
  td{border-bottom:1px solid #EEE;padding:7px 8px;vertical-align:top}
  .cards{font-size:0} .cards>.card{font-size:11.5px;display:inline-block;vertical-align:top;width:48.5%;margin:0 3% 14px 0} .cards>.card:nth-child(2n){margin-right:0}
  .card{border:1px solid #E4E0D6;border-radius:10px;padding:12px 14px;margin:0 0 14px;page-break-inside:avoid;background:#fff}
  .card .badge{display:inline-block;background:#D4AF37;color:#111;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:10px;padding:2px 8px;margin-bottom:6px}
  .pics{margin:-12px -14px 10px} .pics>img{width:100%;height:190px;object-fit:cover;display:block;border-radius:10px 10px 0 0}
  .thumbs{font-size:0;margin-top:2px} .thumbs img{display:inline-block;width:33%;height:70px;object-fit:cover;margin-right:0.5%}
  .gal{font-size:0} .tile{font-size:11px;display:inline-block;vertical-align:top;width:32%;margin:0 2% 14px 0;page-break-inside:avoid;border:1px solid #E4E0D6;border-radius:10px;overflow:hidden;background:#fff}
  .tile:nth-child(3n){margin-right:0} .tile .ph{height:150px;background:#F2EFE8;text-align:center;line-height:150px;color:#AAA}
  .tile .ph img{width:100%;height:150px;object-fit:cover;display:block} .tile .tc{padding:8px 10px;line-height:1.4} .tile .tc div{color:#666;font-size:10px;margin:3px 0}
  table.list{font-size:10.5px} table.list thead th{border-bottom:2px solid #D4AF37} table.list tbody.row{page-break-inside:avoid}
  table.list td{border-bottom:0;border-top:1px solid #EEE} table.list tr.sub td{border-top:0;padding-top:0;color:#666;font-size:10px}
  table.list tr.grp td{background:#111;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:9.5px;padding:6px 8px}
  .lbl{color:#8A6D1C;font-size:8.5px;text-transform:uppercase;letter-spacing:1px;font-weight:700} .r{text-align:right;white-space:nowrap}
  h2.sec{page-break-before:always;margin-top:0}
  .kv{width:100%;border-collapse:collapse;margin:0} .kv td{border:0;border-top:1px solid #F1EEE6;padding:4px 0;font-size:11px} .kv td.k{width:30%;color:#8A8A8A;font-size:9px;text-transform:uppercase;letter-spacing:.4px;padding-right:8px}
  .tot{margin-top:8px;padding-top:6px;border-top:2px solid #D4AF37;font-weight:700;text-align:right}
  .sum{background:#111;color:#fff;border-radius:10px;padding:12px 16px;margin:0 0 16px;display:flex;justify-content:space-between;align-items:center}
  .sum b{color:#D4AF37;font-size:18px;font-family:Georgia,serif;font-weight:normal}
  .sw{display:inline-block;width:20px;height:20px;border-radius:4px;margin-right:4px;border:1px solid #ccc;vertical-align:middle}
  .script{font-family:'Courier Prime','Courier New',Courier,monospace;font-size:12pt;line-height:1.25;max-width:6in;margin:0 auto}
  .sc{font-weight:bold;text-transform:uppercase;margin-top:20px} .ac{margin-top:10px} .ch{margin-left:2.2in;margin-top:12px;text-transform:uppercase}
  .pa{margin-left:1.6in;width:2in} .di{margin-left:1in;width:3.5in} .tr{text-align:right;text-transform:uppercase;margin-top:12px}
  .sb .card{padding:0;overflow:hidden} .sb .frame{background:#fff;border-bottom:1px solid #E4E0D6;text-align:center} .sb svg{width:100%;height:auto;display:block;background:#fff}
  .sb.v>.card{width:31.5%;margin-right:2.75%} .sb.v>.card:nth-child(2n){margin-right:2.75%} .sb.v>.card:nth-child(3n){margin-right:0} .sb.v .frame{height:300px;background:#F2EFE8} .sb.v svg{height:300px;width:auto;display:inline-block}
  .sb .cap{padding:8px 12px} .sb .num{display:inline-block;background:#111;color:#D4AF37;font-weight:700;border-radius:4px;padding:1px 7px;margin-right:6px}
  .sb .tags{color:#8A6D1C;font-size:9.5px;text-transform:uppercase;letter-spacing:1px;margin:2px 0 4px}
  .plan{position:relative;width:100%;height:340px;background:#F7F7F5;border:1px solid #DDD;border-radius:8px;background-image:linear-gradient(#ECECEC 1px,transparent 1px),linear-gradient(90deg,#ECECEC 1px,transparent 1px);background-size:24px 24px}
  .doc{font-family:Georgia,serif;font-size:12.5px;line-height:1.75}
  .cover{width:100%;max-height:340px;object-fit:cover;border-radius:12px;margin-bottom:16px;display:block}
  .facts{background:#F6F0E2;border-radius:10px;padding:12px 16px;margin-bottom:8px} .facts i{font-family:Georgia,serif;font-size:14px;color:#333}
  .empty{color:#999;font-style:italic}
`;

const VIDEO = /\.(mp4|mov|m4v|webm)$/i;

// Turns a stored file into an inline data URL so the PDF embeds the real picture (no auth/network at print time).
async function toDataUrl(path: string): Promise<string | null> {
  if (!path || VIDEO.test(path)) return null;
  try {
    if (Platform.OS !== "web") {
      const dest = new File(Paths.cache, `pdf-${path.replace(/[^a-zA-Z0-9.]/g, "_").slice(-80)}`);
      if (!dest.exists) await File.downloadFileAsync(fileUrl(path), dest, { idempotent: true });
      // Re-encode to a light JPEG: fixes HEIC/orientation and keeps the PDF small.
      const out = await manipulateAsync(dest.uri, [{ resize: { width: 1400 } }], { compress: 0.75, format: SaveFormat.JPEG, base64: true });
      return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
    }
    const res = await fetch(fileUrl(path));
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((ok) => {
      const r = new FileReader();
      r.onloadend = () => ok(r.result as string);
      r.onerror = () => ok(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const wrap = (title: string, body: string, subtitle = "") =>
  `<html><head><meta charset="utf-8"/><title>${esc(title)}</title><style>@page{margin:16mm 14mm}${CSS}</style></head><body><div class="hdr"><div>${subtitle ? `<div class="kicker">${esc(subtitle)}</div>` : ""}<h1>${esc(title)}</h1></div><div class="meta">${new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</div></div>${body}</body></html>`;

export async function exportHtml(title: string, html: string) {
  try {
    if (Platform.OS === "web") {
      // Hidden iframe instead of a popup: works after async image loading (no popup blocker).
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
      document.body.appendChild(f);
      f.contentDocument!.open();
      f.contentDocument!.write(html);
      f.contentDocument!.close();
      setTimeout(() => {
        f.contentWindow!.focus();
        f.contentWindow!.print();
        setTimeout(() => f.remove(), 2000);
      }, 500);
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: title });
  } catch {
    toast("Esportazione PDF non riuscita", "error");
  }
}

async function listHtml(def: ModuleDef, items: Item[], lookup: Lookup) {
  const fields = def.fields ?? [];
  const imgFields = fields.filter((f) => f.type === "image" || f.type === "media");
  const textFields = fields.filter((f) => f.type !== "image" && f.type !== "media");
  const value = (f: FieldDef, it: Item) => {
    if (f.type === "colors")
      return String(it.data[f.key] ?? "")
        .split(",")
        .filter((c) => c.trim())
        .map((c) => `<span class="sw" style="background:${esc(c.trim())}"></span>`)
        .join("");
    return esc(displayValue(f, it.data[f.key], lookup));
  };
  const has = (f: FieldDef, it: Item) => displayValue(f, it.data[f.key], lookup) !== "";
  if (!items.length) return `<p class="empty">Nessun elemento.</p>`;
  const pics = await Promise.all(items.map(async (it) => (await Promise.all(imgFields.map((f) => (it.data[f.key] ? toDataUrl(it.data[f.key]) : null)))).filter(Boolean) as string[]));
  const vids = (it: Item) => imgFields.filter((f) => VIDEO.test(String(it.data[f.key] ?? ""))).length;
  const grand = def.sum ? `<div class="sum"><span>${items.length} voci · Totale ${esc(def.label)}</span><b>${eur(items.reduce((a, it) => a + lineTotal(def, it.data), 0))}</b></div>` : "";

  // 1) Moodboard / reference: image gallery, 3 per row, equal tiles.
  if (def.grid) {
    return `<div class="gal">${items
      .map((it, i) => {
        const img = pics[i][0];
        const cap = [it.title, ...textFields.filter((f) => has(f, it) && f.type !== "multiline").map((f) => displayValue(f, it.data[f.key], lookup))].filter(Boolean).slice(0, 2).join(" · ");
        const note = textFields.filter((f) => f.type === "multiline" && has(f, it)).map((f) => esc(it.data[f.key])).join(" ");
        return `<div class="tile"><div class="ph">${img ? `<img src="${img}"/>` : `<span>${vids(it) ? "🎬 Video" : "Nessuna immagine"}</span>`}</div><div class="tc"><b>${esc(cap || "—")}</b>${note ? `<div>${note}</div>` : ""}${value(fields.find((f) => f.type === "colors") ?? ({ key: "", label: "", type: "text" } as FieldDef), it)}</div></div>`;
      })
      .join("")}</div>`;
  }

  // 2) Modules with photos (location, cast...): two cards per row, photo on top with a fixed frame.
  if (pics.some((p) => p.length)) {
    return `${grand}<div class="cards">${items
      .map((it, i) => {
        const rows = textFields.filter((f) => has(f, it)).map((f) => `<tr><td class="k">${esc(f.label.split(" (")[0])}</td><td>${value(f, it)}</td></tr>`).join("");
        const [main, ...rest] = pics[i];
        const badge = def.badge && it.data[def.badge] ? `<div class="badge">${esc(it.data[def.badge])}</div>` : "";
        const ph = main ? `<div class="pics"><img src="${main}"/>${rest.length ? `<div class="thumbs">${rest.map((s) => `<img src="${s}"/>`).join("")}</div>` : ""}</div>` : "";
        return `<div class="card">${ph}${badge}<h3>${esc(it.title || "Senza titolo")}</h3>${rows ? `<table class="kv">${rows}</table>` : ""}${def.sum && lineTotal(def, it.data) > 0 ? `<div class="tot">${eur(lineTotal(def, it.data))}</div>` : ""}</div>`;
      })
      .join("")}</div>`;
  }

  // 3) Text-only modules (budget, crew, equipment, schedule...): a real table, long text under each row.
  const short = textFields.filter((f) => f.type !== "multiline" && f.key !== def.sum?.groupBy && items.some((it) => has(f, it))).slice(0, def.sum ? 5 : 5);
  const long = textFields.filter((f) => !short.includes(f) && f.key !== def.sum?.groupBy && items.some((it) => has(f, it)));
  const SHORT: Record<string, string> = { durata: "Durata", quantita: "Qtà", unita: "Unità", importo: "Costo unit.", tariffa: "Tariffa" };
  const colLabel = (f: FieldDef) => SHORT[f.key] ?? f.label.split(" (")[0].split(" / ")[0];
  const num = (f: FieldDef) => (f.type === "number" ? ` class="r"` : "");
  const head = `<tr><th>${esc(def.titleLabel ?? "Titolo")}</th>${short.map((f) => `<th${num(f)}>${esc(colLabel(f))}</th>`).join("")}${def.sum ? `<th class="r">Totale</th>` : ""}</tr>`;
  const cols = short.length + 1 + (def.sum ? 1 : 0);
  const row = (it: Item) => {
    const extra = long.filter((f) => has(f, it)).map((f) => `<span class="lbl">${esc(colLabel(f))}</span> ${value(f, it)}`).join(" &nbsp; ");
    return `<tbody class="row"><tr><td><b>${esc(it.title || "—")}</b></td>${short.map((f) => `<td${num(f)}>${value(f, it)}</td>`).join("")}${def.sum ? `<td class="r"><b>${eur(lineTotal(def, it.data))}</b></td>` : ""}</tr>${extra ? `<tr class="sub"><td colspan="${cols}">${extra}</td></tr>` : ""}</tbody>`;
  };
  const g = def.sum?.groupBy;
  if (g) {
    const groups = [...new Set(items.map((it) => String(it.data[g] || "Altro")))];
    return `${grand}<table class="list"><thead>${head}</thead>${groups
      .map((name) => {
        const list = items.filter((it) => String(it.data[g] || "Altro") === name);
        return `<tbody><tr class="grp"><td colspan="${cols - 1}">${esc(name)}</td><td class="r">${eur(list.reduce((a, it) => a + lineTotal(def, it.data), 0))}</td></tr></tbody>${list.map(row).join("")}`;
      })
      .join("")}</table>`;
  }
  return `${grand}<table class="list"><thead>${head}</thead>${items.map(row).join("")}</table>`;
}

export function docHtml(def: ModuleDef, it: Item | undefined) {
  if (!it) return "";
  let html = "";
  let group = "";
  for (const s of def.sections ?? []) {
    if (s.group && s.group !== group) {
      group = s.group;
      html += `<h3 style="margin-top:26px;color:#8A6D1C">${esc(group)}</h3>`;
    }
    if (it.data[s.key]) html += `<h4>${esc(s.label)}</h4><div class="doc">${esc(it.data[s.key])}</div>`;
  }
  return html;
}

export function screenplayHtml(it: Item) {
  const cls: Record<string, string> = { scene: "sc", action: "ac", character: "ch", parenthetical: "pa", dialogue: "di", transition: "tr" };
  const els = (it.data.elements ?? []) as { type: string; text: string }[];
  return `<div class="script">${els.map((e) => `<div class="${cls[e.type] ?? "ac"}">${esc(e.type === "parenthetical" && e.text && !e.text.startsWith("(") ? `(${e.text})` : e.text)}</div>`).join("")}</div>`;
}

export const strokesSvg = (strokes: Stroke[] = [], aspect?: string) =>
  `<svg viewBox="0 0 ${VW} ${viewH(aspect)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${strokes
    .map((s) => {
      const a = strokeAttrs(s);
      return `<path d="${a.d}" fill="${a.fill}" stroke="${a.stroke}" stroke-width="${a.strokeWidth}" opacity="${a.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("")}</svg>`;

export function storyboardHtml(items: Item[], lookup: Lookup) {
  // Vertical/square frames (social) go three per row and taller; widescreen two per row.
  const vertical = items.length > 0 && items.every((it) => ["9:16", "4:5", "1:1"].includes(it.data.aspect));
  return `<div class="cards sb${vertical ? " v" : ""}">${items
    .map((it, i) => {
      const tags = [it.data.aspect, it.data.scena ? `Scena ${lookup.get(it.data.scena)?.title ?? ""}` : "", it.data.inquadratura, it.data.movimento].filter(Boolean).map((t) => esc(t)).join(" · ");
      return `<div class="card"><div class="frame">${strokesSvg(it.data.strokes, it.data.aspect)}</div><div class="cap"><div><span class="num">${i + 1}</span><b>${esc(it.title)}</b></div>${tags ? `<div class="tags">${tags}</div>` : ""}${it.data.descrizione ? `<div>${esc(it.data.descrizione)}</div>` : ""}</div></div>`;
    })
    .join("")}</div>`;
}

export async function lightingHtml(items: Item[], lookup: Lookup) {
  const cards = await Promise.all(
    items.map(async (it) => {
      const els = (it.data.elements ?? []) as { kind: string; x: number; y: number; label?: string }[];
      const dots = els
        .map((e) => `<div style="position:absolute;left:${e.x * 100}%;top:${e.y * 100}%;transform:translate(-50%,-50%);background:#D4AF37;color:#111;border-radius:12px;padding:3px 9px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.25)">${esc(e.label || e.kind)}</div>`)
        .join("");
      const loc = it.data.location ? (lookup.get(it.data.location) as Item | undefined) : undefined;
      const photo = loc?.data?.foto ? await toDataUrl(loc.data.foto) : null;
      const gear = ((it.data.attrezzatura ?? []) as string[]).map((g) => lookup.get(g)?.title).filter(Boolean);
      return `<div class="card">${loc ? `<div class="badge">${esc(loc.title)}</div>` : ""}<h3>${esc(it.title)}</h3>${photo ? `<img src="${photo}" class="cover" style="max-height:220px"/>` : ""}<div class="plan">${dots}</div>${gear.length ? `<h4>Attrezzatura</h4><div>${gear.map((g) => esc(g)).join(" · ")}</div>` : ""}${it.data.note ? `<h4>Note</h4><div>${esc(it.data.note)}</div>` : ""}</div>`;
    }),
  );
  return cards.join("");
}

const pretty = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
export function genericHtml(items: Item[]) {
  return `<table><tr><th style="width:30%">Titolo</th><th>Dettagli</th></tr>${items
    .map((it) => `<tr><td><b>${esc(it.title)}</b></td><td>${Object.entries(it.data).filter(([k, v]) => typeof v !== "object" && v !== "" && v != null && !/(_id|path|uri)$/i.test(k)).map(([k, v]) => `<span style="color:#8A8A8A">${esc(pretty(k))}:</span> ${esc(typeof v === "boolean" ? (v ? "sì" : "no") : v)}`).join(" &nbsp;·&nbsp; ")}</td></tr>`)
    .join("")}</table>`;
}

export async function moduleHtml(def: ModuleDef, items: Item[], lookup: Lookup) {
  if (def.kind === "list") return listHtml(def, items, lookup);
  if (def.kind === "doc") return docHtml(def, items[0]);
  if (def.kind === "screenplay") return items.map((it) => `<h3 style="text-align:center;font-size:20px;margin:10px 0 24px">${esc(it.title)}</h3>${screenplayHtml(it)}`).join("");
  if (def.kind === "storyboard") return storyboardHtml(items, lookup);
  if (def.kind === "lighting") return lightingHtml(items, lookup);
  return genericHtml(items);
}

export async function exportModule(project: Project, def: ModuleDef, items: Item[], lookup: Lookup = new Map()) {
  await exportHtml(def.label, wrap(def.label, await moduleHtml(def, items, lookup), `${project.title} · ${project.type}`));
}

export async function exportProject(project: Project, all: Item[]) {
  const lookup: Lookup = new Map(all.map((i) => [i.id, i]));
  const cover = project.cover_path ? await toDataUrl(project.cover_path) : null;
  let body = `${cover ? `<img src="${cover}" class="cover"/>` : ""}<div class="facts"><table class="kv"><tr><td class="k">Tipo</td><td>`;
  body += `${esc(project.type)}</td></tr>${project.genre ? `<tr><td class="k">Genere</td><td>${esc(project.genre)}</td></tr>` : ""}${project.director ? `<tr><td class="k">Regia</td><td>${esc(project.director)}</td></tr>` : ""}${project.client ? `<tr><td class="k">Cliente</td><td>${esc(project.client)}</td></tr>` : ""}</table>${project.logline ? `<p><i>“${esc(project.logline)}”</i></p>` : ""}</div>`;
  for (const ph of PHASES) {
    for (const def of MODULES.filter((m) => m.phase === ph.key)) {
      const items = all.filter((i) => i.module === def.key || (def.key === "slate" && i.module === "slatelog"));
      if (!items.length) continue;
      body += `<h2 class="sec"><small>${esc(ph.label)}</small>${esc(def.label)}</h2>${await moduleHtml(def, items, lookup)}`;
    }
  }
  await exportHtml(project.title, wrap(project.title, body, `Dossier di progetto · ${project.type}`));
}
