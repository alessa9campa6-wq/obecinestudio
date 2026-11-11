import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage, RemoteVideo } from "@/src/components/Images";
import MoodboardEditor from "@/src/components/MoodboardEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { isVideo, ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

// La moodboard è un muro di immagini: niente righe, niente tabelle. Le schede
// hanno altezze diverse e si distribuiscono in colonne bilanciate.
// Ogni immagine si dimensiona sul proprio formato: niente ritagli.
function MoodImage({ path, width, cellW }: { path: string; width: number; cellW?: number }) {
  const { colors } = useTheme();
  const [ratio, setRatio] = useState<number | null>(null);
  const h = ratio ? Math.round(width / ratio) : Math.round((cellW ?? width) * 0.78);
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
  const [scena, setScena] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const visibili = scena ? items.filter((it) => it.data.scena === scena) : items;
  const scene = [...new Set(items.map((it) => it.data.scena).filter(Boolean))] as string[];
  const conVideo = items.filter((it) => isVideo(String(it.data.immagine ?? ""))).length;

  const cols = width > 1200 ? 4 : width > 900 ? 3 : width > 560 ? 2 : 2;
  const gap = 10;
  const areaW = Math.min(width, 1280) - 48;
  const cellW = (areaW - gap * (cols - 1)) / cols;

  // Distribuzione in colonne: ogni immagine va nella colonna più corta.
  const colonne = useMemo(() => {
    const out: { it: Item; h: number }[][] = Array.from({ length: cols }, () => []);
    const alt: number[] = Array.from({ length: cols }, () => 0);
    visibili.forEach((it) => {
      // Stima per bilanciare le colonne; l'altezza vera arriva dal formato.
      const h = cellW * 0.78;
      const corta = alt.indexOf(Math.min(...alt));
      out[corta].push({ it, h });
      alt[corta] += h + gap + 34;
    });
    return out;
  }, [visibili, cols, cellW]);

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

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} ${items.length === 1 ? "immagine" : "immagini"}${conVideo ? ` · ${conVideo} video` : ""}${scene.length ? ` · ${scene.length} scene` : ""}`}
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
          subtitle="Raccogli immagini, video e reference: si vedono come un muro, e il PDF li stampa nello stesso ordine."
          action={canEdit ? <Button testID="moodboard-empty-add" icon="plus" label="Aggiungi la prima" onPress={() => apri(null)} /> : undefined}
        />
      ) : (
        <FlatList
          data={[0]}
          keyExtractor={(n) => String(n)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
          ListHeaderComponent={
            <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {pillola("image-multiple-outline", `${items.length} ${items.length === 1 ? "immagine" : "immagini"}`)}
                {conVideo ? pillola("play-circle-outline", `${conVideo} video`) : null}
                {scene.length ? pillola("movie-open-outline", `${scene.length} scene`) : null}
              </View>
              {scene.length > 1 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                  <Chip testID="moodboard-filter-tutte" label={`Tutte (${items.length})`} selected={!scena} onPress={() => setScena(null)} />
                  {scene.map((id) => (
                    <Chip key={id} testID={`moodboard-filter-${id}`} label={lookup.get(id)?.title ?? "Scena"} selected={scena === id} onPress={() => setScena(scena === id ? null : id)} />
                  ))}
                </View>
              ) : null}
            </View>
          }
          renderItem={() =>
            visibili.length ? (
              <View style={{ flexDirection: "row", gap, alignItems: "flex-start" }}>
                {colonne.map((col, ci) => (
                  <View key={ci} style={{ width: cellW, gap, flexShrink: 1 }}>
                    {col.map(({ it, h }) => {
                      const img = String(it.data.immagine ?? "");
                      const video = isVideo(img);
                      const scenaTitolo = lookup.get(it.data.scena)?.title;
                      return (
                        <Pressable
                          key={it.id}
                          testID={`item-card-${it.id}`}
                          onPress={() => setViewing(it)}
                          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
                        >
                          <View style={{ borderRadius: 14, overflow: "hidden", backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}>
                            <View style={{ width: "100%" }}>
                              {img ? (
                                video ? (
                                  <View style={{ height: Math.round((cellW ?? 0) * 0.78), width: "100%" }}>
                                    <RemoteVideo path={img} style={{ width: "100%", height: "100%" }} />
                                    <View style={{ position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                                      <Icon name="play" size={15} color="#FFFFFF" />
                                    </View>
                                  </View>
                                ) : (
                                  <MoodImage path={img} width={cellW} cellW={cellW} />
                                )
                              ) : (
                                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }}>
                                  <Icon name="image-off-outline" size={24} color={colors.muted} />
                                  <Text style={[s.muted, { fontSize: 10.5 }]}>Nessuna immagine</Text>
                                </View>
                              )}
                              {it.data.immagine === undefined || !img ? (
                                <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: "rgba(0,0,0,0.05)" }}>
                                  <Text style={{ fontFamily: fonts.display, fontSize: 13, color: colors.onSurface }} numberOfLines={1}>
                                    {it.title}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            {(it.title || scenaTitolo || it.data.note) && img ? (
                              <View style={{ paddingHorizontal: 9, paddingVertical: 7, gap: 2, backgroundColor: colors.surfaceSecondary }}>
                                {it.title ? (
                                  <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: colors.onSurface }}>
                                    {it.title}
                                  </Text>
                                ) : null}
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                  {scenaTitolo ? <Text numberOfLines={1} style={{ fontFamily: fonts.script, fontSize: 9.5, color: colors.brandPrimary, flexShrink: 1 }}>{scenaTitolo}</Text> : null}
                                  {it.data.note ? <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 10, color: colors.muted, flex: 1 }}>{it.data.note}</Text> : null}
                                </View>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : (
              <Empty icon="filter-off-outline" title="Niente per questa scena" action={<Button label="Mostra tutte" variant="secondary" onPress={() => setScena(null)} />} />
            )
          }
        />
      )}

      <Sheet visible={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || "Reference"}>
        {viewing ? (
          <View style={{ gap: spacing.md, padding: spacing.lg }}>
            <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#000", maxHeight: 460 }}>
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
                <View style={{ borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{lookup.get(viewing.data.scena)?.title}</Text>
                </View>
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
