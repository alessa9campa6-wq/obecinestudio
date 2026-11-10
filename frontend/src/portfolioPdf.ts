import { fileUrl } from "@/src/api";
import { esc, exportHtml, imageAsDataUrl, rich, wrap } from "@/src/pdf";
import { Post } from "@/src/social";

// Il portfolio e la vetrina del noleggio: due PDF "da presentazione", pensati
// per essere mandati a un cliente. Foto grandi, poche parole, contatti chiari.

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
};

const EXTRA_CSS = `
  <style>
    .pf-hero { display: flex; gap: 18px; align-items: center; margin-bottom: 26px; }
    .pf-foto { width: 104px; height: 104px; border-radius: 52px; object-fit: cover; }
    .pf-nome { font-family: Georgia, "Times New Roman", serif; font-size: 26pt; line-height: 1.05; margin: 0 0 4px; }
    .pf-cat { display: inline-block; font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #8a6d1c; background: #f4ebd9; border-radius: 99px; padding: 3px 10px; margin-bottom: 8px; }
    .pf-user { color: #6b7280; font-size: 10pt; margin: 0 0 6px; }
    .pf-bio { margin: 0; font-size: 10.5pt; color: #374151; }
    .pf-link { color: #8a6d1c; font-size: 10pt; text-decoration: none; }
    .pf-sez { font-size: 8.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 26px 0 14px; }
    .pf-item { break-inside: avoid; margin-bottom: 22px; }
    .pf-item img { width: 100%; border-radius: 10px; display: block; }
    .pf-cap { font-size: 10pt; color: #374151; margin: 8px 0 0; }
    .pf-meta { font-size: 8.5pt; color: #9ca3af; margin: 3px 0 0; letter-spacing: 0.04em; text-transform: uppercase; }
    .pf-empty { color: #9ca3af; font-style: italic; }
    .vt-hero { width: 100%; max-height: 300px; object-fit: cover; border-radius: 14px; margin-bottom: 18px; }
    .vt-prezzo { display: inline-block; font-size: 13pt; font-weight: 700; color: #111827; background: #d4af37; border-radius: 99px; padding: 4px 14px; margin: 0 0 10px; }
    .vt-card { break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; }
    .vt-card img { width: 100%; border-radius: 8px; margin-bottom: 8px; display: block; }
    .vt-titolo { font-size: 12pt; font-weight: 700; margin: 0 0 2px; }
    .vt-dove { font-size: 9.5pt; color: #6b7280; margin: 0 0 6px; }
    .vt-testo { font-size: 10pt; color: #374151; margin: 0; }
  </style>
`;

const data = (iso: string) => {
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
    if (Object.keys(out).length >= 14) break;
  }
  return out;
}

export async function exportPortfolio(d: PortfolioData) {
  const lavori = d.post.filter((p) => p.kind !== "rental");
  const foto = d.foto ? await imageAsDataUrl(d.foto.startsWith("http") ? d.foto : fileUrl(d.foto)) : null;
  const imgs = await immagini(lavori);

  const contatti = [d.email, d.telefono].filter(Boolean).join(" · ");

  const hero = `
    <div class="pf-hero">
      ${foto ? `<img class="pf-foto" src="${foto}" alt="" />` : ""}
      <div>
        ${d.categoria ? `<div class="pf-cat">${esc(d.categoria)}</div>` : ""}
        <div class="pf-nome">${esc(d.nome)}</div>
        ${d.username ? `<p class="pf-user">@${esc(d.username)}</p>` : ""}
        ${d.bio ? `<p class="pf-bio">${rich(d.bio)}</p>` : ""}
        ${d.link ? `<p class="pf-user"><a class="pf-link" href="${esc(/^https?:\/\//i.test(d.link) ? d.link : `https://${d.link}`)}">${esc(d.link.replace(/^https?:\/\//i, ""))}</a></p>` : ""}
        ${contatti ? `<p class="pf-user">${esc(contatti)}</p>` : ""}
      </div>
    </div>
  `;

  const elenco = lavori.length
    ? lavori
        .map((p) => {
          const src = p.media?.[0] ? imgs[p.media[0]] : null;
          return `
            <div class="pf-item">
              ${src ? `<img src="${src}" alt="" />` : ""}
              ${p.text ? `<p class="pf-cap">${rich(p.text)}</p>` : ""}
              <p class="pf-meta">${esc([p.project_id ? "Progetto" : "Lavoro", data(p.created_at)].filter(Boolean).join(" · "))}</p>
            </div>
          `;
        })
        .join("")
    : `<p class="pf-empty">Ancora nessun lavoro con foto: pubblica il primo post per farlo comparire qui.</p>`;

  const body = `
    ${EXTRA_CSS}
    ${hero}
    <div class="pf-sez">Portfolio · ${lavori.length} ${lavori.length === 1 ? "lavoro" : "lavori"}</div>
    ${elenco}
  `;

  await exportHtml(`Portfolio ${d.nome}`.trim(), wrap("Portfolio", body, d.categoria || d.username || ""));
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
};

export async function exportRentalSheet(d: RentalSheetData) {
  const imgs = await immagini(d.noleggi);
  const foto = d.foto ? await imageAsDataUrl(d.foto.startsWith("http") ? d.foto : fileUrl(d.foto)) : null;

  const righe = [
    ["Città", d.citta],
    ["Telefono", d.telefono],
    ["Email", d.email],
    ["Sito", d.sito],
  ].filter(([, v]) => !!v);

  const contatti = righe.length
    ? `<div class="facts"><table>${righe
        .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${rich(String(v))}</td></tr>`)
        .join("")}</table></div>`
    : "";

  const elenco = d.noleggi.length
    ? d.noleggi
        .map((p) => {
          const src = p.media?.[0] ? imgs[p.media[0]] : null;
          return `
            <div class="vt-card">
              ${src ? `<img src="${src}" alt="" />` : ""}
              ${p.price ? `<div class="vt-prezzo">${esc(p.price)}</div>` : ""}
              <div class="vt-titolo">${esc(p.project_id ? "" : "")}${esc((p.text || "").split("\n")[0].slice(0, 70) || "Noleggio")}</div>
              ${p.place ? `<div class="vt-dove">${esc(p.place)}</div>` : ""}
              ${p.text ? `<p class="vt-testo">${rich(p.text)}</p>` : ""}
            </div>
          `;
        })
        .join("")
    : `<p class="pf-empty">Nessun noleggio pubblicato: aggiungi attrezzatura, prezzo e luogo per riempire la vetrina.</p>`;

  const body = `
    ${EXTRA_CSS}
    ${foto ? `<img class="vt-hero" src="${foto}" alt="" />` : ""}
    <p class="pf-cat">Noleggio attrezzatura</p>
    <div class="pf-nome">${esc(d.nome)}</div>
    <p class="pf-user">${esc(d.proprietario)}</p>
    ${contatti}
    ${d.attrezzatura ? `<div class="pf-sez">Cosa noleggi</div><p class="vt-testo">${rich(d.attrezzatura)}</p>` : ""}
    <div class="pf-sez">Vetrina · ${d.noleggi.length} ${d.noleggi.length === 1 ? "noleggio" : "noleggi"}</div>
    ${elenco}
  `;

  await exportHtml(`Noleggio ${d.nome}`.trim(), wrap("Noleggio", body, [d.citta, d.telefono].filter(Boolean).join(" · ")));
}
