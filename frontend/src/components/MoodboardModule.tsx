import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage, RemoteVideo } from "@/src/components/Images";
import MoodboardEditor from "@/src/components/MoodboardEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { isVideo, ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

// Ogni immagine prende l'altezza dal proprio formato: niente ritagli.
function MoodImage({ path, width, cellW }: { path: string; width: number; cellW: number }) {
  const { colors } = useTheme();
  const [ratio, setRatio] = useState<number | null>(null);
  const h = ratio ? Math.round(width / ratio) : Math.round(cellW * 0.78);
  return (
    <View style={{ width, height: h, backgroundColor: colors.surfaceTertiary }}>
      <RemoteImage
        path={path}
        style={{ width: "100%", height: h }}
        contentFit="cover"
        onLoad={(e: any) => {
          const src = e?.source;
          if (src?.width && src?.height) setRatio(src.width / src.height);
        }}
      />
    </View>
  );
}

function Card({ it, cellW, lookup, onPress }: { it: Item; cellW: number; lookup: ReturnType<typeof useLookup>; onPress: () => void }) {
  const { colors } = useTheme();
  const s = useStyles();
  const img = String(it.data.immagine ?? "");
  const video = isVideo(img);

  return (
    <Pressable testID={`item-card-${it.id}`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
        {img ? (
          video ? (
            <View style={{ height: Math.round(cellW * 0.78), width: "100%" }}>
              <RemoteVideo path={img} style={{ width: "100%", height: "100%" }} />
              <View style={{ position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                <Icon name="play" size={15} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <MoodImage path={img} width={cellW} cellW={cellW} />
          )
        ) : (
          <View style={{ height: Math.round(cellW * 0.78), alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Icon name="image-off-outline" size={24} color={colors.muted} />
            <Text style={[s.muted, { fontSize: 10.5 }]}>Nessuna immagine</Text>
          </View>
        )}

        {it.title || it.data.note ? (
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2, backgroundColor: colors.surfaceSecondary }}>
            {it.title ? (
              <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 16, color: colors.onSurface }}>
                {it.title}
              </Text>
            ) : null}
            {it.data.note ? (
              <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 11.5, lineHeight: 15, color: colors.muted }}>
                {it.data.note}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Glass>
    </Pressable>
  );
}

// Muro del singolo gruppo: le schede si distribuiscono nella colonna più corta.
function Muro({ items, cellW, cols, gap, lookup, onPress }: { items: Item[]; cellW: number; cols: number; gap: number; lookup: ReturnType<typeof useLookup>; onPress: (it: Item) => void }) {
  const colonne = useMemo(() => {
    const out: Item[][] = Array.from({ length: cols }, () => []);
    const alt: number[] = Array.from({ length: cols }, () => 0);
    items.forEach((it) => {
      const corta = alt.indexOf(Math.min(...alt));
      out[corta].push(it);
      alt[corta] += cellW * 0.78 + gap + 30;
    });
    return out;
  }, [items, cols, cellW, gap]);

  return (
    <View style={{ flexDirection: "row", gap, alignItems: "flex-start" }}>
      {colonne.map((col, ci) => (
        <View key={ci} style={{ width: cellW, gap, flexShrink: 1 }}>
          {col.map((it) => (
            <Card key={it.id} it={it} cellW={cellW} lookup={lookup} onPress={() => onPress(it)} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function MoodboardModule({ def }: { def: ModuleDef }) {
  const { project, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const lookup = useLookup(project.id);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Item | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const conVideo = items.filter((it) => isVideo(String(it.data.immagine ?? ""))).length;

  // Il gruppo è quello più usato nel progetto: scene per un film, episodi per
  // una serie, contenuti social per i social. Così ogni muro ha il suo titolo.
  const groupKey = useMemo(() => {
    const chiavi = ["scena", "episodio", "contenuto"] as const;
    let best: (typeof chiavi)[number] = "scena";
    let bestN = -1;
    for (const k of chiavi) {
      const n = items.filter((it) => it.data[k]).length;
      if (n > bestN) {
        best = k;
        bestN = n;
      }
    }
    return best;
  }, [items]);

  const sezioni = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((it) => {
      const id = String(it.data[groupKey] ?? "");
      const arr = map.get(id) ?? [];
      arr.push(it);
      map.set(id, arr);
    });
    const conGruppo = [...map.entries()]
      .filter(([id]) => id)
      .map(([id, arr]) => ({ id, titolo: lookup.get(id)?.title ?? "Senza titolo", items: arr }))
      .sort((a, b) => a.titolo.localeCompare(b.titolo));
    const senza = map.get("") ?? [];
    const ultima = senza.length ? [{ id: "", titolo: groupKey === "contenuto" ? "Senza contenuto" : groupKey === "episodio" ? "Senza episodio" : "Senza scena", items: senza }] : [];
    return [...conGruppo, ...ultima];
  }, [items, groupKey, lookup]);

  const cols = width > 1200 ? 4 : width > 900 ? 3 : 2;
  const gap = 10;
  const areaW = Math.min(width, 1280) - 48;
  const cellW = (areaW - gap * (cols - 1)) / cols;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Reference aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Reference aggiunta")), onError: (e: Error) => toast(e.message, "error") });

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const iconaGruppo: IconName = groupKey === "contenuto" ? "cellphone-play" : groupKey === "episodio" ? "television-classic" : "movie-open-outline";
  const nomeGruppo = groupKey === "contenuto" ? "contenuto" : groupKey === "episodio" ? "episodio" : "scena";

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} ${items.length === 1 ? "immagine" : "immagini"} · ${sezioni.length} ${sezioni.length === 1 ? nomeGruppo : nomeGruppo + (groupKey === "scena" ? "e" : "")}${conVideo ? ` · ${conVideo} video` : ""}`}
        right={
          <>
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 700 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : !items.length ? (
        <Empty
          icon={def.icon}
          title="Moodboard vuota"
          subtitle="Raccogli immagini e video: vengono divisi da soli per scena, episodio o contenuto social."
          action={canEdit ? <Button testID="moodboard-empty-add" icon="plus" label="Aggiungi la prima" onPress={() => apri(null)} /> : undefined}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
          <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
            <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
            <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
              <Icon name="image-multiple-outline" size={170} color={colors.brandPrimary} />
            </View>
            <View style={{ padding: spacing.xl, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Icon name="image-multiple-outline" size={14} color={colors.brandPrimary} />
                <Text style={s.label}>La moodboard</Text>
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                {project.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                {pillola("image-multiple-outline", `${items.length} ${items.length === 1 ? "immagine" : "immagini"}`)}
                {pillola(iconaGruppo, `${sezioni.length} ${nomeGruppo}${sezioni.length === 1 ? "" : groupKey === "scena" ? "e" : "i"}`)}
                {conVideo ? pillola("play-circle-outline", `${conVideo} video`) : null}
              </View>
            </View>
          </View>

          {sezioni.map((sezione) => (
            <View key={sezione.id || "senza"} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={{ width: 20, height: 1.5, backgroundColor: colors.brandPrimary }} />
                <Icon name={iconaGruppo} size={14} color={colors.brandPrimary} />
                <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.onSurface, flexShrink: 1 }} numberOfLines={1}>
                  {sezione.titolo}
                </Text>
                <View style={{ flex: 1 }} />
                <View style={{ borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.onSurfaceSecondary }}>{sezione.items.length}</Text>
                </View>
              </View>
              <Muro items={sezione.items} cellW={cellW} cols={cols} gap={gap} lookup={lookup} onPress={(it) => setViewing(it)} />
            </View>
          ))}
        </ScrollView>
      )}

      <Sheet visible={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || "Reference"}>
        {viewing ? (
          <View style={{ gap: spacing.md, padding: spacing.lg }}>
            <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}>
              {String(viewing.data.immagine ?? "") ? (
                isVideo(String(viewing.data.immagine)) ? (
                  <RemoteVideo path={String(viewing.data.immagine)} style={{ width: "100%", height: 300 }} />
                ) : (
                  <RemoteImage path={String(viewing.data.immagine)} contentFit="contain" style={{ width: "100%", height: 420 }} />
                )
              ) : (
                <View style={{ height: 160, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="image-off-outline" size={30} color="#888" />
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {lookup.get(viewing.data.scena)?.title ? (
                <Glass style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(212,175,55,0.4)", paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{lookup.get(viewing.data.scena)?.title}</Text>
                </Glass>
              ) : null}
            </View>
            {viewing.data.note ? <Text style={{ fontFamily: fonts.text, fontSize: 14, lineHeight: 21, color: colors.onSurfaceSecondary }}>{viewing.data.note}</Text> : null}
            {canEdit ? (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Button icon="pencil" label="Modifica" onPress={() => (setOpen(true), setEditing(viewing), setViewing(null))} />
                <Button icon="trash-can-outline" label="Elimina" variant="secondary" onPress={() => m.remove.mutate(viewing.id, { onSuccess: () => (setViewing(null), toast("Reference eliminata")) })} />
              </View>
            ) : null}
          </View>
        ) : null}
      </Sheet>

      <MoodboardEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Reference eliminata")) })}
      />
    </View>
  );
}
