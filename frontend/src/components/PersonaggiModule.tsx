import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import PersonaggioEditor from "@/src/components/PersonaggioEditor";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

type Elemento = { type: string; text: string };
type Analisi = { battute: number; scene: Set<string>; linee: { scena: string; testo: string }[] };

// Legge la sceneggiatura e conta, per ogni personaggio, quante volte parla e in
// quante scene compare: è il filo che tiene unite le tre sezioni.
const analizza = (elementi: Elemento[]): Map<string, Analisi> => {
  const out = new Map<string, Analisi>();
  let scena = "Scena iniziale";
  let ultimo: string | null = null;
  for (const el of elementi ?? []) {
    const testo = (el.text ?? "").trim();
    if (el.type === "scene") {
      scena = testo || "Scena senza titolo";
      ultimo = null;
      continue;
    }
    if (el.type === "transition") {
      ultimo = null;
      continue;
    }
    if (el.type === "character" && testo) {
      const nome = testo.toUpperCase();
      const a = out.get(nome) ?? { battute: 0, scene: new Set<string>(), linee: [] };
      a.battute += 1;
      a.scene.add(scena);
      out.set(nome, a);
      ultimo = nome;
      continue;
    }
    if (el.type === "dialogue" && ultimo && testo) out.get(ultimo)?.linee.push({ scena, testo });
  }
  return out;
};

const iniziali = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";


export default function PersonaggiModule({ def }: { def: ModuleDef }) {
  const { project, go, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const sceneggiatura = useItems(project.id, "sceneggiatura");
  const scene = useItems(project.id, "scene");
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [dettaglio, setDettaglio] = useState<Item | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const items = q.data ?? [];
  const script = (sceneggiatura.data ?? [])[sceneggiatura.data?.length ? sceneggiatura.data.length - 1 : 0];
  const analisi = analizza((script?.data.elements ?? []) as Elemento[]);
  const info = (titolo: string) => analisi.get(titolo.trim().toUpperCase()) ?? analisi.get(titolo.replace(/\s*\(.*?\)\s*$/, "").trim().toUpperCase());

  const conBattute = items.filter((it) => (info(it.title)?.battute ?? 0) > 0).length;
  const protagonisti = items.filter((it) => it.data.ruolo === "Protagonista").length;
  const larghezza = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const colonna = (width - spacing.lg * 2 - spacing.md * (larghezza - 1)) / larghezza;

  const apri = (it: Item) => setDettaglio(it);
  const modifica = () => {
    if (!dettaglio) return;
    setEditing(dettaglio);
    setDettaglio(null);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Personaggio aggiornato")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Personaggio aggiunto")), onError: (e: Error) => toast(e.message, "error") });

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const elenco = items.length ? (
    <View style={{ flexDirection: larghezza > 1 ? "row" : "column", flexWrap: "wrap", gap: spacing.md }}>
      {items.map((it) => {
        const a = info(it.title);
        const ruolo: string = it.data.ruolo ?? "";
        return (
          <Pressable
            key={it.id}
            testID={`item-card-${it.id}`}
            onPress={() => apri(it)}
            style={({ pressed }) => ({ width: larghezza > 1 ? colonna : "100%", opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
          >
            <Glass
              style={{
                borderRadius: 22,
                borderWidth: 1,
                borderColor: (a?.battute ?? 0) > 0 ? "rgba(212,175,55,0.45)" : colors.divider,
                padding: spacing.lg,
                gap: spacing.sm,
                minHeight: 150,
              }}
              tint={(a?.battute ?? 0) > 0 ? colors.brandTertiary : undefined}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(212,175,55,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(212,175,55,0.45)",
                  }}
                >
                  <Text style={{ fontFamily: fonts.display, fontSize: 15, color: colors.brandPrimary }}>{iniziali(it.title)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.onSurface }} numberOfLines={1}>
                    {it.title}
                  </Text>
                  <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                    {[ruolo, it.data.eta ? `${it.data.eta} anni` : ""].filter(Boolean).join(" · ") || "Ruolo da definire"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={colors.muted} />
              </View>

              {it.data.descrizione ? (
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceSecondary }} numberOfLines={3}>
                  {it.data.descrizione}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: 2 }}>
                <Icon name="comment-quote-outline" size={13} color={(a?.battute ?? 0) > 0 ? colors.brandPrimary : colors.muted} />
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: (a?.battute ?? 0) > 0 ? colors.brandPrimary : colors.muted }}>
                  {(a?.battute ?? 0) > 0 ? `${a!.battute} ${a!.battute === 1 ? "battuta" : "battute"}` : "nessuna battuta"}
                </Text>
                <View style={{ width: 1, height: 12, backgroundColor: colors.divider }} />
                <Icon name="movie-open-outline" size={13} color={(a?.scene.size ?? 0) > 0 ? colors.brandPrimary : colors.muted} />
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: (a?.scene.size ?? 0) > 0 ? colors.brandPrimary : colors.muted }}>
                  {(a?.scene.size ?? 0) > 0 ? `${a!.scene.size} ${a!.scene.size === 1 ? "scena" : "scene"}` : "nessuna scena"}
                </Text>
              </View>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  ) : (
    <Empty
      icon={def.icon}
      title="Nessun personaggio"
      subtitle="Scrivi i personaggi qui: la sceneggiatura li ritrova da sola quando li nomini in una battuta."
      action={canEdit ? <Button testID="empty-add-personaggi" icon="plus" label="Aggiungi personaggio" onPress={() => (setEditing(null), setOpen(true))} /> : undefined}
    />
  );

  const dettaglioA = dettaglio ? info(dettaglio.title) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} ${items.length === 1 ? "personaggio" : "personaggi"} · ${conBattute} con battute · ${(scene.data ?? []).length} scene`}
        right={
          <>
            <Button testID="personaggi-goto-sceneggiatura" icon="script-text-outline" label={width > 900 ? "Sceneggiatura" : undefined} variant="secondary" onPress={() => go("sceneggiatura")} />
            <Button testID="personaggi-goto-scene" icon="movie-open-outline" label={width > 1000 ? "Scene" : undefined} variant="secondary" onPress={() => go("scene")} />
            {canEdit ? <Button testID="add-personaggi-button" icon="plus" label={width > 600 ? "Aggiungi" : undefined} onPress={() => (setEditing(null), setOpen(true))} /> : null}
          </>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
          <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", right: -18, bottom: -24, opacity: 0.09 }} pointerEvents="none">
            <Icon name="drama-masks" size={180} color={colors.brandPrimary} />
          </View>
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Icon name="account-group-outline" size={14} color={colors.brandPrimary} />
              <Text style={s.label}>Il cast del progetto</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
              {project.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
              {pillola("account-multiple-outline", `${items.length} ${items.length === 1 ? "personaggio" : "personaggi"}`)}
              {pillola("comment-quote-outline", `${conBattute} con battute`)}
              {protagonisti ? pillola("star-outline", `${protagonisti} ${protagonisti === 1 ? "protagonista" : "protagonisti"}`) : null}
            </View>
          </View>
        </View>

        {q.isLoading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} /> : elenco}
      </ScrollView>

      <Sheet
        testID="personaggio-sheet"
        visible={!!dettaglio}
        onClose={() => setDettaglio(null)}
        title={dettaglio?.title ?? ""}
        footer={
          <>
            {canEdit ? <Button testID="personaggio-edit" icon="pencil-outline" label="Modifica" onPress={modifica} /> : null}
            <Button testID="personaggio-goto-script" icon="script-text-outline" label="Nella sceneggiatura" variant="secondary" onPress={() => (setDettaglio(null), go("sceneggiatura"))} />
          </>
        }
      >
        {dettaglio ? (
          <>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Ruolo</Text>
                <Text style={s.body}>{dettaglio.data.ruolo || "Da definire"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Età</Text>
                <Text style={s.body}>{dettaglio.data.eta || "—"}</Text>
              </View>
            </View>
            {[
              ["Descrizione", dettaglio.data.descrizione],
              ["Obiettivo / bisogno", dettaglio.data.obiettivo],
              ["Arco narrativo", dettaglio.data.arco],
            ]
              .filter(([, v]) => !!v)
              .map(([l, v]) => (
                <View key={String(l)} style={{ gap: 2 }}>
                  <Text style={s.label}>{String(l)}</Text>
                  <Text style={s.body}>{String(v)}</Text>
                </View>
              ))}

            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Icon name="comment-quote-outline" size={16} color={colors.brandPrimary} />
                <Text style={[s.h3, { flex: 1 }]}>Dalla sceneggiatura</Text>
                <Text style={s.muted}>
                  {dettaglioA?.battute ?? 0} battute · {dettaglioA?.scene.size ?? 0} scene
                </Text>
              </View>
              {dettaglioA?.linee.length ? (
                dettaglioA.linee.slice(0, 8).map((l, i) => (
                  <View key={`${l.scena}-${i}`} style={{ borderLeftWidth: 2, borderLeftColor: "rgba(212,175,55,0.4)", paddingLeft: spacing.sm, gap: 1, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: fonts.script, fontSize: 10.5, letterSpacing: 0.6, color: colors.muted }} numberOfLines={1}>
                      {l.scena}
                    </Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 13.5, lineHeight: 19, color: colors.onSurface }} numberOfLines={3}>
                      {l.testo}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={s.muted}>Nessuna battuta nella sceneggiatura: quando scrivi il suo nome in un blocco Personaggio, le battute compaiono qui.</Text>
              )}
              {dettaglioA && dettaglioA.linee.length > 8 ? <Text style={s.muted}>…e altre {dettaglioA.linee.length - 8} battute.</Text> : null}
              {dettaglioA && dettaglioA.scene.size ? (
                <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={3}>
                  Scene: {Array.from(dettaglioA.scene).slice(0, 6).join(" · ")}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}
      </Sheet>

      <PersonaggioEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), setDettaglio(null), toast("Personaggio eliminato")) })}
      />
    </View>
  );
}
