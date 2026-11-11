import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import SceneEditor from "@/src/components/SceneEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const STATI = ["Da girare", "Girata", "Tagliata"];

export default function SceneModule({ def }: { def: ModuleDef }) {
  const { project, go, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const personaggi = useItems(project.id, "personaggi");
  const location = useItems(project.id, "location");
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
  const filtrate = stato ? items.filter((it) => (it.data.stato ?? "Da girare") === stato) : items;
  const girate = items.filter((it) => it.data.stato === "Girata").length;
  const pagine = items.reduce((n, it) => n + (String(it.data.pagine ?? "").trim() ? 1 : 0), 0);

  const nomeDi = (id?: string) => (id ? lookup.get(id)?.title : "") ?? "";
  const tinta = (st: string) => (st === "Girata" ? colors.success : st === "Tagliata" ? colors.error : colors.muted);

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Scena aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Scena aggiunta")), onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} ${items.length === 1 ? "scena" : "scene"} · ${girate} girate · ${(personaggi.data ?? []).length} personaggi · ${(location.data ?? []).length} location`}
        right={
          <>
            <Button testID="scene-goto-personaggi" icon="drama-masks" label={width > 900 ? "Personaggi" : undefined} variant="secondary" onPress={() => go("personaggi")} />
            <Button testID="scene-goto-location" icon="map-marker-outline" label={width > 1050 ? "Location" : undefined} variant="secondary" onPress={() => go("location")} />
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 700 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
          <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", right: -16, bottom: -24, opacity: 0.09 }} pointerEvents="none">
            <Icon name="movie-open-outline" size={170} color={colors.brandPrimary} />
          </View>
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Icon name="movie-open-outline" size={14} color={colors.brandPrimary} />
              <Text style={s.label}>Le scene</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
              {project.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
              {pillola("movie-open-outline", `${items.length} ${items.length === 1 ? "scena" : "scene"}`)}
              {pillola("check-circle-outline", `${girate} girate`)}
              {pagine ? pillola("file-document-outline", `${pagine} con pagine`) : null}
            </View>
            <View style={{ gap: 5, paddingTop: spacing.sm }}>
              <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: "rgba(0,0,0,0.12)", overflow: "hidden" }}>
                <LinearGradient
                  colors={[colors.brandSecondary, colors.brandPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 6, width: `${items.length ? Math.max(3, (girate / items.length) * 100) : 3}%`, borderRadius: radius.pill }}
                />
              </View>
              <Text style={[s.muted, { fontSize: 11.5 }]}>
                {items.length - girate} ancora da girare
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          <Chip testID="scene-filter-tutte" label={`Tutte (${items.length})`} selected={!stato} onPress={() => setStato(null)} />
          {STATI.map((st) => (
            <Chip key={st} testID={`scene-filter-${st}`} label={`${st} (${items.filter((it) => (it.data.stato ?? "Da girare") === st).length})`} selected={stato === st} onPress={() => setStato(stato === st ? null : st)} />
          ))}
        </View>

        {q.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : !items.length ? (
          <Empty
            icon={def.icon}
            title="Nessuna scena"
            subtitle="Scrivi le intestazioni come in copione: la sincronizzazione della sceneggiatura può crearle da sola."
            action={canEdit ? <Button testID="empty-add-scene" icon="plus" label="Aggiungi scena" onPress={() => apri(null)} /> : undefined}
          />
        ) : !filtrate.length ? (
          <Empty icon="filter-off-outline" title="Nessuna scena in questo stato" action={<Button label="Mostra tutte" variant="secondary" onPress={() => setStato(null)} />} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {filtrate.map((it, i) => {
              const st = String(it.data.stato ?? "Da girare");
              const luogo = nomeDi(it.data.location);
              const chi = ((it.data.personaggi ?? []) as string[]).map(nomeDi).filter(Boolean);
              return (
                <Pressable
                  key={it.id}
                  testID={`item-card-${it.id}`}
                  onPress={() => apri(it)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
                >
                  <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: st === "Girata" ? "rgba(76,175,80,0.45)" : colors.divider, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                      <View style={{ width: 34, alignItems: "center", paddingTop: 2 }}>
                        <Text style={{ fontFamily: fonts.script, fontSize: 15, color: colors.brandPrimary }}>{it.data.numero || i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <Text style={{ flex: 1, fontFamily: fonts.script, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={2}>
                            {it.title}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: tinta(st) }}>
                            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tinta(st) }} />
                            <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: tinta(st) }}>{st}</Text>
                          </View>
                        </View>

                        <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>
                          {[it.data.intext, it.data.momento, luogo, it.data.pagine ? `${it.data.pagine} pag.` : ""].filter(Boolean).join(" · ") || "Nessun dettaglio"}
                        </Text>

                        {chi.length ? (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, paddingTop: 2 }}>
                            {chi.slice(0, 5).map((n) => (
                              <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: 3, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                                <Icon name="account-outline" size={10} color={colors.muted} />
                                <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.onSurfaceSecondary }}>{n}</Text>
                              </View>
                            ))}
                            {chi.length > 5 ? <Text style={[s.muted, { fontSize: 10.5 }]}>+{chi.length - 5}</Text> : null}
                          </View>
                        ) : null}

                        {it.data.sinossi ? (
                          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceSecondary }} numberOfLines={2}>
                            {it.data.sinossi}
                          </Text>
                        ) : null}
                      </View>
                      <Icon name="chevron-right" size={18} color={colors.muted} />
                    </View>
                  </Glass>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SceneEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Scena eliminata")) })}
      />
    </View>
  );
}
