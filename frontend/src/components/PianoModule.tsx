import dayjs from "dayjs";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import PianoEditor from "@/src/components/PianoEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { datiGiornata } from "@/src/piano";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

const elenco = (v: any): string[] => (Array.isArray(v) ? v : v ? [v] : []);

// Il piano si legge come un orario di lavoro affisso in produzione: una
// giornata per scheda, con la data grande a sinistra e la giornata a destra.
export default function PianoModule({ def }: { def: ModuleDef }) {
  const { project, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const lookup = useLookup(project.id);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const due = width >= 1000;
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const items = [...(q.data ?? [])].sort((a, b) => {
    const da = datiGiornata(a).data;
    const db = datiGiornata(b).data;
    if (da && db && da !== db) return da < db ? -1 : 1;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return (Number(a.data.numero) || 0) - (Number(b.data.numero) || 0);
  });

  const prima = items.find((it) => datiGiornata(it).data);
  const ultima = [...items].reverse().find((it) => datiGiornata(it).data);
  const totaleScene = items.reduce((n, it) => n + elenco(it.data.scene).length, 0);
  const locationUsate = new Set(items.map((it) => it.data.location).filter(Boolean)).size;
  const periodo =
    prima && ultima
      ? prima === ultima
        ? datiGiornata(prima).etichetta
        : `${datiGiornata(prima).etichetta} → ${datiGiornata(ultima).etichetta}`
      : "";

  const nuova = () => {
    const numero = String(items.length + 1);
    m.create.mutate(
      { title: `Giornata ${numero}`, data: { numero, data: dayjs().format("YYYY-MM-DD") } },
      { onSuccess: (creata) => (setEditing(creata), setOpen(true)), onError: (e: Error) => toast(e.message, "error") },
    );
  };

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const orari = (it: Item) =>
    [
      { icona: "account-group-outline" as IconName, label: "Troupe", value: it.data.convocazione },
      { icona: "account-star-outline" as IconName, label: "Cast", value: it.data.convocazione_cast },
      { icona: "movie-open-outline" as IconName, label: "Riprese", value: it.data.inizio },
      { icona: "silverware-fork-knife" as IconName, label: "Pranzo", value: it.data.pranzo },
      { icona: "weather-sunset" as IconName, label: "Cena", value: it.data.cena },
      { icona: "flag-checkered" as IconName, label: "Fine", value: it.data.fine },
    ].filter((x) => x.value);

  const scheda = (it: Item) => {
    const g = datiGiornata(it);
    const d = g.data ? dayjs(g.data) : null;
    const location = lookup.get(it.data.location)?.title;
    const scene = elenco(it.data.scene);
    const troupe = elenco(it.data.troupe).length;
    const cast = elenco(it.data.cast).length;
    const giri = orari(it);

    return (
      <Pressable
        key={it.id}
        testID={`piano-giornata-${it.id}`}
        onPress={() => (setEditing(it), setOpen(true))}
        style={({ pressed }) => ({ width: due ? (Math.min(width, 1240) - 300 - spacing.xl * 2 - spacing.md) / 2 : "100%", opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
      >
        <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, overflow: "hidden" }}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: 76, backgroundColor: d ? "rgba(212,175,55,0.16)" : colors.surfaceTertiary, borderRightWidth: 1, borderRightColor: colors.divider, alignItems: "center", justifyContent: "center", paddingVertical: spacing.md, gap: 1 }}>
              {d ? (
                <>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.2, fontWeight: "700", color: colors.brandPrimary }}>{GIORNI[d.day()].toUpperCase()}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.onSurface }}>{d.date()}</Text>
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{MESI[d.month()]}</Text>
                </>
              ) : (
                <>
                  <Icon name="calendar-blank-outline" size={20} color={colors.muted} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 9.5, color: colors.muted }}>data</Text>
                </>
              )}
            </View>

            <View style={{ flex: 1, padding: spacing.md, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.label, { fontSize: 9.5 }]}>{it.data.numero ? `Giornata ${it.data.numero}` : "Giornata"}</Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.onSurface }} numberOfLines={1}>
                    {location || "Location da definire"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                  <Icon name="movie-open-outline" size={10} color={colors.muted} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 10, color: colors.onSurfaceSecondary }}>{scene.length} scene</Text>
                </View>
                {it.data.meteo ? (
                  <View style={{ borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10, color: colors.onSurfaceSecondary }}>{it.data.meteo}</Text>
                  </View>
                ) : null}
              </View>

              {giri.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                  {giri.map((x) => (
                    <View key={x.label} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.surfaceTertiary }}>
                      <Icon name={x.icona} size={10} color={colors.brandPrimary} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 10, color: colors.muted }}>{x.label}</Text>
                      <Text style={{ fontFamily: fonts.script, fontSize: 11.5, color: colors.onSurface }}>{x.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.muted}>Nessun orario ancora.</Text>
              )}

              {scene.length ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                  {scene.slice(0, 3).map((id) => (
                    <View key={id} style={{ borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.35)" }}>
                      <Text style={{ fontFamily: fonts.script, fontSize: 10.5, color: colors.brandPrimary }} numberOfLines={1}>
                        {lookup.get(id)?.title ?? "Scena"}
                      </Text>
                    </View>
                  ))}
                  {scene.length > 3 ? <Text style={[s.muted, { fontSize: 10.5, alignSelf: "center" }]}>+{scene.length - 3}</Text> : null}
                </View>
              ) : null}

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, alignItems: "center" }}>
                {troupe ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Icon name="account-hard-hat-outline" size={12} color={colors.muted} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{troupe} troupe</Text>
                  </View>
                ) : null}
                {cast ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Icon name="account-star-outline" size={12} color={colors.muted} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{cast} cast</Text>
                  </View>
                ) : null}
                {it.data.comparse ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Icon name="account-multiple-outline" size={12} color={colors.muted} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }} numberOfLines={1}>{it.data.comparse}</Text>
                  </View>
                ) : null}
                {it.data.pagine ? (
                  <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{it.data.pagine} pag.</Text>
                ) : null}
                <View style={{ flex: 1 }} />
                <Icon name="chevron-right" size={16} color={colors.muted} />
              </View>

              {it.data.note ? (
                <Text numberOfLines={2} style={{ fontFamily: fonts.text, fontSize: 12, lineHeight: 16, color: colors.onSurfaceSecondary }}>
                  {it.data.note}
                </Text>
              ) : null}
            </View>
          </View>
        </Glass>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} giornate${totaleScene ? ` · ${totaleScene} scene` : ""}${locationUsate ? ` · ${locationUsate} location` : ""}${periodo ? ` · ${periodo}` : ""}`}
        right={
          <>
            <Button testID="piano-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID="piano-add-button" icon="plus" label={width > 500 ? "Giornata" : undefined} onPress={nuova} loading={m.create.isPending} /> : null}
          </>
        }
      />

      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : items.length ? (
        <ScrollView
          testID="piano-giornate"
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        >
          <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
            <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
            <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
              <Icon name="calendar-month-outline" size={170} color={colors.brandPrimary} />
            </View>
            <View style={{ padding: spacing.xl, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Icon name="calendar-month-outline" size={14} color={colors.brandPrimary} />
                <Text style={s.label}>Il piano di lavorazione</Text>
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                {project.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                {pillola("calendar-check-outline", `${items.length} ${items.length === 1 ? "giornata" : "giornate"}`)}
                {pillola("movie-open-outline", `${totaleScene} scene`)}
                {pillola("map-marker-outline", `${locationUsate} location`)}
              </View>
              {periodo ? <Text style={[s.muted, { paddingTop: spacing.xs }]}>{periodo}</Text> : null}
            </View>
          </View>

          <View style={{ flexDirection: due ? "row" : "column", flexWrap: "wrap", gap: spacing.md }}>{items.map(scheda)}</View>
        </ScrollView>
      ) : (
        <Empty
          icon="calendar-month-outline"
          title="Nessuna giornata di lavorazione"
          subtitle="Aggiungi la prima giornata: data, orari, location, scene e persone convocate."
          action={canEdit ? <Button testID="piano-empty-add" icon="plus" label="Nuova giornata" onPress={nuova} /> : undefined}
        />
      )}

      <PianoEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={(title, data) => {
          const opts = { onSuccess: () => (setOpen(false), toast("Giornata salvata")), onError: (e: Error) => toast(e.message, "error") };
          if (editing) m.update.mutate({ id: editing.id, title, data }, opts);
          else m.create.mutate({ title, data }, opts);
        }}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Giornata eliminata")) })}
      />
    </View>
  );
}
