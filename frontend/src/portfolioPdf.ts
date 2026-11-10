import { fileUrl } from "@/src/api";
import { esc, exportHtml, imageAsDataUrl, rich } from "@/src/pdf";
import { isVideo } from "@/src/modules";
import { Post } from "@/src/social";

// Portfolio e vetrina noleggio: due PDF "da presentazione", pensati per essere
// mandati a un cliente. Foto grandi, tipografia da rivista, poche parole.

export type PortfolioData = {
  nome: string;
  username?: string;
  categoria?: string;
  bio?: string;
  link?: string;
  foto?: string | null;
  post: Post[];
  email?: string;
  telefono?: string;
  /** Solo questi post (per scegliere i lavori da mettere nel PDF). */
  scelti?: string[];
  includiContatti?: boolean;
};

// Documento completo: qui comando io margini, font e stacchi pagina.
const BASE = `
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111827; margin: 0; font-size: 10.5pt; line-height: 1.45; }
  a { color: #7A5F0A; text-decoration: none; }
`;

const doc = (titolo: string, body: string) => `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${esc(titolo)}</title>
      <style>${BASE}</style>
    </head>
    <body>${body}</body>
  </html>`;

const CSS = `
  <style>
    body { background: #FFFFFF; }
    .sheet { padding: 0; }

    /* ---------- copertina ---------- */
    .cover-page { page-break-after: always; min-height: 252mm; display: flex; flex-direction: column; justify-content: space-between; }
    .cover-img { width: 100%; height: 132mm; object-fit: cover; border-radius: 4mm; display: block; }
    .cover-block { padding: 8mm 0 0; }
    .eyebrow { font-size: 7.5pt; letter-spacing: 0.34em; text-transform: uppercase; color: #9A7B12; font-weight: 700; margin: 0 0 4mm; }
    .big-name { font-family: Georgia, "Times New Roman", serif; font-size: 42pt; line-height: 0.98; margin: 0 0 3mm; letter-spacing: -0.01em; }
    .handle { font-size: 10pt; color: #6B7280; margin: 0 0 5mm; }
    .lead { font-size: 12pt; line-height: 1.55; color: #1F2937; margin: 0 0 6mm; max-width: 150mm; }
    .cover-meta { display: flex; flex-wrap: wrap; gap: 3mm; margin-top: 4mm; }
    .meta-pill { border: 0.4mm solid #E5E7EB; border-radius: 99px; padding: 2mm 4mm; font-size: 8.5pt; color: #374151; }
    .meta-pill.gold { background: #F7EFD8; border-color: #E8D49A; color: #7A5F0A; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
    .rule { height: 1.2mm; width: 22mm; background: #D4AF37; border-radius: 2mm; margin: 8mm 0 0; }
    .cover-foot { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 8pt; color: #9CA3AF; letter-spacing: 0.16em; text-transform: uppercase; }

    /* ---------- sezioni ---------- */
    .section-head { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 0.3mm solid #E5E7EB; padding-bottom: 3mm; margin: 0 0 7mm; }
    .section-title { font-family: Georgia, "Times New Roman", serif; font-size: 24pt; margin: 0; }
    .section-count { font-size: 8.5pt; color: #9CA3AF; letter-spacing: 0.18em; text-transform: uppercase; }

    /* ---------- griglia lavori ---------- */
    .grid { display: flex; flex-wrap: wrap; gap: 6mm; }
    .work { width: 48%; break-inside: avoid; }
    .work.wide { width: 100%; }
    .work-frame { border-radius: 3mm; overflow: hidden; background: #0B0B0B; }
    .work img { width: 100%; display: block; object-fit: cover; }
    .work.wide img { height: 92mm; }
    .work:not(.wide) img { height: 62mm; }
    .work-num { font-size: 7.5pt; letter-spacing: 0.2em; color: #B08D1F; font-weight: 700; margin: 3mm 0 1mm; }
    .work-title { font-size: 11pt; font-weight: 700; color: #111827; margin: 0 0 1mm; line-height: 1.3; }
    .work-meta { font-size: 8pt; color: #9CA3AF; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .empty { font-size: 10pt; color: #9CA3AF; font-style: italic; }

    /* ---------- vetrina noleggio ---------- */
    .rental-cover { width: 100%; height: 126mm; object-fit: cover; border-radius: 4mm; display: block; }
    .price { display: inline-block; background: #111111; color: #FFFFFF; font-size: 13pt; font-weight: 700; border-radius: 99px; padding: 2.5mm 7mm; margin: 0 0 4mm; }
    .facts { display: flex; flex-wrap: wrap; gap: 4mm; margin: 0 0 8mm; }
    .fact { width: 47%; border: 0.4mm solid #E5E7EB; border-radius: 3mm; padding: 4mm; }
    .fact-k { font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: #9CA3AF; margin: 0 0 1mm; }
    .fact-v { font-size: 10.5pt; color: #111827; margin: 0; }
    .rental-card { width: 48%; break-inside: avoid; border: 0.4mm solid #E5E7EB; border-radius: 4mm; overflow: hidden; background: #FFFFFF; }
    .rental-card img { width: 100%; height: 52mm; object-fit: cover; display: block; }
    .rental-card .body { padding: 4mm; }
    .rental-price { display: inline-block; background: #F7EFD8; color: #7A5F0A; font-weight: 800; font-size: 9pt; border-radius: 99px; padding: 1mm 3mm; margin: 0 0 2mm; }
    .rental-title { font-size: 11pt; font-weight: 700; margin: 0 0 1mm; line-height: 1.3; }
    .rental-place { font-size: 8.5pt; color: #6B7280; margin: 0 0 2mm; }
    .rental-text { font-size: 9pt; color: #374151; margin: 0; line-height: 1.45; }
    .foot { margin-top: 10mm; border-top: 0.3mm solid #E5E7EB; padding-top: 3mm; font-size: 7.5pt; color: #9CA3AF; letter-spacing: 0.14em; text-transform: uppercase; display: flex; justify-content: space-between; }
  </style>
`;

const dataBreve = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
};

// Scarica le prime foto dei post, una alla volta, senza bloccare tutto se una manca.
async function immagini(posts: Post[]) {
  const out: Record<string, string | null> = {};
  for (const p of posts) {
    const prima = p.media?.[0];
    if (!prima || out[prima] !== undefined) continue;
    out[prima] = await imageAsDataUrl(prima);
    if (Object.keys(out).length >= 12) break;
  }
  return out;
}

const pulito = (s: string) => s.split("\n")[0].slice(0, 90);

export async function exportPortfolio(d: PortfolioData) {
  // Nel portfolio cartaceo entrano solo le foto: i video restano nell'app.
  const lavori = d.post.filter(
    (p) => p.kind !== "rental" && !p.media.some((m) => isVideo(m)) && (!d.scelti || d.scelti.includes(p.id)),
  );
  const conContatti = d.includiContatti !== false;
  const foto = d.foto ? await imageAsDataUrl(d.foto.startsWith("http") ? d.foto : fileUrl(d.foto)) : null;
  const imgs = await immagini(lavori);
  const contatti = conContatti ? [d.telefono, d.email].filter(Boolean).join("  ·  ") : "";
  const anno = new Date().getFullYear();

  const copertina = `
    <div class="cover-page">
      ${foto || imgs[lavori[0]?.media?.[0] ?? ""] ? `<img class="cover-img" src="${foto ?? imgs[lavori[0]?.media?.[0] ?? ""]}" alt="" />` : ""}
      <div class="cover-block">
        ${d.categoria ? `<p class="eyebrow">${esc(d.categoria)}</p>` : ""}
        <h1 class="big-name">${esc(d.nome)}</h1>
        ${d.username ? `<p class="handle">@${esc(d.username)}</p>` : ""}
        ${d.bio ? `<p class="lead">${rich(d.bio)}</p>` : ""}
        <div class="cover-meta">
          <span class="meta-pill gold">Portfolio · ${lavori.length} ${lavori.length === 1 ? "lavoro" : "lavori"}</span>
          ${d.link ? `<span class="meta-pill">${esc(d.link.replace(/^https?:\/\//i, ""))}</span>` : ""}
          ${contatti ? `<span class="meta-pill">${esc(contatti)}</span>` : ""}
        </div>
        <div class="rule"></div>
      </div>
    </div>
  `;

  const elenco = lavori.length
    ? `<div class="grid">${lavori
        .map((p, i) => {
          const src = p.media?.[0] ? imgs[p.media[0]] : null;
          const wide = i === 0 && !!src;
          return `
            <div class="work${wide ? " wide" : ""}">
              ${src ? `<div class="work-frame"><img src="${src}" alt="" /></div>` : ""}
              <p class="work-num">${String(i + 1).padStart(2, "0")}${p.media.length > 1 ? ` · ${p.media.length} foto` : ""}</p>
              <p class="work-title">${esc(pulito(p.text) || "Lavoro")}</p>
              <p class="work-meta">${esc([p.price && "", dataBreve(p.created_at)].filter(Boolean).join(" · "))}</p>
            </div>
          `;
        })
        .join("")}</div>`
    : `<p class="empty">Ancora nessun lavoro pubblicato: basta pubblicare un post con una foto e compare qui.</p>`;

  const body = `
    ${CSS}
    ${copertina}
    <div class="section-head">
      <h2 class="section-title">Lavori scelti</h2>
      <span class="section-count">${anno}</span>
    </div>
    ${elenco}
    <div class="foot"><span>${esc(d.nome)}</span><span>Portfolio</span></div>
  `;

  await exportHtml(`Portfolio ${d.nome}`.trim(), doc("Portfolio", body));
}

export type RentalSheetData = {
  nome: string;
  citta?: string;
  telefono?: string;
  email?: string;
  sito?: string;
  attrezzatura?: string;
  foto?: string | null;
  noleggi: Post[];
  proprietario: string;
  scelti?: string[];
  includiContatti?: boolean;
};

export async function exportRentalSheet(d: RentalSheetData) {
  const noleggi = d.noleggi.filter((n) => !d.scelti || d.scelti.includes(n.id));
  const conContatti = d.includiContatti !== false;
  const imgs = await immagini(noleggi);
  const foto = d.foto ? await imageAsDataUrl(d.foto.startsWith("http") ? d.foto : fileUrl(d.foto)) : null;
  const prezzo = noleggi.find((n) => n.price)?.price;
  const anno = new Date().getFullYear();

  const fatti = (conContatti
    ? [
        ["Città", d.citta],
        ["Telefono", d.telefono],
        ["Email", d.email],
        ["Sito", d.sito],
      ]
    : []
  ).filter(([, v]) => !!v) as [string, string][];

  const card = noleggi.length
    ? `<div class="grid">${noleggi
        .map((p) => {
          const src = p.media?.[0] ? imgs[p.media[0]] : null;
          return `
            <div class="rental-card">
              ${src ? `<img src="${src}" alt="" />` : ""}
              <div class="body">
                ${p.price ? `<span class="rental-price">${esc(p.price)}</span>` : ""}
                <p class="rental-title">${esc(pulito(p.text) || "Noleggio")}</p>
                ${p.place ? `<p class="rental-place">${esc(p.place)}</p>` : ""}
                <p class="rental-text">${rich(p.text)}</p>
              </div>
            </div>
          `;
        })
        .join("")}</div>`
    : `<p class="empty">Nessun noleggio pubblicato: aggiungi attrezzatura, prezzo e luogo per riempire la vetrina.</p>`;

  const corpo = `
    ${CSS}
    <div class="cover-page">
      ${foto ? `<img class="rental-cover" src="${foto}" alt="" />` : ""}
      <div class="cover-block">
        <p class="eyebrow">Noleggio attrezzatura</p>
        <h1 class="big-name">${esc(d.nome)}</h1>
        <p class="handle">${esc(d.proprietario)}${d.citta ? ` · ${esc(d.citta)}` : ""}</p>
        ${prezzo ? `<p style="margin:0 0 5mm"><span class="price">a partire da ${esc(prezzo)}</span></p>` : ""}
        ${d.attrezzatura ? `<p class="lead">${rich(d.attrezzatura)}</p>` : ""}
        <div class="rule"></div>
      </div>
    </div>

    ${
      fatti.length
        ? `<div class="section-head"><h2 class="section-title">Contatti</h2><span class="section-count">${anno}</span></div>
           <div class="facts">${fatti.map(([k, v]) => `<div class="fact"><p class="fact-k">${esc(k)}</p><p class="fact-v">${rich(String(v))}</p></div>`).join("")}</div>`
        : ""
    }

    <div class="section-head">
      <h2 class="section-title">La vetrina</h2>
      <span class="section-count">${noleggi.length} ${noleggi.length === 1 ? "noleggio" : "noleggi"}</span>
    </div>
    ${card}
    <div class="foot"><span>${esc(d.nome)}</span><span>Noleggio</span></div>
  `;

  await exportHtml(`Noleggio ${d.nome}`.trim(), doc("Noleggio", corpo));
}
