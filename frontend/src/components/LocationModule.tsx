import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import LocationEditor from "@/src/components/LocationEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const PERMESSI = ["Da richiedere", "Richiesti", "Ottenuti", "Non necessari"];

const euro = (n: number) => `€ ${Math.round(n).toLocaleString("it-IT")}`;

export default function LocationModule({ def }: { def: ModuleDef }) {
  const { project, go, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const scene = useItems(project.id, "scene");
  const m = useItemMutations(project.id, def.key);
  const lookup = useLookup(project.id);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [permesso, setPermesso] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const filtrate = permesso ? items.filter((it) => (it.data.permessi ?? "Da richiedere") === permesso) : items;

  const costo = items.reduce((n, it) => n + Number(it.data.tariffa || 0) * (Number(it.data.durata || 0) || 1), 0);
  const ottenuti = items.filter((it) => it.data.permessi === "Ottenuti").length;
  const conFoto = items.filter((it) => it.data.foto).length;
  const sceneDi = (id: string) => (scene.data ?? []).filter((sc) => sc.data.location === id).length;

  const cols = width > 1080 ? 2 : 1;
  const cellW = Math.min(width, 1080) - 48 - (cols > 1 ? spacing.lg : 0);
  const cardW = cols > 1 ? cellW / 2 : cellW;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Location aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Location aggiunta")), onError: (e: Error) => toast(e.message, "error") });

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const tintaPermesso = (p: string) => (p === "Ottenuti" ? colors.success : p === "Richiesti" ? colors.brandPrimary : p === "Non necessari" ? colors.muted : colors.error);

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} location · ${ottenuti} permessi ottenuti · ${conFoto} con foto`}
        right={
          <>
            <Button testID="location-goto-scene" icon="movie-open-outline" label={width > 900 ? "Scene" : undefined} variant="secondary" onPress={() => go("scene")} />
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 700 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      <FlatList
        key={cols}
        data={filtrate}
        numColumns={cols}
        keyExtractor={(it) => it.id}
        columnWrapperStyle={cols > 1 ? { gap: spacing.lg } : undefined}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
              <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
                <Icon name="map-marker-outline" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="map-marker-outline" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>Le location</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                  {pillola("map-marker-outline", `${items.length} ${items.length === 1 ? "location" : "location"}`)}
                  {pillola("shield-check-outline", `${ottenuti} permessi ottenuti`)}
                  {costo ? pillola("cash-multiple", euro(costo)) : null}
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Chip testID="location-filter-tutte" label={`Tutte (${items.length})`} selected={!permesso} onPress={() => setPermesso(null)} />
              {PERMESSI.map((p) => (
                <Chip key={p} testID={`location-filter-${p}`} label={`${p} (${items.filter((it) => (it.data.permessi ?? "Da richiedere") === p).length})`} selected={permesso === p} onPress={() => setPermesso(permesso === p ? null : p)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrate.length ? (
            <Empty icon="filter-off-outline" title="Nessuna location con questo stato" action={<Button label="Azzera" variant="secondary" onPress={() => setPermesso(null)} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Nessuna location"
              subtitle="Aggiungi i luoghi delle riprese con foto, indirizzo, permessi e costo: le scene si collegano da sole."
              action={canEdit ? <Button testID="location-empty-add" icon="plus" label="Aggiungi location" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const foto = String(item.data.foto ?? "");
          const extra = [item.data.foto2, item.data.foto3].filter(Boolean).length;
          const p = String(item.data.permessi ?? "Da richiedere");
          const n = sceneDi(item.id);
          const giorni = Number(item.data.durata || 0);
          return (
            <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
              <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
                <View style={{ height: 168, backgroundColor: colors.surfaceTertiary }}>
                  {foto ? (
                    <RemoteImage path={foto} style={{ width: "100%", height: 168 }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon name="image-off-outline" size={30} color={colors.muted} />
                      <Text style={[s.muted, { fontSize: 11.5 }]}>Nessuna foto</Text>
                    </View>
                  )}
                  <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 92 }} />
                  <View style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.sm, gap: 2 }}>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 19, color: "#FFFFFF" }}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 11.5, color: "rgba(255,255,255,0.82)" }}>
                      {[item.data.indirizzo, item.data.contatto].filter(Boolean).join(" · ") || "Indirizzo da compilare"}
                    </Text>
                  </View>
                  <View style={{ position: "absolute", top: spacing.sm, right: spacing.sm, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.92)" }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tintaPermesso(p) }} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: "#2A2721" }}>{p}</Text>
                  </View>
                  {extra ? (
                    <View style={{ position: "absolute", top: spacing.sm, left: spacing.sm, flexDirection: "row", alignItems: "center", gap: 3, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <Icon name="image-multiple-outline" size={11} color="#FFFFFF" />
                      <Text style={{ fontFamily: fonts.text, fontSize: 10, color: "#FFFFFF" }}>+{extra}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                    {item.data.date ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                        <Icon name="calendar-range" size={11} color={colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.onSurfaceSecondary }}>{String(item.data.date).replace(" → ", " → ")}</Text>
                      </View>
                    ) : null}
                    {item.data.tariffa ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                        <Icon name="cash" size={11} color={colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.onSurfaceSecondary }}>
                          {euro(Number(item.data.tariffa))}
                          {item.data.unita ? ` / ${item.data.unita}` : ""}
                          {giorni ? ` · ${giorni}${item.data.unita === "Ore" ? "h" : item.data.unita === "Settimana" ? " sett." : " gg"}` : ""}
                        </Text>
                      </View>
                    ) : null}
                    {n ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.35)" }}>
                        <Icon name="movie-open-outline" size={11} color={colors.brandPrimary} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: colors.brandPrimary }}>{n} {n === 1 ? "scena" : "scene"}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.data.note ? (
                    <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceSecondary }}>
                      {item.data.note}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    {item.data.mappa ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Icon name="map-outline" size={13} color={colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.muted }} numberOfLines={1}>Mappa salvata</Text>
                      </View>
                    ) : null}
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

      <LocationEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Location eliminata")) })}
      />
    </View>
  );
}
