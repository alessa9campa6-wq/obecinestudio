import { useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage, RemoteVideo } from "@/src/components/Images";
import ReferenceEditor from "@/src/components/ReferenceEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { isVideo, ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

const TIPI = ["Film", "Fotografia", "Viewfinder", "Arte", "Musica", "Video", "Altro"];

const ICONE: Record<string, IconName> = {
  Film: "movie-open-outline",
  Fotografia: "image-outline",
  Viewfinder: "camera-iris",
  Arte: "palette-outline",
  Musica: "music-note-outline",
  Video: "play-box-outline",
  Altro: "bookmark-multiple-outline",
};

// Anteprima che rispetta il formato dell'immagine, senza tagli.
function RefMedia({ path, width, onPress }: { path: string; width: number; onPress?: () => void }) {
  const { colors } = useTheme();
  const [ratio, setRatio] = useState<number | null>(null);
  const video = isVideo(path);
  const h = video ? Math.round(width * 0.6) : ratio ? Math.round(width / ratio) : Math.round(width * 0.7);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ width, height: h, backgroundColor: colors.surfaceTertiary }}>
      {video ? (
        <>
          <RemoteVideo path={path} style={{ width: "100%", height: "100%" }} />
          <View style={{ position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="play" size={15} color="#FFFFFF" />
          </View>
        </>
      ) : (
        <RemoteImage
          path={path}
          style={{ width: "100%", height: h }}
          onLoad={(e: any) => {
            const src = e?.source;
            if (src?.width && src?.height) setRatio(src.width / src.height);
          }}
        />
      )}
    </Pressable>
  );
}

function apriLink(url?: string) {
  const u = String(url ?? "").trim();
  if (!u) return;
  const safe = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  Linking.openURL(safe).catch(() => toast("Non riesco ad aprire il link", "error"));
}

export default function ReferenceModule({ def }: { def: ModuleDef }) {
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
  const [tipo, setTipo] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const filtrate = tipo ? items.filter((it) => (it.data.tipo ?? "Altro") === tipo) : items;
  const tipiUsati = TIPI.filter((t) => items.some((it) => (it.data.tipo ?? "Altro") === t));
  const conLink = items.filter((it) => String(it.data.link ?? "").trim()).length;

  const cols = width > 1200 ? 3 : width > 800 ? 2 : 1;
  const gap = 12;
  const areaW = Math.min(width, 1240) - 48;
  const cellW = (areaW - gap * (cols - 1)) / cols;

  const sezioni = useMemo(() => {
    const gruppi = tipiUsati.map((t) => ({ t, items: filtrate.filter((it) => (it.data.tipo ?? "Altro") === t) })).filter((g) => g.items.length);
    return gruppi;
  }, [tipiUsati, filtrate]);

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

  const scheda = (it: Item) => {
    const img = String(it.data.immagine ?? "");
    const t = String(it.data.tipo ?? "Altro");
    const link = String(it.data.link ?? "");
    const scena = lookup.get(it.data.scena)?.title;
    return (
      <View key={it.id} style={{ width: cellW }}>
        <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
          {img ? (
            <RefMedia path={img} width={cellW - 2} onPress={() => setViewing(it)} />
          ) : (
            <Pressable onPress={() => setViewing(it)} style={{ height: Math.round(cellW * 0.5), alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.surfaceTertiary }}>
              <Icon name={ICONE[t] ?? "bookmark-multiple-outline"} size={28} color={colors.brandPrimary} />
              <Text style={[s.muted, { fontSize: 11 }]}>Solo link o nota</Text>
            </Pressable>
          )}

          <View style={{ padding: spacing.md, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.35)" }}>
                <Icon name={ICONE[t] ?? "bookmark"} size={10} color={colors.brandPrimary} />
                <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: colors.brandPrimary }}>{t}</Text>
              </View>
              {scena ? (
                <Text numberOfLines={1} style={{ fontFamily: fonts.script, fontSize: 10, color: colors.muted, flex: 1 }}>
                  {scena}
                </Text>
              ) : null}
            </View>

            <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 14, fontWeight: "700", color: colors.onSurface }}>
              {it.title || "Senza titolo"}
            </Text>
            {it.data.note ? (
              <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 12, lineHeight: 16, color: colors.onSurfaceSecondary }}>
                {it.data.note}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: 2 }}>
              {link ? (
                <Pressable testID={`reference-link-${it.id}`} onPress={() => apriLink(link)} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="link-variant" size={13} color={colors.brandPrimary} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>Apri link</Text>
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => apri(it)} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.muted }}>Modifica</Text>
                <Icon name="pencil-outline" size={12} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        </Glass>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} reference${tipiUsati.length ? ` · ${tipiUsati.length} tipi` : ""}${conLink ? ` · ${conLink} con link` : ""}`}
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
          title="Nessuna reference"
          subtitle="Raccogli film, fotografie, viewfinder e link: si dividono da soli per tipo."
          action={canEdit ? <Button testID="reference-empty-add" icon="plus" label="Aggiungi la prima" onPress={() => apri(null)} /> : undefined}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {pillola("bookmark-multiple-outline", `${items.length} ${items.length === 1 ? "reference" : "reference"}`)}
            {conLink ? pillola("link-variant", `${conLink} con link`) : null}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            <Chip testID="reference-filter-tutte" label={`Tutte (${items.length})`} selected={!tipo} onPress={() => setTipo(null)} />
            {tipiUsati.map((t) => (
              <Chip key={t} testID={`reference-filter-${t}`} label={`${t} (${items.filter((it) => (it.data.tipo ?? "Altro") === t).length})`} selected={tipo === t} onPress={() => setTipo(tipo === t ? null : t)} />
            ))}
          </View>

          {sezioni.map((sezione) => (
            <View key={sezione.t} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={{ width: 20, height: 1.5, backgroundColor: colors.brandPrimary }} />
                <Icon name={ICONE[sezione.t] ?? "bookmark"} size={14} color={colors.brandPrimary} />
                <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.onSurface }}>{sezione.t}</Text>
                <View style={{ flex: 1 }} />
                <View style={{ borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.onSurfaceSecondary }}>{sezione.items.length}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>{sezione.items.map(scheda)}</View>
            </View>
          ))}
        </ScrollView>
      )}

      <Sheet visible={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || "Reference"}>
        {viewing ? (
          <ScrollView contentContainerStyle={{ gap: spacing.md, padding: spacing.lg }}>
            {String(viewing.data.immagine ?? "") ? (
              <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}>
                {isVideo(String(viewing.data.immagine)) ? (
                  <RemoteVideo path={String(viewing.data.immagine)} style={{ width: "100%", height: 300 }} />
                ) : (
                  <RemoteImage path={String(viewing.data.immagine)} contentFit="contain" style={{ width: "100%", height: 420 }} />
                )}
              </View>
            ) : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              <View style={{ borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{String(viewing.data.tipo ?? "Altro")}</Text>
              </View>
              {lookup.get(viewing.data.scena)?.title ? (
                <View style={{ borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceTertiary }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: colors.onSurfaceSecondary }}>{lookup.get(viewing.data.scena)?.title}</Text>
                </View>
              ) : null}
            </View>
            {viewing.data.note ? <Text style={{ fontFamily: fonts.text, fontSize: 14, lineHeight: 21, color: colors.onSurfaceSecondary }}>{viewing.data.note}</Text> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {String(viewing.data.link ?? "").trim() ? <Button icon="open-in-new" label="Apri il link" variant="secondary" onPress={() => apriLink(viewing.data.link)} /> : null}
              {canEdit ? <Button icon="pencil" label="Modifica" onPress={() => (setOpen(true), setEditing(viewing), setViewing(null))} /> : null}
              {canEdit ? <Button icon="trash-can-outline" label="Elimina" variant="secondary" onPress={() => m.remove.mutate(viewing.id, { onSuccess: () => (setViewing(null), toast("Reference eliminata")) })} /> : null}
            </View>
          </ScrollView>
        ) : null}
      </Sheet>

      <ReferenceEditor
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
