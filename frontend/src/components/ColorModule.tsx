import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import ColorEditor from "@/src/components/ColorEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const STATI = ["Da fare", "In lavorazione", "Revisione", "Approvato"];

const paletteDi = (v: any) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => /^#?[0-9a-fA-F]{3,8}$/.test(x))
    .map((x) => (x.startsWith("#") ? x : `#${x}`));

export default function ColorModule({ def }: { def: ModuleDef }) {
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
  const [stato, setStato] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const filtrati = stato ? items.filter((it) => (it.data.stato ?? "Da fare") === stato) : items;
  const camere = useMemo(() => new Set(items.map((it) => String(it.data.camera ?? "").trim()).filter(Boolean)).size, [items]);
  const conLut = items.filter((it) => String(it.data.lut ?? "").trim()).length;
  const sceneUsate = useMemo(() => new Set(items.flatMap((it) => (it.data.scene ?? []) as string[])).size, [items]);

  const cols = width > 1080 ? 2 : 1;
  const cellW = Math.min(width, 1080) - 48 - (cols > 1 ? spacing.lg : 0);
  const cardW = cols > 1 ? cellW / 2 : cellW;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Look aggiornato")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Look aggiunto")), onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} ${items.length === 1 ? "look" : "look"}${camere ? ` · ${camere} ${camere === 1 ? "camera" : "camere"}` : ""}${conLut ? ` · ${conLut} LUT` : ""}`}
        right={
          <>
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 700 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      <FlatList
        key={cols}
        data={filtrati}
        numColumns={cols}
        keyExtractor={(it) => it.id}
        columnWrapperStyle={cols > 1 ? { gap: spacing.lg } : undefined}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
              <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
                <Icon name="palette-outline" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="palette-outline" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>Il look del progetto</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                  {pillola("palette-outline", `${items.length} ${items.length === 1 ? "look" : "look"}`)}
                  {camere ? pillola("camera-outline", `${camere} ${camere === 1 ? "camera" : "camere"}`) : null}
                  {sceneUsate ? pillola("movie-open-outline", `${sceneUsate} ${sceneUsate === 1 ? "scena" : "scene"}`) : null}
                </View>
              </View>
            </View>

            {items.some((it) => it.data.stato) ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                <Chip testID="color-filter-tutti" label={`Tutti (${items.length})`} selected={!stato} onPress={() => setStato(null)} />
                {STATI.filter((st) => items.some((it) => (it.data.stato ?? "Da fare") === st)).map((st) => (
                  <Chip key={st} testID={`color-filter-${st}`} label={`${st} (${items.filter((it) => (it.data.stato ?? "Da fare") === st).length})`} selected={stato === st} onPress={() => setStato(stato === st ? null : st)} />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrati.length ? (
            <Empty icon="filter-off-outline" title="Nessun look con questo stato" action={<Button label="Mostra tutti" variant="secondary" onPress={() => setStato(null)} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Nessun look"
              subtitle="Definisci palette, camera, LUT e scene: ogni look diventa una scheda colori da mostrare in reparto."
              action={canEdit ? <Button testID="color-empty-add" icon="plus" label="Aggiungi il primo look" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const palette = paletteDi(item.data.palette);
          const st = String(item.data.stato ?? "Da fare");
          const n = ((item.data.scene ?? []) as string[]).length;
          return (
            <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}>
              <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
                <View style={{ height: 74, flexDirection: "row", backgroundColor: colors.surfaceTertiary }}>
                  {palette.length ? (
                    palette.map((c, i) => <View key={`${c}-${i}`} style={{ flex: 1, backgroundColor: c }} />)
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }}>
                      <Icon name="palette-swatch-outline" size={18} color={colors.muted} />
                      <Text style={[s.muted, { fontSize: 11.5 }]}>Palette da definire</Text>
                    </View>
                  )}
                </View>

                <View style={{ padding: spacing.md, gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, color: colors.onSurface }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st === "Approvato" ? colors.success : st === "Revisione" ? colors.brandPrimary : st === "In lavorazione" ? colors.brandPrimary : colors.muted }} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.onSurfaceSecondary }}>{st}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" }}>
                    {item.data.camera ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                        <Icon name="camera-outline" size={11} color={colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.onSurfaceSecondary }}>{String(item.data.camera)}</Text>
                      </View>
                    ) : null}
                    {item.data.lut ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.35)" }}>
                        <Icon name="movie-filter-outline" size={11} color={colors.brandPrimary} />
                        <Text style={{ fontFamily: fonts.script, fontSize: 11, fontWeight: "700", color: colors.brandPrimary }}>{String(item.data.lut)}</Text>
                      </View>
                    ) : null}
                    {n ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Icon name="movie-open-outline" size={11} color={colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{n} {n === 1 ? "scena" : "scene"}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.data.note ? (
                    <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceSecondary }}>
                      {item.data.note}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: 2 }}>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>Apri</Text>
                    <Icon name="chevron-right" size={16} color={colors.brandPrimary} />
                  </View>
                </View>
              </Glass>
            </Pressable>
          );
        }}
      />

      <ColorEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Look eliminato")) })}
      />
    </View>
  );
}
