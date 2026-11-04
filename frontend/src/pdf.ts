import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { fileUrl, Item, Project } from "@/src/api";
import { displayValue, eur, lineTotal, ModuleDef, MODULES, PHASES } from "@/src/modules";
import { Stroke, strokeAttrs, viewH, VW } from "@/src/strokes";
import { toast } from "@/src/ui";

type Lookup = Map<string, { title: string }>;

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

const CSS = `
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;margin:32px;font-size:12px}
  h1{font-family:Georgia,serif;font-size:26px;margin:0 0 4px} h2{font-family:Georgia,serif;font-size:18px;border-bottom:2px solid #D4AF37;padding-bottom:4px;margin-top:28px}
  h4{font-family:Georgia,serif;font-size:14px;margin:16px 0 4px;color:#8A6D1C;text-transform:uppercase;letter-spacing:1px}
  .meta{color:#777;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#F4EBD9;text-align:left;padding:6px;font-size:10px;text-transform:uppercase} td{border-bottom:1px solid #eee;padding:6px;vertical-align:top}
  .card{border:1px solid #ddd;border-radius:8px;padding:10px;margin:8px 0;page-break-inside:avoid} img{max-width:100%;max-height:220px;border-radius:6px}
  .sw{display:inline-block;width:22px;height:22px;border-radius:4px;margin-right:4px;border:1px solid #ccc}
  .grid{display:flex;flex-wrap:wrap;gap:10px} .grid .card{width:46%}
  .script{font-family:'Courier New',Courier,monospace;font-size:12pt;line-height:1.2;max-width:6in;margin:0 auto}
  .sc{font-weight:bold;text-transform:uppercase;margin-top:18px} .ac{margin-top:10px} .ch{margin-left:2.2in;margin-top:12px;text-transform:uppercase}
  .pa{margin-left:1.6in;width:2in} .di{margin-left:1in;width:3.5in} .tr{text-align:right;text-transform:uppercase;margin-top:12px}
  .sb{display:flex;flex-wrap:wrap;gap:12px} .sb .card{width:47%} svg{background:#fff;border:1px solid #ccc;width:100%}
  .doc{font-family:Georgia,serif;font-size:13px;line-height:1.7}
`;

async function toDataUrl(path: string): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      // Native: download to cache and inline as base64 so expo-print embeds the real image.
      const file = await File.downloadFileAsync(fileUrl(path), new Directory(Paths.cache), { idempotent: true });
      const ext = path.split(".").pop()?.toLowerCase();
      return `data:image/${ext === "png" ? "png" : "jpeg"};base64,${await file.base64()}`;
    }
    const blob = await (await fetch(fileUrl(path))).blob();
    return await new Promise((res) => {
      const r = new FileReader();
      r.onloadend = () => res(r.result as string);
      r.onerror = () => res(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const wrap = (title: string, body: string, subtitle = "") =>
  `<html><head><meta charset="utf-8"/><style>${CSS}</style></head><body><h1>${esc(title)}</h1><div class="meta">${esc(subtitle)} · ${new Date().toLocaleDateString("it-IT")}</div>${body}</body></html>`;

export async function exportHtml(title: string, html: string) {
  try {
    if (Platform.OS === "web") {
      const w = window.open("", "_blank");
      if (!w) throw new Error("popup");
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 400);
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
  const imgFields = fields.filter((f) => f.type === "image");
  const cards = await Promise.all(
    items.map(async (it) => {
      const imgs = (await Promise.all(imgFields.map((f) => (it.data[f.key] ? toDataUrl(it.data[f.key]) : null)))).filter(Boolean);
      const rows = fields
        .filter((f) => f.type !== "image" && displayValue(f, it.data[f.key], lookup) !== "")
        .map((f) => {
          let v: string = esc(displayValue(f, it.data[f.key], lookup));
          if (f.type === "colors")
            v = String(it.data[f.key])
              .split(",")
              .map((c) => `<span class="sw" style="background:${esc(c.trim())}"></span>${esc(c.trim())} `)
              .join("");
          return `<div><b>${esc(f.label)}:</b> ${v}</div>`;
        })
        .join("");
      const tot = def.sum ? `<div><b>Totale voce:</b> ${eur(lineTotal(def, it.data))}</div>` : "";
      return `<div class="card"><h3 style="margin:0 0 6px">${esc(it.title || "Senza titolo")}</h3>${imgs.map((s) => `<img src="${s}"/>`).join("")}${rows}${tot}</div>`;
    }),
  );
  const total = def.sum ? `<p><b>Totale: ${eur(items.reduce((a, it) => a + lineTotal(def, it.data), 0))}</b></p>` : "";
  return `${total}<div class="${def.grid ? "grid" : ""}">${cards.join("") || "<p>Nessun elemento.</p>"}</div>`;
}

export function docHtml(def: ModuleDef, it: Item | undefined) {
  if (!it) return "";
  let html = "";
  let group = "";
  for (const s of def.sections ?? []) {
    if (s.group && s.group !== group) {
      group = s.group;
      html += `<h2>${esc(group)}</h2>`;
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
  `<svg viewBox="0 0 ${VW} ${viewH(aspect)}" style="background:#fff;max-height:420px" xmlns="http://www.w3.org/2000/svg">${strokes
    .map((s) => {
      const a = strokeAttrs(s);
      return `<path d="${a.d}" fill="${a.fill}" stroke="${a.stroke}" stroke-width="${a.strokeWidth}" opacity="${a.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join("")}</svg>`;

export function storyboardHtml(items: Item[], lookup: Lookup) {
  return `<div class="sb">${items
    .map((it, i) => `<div class="card"><b>${i + 1}. ${esc(it.title)}</b> ${esc(it.data.scena ? `· Scena ${lookup.get(it.data.scena)?.title ?? ""}` : "")} ${esc(it.data.inquadratura ?? "")}${strokesSvg(it.data.strokes, it.data.aspect)}<div>${esc(it.data.movimento)}</div><div>${esc(it.data.descrizione)}</div></div>`)
    .join("")}</div>`;
}

export function lightingHtml(items: Item[]) {
  return items
    .map((it) => {
      const els = (it.data.elements ?? []) as { kind: string; x: number; y: number; label?: string }[];
      const dots = els
        .map((e) => `<div style="position:absolute;left:${e.x * 100}%;top:${e.y * 100}%;transform:translate(-50%,-50%);background:#D4AF37;color:#111;border-radius:12px;padding:2px 8px;font-size:10px;white-space:nowrap">${esc(e.label || e.kind)}</div>`)
        .join("");
      return `<div class="card"><h3>${esc(it.title)}</h3><div style="position:relative;width:100%;height:340px;background:#f6f6f6;border:1px solid #ccc">${dots}</div><div>${esc(it.data.note)}</div></div>`;
    })
    .join("");
}

export function genericHtml(items: Item[]) {
  return `<table><tr><th>Titolo</th><th>Dettagli</th></tr>${items
    .map((it) => `<tr><td>${esc(it.title)}</td><td>${Object.entries(it.data).filter(([, v]) => typeof v !== "object").map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(" · ")}</td></tr>`)
    .join("")}</table>`;
}

export async function moduleHtml(def: ModuleDef, items: Item[], lookup: Lookup) {
  if (def.kind === "list") return listHtml(def, items, lookup);
  if (def.kind === "doc") return docHtml(def, items[0]);
  if (def.kind === "screenplay") return items.map((it) => `<h3>${esc(it.title)}</h3>${screenplayHtml(it)}`).join("");
  if (def.kind === "storyboard") return storyboardHtml(items, lookup);
  if (def.kind === "lighting") return lightingHtml(items);
  return genericHtml(items);
}

export async function exportModule(project: Project, def: ModuleDef, items: Item[], lookup: Lookup = new Map()) {
  await exportHtml(def.label, wrap(def.label, await moduleHtml(def, items, lookup), project.title));
}

export async function exportProject(project: Project, all: Item[]) {
  const lookup: Lookup = new Map(all.map((i) => [i.id, i]));
  let body = `<p><b>Tipo:</b> ${esc(project.type)} · <b>Genere:</b> ${esc(project.genre)} · <b>Regia:</b> ${esc(project.director)}</p><p><i>${esc(project.logline)}</i></p>`;
  for (const ph of PHASES) {
    for (const def of MODULES.filter((m) => m.phase === ph.key)) {
      const items = all.filter((i) => i.module === def.key || (def.key === "slate" && i.module === "slatelog"));
      if (!items.length) continue;
      body += `<h2>${esc(ph.label)} — ${esc(def.label)}</h2>${await moduleHtml(def, items, lookup)}`;
    }
  }
  await exportHtml(project.title, wrap(project.title, body, "Dossier completo del progetto"));
}
