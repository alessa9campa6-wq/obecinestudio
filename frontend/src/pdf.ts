import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { fileUrl, Item, Project } from "@/src/api";
import { boardBoxes, testoSu } from "@/src/board";
import { displayValue, eur, FieldDef, lineTotal, ModuleDef, MODULES, PHASES } from "@/src/modules";
import { strokesToDataUri } from "@/src/brushes/render";
import { Stroke, strokeAttrs, viewH, VW } from "@/src/strokes";
import { toast } from "@/src/ui";

type Lookup = Map<string, { title: string }>;

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

// Indirizzi web ed email dentro ai testi diventano collegamenti veri.
// Si applica DOPO esc(): il testo è già sicuro, quindi < e > non possono
// finire dentro l'attributo href.
const URL_RE = /(https?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+)/gi;
const MAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;

export const links = (html: string): string => {
  const withUrls = html.replace(URL_RE, (match) => {
    const url = match.replace(/[.,;:!?)\]]+$/, "");
    const tail = match.slice(url.length);
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return `<a href="${href}" class="lnk">${url}</a>${tail}`;
  });

  return withUrls.replace(
    MAIL_RE,
    (mail) => `<a href="mailto:${mail}" class="lnk">${mail}</a>`,
  );
};

// Testo semplice con i collegamenti attivi: il caso normale.
export const rich = (s: unknown) => links(esc(s));

const CSS = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4;
    margin: 18mm 16mm;
  }

  body {
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #111827;
    margin: 0;
    font-size: 10.5pt;
    line-height: 1.45;
    background: #ffffff;
    orphans: 2;
    widows: 3;
    overflow-wrap: break-word;
    word-wrap: break-word;
  }

  .cover {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    border-radius: 14px;
    margin-bottom: 22px;
    display: block;
  }

  .cover-title {
    margin: 0 0 6px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 30pt;
    line-height: 1.1;
    color: #111827;
  }

  .cover-subtitle {
    margin: 0 0 18px;
    font-size: 10pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .cover-rule {
    height: 3px;
    width: 72px;
    background: #d4af37;
    border-radius: 3px;
    margin-bottom: 22px;
  }

  .facts {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 22px;
  }

  .facts table {
    width: 100%;
    border-collapse: collapse;
  }

  .facts td {
    border: 0;
    border-bottom: 1px solid #e5e7eb;
    padding: 6px 0;
    font-size: 10pt;
    vertical-align: top;
  }

  .facts td.k {
    width: 32%;
    color: #6b7280;
    font-size: 8.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding-right: 10px;
  }

  .facts tr:last-child td {
    border-bottom: 0;
  }

  .logline {
    margin: 12px 0 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #374151;
  }

  h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 17pt;
    font-weight: 600;
    color: #111827;
    margin: 28px 0 12px;
    padding-bottom: 7px;
    border-bottom: 2px solid #d4af37;
    break-after: avoid;
  }

  h2 small {
    display: block;
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #8a6d1c;
    margin-bottom: 4px;
  }

  h3 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12.5pt;
    font-weight: 600;
    color: #111827;
    margin: 0 0 7px;
  }

  h4 {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8a6d1c;
    margin: 14px 0 5px;
    padding-bottom: 3px;
    border-bottom: 1px solid #e5e7eb;
  }

  p {
    margin: 0 0 9px;
  }

  .doc {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11.5pt;
    line-height: 1.65;
    color: #1f2937;
  }

  .empty {
    color: #9ca3af;
    font-style: italic;
  }

  table.list {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin: 8px 0 16px;
  }

  table.list th {
    background: #f9fafb;
    color: #374151;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    padding: 8px 9px;
    border-bottom: 2px solid #d4af37;
  }

  table.list td {
    border-bottom: 1px solid #e5e7eb;
    padding: 8px 9px;
    vertical-align: top;
  }

  table.list tr {
    break-inside: avoid;
  }

  table.list tbody.row {
    break-inside: avoid;
  }

  table.list tr.sub td {
    border-top: 0;
    padding-top: 0;
    color: #6b7280;
    font-size: 9pt;
  }

  table.list tr.grp td {
    background: #111827;
    color: #d4af37;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 8.5pt;
    padding: 7px 9px;
  }

  .r {
    text-align: right;
    white-space: nowrap;
  }

  .lbl {
    color: #8a6d1c;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-right: 4px;
  }

  .sum {
    background: #111827;
    color: #ffffff;
    border-radius: 12px;
    padding: 12px 16px;
    margin: 0 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    break-inside: avoid;
  }

  .sum b {
    color: #d4af37;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15pt;
    font-weight: 600;
  }

  .cards {
    font-size: 0;
    margin: 0 -4px;
  }

  .card {
    display: inline-block;
    vertical-align: top;
    width: calc(50% - 8px);
    margin: 0 8px 14px 0;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    background: #ffffff;
    break-inside: avoid;
  }

  .card:nth-child(2n) {
    margin-right: 0;
  }

  .badge {
    display: inline-block;
    background: #d4af37;
    color: #111827;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 999px;
    padding: 3px 9px;
    margin-bottom: 7px;
  }

  .pics {
    margin: -12px -14px 10px;
  }

  .pics img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
    border-radius: 12px 12px 0 0;
  }

  .thumbs {
    font-size: 0;
    margin-top: 3px;
  }

  .thumbs img {
    display: inline-block;
    width: 33%;
    height: 64px;
    object-fit: cover;
    margin-right: 0.5%;
  }

  .kv {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }

  .kv td {
    border: 0;
    border-top: 1px solid #f3f4f6;
    padding: 5px 0;
    font-size: 9.5pt;
    vertical-align: top;
  }

  .kv td.k {
    width: 34%;
    color: #6b7280;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding-right: 8px;
  }

  .tot {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 2px solid #d4af37;
    font-weight: 700;
    text-align: right;
  }

  .gal {
    font-size: 0;
    margin: 0 -4px;
  }

  /* Tavola moodboard: il collage stampato com'è disposto nell'app. */
  .mb-page {
    break-after: page;
  }

  .mb-page:last-child {
    break-after: auto;
  }

  .mb {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 66.66%;
    background: #f5f3ee;
    border: 1px solid #e5e2d8;
    border-radius: 8px;
    overflow: hidden;
  }

  .mb-in {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }

  .mb-t {
    position: absolute;
    overflow: hidden;
    border-radius: 4px;
    background: #ffffff;
  }

  .mb-t img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .mb-txt {
    height: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    font-size: 9pt;
    line-height: 1.25;
  }

  .mb-txt b {
    display: block;
    font-size: 10pt;
    margin-bottom: 3px;
  }

  .mb-txt span {
    opacity: 0.85;
  }

  .mb-vuoto {
    display: block;
    padding: 10px;
    font-size: 8pt;
    color: #9ca3af;
  }

  .mb-legend {
    columns: 2;
    column-gap: 20px;
    margin: 10px 0 0;
    font-size: 8.5pt;
    color: #4b5563;
  }

  .mb-legend div {
    break-inside: avoid;
    margin-bottom: 4px;
    line-height: 1.35;
  }

  .mb-legend .n {
    color: #b8962e;
    font-weight: 700;
    margin-right: 5px;
  }

  .tile {
    display: inline-block;
    vertical-align: top;
    width: calc(33.333% - 8px);
    margin: 0 8px 14px 0;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    break-inside: avoid;
  }

  .tile:nth-child(3n) {
    margin-right: 0;
  }

  .tile .ph {
    height: 150px;
    background: #f3f4f6;
    text-align: center;
    line-height: 150px;
    color: #9ca3af;
  }

  .tile .ph img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }

  .tile .tc {
    padding: 9px 11px;
    line-height: 1.4;
  }

  .tile .tc div {
    color: #6b7280;
    font-size: 9pt;
    margin: 3px 0 0;
  }

  .sw {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    margin-right: 4px;
    border: 1px solid #d1d5db;
    vertical-align: middle;
  }

  .script {
    font-family: "Courier Prime", "Courier New", Courier, monospace;
    font-size: 11.5pt;
    line-height: 1.35;
    max-width: 6in;
    margin: 0 auto;
  }

  .sc {
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 20px;
  }

  .ac {
    margin-top: 10px;
  }

  .ch {
    margin-left: 2.2in;
    margin-top: 12px;
    text-transform: uppercase;
  }

  .pa {
    margin-left: 1.6in;
    width: 2in;
  }

  .di {
    margin-left: 1in;
    width: 3.5in;
  }

  .tr {
    text-align: right;
    text-transform: uppercase;
    margin-top: 12px;
  }

  .sb .card {
    padding: 0;
    overflow: hidden;
  }

  .sb .frame {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
  }

  .sb svg,
  .sb img {
    width: 100%;
    height: auto;
    display: block;
    background: #ffffff;
  }

  .sb.v > .card {
    width: calc(33.333% - 8px);
    margin-right: 8px;
  }

  .sb.v > .card:nth-child(3n) {
    margin-right: 0;
  }

  .sb.v .frame {
    height: 280px;
    background: #f3f4f6;
  }

  .sb.v svg,
  .sb.v img {
    height: 280px;
    width: auto;
    display: inline-block;
  }

  .sb .cap {
    padding: 9px 12px;
  }

  .sb .num {
    display: inline-block;
    background: #111827;
    color: #d4af37;
    font-weight: 700;
    border-radius: 5px;
    padding: 1px 7px;
    margin-right: 6px;
  }

  .sb .tags {
    color: #8a6d1c;
    font-size: 8.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 3px 0 4px;
  }

  .plan {
    position: relative;
    width: 100%;
    height: 320px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background-image:
      linear-gradient(#e5e7eb 1px, transparent 1px),
      linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .section-break {
    break-before: page;
    break-after: page;
  }

  .page-break {
    break-before: page;
  }

  .avoid-break {
    break-inside: avoid;
  }

  .lnk {
    color: #8a6d1c;
    text-decoration: none;
    border-bottom: 1px solid #d4af37;
    overflow-wrap: anywhere;
  }

  thead {
    display: table-header-group;
  }

  h3,
  h4 {
    break-after: avoid;
  }

  img,
  svg,
  tr {
    break-inside: avoid;
  }

  /* Piano di lavorazione: una giornata per pagina, come un ordine del giorno. */
  .day {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 14px 16px 6px;
    margin: 0 0 16px;
    break-inside: avoid;
  }

  .day-hd {
    border-bottom: 2px solid #d4af37;
    padding-bottom: 9px;
    margin-bottom: 12px;
  }

  .day-kicker {
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #8a6d1c;
    margin-bottom: 3px;
  }

  .day-title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15pt;
    line-height: 1.2;
    color: #111827;
  }

  .day-date {
    font-size: 10pt;
    font-weight: 600;
    color: #374151;
    margin-top: 3px;
  }

  .cols {
    display: flex;
    gap: 18px;
    align-items: flex-start;
  }

  .cols > .col {
    flex: 1 1 0;
    min-width: 0;
  }

  .block {
    margin: 10px 0 0;
    break-inside: avoid;
  }

  .block > h4 {
    margin: 0 0 4px;
  }

  .block > div,
  .block > table {
    font-size: 10pt;
    color: #1f2937;
  }

  .footer {
    margin-top: 24px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt;
    color: #6b7280;
    text-align: center;
  }
`;

const VIDEO = /\.(mp4|mov|m4v|webm)$/i;

async function toDataUrl(path: string): Promise<string | null> {
  if (!path || VIDEO.test(path)) return null;

  try {
    if (Platform.OS !== "web") {
      const safeName = path.replace(/[^a-zA-Z0-9.]/g, "_").slice(-80);
      const dest = new File(Paths.cache, `pdf-${safeName}`);

      if (!dest.exists) {
        await File.downloadFileAsync(fileUrl(path), dest, {
          idempotent: true,
        });
      }

      const out = await manipulateAsync(
        dest.uri,
        [{ resize: { width: 1400 } }],
        {
          compress: 0.75,
          format: SaveFormat.JPEG,
          base64: true,
        },
      );

      return out.base64
        ? `data:image/jpeg;base64,${out.base64}`
        : null;
    }

    const res = await fetch(fileUrl(path));

    if (!res.ok) return null;

    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const wrap = (
  title: string,
  body: string,
  subtitle = "",
) => `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${esc(title)}</title>
      <style>
        ${CSS}
      </style>
    </head>

    <body>
      <div class="cover-title">${esc(title)}</div>
      ${
        subtitle
          ? `<div class="cover-subtitle">${esc(subtitle)}</div>`
          : ""
      }
      <div class="cover-rule"></div>
      ${body}
    </body>
  </html>
`;

export async function exportHtml(title: string, html: string) {
  try {
    if (Platform.OS === "web") {
      const frame = document.createElement("iframe");

      frame.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0";

      document.body.appendChild(frame);

      frame.contentDocument!.open();
      frame.contentDocument!.write(html);
      frame.contentDocument!.close();

      setTimeout(() => {
        frame.contentWindow!.focus();
        frame.contentWindow!.print();

        setTimeout(() => {
          frame.remove();
        }, 2000);
      }, 500);

      return;
    }

    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: title,
    });
  } catch {
    toast("Esportazione PDF non riuscita", "error");
  }
}

async function listHtml(
  def: ModuleDef,
  items: Item[],
  lookup: Lookup,
) {
  const fields = def.fields ?? [];

  const imageFields = fields.filter(
    (field) => field.type === "image" || field.type === "media",
  );

  const textFields = fields.filter(
    (field) => field.type !== "image" && field.type !== "media",
  );

  const value = (field: FieldDef, item: Item) => {
    if (field.type === "colors") {
      return String(item.data[field.key] ?? "")
        .split(",")
        .filter((color) => color.trim())
        .map(
          (color) =>
            `<span class="sw" style="background:${esc(
              color.trim(),
            )}"></span>`,
        )
        .join("");
    }

    return rich(
      displayValue(field, item.data[field.key], lookup),
    );
  };

  const has = (field: FieldDef, item: Item) =>
    displayValue(field, item.data[field.key], lookup) !== "";

  if (!items.length) {
    return `<p class="empty">Nessun elemento.</p>`;
  }

  const pictures = await Promise.all(
    items.map(async (item) => {
      const urls = await Promise.all(
        imageFields.map(async (field) => {
          if (!item.data[field.key]) return null;

          return toDataUrl(item.data[field.key]);
        }),
      );

      return urls.filter(Boolean) as string[];
    }),
  );

  const videos = (item: Item) =>
    imageFields.filter((field) =>
      VIDEO.test(String(item.data[field.key] ?? "")),
    ).length;

  const total = def.sum
    ? `<div class="sum">
        <span>${items.length} voci · Totale ${esc(def.label)}</span>
        <b>${eur(
          items.reduce(
            (sum, item) => sum + lineTotal(def, item.data),
            0,
          ),
        )}</b>
      </div>`
    : "";

  if (def.grid) {
    return `${total}<div class="gal">${items
      .map((item, index) => {
        const image = pictures[index][0];

        const caption = [
          item.title,
          ...textFields
            .filter(
              (field) =>
                has(field, item) && field.type !== "multiline",
            )
            .map((field) =>
              displayValue(field, item.data[field.key], lookup),
            ),
        ]
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ");

        const note = textFields
          .filter(
            (field) =>
              field.type === "multiline" && has(field, item),
          )          .map((field) => rich(item.data[field.key]))
            .join(" ");

        return `<div class="tile">
          <div class="ph">
            ${
              image
                ? `<img src="${image}" />`
                : `<span>${
                    videos(item) ? "🎬 Video" : "Nessuna immagine"
                  }</span>`
            }
          </div>

          <div class="tc">
            <b>${links(esc(caption || "—"))}</b>
            ${note ? `<div>${note}</div>` : ""}
          </div>
        </div>`;
      })
      .join("")}</div>`;
  }

  if (pictures.some((pictures) => pictures.length)) {
    return `${total}<div class="cards">${items
      .map((item, index) => {
        const rows = textFields
          .filter((field) => has(field, item))
          .map(
            (field) => `<tr>
              <td class="k">${esc(
                field.label.split(" (")[0],
              )}</td>
              <td>${value(field, item)}</td>
            </tr>`,
          )
          .join("");

        const [main, ...others] = pictures[index];

        const badge =
          def.badge && item.data[def.badge]
            ? `<div class="badge">${esc(
                item.data[def.badge],
              )}</div>`
            : "";

        const photo = main
          ? `<div class="pics">
              <img src="${main}" />
              ${
                others.length
                  ? `<div class="thumbs">${others
                      .map((url) => `<img src="${url}" />`)
                      .join("")}</div>`
                  : ""
              }
            </div>`
          : "";

        return `<div class="card">
          ${photo}
          ${badge}
          <h3>${esc(item.title || "Senza titolo")}</h3>
          ${
            rows
              ? `<table class="kv">${rows}</table>`
              : ""
          }
          ${
            def.sum && lineTotal(def, item.data) > 0
              ? `<div class="tot">${eur(
                  lineTotal(def, item.data),
                )}</div>`
              : ""
          }
        </div>`;
      })
      .join("")}</div>`;
  }

  // I campi a righe (i ruoli della troupe) sono troppo lunghi per una colonna:
  // finiscono sotto la riga, come i testi lunghi.
  const shortFields = textFields
    .filter(
      (field) =>
        field.type !== "multiline" &&
        field.type !== "rows" &&
        field.key !== def.sum?.groupBy &&
        items.some((item) => has(field, item)),
    )
    .slice(0, 5);

  const longFields = textFields.filter(
    (field) =>
      !shortFields.includes(field) &&
      field.key !== def.sum?.groupBy &&
      items.some((item) => has(field, item)),
  );

  const shortLabels: Record<string, string> = {
    durata: "Durata",
    quantita: "Qtà",
    unita: "Unità",
    importo: "Costo unit.",
    tariffa: "Tariffa",
  };

  const columnLabel = (field: FieldDef) =>
    shortLabels[field.key] ??
    field.label.split(" (")[0].split(" / ")[0];

  const numberClass = (field: FieldDef) =>
    field.type === "number" ? ` class="r"` : "";

  const head = `<tr>
    <th>${esc(def.titleLabel ?? "Titolo")}</th>
    ${shortFields
      .map(
        (field) =>
          `<th${numberClass(field)}>${esc(
            columnLabel(field),
          )}</th>`,
      )
      .join("")}
    ${def.sum ? `<th class="r">Totale</th>` : ""}
  </tr>`;

  const columns =
    shortFields.length + 1 + (def.sum ? 1 : 0);

  const row = (item: Item) => {
    const extra = longFields
      .filter((field) => has(field, item))
      .map(
        (field) =>
          `<span class="lbl">${esc(
            columnLabel(field),
          )}</span> ${value(field, item)}`,
      )
      .join(" &nbsp;·&nbsp; ");

    return `<tbody class="row">
      <tr>
        <td><b>${esc(item.title || "—")}</b></td>
        ${shortFields
          .map(
            (field) =>
              `<td${numberClass(field)}>${value(
                field,
                item,
              )}</td>`,
          )
          .join("")}
        ${
          def.sum
            ? `<td class="r"><b>${eur(
                lineTotal(def, item.data),
              )}</b></td>`
            : ""
        }
      </tr>

      ${
        extra
          ? `<tr class="sub">
              <td colspan="${columns}">${extra}</td>
            </tr>`
          : ""
      }
    </tbody>`;
  };

  const groupBy = def.sum?.groupBy;

  if (groupBy) {
    const groups = [
      ...new Set(
        items.map((item) =>
          String(item.data[groupBy] || "Altro"),
        ),
      ),
    ];

    return `${total}<table class="list">
      <thead>${head}</thead>

      ${groups
        .map((name) => {
          const groupItems = items.filter(
            (item) =>
              String(item.data[groupBy] || "Altro") === name,
          );

          return `<tbody>
            <tr class="grp">
              <td colspan="${columns - 1}">${esc(name)}</td>
              <td class="r">${eur(
                groupItems.reduce(
                  (sum, item) =>
                    sum + lineTotal(def, item.data),
                  0,
                ),
              )}</td>
            </tr>
          </tbody>
          ${groupItems.map(row).join("")}`;
        })
        .join("")}
    </table>`;
  }

  return `${total}<table class="list">
    <thead>${head}</thead>
    ${items.map(row).join("")}
  </table>`;
}

export function docHtml(
  def: ModuleDef,
  item: Item | undefined,
) {
  if (!item) return "";

  let html = "";
  let group = "";

  for (const section of def.sections ?? []) {
    if (section.group && section.group !== group) {
      group = section.group;

      html += `<h3 style="
        margin-top: 24px;
        color: #8a6d1c;
      ">${esc(group)}</h3>`;
    }

    if (item.data[section.key]) {
      html += `<h4>${esc(section.label)}</h4>
      <div class="doc">${links(
        esc(item.data[section.key]),
      )}</div>`;
    }
  }

  return html;
}

export function screenplayHtml(item: Item) {
  const classes: Record<string, string> = {
    scene: "sc",
    action: "ac",
    character: "ch",
    parenthetical: "pa",
    dialogue: "di",
    transition: "tr",
  };

  const elements = (item.data.elements ?? []) as {
    type: string;
    text: string;
  }[];

  return `<div class="script">${elements
    .map((element) => {
      const text =
        element.type === "parenthetical" &&
        element.text &&
        !element.text.startsWith("(")
          ? `(${element.text})`
          : element.text;

      return `<div class="${
        classes[element.type] ?? "ac"
      }">${esc(text)}</div>`;
    })
    .join("")}</div>`;
}

export const strokesSvg = (
  strokes: Stroke[] = [],
  aspect?: string,
) => {
  const uri = strokes.length
    ? strokesToDataUri(strokes, aspect, {
        width: 1400,
        format: "png",
      })
    : null;

  return uri
    ? `<img src="${uri}" />`
    : strokesVectorSvg(strokes, aspect);
};

const strokesVectorSvg = (
  strokes: Stroke[] = [],
  aspect?: string,
) => `
  <svg
    viewBox="0 0 ${VW} ${viewH(aspect)}"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    ${strokes
      .map((stroke) => {
        const attrs = strokeAttrs(stroke);

        return `<path
          d="${attrs.d}"
          fill="${attrs.fill}"
          stroke="${attrs.stroke}"
          stroke-width="${attrs.strokeWidth}"
          opacity="${attrs.opacity}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />`;
      })
      .join("")}
  </svg>
`;

export function storyboardHtml(
  items: Item[],
  lookup: Lookup,
) {
  const vertical =
    items.length > 0 &&
    items.every((item) =>
      ["9:16", "4:5", "1:1"].includes(item.data.aspect),
    );

  return `<div class="cards sb${
    vertical ? " v" : ""
  }">${items
    .map((item, index) => {
      const tags = [
        item.data.aspect,
        item.data.scena
          ? `Scena ${
              lookup.get(item.data.scena)?.title ?? ""
            }`
          : "",
        item.data.inquadratura,
        item.data.movimento,
      ]
        .filter(Boolean)
        .map((tag) => esc(tag))
        .join(" · ");

      return `<div class="card">
        <div class="frame">
          ${strokesSvg(
            item.data.strokes,
            item.data.aspect,
          )}
        </div>

        <div class="cap">
          <div>
            <span class="num">${index + 1}</span>
            <b>${esc(item.title)}</b>
          </div>

          ${tags ? `<div class="tags">${tags}</div>` : ""}

          ${
            item.data.descrizione
              ? `<div>${rich(item.data.descrizione)}</div>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("")}</div>`;
}

export async function lightingHtml(
  items: Item[],
  lookup: Lookup,
) {
  const cards = await Promise.all(
    items.map(async (item) => {
      const elements = (item.data.elements ?? []) as {
        kind: string;
        x: number;
        y: number;
        label?: string;
      }[];

      const dots = elements
        .map(
          (element) => `<div style="
            position: absolute;
            left: ${element.x * 100}%;
            top: ${element.y * 100}%;
            transform: translate(-50%, -50%);
            background: #d4af37;
            color: #111827;
            border-radius: 12px;
            padding: 3px 9px;
            font-size: 9pt;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          ">${esc(element.label || element.kind)}</div>`,
        )
        .join("");

      const location = item.data.location
        ? (lookup.get(item.data.location) as Item | undefined)
        : undefined;

      const photo = location?.data?.foto
        ? await toDataUrl(location.data.foto)
        : null;

      const gear = (
        (item.data.attrezzatura ?? []) as string[]
      )
        .map((id) => lookup.get(id)?.title)
        .filter(Boolean);

      return `<div class="card">
        ${
          location
            ? `<div class="badge">${esc(
                location.title,
              )}</div>`
            : ""
        }

        <h3>${esc(item.title)}</h3>

        ${
          photo
            ? `<img
                src="${photo}"
                class="cover"
                style="max-height: 210px"
              />`
            : ""
        }

        <div class="plan">${dots}</div>

        ${
          gear.length
            ? `<h4>Attrezzatura</h4>
              <div>${gear
                .map((item) => esc(item))
                .join(" · ")}</div>`
            : ""
        }

        ${
          item.data.note
            ? `<h4>Note</h4>
              <div>${rich(item.data.note)}</div>`
            : ""
        }
      </div>`;
    }),
  );

  return cards.join("");
}

const pretty = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

export function genericHtml(items: Item[]) {
  return `<table class="list">
    <thead>
      <tr>
        <th style="width: 30%">Titolo</th>
        <th>Dettagli</th>
      </tr>
    </thead>

    <tbody>
      ${items
        .map(
          (item) => `<tr>
            <td><b>${esc(item.title)}</b></td>
            <td>${Object.entries(item.data)
              .filter(
                ([key, value]) =>
                  typeof value !== "object" &&
                  value !== "" &&
                  value != null &&
                  !/(_id|path|uri)$/i.test(key),
              )
              .map(
                ([key, value]) =>
                  `<span class="lbl">${esc(
                    pretty(key),
                  )}</span> ${links(
                    esc(
                      typeof value === "boolean"
                        ? value
                          ? "sì"
                          : "no"
                        : value,
                    ),
                  )}`,
              )
              .join(" &nbsp;·&nbsp; ")}</td>
          </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
}



const MESI = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

// Le date sono salvate come 2026-11-08: sul PDF si leggono meglio per esteso.
const humanDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) return value;
  return `${Number(day)} ${MESI[date.getMonth()]} ${year}`;
};

// Piano di lavorazione impaginato come un ordine del giorno: una giornata
// per pagina, orari a sinistra, luoghi a destra, testi lunghi a tutta larghezza.
export function pianoHtml(
  def: ModuleDef,
  items: Item[],
  lookup: Lookup,
) {
  if (!items.length) return `<p class="empty">Nessun giorno.</p>`;

  const fields = def.fields ?? [];
  const fieldFor = (key: string) =>
    fields.find((field) => field.key === key);
  const labelFor = (key: string) => fieldFor(key)?.label ?? key;

  const val = (key: string, item: Item): string => {
    const field = fieldFor(key);
    const raw = displayValue(field, item.data[key], lookup);

    if (!raw) return "";
    return field?.type === "date" ? humanDate(raw) : raw;
  };

  const table = (keys: string[], item: Item): string => {
    const rows = keys
      .map((key) => {
        const value = val(key, item);

        return value
          ? `<tr><td class="k">${esc(
              labelFor(key),
            )}</td><td>${rich(value)}</td></tr>`
          : "";
      })
      .join("");

    return rows ? `<table class="kv">${rows}</table>` : "";
  };

  const ORARI = [
    "convocazione",
    "convocazione_cast",
    "inizio",
    "pranzo",
    "cena",
    "fine",
    "alba",
    "tramonto",
  ];
  const LUOGHI = ["location", "ambienti", "base", "parcheggio", "meteo"];
  const LAVORO = ["scene", "pagine", "troupe", "cast", "comparse"];
  const TESTI = [
    "orari_reparti",
    "fabbisogno",
    "note",
    "sicurezza",
    "emergenza",
    "ospedale",
  ];

  return items
    .map((item, index) => {
      const numero = val("numero", item);
      const data = val("data", item);
      const title =
        item.title ||
        (numero ? `Giornata ${numero}` : "Piano di lavorazione");

      const kicker = /giornata/i.test(title)
        ? "Ordine del giorno"
        : numero
          ? `Giornata ${numero}`
          : "Ordine del giorno";

      const orari = table(ORARI, item);
      const luoghi = table(LUOGHI, item);
      const lavoro = table(LAVORO, item);

      const blocks = TESTI.filter((key) => val(key, item))
        .map(
          (key) =>
            `<div class="block"><h4>${esc(
              labelFor(key),
            )}</h4><div>${rich(val(key, item))}</div></div>`,
        )
        .join("");

      return `<div class="day${index > 0 ? " page-break" : ""}">
        <div class="day-hd">
          <div class="day-kicker">${esc(kicker)}</div>
          <div class="day-title">${esc(title)}</div>
          ${data ? `<div class="day-date">${esc(data)}</div>` : ""}
        </div>

        ${
          orari || luoghi
            ? `<div class="cols">
                ${orari ? `<div class="col">${orari}</div>` : ""}
                ${luoghi ? `<div class="col">${luoghi}</div>` : ""}
              </div>`
            : ""
        }

        ${lavoro ? `<div class="block">${lavoro}</div>` : ""}
        ${blocks}
      </div>`;
    })
    .join("");
}


// La moodboard non è una lista di immagini: è uno spazio. Il PDF stampa il
// collage con le stesse posizioni, misure e rotazioni dell'app, una tavola per
// scena, con la legenda sotto. Le posizioni vengono da boardBoxes(), la stessa
// funzione che usa l'app: i due non possono divergere.
async function moodboardHtml(
  def: ModuleDef,
  items: Item[],
  lookup: Lookup,
) {
  if (!items.length) return `<p class="empty">Nessun elemento.</p>`;

  const fields = def.fields ?? [];
  const imageFields = fields.filter(
    (field) => field.type === "image" || field.type === "media",
  );
  const noteFields = fields.filter((field) => field.type === "multiline");

  const chiave = (def.groupBy ?? []).find((k) =>
    items.some((item) => item.data[k]),
  );

  const gruppi = new Map<string, Item[]>();
  items.forEach((item) => {
    const valore = chiave ? item.data[chiave] : "";
    const label = valore
      ? String(lookup.get(valore)?.title ?? valore)
      : "";

    gruppi.set(label, [...(gruppi.get(label) ?? []), item]);
  });

  // Le immagini viaggiano dentro il PDF come data URL: il foglio si apre anche
  // senza rete.
  const sorgenti = new Map<string, string | null>();
  for (const item of items) {
    const percorso = imageFields
      .map((field) => item.data[field.key])
      .find(Boolean);
    sorgenti.set(item.id, percorso ? await toDataUrl(percorso) : null);
  }

  const schede = [...gruppi.entries()].map(([label, lista]) => {
    const boxes = boardBoxes(lista);

    const tile = lista
      .map((item, i) => {
        const box = boxes[i];
        const percorso = imageFields
          .map((field) => item.data[field.key])
          .find(Boolean);
        const src = sorgenti.get(item.id) ?? null;
        const nota = noteFields
          .map((field) => rich(item.data[field.key]))
          .filter(Boolean)
          .join(" ");
        const fondo = String(item.data.tavola_fondo ?? "") || "#ffffff";

        const stile = `left:${(box.x * 100).toFixed(2)}%;top:${(
          box.y * 100
        ).toFixed(2)}%;width:${(box.w * 100).toFixed(2)}%;height:${(
          box.h * 100
        ).toFixed(2)}%;z-index:${box.z + 1};${
          box.rot ? `transform:rotate(${box.rot}deg);` : ""
        }`;

        const corpo =
          src && !VIDEO.test(String(percorso))
            ? `<img src="${src}" />`
            : percorso
              ? `<span class="mb-vuoto">Video</span>`
              : `<div class="mb-txt" style="background:${esc(
                  fondo,
                )};color:${testoSu(fondo)}"><b>${links(
                  esc(item.title || "Senza titolo"),
                )}</b>${nota ? `<span>${nota}</span>` : ""}</div>`;

        return `<div class="mb-t" style="${stile}">${corpo}</div>`;
      })
      .join("");

    const legenda = lista
      .map((item, i) => {
        const nota = noteFields
          .map((field) => rich(item.data[field.key]))
          .filter(Boolean)
          .join(" ");

        return `<div><span class="n">${i + 1}</span><b>${links(
          esc(item.title || "Senza titolo"),
        )}</b>${nota ? ` — ${nota}` : ""}</div>`;
      })
      .join("");

    return `<div class="mb-page">
      <h3>${esc(label || def.label)}</h3>
      <div class="mb"><div class="mb-in">${tile}</div></div>
      <div class="mb-legend">${legenda}</div>
    </div>`;
  });

  return schede.join("");
}

export async function moduleHtml(
  def: ModuleDef,
  items: Item[],
  lookup: Lookup,
) {
  if (def.kind === "list") {
    if (def.key === "piano") {
      return pianoHtml(def, items, lookup);
    }
    if (def.key === "moodboard") {
      return moodboardHtml(def, items, lookup);
    }
    return listHtml(def, items, lookup);
  }

  if (def.kind === "doc") {
    return docHtml(def, items[0]);
  }

  if (def.kind === "screenplay") {
    return items
      .map(
        (item) => `<h3 style="
          text-align: center;
          font-size: 18pt;
          margin: 10px 0 22px;
        ">${esc(item.title)}</h3>
        ${screenplayHtml(item)}`,
      )
      .join("");
  }

  if (def.kind === "storyboard") {
    return storyboardHtml(items, lookup);
  }

  if (def.kind === "lighting") {
    return lightingHtml(items, lookup);
  }

  return genericHtml(items);
}

export async function exportModule(
  project: Project,
  def: ModuleDef,
  items: Item[],
  lookup: Lookup = new Map(),
) {
  await exportHtml(
    def.label,
    wrap(
      def.label,
      await moduleHtml(def, items, lookup),
      `${project.title} · ${project.type}`,
    ),
  );
}

export async function exportProject(
  project: Project,
  all: Item[],
) {
  const lookup: Lookup = new Map(
    all.map((item) => [item.id, item]),
  );

  const cover = project.cover_path
    ? await toDataUrl(project.cover_path)
    : null;

  let body = "";

  if (cover) {
    body += `<img class="cover" src="${cover}" />`;
  }

  body += `<div class="facts">
    <table>
      <tr>
        <td class="k">Tipo</td>
        <td>${esc(project.type)}</td>
      </tr>

      ${
        project.genre
          ? `<tr>
              <td class="k">Genere</td>
              <td>${esc(project.genre)}</td>
            </tr>`
          : ""
      }

      ${
        project.director
          ? `<tr>
              <td class="k">Regia</td>
              <td>${esc(project.director)}</td>
            </tr>`
          : ""
      }

      ${
        project.client
          ? `<tr>
              <td class="k">Cliente</td>
              <td>${esc(project.client)}</td>
            </tr>`
          : ""
      }
    </table>

    ${
      project.logline
        ? `<p class="logline">“${links(
            esc(project.logline),
          )}”</p>`
        : ""
    }
  </div>`;

  for (const phase of PHASES) {
    const modules = MODULES.filter(
      (module) => module.phase === phase.key,
    );

    for (const module of modules) {
      const items = all.filter(
        (item) =>
          item.module === module.key ||
          (module.key === "slate" &&
            item.module === "slatelog"),
      );

      if (!items.length) continue;

      body += `<h2 class="page-break">
        <small>${esc(phase.label)}</small>
        ${esc(module.label)}
      </h2>`;

      body += await moduleHtml(
        module,
        items,
        lookup,
      );
    }
  }

  await exportHtml(
    project.title,
    wrap(
      project.title,
      body,
      `Dossier di progetto · ${project.type}`,
    ),
  );
}