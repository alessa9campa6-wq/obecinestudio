import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import ShotlistEditor from "@/src/components/ShotlistEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const TIPI = ["ECU", "CU", "MCU", "MS", "MLS", "WS", "EWS", "OTS", "POV", "Insert"];

export default function ShotlistModule({ def }: { def: ModuleDef }) {
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
  const [stato, setStato] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const girate = items.filter((it) => it.data.girata).length;
  const filtrate = items.filter((it) => (stato === "girata" ? !!it.data.girata : stato === "resta" ? !it.data.girata : true)).filter((it) => (tipo ? it.data.tipo === tipo : true));
  const ottiche = new Set(items.map((it) => String(it.data.ottica ?? "").trim()).filter(Boolean)).size;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Inquadratura aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Inquadratura aggiunta")), onError: (e: Error) => toast(e.message, "error") });
  const toggle = (it: Item) =>
    m.update.mutate({ id: it.id, title: it.title, data: { ...it.data, girata: !it.data.girata } }, { onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} inquadrature · ${girate} girate · ${(scene.data ?? []).length} scene · ${ottiche} ottiche`}
        right={
          <>
            <Button testID="shotlist-goto-scene" icon="movie-open-outline" label={width > 900 ? "Scene" : undefined} variant="secondary" onPress={() => go("scene")} />
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 700 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
          <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", right: -10, bottom: -30, opacity: 0.09 }} pointerEvents="none">
            <Icon name="format-list-numbered" size={170} color={colors.brandPrimary} />
          </View>
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Icon name="format-list-numbered" size={14} color={colors.brandPrimary} />
              <Text style={s.label}>La shotlist</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
              {project.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
              {pillola("format-list-numbered", `${items.length} inquadrature`)}
              {pillola("check-circle-outline", `${girate} girate`)}
              {ottiche ? pillola("camera-iris", `${ottiche} ottiche`) : null}
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
              <Text style={[s.muted, { fontSize: 11.5 }]}>{items.length - girate} ancora da girare</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            <Chip testID="shotlist-filter-tutte" label={`Tutte (${items.length})`} selected={!stato} onPress={() => setStato(null)} />
            <Chip testID="shotlist-filter-resta" label={`Da girare (${items.length - girate})`} selected={stato === "resta"} onPress={() => setStato(stato === "resta" ? null : "resta")} />
            <Chip testID="shotlist-filter-girata" label={`Girate (${girate})`} selected={stato === "girata"} onPress={() => setStato(stato === "girata" ? null : "girata")} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }}>
            {TIPI.map((t) =>
              items.some((it) => it.data.tipo === t) ? (
                <Chip key={t} testID={`shotlist-tipo-${t}`} label={t} selected={tipo === t} onPress={() => setTipo(tipo === t ? null : t)} />
              ) : null,
            )}
          </ScrollView>
        </View>

        {q.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : !items.length ? (
          <Empty
            icon={def.icon}
            title="Nessuna inquadratura"
            subtitle="Elenca i campi che vuoi girare: tipo, angolo, movimento e ottica restano separati."
            action={canEdit ? <Button testID="empty-add-shotlist" icon="plus" label="Aggiungi inquadratura" onPress={() => apri(null)} /> : undefined}
          />
        ) : !filtrate.length ? (
          <Empty icon="filter-off-outline" title="Nessuna inquadratura con questi filtri" action={<Button label="Azzera" variant="secondary" onPress={() => (setStato(null), setTipo(null))} />} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {filtrate.map((it, i) => {
              const scena = lookup.get(it.data.scena)?.title;
              const riga = [it.data.angolo, it.data.movimento, it.data.ottica].filter(Boolean).join(" · ");
              return (
                <Glass key={it.id} style={{ borderRadius: 18, borderWidth: 1, borderColor: it.data.girata ? "rgba(76,175,80,0.45)" : colors.divider, paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                    <Pressable testID={`item-card-${it.id}`} onPress={() => apri(it)} style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                      <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
                        <Text style={{ fontFamily: fonts.script, fontSize: 13, fontWeight: "700", color: colors.brandPrimary }}>{String(it.data.tipo ?? "—")}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={{ fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
                          {it.title}
                        </Text>
                        <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>
                          {[`Shot ${i + 1}`, scena, riga].filter(Boolean).join(" · ")}
                        </Text>
                        {it.data.descrizione ? (
                          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceSecondary }} numberOfLines={2}>
                            {it.data.descrizione}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                    <Pressable
                      testID={`shotlist-toggle-${it.id}`}
                      onPress={() => toggle(it)}
                      hitSlop={8}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: it.data.girata ? colors.success : colors.divider, backgroundColor: it.data.girata ? "rgba(76,175,80,0.14)" : "transparent" }}
                    >
                      <Icon name={it.data.girata ? "check-circle" : "circle-outline"} size={13} color={it.data.girata ? colors.success : colors.muted} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: it.data.girata ? colors.success : colors.muted }}>{it.data.girata ? "Girata" : "Da girare"}</Text>
                    </Pressable>
                  </View>
                </Glass>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ShotlistEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Inquadratura eliminata")) })}
      />
    </View>
  );
}
