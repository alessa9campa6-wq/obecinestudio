import { api, Item } from "@/src/api";

const HEAD = /^(INT\.?\s*\/\s*EST\.?|INT\.?\s*\/\s*EXT\.?|I\/E\.?|INT\.|EST\.|EXT\.|INT|EST|EXT)\s+(.+?)(?:\s+[-–]\s+(.+))?$/i;
const normInt = (s: string) => {
  const u = s.toUpperCase().replace(/\s/g, "");
  if (u.includes("/") || u.startsWith("I/E")) return "INT./EST.";
  return u.startsWith("INT") ? "INT." : "EST.";
};
const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

type El = { type: string; text: string };

// Reads scene headings and character cues from the screenplay and creates or
// updates Scene, Location and Personaggi items so all sections stay connected.
export async function syncScreenplay(pid: string, elements: El[], all: Item[]) {
  const scenes: { heading: string; intext: string; loc: string; momento: string; chars: Set<string>; action: string }[] = [];
  for (const e of elements) {
    const t = (e.text ?? "").trim();
    if (!t) continue;
    if (e.type === "scene") {
      const m = t.match(HEAD);
      scenes.push({ heading: t, intext: m ? normInt(m[1]) : "", loc: (m ? m[2] : t).trim(), momento: (m?.[3] ?? "").trim().toUpperCase(), chars: new Set(), action: "" });
    } else if (scenes.length) {
      const cur = scenes[scenes.length - 1];
      if (e.type === "character") cur.chars.add(t.replace(/\(.*?\)/g, "").trim());
      if (e.type === "action" && !cur.action) cur.action = t.slice(0, 300);
    }
  }
  const byTitle = (module: string) => new Map(all.filter((i) => i.module === module).map((i) => [i.title.trim().toUpperCase(), i]));
  const locs = byTitle("location");
  const chars = byTitle("personaggi");
  const existingScenes = all.filter((i) => i.module === "scene");
  const create = (module: string, title: string, data: Record<string, any>) => api<Item>(`/projects/${pid}/items`, { method: "POST", body: { module, title, data } });
  let created = { scene: 0, location: 0, personaggi: 0 };

  for (const sc of scenes) {
    const lk = sc.loc.toUpperCase();
    if (lk && !locs.has(lk)) {
      locs.set(lk, await create("location", titleCase(sc.loc), { permessi: "Da richiedere" }));
      created.location++;
    }
    for (const c of sc.chars) {
      if (c && !chars.has(c.toUpperCase())) {
        chars.set(c.toUpperCase(), await create("personaggi", titleCase(c), {}));
        created.personaggi++;
      }
    }
  }
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const data = {
      numero: String(i + 1),
      heading: sc.heading,
      intext: sc.intext,
      momento: sc.momento,
      location: locs.get(sc.loc.toUpperCase())?.id ?? "",
      personaggi: [...sc.chars].map((c) => chars.get(c.toUpperCase())?.id).filter(Boolean),
    };
    const ex = existingScenes.find((x) => x.data.heading === sc.heading || x.title.toUpperCase() === sc.heading.toUpperCase());
    if (ex) await api(`/items/${ex.id}`, { method: "PUT", body: { data: { ...ex.data, ...data, sinossi: ex.data.sinossi || sc.action } } });
    else {
      await create("scene", sc.heading, { ...data, sinossi: sc.action, stato: "Da girare" });
      created.scene++;
    }
  }
  return { total: scenes.length, ...created };
}
