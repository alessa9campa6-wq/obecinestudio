import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Project } from "@/src/api";
import { useAuth } from "@/src/auth";
import { fonts, spacing } from "@/src/theme";
import { Icon, IconName } from "@/src/ui";

// ── Profilo 3, pagina di prova ───────────────────────────────────────────────
// Stesso linguaggio della Home 3: copertina, numeri grandi in vetro, righe
// editoriali. I progetti stanno qui, non più nella home.

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

export default function Profilo3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
  const progetti = q.data ?? [];
  const [vista, setVista] = useState<"griglia" | "elenco">("griglia");

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
              <Pressable onPress={() => router.push("/account" as never)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,7,8,0.45)", borderWidth: 1, borderColor: BORDO }}>
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

          {/* ── progetti (spostati dalla home) ─────────────────────── */}
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
                  {(progetti.length ? progetti : [{ id: "demo", title: "Ferro & Fuoco", type: "Documentario", cover_path: null, logline: "" }]).slice(0, 6).map((p, i) => (
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
              { icona: "account-edit-outline" as IconName, t: "Account e impostazioni", rotta: "/account" },
              { icona: "account-group-outline" as IconName, t: "Persone che segui", rotta: "/esplora" },
              { icona: "help-circle-outline" as IconName, t: "Come funziona CineStudio", rotta: "" },
            ].map((r) => (
              <Pressable key={r.t} onPress={() => (r.rotta ? router.push(r.rotta as never) : undefined)}>
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
    </View>
  );
}
