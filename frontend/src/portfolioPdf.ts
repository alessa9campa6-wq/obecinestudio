import { fileUrl } from "@/src/api";
import { esc, exportHtml, imageAsDataUrl, rich } from "@/src/pdf";
import { isVideo } from "@/src/modules";
import { Post } from "@/src/social";

// Portfolio e vetrina noleggio: due PDF "da presentazione", pensati per essere
// mandati a un cliente. Ogni pagina è un foglio A4 esatto (210×297mm) con i suoi
// margini, così il footer sta sempre in fondo e nulla si spezza a metà.

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

// Margini e foglio: comando io tutto, il browser non decide niente.
const BASE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #FFFFFF; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111827; font-size: 10.5pt; line-height: 1.45; }
  a { color: #7A5F0A; text-decoration: none; }
  img { display: block; }
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
    /* ---------- foglio ---------- */
    .page { width: 210mm; height: 288mm; padding: 14mm; display: flex; flex-direction: column; page-break-after: always; break-after: page; overflow: hidden; }
    .page:last-child { page-break-after: auto; break-after: auto; }

    /* ---------- copertina ---------- */
    .cover-img { width: 100%; height: 132mm; object-fit: cover; border-radius: 3mm; background: #0B0B0B; }
    .cover-text { padding-top: 7mm; }
    .eyebrow { font-size: 7.5pt; letter-spacing: 0.32em; text-transform: uppercase; color: #9A7B12; font-weight: 700; margin: 0 0 4mm; }
    .big-name { font-family: Georgia, "Times New Roman", serif; font-size: 34pt; line-height: 1; margin: 0 0 3mm; letter-spacing: -0.01em; }
    .handle { font-size: 10pt; color: #6B7280; margin: 0 0 5mm; }
    .lead { font-size: 11pt; line-height: 1.55; color: #1F2937; margin: 0 0 5mm; max-width: 155mm; }
    .cover-meta { display: flex; flex-wrap: wrap; gap: 2.5mm; }
    .meta-pill { border: 0.35mm solid #E5E7EB; border-radius: 99px; padding: 1.8mm 4mm; font-size: 8.5pt; color: #374151; }
    .meta-pill.gold { background: #F7EFD8; border-color: #E8D49A; color: #7A5F0A; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
    .rule { height: 1.1mm; width: 22mm; background: #D4AF37; border-radius: 2mm; margin: 6mm 0 0; }

    /* ---------- testata di sezione ---------- */
    .section-head { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 0.3mm solid #E5E7EB; padding-bottom: 3mm; margin: 0 0 6mm; }
    .section-title { font-family: Georgia, "Times New Roman", serif; font-size: 22pt; margin: 0; line-height: 1.1; }
    .section-count { font-size: 8.5pt; color: #9CA3AF; letter-spacing: 0.18em; text-transform: uppercase; white-space: nowrap; padding-left: 6mm; }

    /* ---------- griglia: due colonne, altezze fisse, foto mai tagliate ---------- */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4.5mm 5mm; align-content: start; }
    .work { break-inside: avoid; page-break-inside: avoid; }
    .work-frame { height: 58mm; border-radius: 2.5mm; background: #0B0B0B; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .work-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .work-frame.vuota { border: 0.3mm dashed #D1D5DB; background: #F9FAFB; color: #9CA3AF; font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; }
    .work-num { font-size: 6.8pt; letter-spacing: 0.2em; color: #B08D1F; font-weight: 700; margin: 2mm 0 0.8mm; }
    .work-title { font-size: 9.8pt; font-weight: 700; color: #111827; margin: 0 0 0.8mm; line-height: 1.3; max-height: 2.6em; overflow: hidden; }
    .work-meta { font-size: 7.5pt; color: #9CA3AF; letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .empty { font-size: 10pt; color: #9CA3AF; font-style: italic; }

    /* ---------- vetrina noleggio ---------- */
    .rental-cover { width: 100%; height: 126mm; object-fit: cover; border-radius: 3mm; background: #0B0B0B; }
    .price { display: inline-block; background: #111111; color: #FFFFFF; font-size: 12pt; font-weight: 700; border-radius: 99px; padding: 2.2mm 6mm; margin: 0 0 4mm; }
    .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin: 0 0 2mm; }
    .fact { border: 0.35mm solid #E5E7EB; border-radius: 3mm; padding: 3.5mm 4mm; }
    .fact-k { font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: #9CA3AF; margin: 0 0 1mm; }
    .fact-v { font-size: 10pt; color: #111827; margin: 0; word-break: break-word; }
    .rental-card { break-inside: avoid; page-break-inside: avoid; border: 0.35mm solid #E5E7EB; border-radius: 3mm; overflow: hidden; background: #FFFFFF; }
    .rental-frame { height: 72mm; background: #0B0B0B; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .rental-frame img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .rental-card .body { padding: 3mm 3.5mm 3.5mm; }
    .rental-price { display: inline-block; background: #F7EFD8; color: #7A5F0A; font-weight: 800; font-size: 8.5pt; border-radius: 99px; padding: 1mm 3mm; margin: 0 0 1.6mm; }
    .rental-title { font-size: 10.5pt; font-weight: 700; margin: 0 0 1mm; line-height: 1.3; }
    .rental-place { font-size: 8pt; color: #6B7280; margin: 0 0 1.6mm; }
    .rental-text { font-size: 8.5pt; color: #374151; margin: 0; line-height: 1.4; max-height: 5.6em; overflow: hidden; }

    /* ---------- piede di pagina, sempre in fondo ---------- */
    .foot { margin-top: auto; padding-top: 4mm; border-top: 0.3mm solid #E5E7EB; font-size: 7pt; color: #9CA3AF; letter-spacing: 0.14em; text-transform: uppercase; display: flex; justify-content: space-between; }
    .foot .right { letter-spacing: 0.14em; }
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
  }
  return out;
}

const pulito = (s: string) => s.split("\n")[0].slice(0, 90);

// Divide in blocchi: ogni pagina porta al massimo `n` elementi.
function pagine<T>(lista: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < lista.length; i += n) out.push(lista.slice(i, i + n));
  return out;
}

const testata = (titolo: string, conteggio: string) => `
  <div class="section-head">
    <h2 class="section-title">${esc(titolo)}</h2>
    <span class="section-count">${esc(conteggio)}</span>
  </div>`;

const piede = (nome: string, destra: string, pagina: number, totale: number) => `
  <div class="foot"><span>${esc(nome)}</span><span class="right">${esc(destra)} · ${pagina}/${totale}</span></div>`;

export async function exportPortfolio(d: PortfolioData) {
  // Nel portfolio cartaceo entrano solo le foto: i video restano nell'app.
  const lavori = d.post.filter(
    (p) => p.kind !== "rental" && !p.media.some((m) => isVideo(m)) && (!d.scelti || d.scelti.includes(p.id)),
  );
  const conContatti = d.includiContatti !== false;
  const foto = d.foto ? await imageAsDataUrl(d.foto.startsWith("http") ? d.foto : fileUrl(d.foto)) : null;
  const imgs = await immagini(lavori);
  const contatti = conContatti ? [d.telefono, d.email].filter(Boolean).join("   ·   ") : "";
  const anno = new Date().getFullYear();

  const copertina = foto || imgs[lavori[0]?.media?.[0] ?? ""];
  const gruppi = pagine(lavori, 6);
  const totale = 1 + Math.max(1, gruppi.length);

  const paginaCopertina = `
    <div class="page">
      ${copertina ? `<img class="cover-img" src="${copertina}" alt="" />` : ""}
      <div class="cover-text">
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
      ${piede(d.nome, "Portfolio", 1, totale)}
    </div>`;

  const pagineLavori = gruppi.length
    ? gruppi
        .map((gruppo, gi) => {
          const base = gi * 6;
          return `
          <div class="page">
            ${testata(gi === 0 ? "Lavori scelti" : "Lavori", `${anno} · ${lavori.length} ${lavori.length === 1 ? "lavoro" : "lavori"}`)}
            <div class="grid">
              ${gruppo
                .map((p, idx) => {
                  const i = base + idx;
                  const src = p.media?.[0] ? imgs[p.media[0]] : null;
                  return `
                  <div class="work">
                    ${
                      src
                        ? `<div class="work-frame"><img src="${src}" alt="" /></div>`
                        : `<div class="work-frame vuota">Nessuna foto</div>`
                    }
                    <p class="work-num">${String(i + 1).padStart(2, "0")}${p.media.length > 1 ? ` · ${p.media.length} foto` : ""}</p>
                    <p class="work-title">${esc(pulito(p.text) || "Lavoro")}</p>
                    <p class="work-meta">${esc(dataBreve(p.created_at))}</p>
                  </div>`;
                })
                .join("")}
            </div>
            ${piede(d.nome, "Portfolio", 2 + gi, totale)}
          </div>`;
        })
        .join("")
    : `
      <div class="page">
        ${testata("Lavori", `${anno}`)}
        <p class="empty">Ancora nessun lavoro pubblicato: basta pubblicare un post con una foto e compare qui.</p>
        ${piede(d.nome, "Portfolio", 2, totale)}
      </div>`;

  const body = `${CSS}${paginaCopertina}${pagineLavori}`;
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

  const fatti = (conContatti
    ? ([
        ["Città", d.citta],
        ["Telefono", d.telefono],
        ["Email", d.email],
        ["Sito", d.sito],
      ] as [string, string | undefined][])
    : []
  ).filter(([, v]) => !!v) as [string, string][];

  const copertina = foto || imgs[noleggi[0]?.media?.[0] ?? ""];
  const gruppi = pagine(noleggi, 4);
  // Copertina con i contatti dentro, poi la vetrina: niente fogli di passaggio.
  const totale = 1 + Math.max(1, gruppi.length);

  const paginaCopertina = `
    <div class="page">
      ${copertina ? `<img class="rental-cover" src="${copertina}" alt="" />` : ""}
      <div class="cover-text">
        <p class="eyebrow">Noleggio attrezzatura</p>
        <h1 class="big-name">${esc(d.nome)}</h1>
        <p class="handle">${esc(d.proprietario)}${d.citta ? ` · ${esc(d.citta)}` : ""}</p>
        ${prezzo ? `<p style="margin:3mm 0 0"><span class="price">a partire da ${esc(prezzo)}</span></p>` : ""}
        ${
          fatti.length
            ? `<div class="facts">${fatti
                .map(([k, v]) => `<div class="fact"><p class="fact-k">${esc(k)}</p><p class="fact-v">${rich(String(v))}</p></div>`)
                .join("")}</div>`
            : ""
        }
        <div class="rule"></div>
      </div>
      ${piede(d.nome, "Noleggio", 1, totale)}
    </div>`;

  const paginaVetrina = (gruppo: Post[], gi: number) => `
    <div class="page">
      ${testata(gi === 0 ? "La vetrina" : "Vetrina", `${noleggi.length} ${noleggi.length === 1 ? "noleggio" : "noleggi"}`)}
      <div class="grid">
        ${gruppo
          .map((p) => {
            const src = p.media?.[0] ? imgs[p.media[0]] : null;
            return `
            <div class="rental-card">
              <div class="rental-frame">${src ? `<img src="${src}" alt="" />` : ""}</div>
              <div class="body">
                ${p.price ? `<span class="rental-price">${esc(p.price)}</span>` : ""}
                <p class="rental-title">${esc(pulito(p.text) || "Noleggio")}</p>
                ${p.place ? `<p class="rental-place">${esc(p.place)}</p>` : ""}
                <p class="rental-text">${rich(p.text)}</p>
              </div>
            </div>`;
          })
          .join("")}
      </div>
      ${piede(d.nome, "Noleggio", 2 + gi, totale)}
    </div>`;

  const vetrina = gruppi.length
    ? gruppi.map((g, i) => paginaVetrina(g, i)).join("")
    : `
      <div class="page">
        ${testata("La vetrina", "0 noleggi")}
        <p class="empty">Nessun noleggio pubblicato: aggiungi attrezzatura, prezzo e luogo per riempire la vetrina.</p>
        ${piede(d.nome, "Noleggio", 2, totale)}
      </div>`;

  const corpo = `${CSS}${paginaCopertina}${vetrina}`;
  await exportHtml(`Noleggio ${d.nome}`.trim(), doc("Noleggio", corpo));
}
