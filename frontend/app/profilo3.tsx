import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Project, uploadImage } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Post, PostPrivacy } from "@/src/social";
import { fonts, spacing } from "@/src/theme";
import { Icon, IconName, toast } from "@/src/ui";
import { storage } from "@/src/utils/storage";

// ── Profilo 3, pagina di prova ───────────────────────────────────────────────
// Stesso linguaggio della Home 3: copertina, numeri grandi in vetro, righe
// editoriali. Qui vivono i progetti e il portfolio: i lavori si pubblicano
// davvero sul feed, con foto, tipo, anno e privacy.

const NERO = "#050708";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.05)";
const BORDO = "rgba(255,255,255,0.12)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.56)";

const SFONDO = "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1600&auto=format&fit=crop";
const DEMO_COVER = "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?q=80&w=900&auto=format&fit=crop";

const MESTIERI: { icona: IconName; nome: string; anni: string }[] = [
  { icona: "movie-open-outline", nome: "Regia", anni: "9 anni" },
  { icona: "camera-outline", nome: "Fotografia", anni: "7 anni" },
  { icona: "content-cut", nome: "Montaggio", anni: "6 anni" },
  { icona: "palette-outline", nome: "Color", anni: "4 anni" },
];

const CONTATTI: { icona: IconName; etichetta: string; valore: string }[] = [
  { icona: "email-outline", etichetta: "Email", valore: "" },
  { icona: "web", etichetta: "Sito", valore: "cine.studio" },
  { icona: "instagram", etichetta: "Instagram", valore: "@alessandro.film" },
];

const TIPI_LAVORO = ["Cortometraggio", "Documentario", "Videoclip", "Spot", "Social"];
const PRIVACY: { v: PostPrivacy; l: string }[] = [
  { v: "public", l: "Pubblico" },
  { v: "unlisted", l: "Non in elenco" },
  { v: "private", l: "Solo io" },
];

const DOCK: { icona: IconName; titolo: string; rotta: string; attivo?: boolean }[] = [
  { icona: "view-dashboard", titolo: "Oggi", rotta: "/home3" },
  { icona: "compass-outline", titolo: "Esplora", rotta: "/esplora" },
  { icona: "message-text-outline", titolo: "Messaggi", rotta: "/messaggi" },
  { icona: "wrench-outline", titolo: "Strumenti", rotta: "/strumenti" },
  { icona: "account-circle-outline", titolo: "Profilo", rotta: "/profilo3", attivo: true },
];

function Vetro({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO, borderRadius: 22, overflow: "hidden" }, style]}>
      <LinearGradient colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.01)", "rgba(2,86,105,0.18)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      {children}
    </View>
  );
}

function Etichetta({ children }: { children: string }) {
  return <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.8, fontWeight: "800", color: TEAL_CHIARO }}>{children}</Text>;
}

const campo = {
  backgroundColor: "rgba(5,7,8,0.6)",
  borderWidth: 1,
  borderColor: BORDO,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: 10,
  color: TESTO,
  fontFamily: fonts.text,
  fontSize: 13,
} as const;

export default function Profilo3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
  const progetti = q.data ?? [];
  const io = user?.user_id ?? "";
  const post = useQuery({ queryKey: ["profile-posts", io], queryFn: () => api<Post[]>(`/users/${io}/posts`), enabled: !!io });
  const lavori = post.data ?? [];
  const [vista, setVista] = useState<"griglia" | "elenco">("griglia");
  const [mostraPortfolio, setMostraPortfolio] = useState(true);

  const [modale, setModale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [titoloL, setTitoloL] = useState("");
  const [tipoL, setTipoL] = useState("Cortometraggio");
  const [annoL, setAnnoL] = useState(String(new Date().getFullYear()));
  const [descL, setDescL] = useState("");
  const [privacyL, setPrivacyL] = useState<PostPrivacy>("public");
  const [foto, setFoto] = useState<{ uri: string; fileName?: string | null; mimeType?: string | null; ratio?: number } | null>(null);

  useEffect(() => {
    void storage.getItem<string>("impostazioni3", "").then((raw) => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw) as { portfolio?: boolean };
        if (typeof v.portfolio === "boolean") setMostraPortfolio(v.portfolio);
      } catch {}
    });
  }, []);

  const scegliFoto = async () => {
    const permesso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permesso.granted) return toast("Serve il permesso per le foto", "error");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!res.canceled) {
      const a = res.assets[0];
      setFoto({ ...a, ratio: a.width && a.height ? Math.round((a.width / a.height) * 1000) / 1000 : undefined });
    }
  };

  const pubblicaLavoro = async () => {
    if (!titoloL.trim()) return toast("Dai un titolo al lavoro", "error");
    setBusy(true);
    try {
      const media: string[] = [];
      if (foto) media.push(await uploadImage(foto));
      const testo = [titoloL.trim() + (annoL.trim() ? ` (${annoL.trim()})` : ""), tipoL, descL.trim()].filter(Boolean).join(" · ");
      await api("/posts", {
        method: "POST",
        body: {
          text: testo,
          media,
          kind: "post",
          privacy: privacyL,
          price: "",
          place: "",
          city: "",
          lat: null,
          lng: null,
          ratios: foto ? [foto.ratio ?? 1] : [],
        },
      });
      for (const chiave of ["feed", "explore", "profile", "profile-posts"]) void qc.invalidateQueries({ queryKey: [chiave] });
      toast("Lavoro pubblicato");
      setModale(false);
      setTitoloL("");
      setDescL("");
      setAnnoL(String(new Date().getFullYear()));
      setTipoL("Cortometraggio");
      setPrivacyL("public");
      setFoto(null);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const picture = user?.picture;
  const avatar = picture ? (/^https?:\/\//i.test(picture) ? picture : fileUrl(picture)) : null;
  const iniziali =
    (user?.name ?? "Alessandro Campagna")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AC";
  const nome = user?.name || "Alessandro Campagna";
  const email = user?.email || "";
  const rental = user?.rental?.nome || "";
  const cardW = wide ? 290 : Math.min(268, width * 0.74);
  const condomini = progetti.length ? progetti.filter((p) => p.my_role && p.my_role !== "owner").length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }} showsVerticalScrollIndicator={false}>
        {/* ── copertina del profilo ─────────────────────────────────── */}
        <View style={{ height: wide ? 330 : 300 }}>
          <Image source={{ uri: SFONDO }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(5,7,8,0.35)", "rgba(2,86,105,0.6)", NERO]} locations={[0, 0.5, 1]} style={{ position: "absolute", width: "100%", height: "100%" }} />
          <View style={{ flex: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="chevron-left" size={20} color={TESTO} />
              </Pressable>
              <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.4, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>PROFILO 3 · ESPERIMENTO</Text>
              <Pressable onPress={() => router.push("/impostazioni3" as never)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="cog-outline" size={19} color={TESTO} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md, paddingBottom: spacing.lg }}>
              <View style={{ width: wide ? 92 : 76, height: wide ? 92 : 76, borderRadius: 999, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.55)", borderWidth: 2, borderColor: TEAL_CHIARO }}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                ) : (
                  <Text style={{ fontFamily: fonts.display, fontSize: wide ? 32 : 26, color: "#FFFFFF" }}>{iniziali}</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: wide ? 40 : 32, lineHeight: wide ? 42 : 34, color: "#FFFFFF" }} numberOfLines={2}>{nome}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, letterSpacing: 1.4, fontWeight: "700", color: TEAL_CHIARO }}>REGIA E FOTOGRAFIA · BOLOGNA</Text>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", paddingTop: 2 }}>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(5,7,8,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: TESTO }}>{progetti.length} progetti</Text>
                  </View>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(5,7,8,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: TESTO }}>{condomini} condivisi</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: -spacing.sm }}>
          {/* ── in due righe + numeri ──────────────────────────────── */}
          <Vetro>
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <Etichetta>IN DUE RIGHE</Etichetta>
              <Text style={{ fontFamily: fonts.text, fontSize: 13, lineHeight: 19, color: "rgba(242,246,247,0.82)" }}>
                Racconto il lavoro delle persone: corpi, luoghi, notti. Cortometraggi e documentari, dal soggetto alla copia finale.
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                {[
                  { n: "12", l: "film" },
                  { n: "38", l: "set" },
                  { n: "9", l: "anni" },
                ].map((x) => (
                  <View key={x.l} style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: TESTO }}>{x.n}</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.4, color: TENUE }}>{x.l.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Vetro>

          {/* ── portfolio pubblicabile ────────────────────────────── */}
          {mostraPortfolio ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 23, color: TESTO }}>Portfolio</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: BORDO }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TENUE }}>{lavori.length}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => setModale(true)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: TEAL_CHIARO, opacity: pressed ? 0.85 : 1 })}
                >
                  <Icon name="plus" size={14} color="#FFFFFF" />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "800", color: "#FFFFFF" }}>Pubblica</Text>
                </Pressable>
              </View>

              {lavori.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
                  {lavori.slice(0, 8).map((l) => {
                    const copertina = l.media?.[0];
                    return (
                      <Pressable key={l.id} onPress={() => router.push(`/post/${l.id}` as never)} style={({ pressed }) => ({ width: 148, height: 190, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: BORDO, backgroundColor: "rgba(2,86,105,0.2)", opacity: pressed ? 0.9 : 1 })}>
                        {copertina ? <Image source={{ uri: fileUrl(copertina) }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : null}
                        <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.9)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96 }} />
                        <Text style={{ position: "absolute", left: 10, right: 10, bottom: 10, fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={2}>{l.text || "Senza titolo"}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <Pressable onPress={() => setModale(true)}>
                  <View style={{ borderRadius: 20, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(10,143,166,0.45)", padding: spacing.lg, alignItems: "center", gap: 6 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.3)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
                      <Icon name="image-plus" size={20} color={TEAL_CHIARO} />
                    </View>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, color: TESTO }}>Il primo lavoro</Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: TENUE, textAlign: "center" }}>Titolo, tipo, anno, una foto e due righe di descrizione.</Text>
                  </View>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* ── progetti ─────────────────────────────────────────── */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 23, color: TESTO }}>I miei progetti</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: BORDO }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TENUE }}>{progetti.length}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setVista(vista === "griglia" ? "elenco" : "griglia")} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: BORDO, backgroundColor: "rgba(255,255,255,0.05)" }}>
                <Icon name={vista === "griglia" ? "format-list-bulleted" : "view-grid-outline"} size={13} color={TEAL_CHIARO} />
                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: TESTO }}>{vista === "griglia" ? "Elenco" : "Griglia"}</Text>
              </Pressable>
            </View>

            {vista === "griglia" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}>
                {(progetti.length ? progetti : [{ id: "demo", title: "Ferro & Fuoco", type: "Documentario", cover_path: null }]).slice(0, 5).map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => (p.id === "demo" ? undefined : router.push(`/project/${p.id}` as never))}
                    style={({ pressed }) => ({ width: cardW, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: BORDO, backgroundColor: VETRO, opacity: pressed ? 0.9 : 1 })}
                  >
                    <Image source={{ uri: p.cover_path ? fileUrl(p.cover_path) : DEMO_COVER }} style={{ width: "100%", height: 150 }} contentFit="cover" />
                    <LinearGradient colors={["rgba(5,7,8,0)", "rgba(5,7,8,0.94)"]} style={{ position: "absolute", left: 0, right: 0, top: 52, height: 200 }} />
                    <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 3 }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 9, letterSpacing: 1.4, fontWeight: "800", color: TEAL_CHIARO }}>{p.type.toUpperCase()}</Text>
                      <Text style={{ fontFamily: fonts.display, fontSize: 21, color: TESTO }} numberOfLines={1}>{p.title}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.16)" }}>
                          <View style={{ height: 3, width: `${40 + ((p.title.length * 7) % 45)}%`, borderRadius: 2, backgroundColor: TEAL_CHIARO }} />
                        </View>
                        <Icon name="arrow-top-right" size={13} color={TEAL_CHIARO} />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Vetro>
                <View style={{ paddingVertical: 2 }}>
                  {(progetti.length ? progetti : [{ id: "demo", title: "Ferro & Fuoco", type: "Documentario", cover_path: null }]).slice(0, 6).map((p, i) => (
                    <Pressable
                      key={p.id}
                      onPress={() => (p.id === "demo" ? undefined : router.push(`/project/${p.id}` as never))}
                      style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 10, paddingHorizontal: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}
                    >
                      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: "rgba(10,143,166,0.75)", width: 28 }}>{String(i + 1).padStart(2, "0")}</Text>
                      <Image source={{ uri: p.cover_path ? fileUrl(p.cover_path) : DEMO_COVER }} style={{ width: 36, height: 46, borderRadius: 8 }} contentFit="cover" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1.2, fontWeight: "800", color: TEAL_CHIARO }} numberOfLines={1}>{p.type.toUpperCase()}</Text>
                        <Text style={{ fontFamily: fonts.display, fontSize: 17, color: TESTO }} numberOfLines={1}>{p.title}</Text>
                      </View>
                      <Icon name="chevron-right" size={17} color={TENUE} />
                    </Pressable>
                  ))}
                </View>
              </Vetro>
            )}
          </View>

          {/* ── mestieri + rental ─────────────────────────────────── */}
          <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.lg, alignItems: "stretch" }}>
            <Vetro style={{ flex: wide ? 1 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <Etichetta>DI COSA MI OCCUPO</Etichetta>
                {MESTIERI.map((m, i) => (
                  <View key={m.nome} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: i === 0 ? 0 : 8, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 8 }}>
                    <Icon name={m.icona} size={16} color={TEAL_CHIARO} />
                    <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 13, fontWeight: "600", color: TESTO }}>{m.nome}</Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: TENUE }}>{m.anni}</Text>
                  </View>
                ))}
              </View>
            </Vetro>

            <Vetro style={{ flex: wide ? 1 : undefined }}>
              <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Etichetta>REPARTO E RENTAL</Etichetta>
                  <View style={{ flex: 1 }} />
                  <Icon name="video-box" size={15} color={TEAL_CHIARO} />
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: TESTO }} numberOfLines={1}>{rental || "Nessun rental collegato"}</Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, lineHeight: 16, color: TENUE }}>
                  {rental ? "Attrezzatura disponibile per i tuoi progetti." : "Collega un rental dal profilo per mostrare l’attrezzatura."}
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                  {[
                    { n: "6", l: "corpi" },
                    { n: "11", l: "ottiche" },
                    { n: "4", l: "luci" },
                  ].map((x) => (
                    <View key={x.l} style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.script, fontSize: 15, color: TESTO }}>{x.n}</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 8.5, letterSpacing: 1.2, color: TENUE }}>{x.l.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                <Pressable onPress={() => router.push("/strumenti/attrezzatura" as never)} style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingTop: 2 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", color: TEAL_CHIARO }}>Apri l’attrezzatura</Text>
                  <Icon name="arrow-right" size={12} color={TEAL_CHIARO} />
                </Pressable>
              </View>
            </Vetro>
          </View>

          {/* ── contatti ─────────────────────────────────────────── */}
          <Vetro>
            <View style={{ paddingVertical: 2 }}>
              {CONTATTI.map((c, i) => {
                const valore = c.etichetta === "Email" ? email || "—" : c.valore;
                return (
                  <View key={c.etichetta} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
                    <Icon name={c.icona} size={17} color={TEAL_CHIARO} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.4, color: TENUE, width: 78 }}>{c.etichetta.toUpperCase()}</Text>
                    <Text style={{ flex: 1, fontFamily: fonts.script, fontSize: 12, color: TESTO }} numberOfLines={1}>{valore}</Text>
                  </View>
                );
              })}
            </View>
          </Vetro>

          {/* ── righe di servizio ────────────────────────────────── */}
          <View style={{ gap: spacing.sm }}>
            {[
              { icona: "cog-outline" as IconName, t: "Impostazioni", rotta: "/impostazioni3" },
              { icona: "account-edit-outline" as IconName, t: "Account e dati personali", rotta: "/account" },
              { icona: "account-group-outline" as IconName, t: "Persone che segui", rotta: "/esplora" },
            ].map((r) => (
              <Pressable key={r.t} onPress={() => router.push(r.rotta as never)}>
                <Vetro>
                  <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <Icon name={r.icona} size={17} color={TEAL_CHIARO} />
                    <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: TESTO }}>{r.t}</Text>
                    <Icon name="chevron-right" size={17} color={TENUE} />
                  </View>
                </Vetro>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.28)", textAlign: "center" }}>PROFILO 3 · concetto, dati reali dove disponibili</Text>
        </View>
      </ScrollView>

      {/* barra fissa, come nella Home 3 */}
      <View pointerEvents="box-none" style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: insets.bottom > 0 ? insets.bottom - 4 : 10 }}>
        <View style={{ height: 62, borderRadius: 31, backgroundColor: "rgba(10,14,16,0.78)", borderWidth: 1, borderColor: BORDO, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
          {DOCK.map((d) => {
            const acceso = !!d.attivo;
            return (
              <Pressable
                key={d.titolo}
                onPress={() => router.push(d.rotta as never)}
                style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.7 : 1 })}
              >
                <Icon name={d.icona} size={21} color={acceso ? TEAL_CHIARO : "rgba(242,246,247,0.62)"} />
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: acceso ? "800" : "500", color: acceso ? TEAL_CHIARO : "rgba(242,246,247,0.62)" }}>{d.titolo}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── pubblica un lavoro ───────────────────────────────────── */}
      <Modal visible={modale} transparent animationType="slide" onRequestClose={() => setModale(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(3,5,6,0.72)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setModale(false)} />
          <View style={{ backgroundColor: "#0A0E10", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: BORDO, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.lg, maxHeight: "88%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Etichetta>NUOVO LAVORO</Etichetta>
                <Text style={{ fontFamily: fonts.display, fontSize: 24, color: TESTO }}>Pubblica nel portfolio</Text>
              </View>
              <Pressable onPress={() => setModale(false)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: BORDO }}>
                <Icon name="close" size={16} color={TESTO} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.md }}>
              <Pressable onPress={scegliFoto} style={{ height: 150, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderStyle: foto ? "solid" : "dashed", borderColor: "rgba(10,143,166,0.45)", backgroundColor: "rgba(2,86,105,0.18)", alignItems: "center", justifyContent: "center" }}>
                {foto ? (
                  <>
                    <Image source={{ uri: foto.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <View style={{ position: "absolute", right: 8, top: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(5,7,8,0.7)" }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 9.5, color: TESTO }}>Cambia foto</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Icon name="image-plus" size={24} color={TEAL_CHIARO} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: TENUE, paddingTop: 4 }}>Aggiungi una foto dal rullino</Text>
                  </>
                )}
              </Pressable>

              <TextInput value={titoloL} onChangeText={setTitoloL} placeholder="Titolo del lavoro" placeholderTextColor="rgba(242,246,247,0.35)" style={campo} />

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {TIPI_LAVORO.map((t) => (
                  <Pressable key={t} onPress={() => setTipoL(t)} style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: tipoL === t ? TEAL_CHIARO : BORDO, backgroundColor: tipoL === t ? "rgba(2,86,105,0.4)" : "transparent" }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: tipoL === t ? TESTO : TENUE }}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput value={annoL} onChangeText={setAnnoL} placeholder="Anno" placeholderTextColor="rgba(242,246,247,0.35)" keyboardType="number-pad" style={campo} />
              <TextInput value={descL} onChangeText={setDescL} placeholder="Due righe: di cosa parla, che ruolo hai avuto" placeholderTextColor="rgba(242,246,247,0.35)" multiline style={[campo, { minHeight: 72, textAlignVertical: "top" }]} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.4, color: TENUE, width: 62 }}>CHI LO VEDE</Text>
                {PRIVACY.map((p) => (
                  <Pressable key={p.v} onPress={() => setPrivacyL(p.v)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: privacyL === p.v ? TEAL_CHIARO : BORDO }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: privacyL === p.v ? TESTO : TENUE }}>{p.l}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={pubblicaLavoro}
                disabled={busy}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 999, backgroundColor: TEAL_CHIARO, opacity: busy ? 0.6 : pressed ? 0.85 : 1 })}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Icon name="upload" size={16} color="#FFFFFF" />}
                <Text style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>{busy ? "Pubblico…" : "Pubblica"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
