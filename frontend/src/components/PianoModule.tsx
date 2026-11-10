import dayjs from "dayjs";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import ItemEditor from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { displayValue, ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { datiGiornata } from "@/src/piano";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Icon, toast, useStyles } from "@/src/ui";

// Il piano di lavorazione si legge una giornata per volta: data grande, orari
// in colonna, poi location, scene, persone e note. Su schermo largo due colonne.
export default function PianoModule({ def }: { def: ModuleDef }) {
  const { project, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const lookup = useLookup(project.id);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const due = width >= 900;
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

  const apri = (it: Item) => (setEditing(it), setOpen(true));
  const nuova = () => {
    const numero = String(items.length + 1);
    m.create.mutate(
      { title: `Giornata ${numero}`, data: { numero, data: dayjs().format("YYYY-MM-DD") } },
      { onSuccess: (creata) => (setEditing(creata), setOpen(true)), onError: (e: Error) => toast(e.message, "error") },
    );
  };
  const salva = (title: string, data: Record<string, any>) => {
    const opts = { onSuccess: () => (setOpen(false), toast("Salvato")), onError: (e: Error) => toast(e.message, "error") };
    if (editing) m.update.mutate({ id: editing.id, title, data }, opts);
    else m.create.mutate({ title, data }, opts);
  };

  const campo = (k: string) => def.fields?.find((f) => f.key === k);
  const valore = (it: Item, k: string) => displayValue(campo(k), it.data[k], lookup);

  const orari = (it: Item) =>
    [
      { icona: "account-group-outline" as const, label: "Convocazione troupe", value: it.data.convocazione },
      { icona: "account-star-outline" as const, label: "Convocazione cast", value: it.data.convocazione_cast },
      { icona: "movie-open-outline" as const, label: "Inizio riprese", value: it.data.inizio },
      { icona: "silverware-fork-knife" as const, label: "Pausa pranzo", value: it.data.pranzo },
      { icona: "weather-sunset" as const, label: "Pausa cena", value: it.data.cena },
      { icona: "flag-checkered" as const, label: "Fine giornata", value: it.data.fine },
    ].filter((x) => x.value);

  const scheda = (it: Item) => {
    const g = datiGiornata(it);
    const location = valore(it, "location");
    const scene = (Array.isArray(it.data.scene) ? it.data.scene : it.data.scene ? [it.data.scene] : []) as string[];
    const troupe = (Array.isArray(it.data.troupe) ? it.data.troupe : []) as string[];
    const cast = (Array.isArray(it.data.cast) ? it.data.cast : []) as string[];
    const giri = orari(it);

    return (
      <Pressable
        key={it.id}
        testID={`piano-giornata-${it.id}`}
        onPress={() => apri(it)}
        style={({ pressed }) => ({
          width: due ? (width - 300 - spacing.xl * 3) / 2 : "100%",
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[s.muted, { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }]}>
              {it.data.numero ? `Giornata ${it.data.numero}` : "Giornata"}
            </Text>
            <Text style={s.h2} numberOfLines={1}>{g.data ? g.etichetta : "Data da definire"}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="map-marker-outline" size={14} color={colors.muted} />
              <Text style={[s.muted, { flex: 1 }]} numberOfLines={1}>{location || "Location da definire"}</Text>
            </View>
          </View>
          {it.data.meteo ? (
            <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
              <Text style={[s.muted, { fontSize: 12 }]}>{it.data.meteo}</Text>
            </View>
          ) : null}
        </View>

        {giri.length ? (
          <View style={{ gap: 4 }}>
            {giri.map((x) => (
              <View key={x.label} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Icon name={x.icona} size={15} color={colors.brandPrimary} />
                <Text style={[s.body, { flex: 1, fontSize: 14 }]} numberOfLines={1}>{x.label}</Text>
                <Text style={[s.h3, { fontSize: 15, fontVariant: ["tabular-nums"] }]}>{x.value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.muted}>{"Nessun orario indicato. Tocca per aggiungerli con l'orologio a scorrimento."}</Text>
        )}

        {it.data.ambienti || it.data.pagine || it.data.alba || it.data.tramonto ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {it.data.ambienti ? <Etichetta icona="home-outline" testo={it.data.ambienti} /> : null}
            {it.data.pagine ? <Etichetta icona="file-document-outline" testo={`${it.data.pagine} pagine`} /> : null}
            {it.data.alba ? <Etichetta icona="weather-sunset-up" testo={`Alba ${it.data.alba}`} /> : null}
            {it.data.tramonto ? <Etichetta icona="weather-sunset-down" testo={`Tramonto ${it.data.tramonto}`} /> : null}
          </View>
        ) : null}

        {scene.length ? (
          <View style={{ gap: 4 }}>
            <Text style={s.label}>Scene</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {scene.map((id) => (
                <View key={id} style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.brandTertiary }}>
                  <Text style={{ ...s.muted, color: colors.onBrandTertiary, fontSize: 12 }}>{lookup.get(id)?.title ?? "Scena"}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {troupe.length || cast.length ? (
          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            {troupe.length ? <Riga icona="account-hard-hat-outline" testo={`${troupe.length} troupe`} /> : null}
            {cast.length ? <Riga icona="account-star-outline" testo={`${cast.length} cast`} /> : null}
            {it.data.comparse ? <Riga icona="account-multiple-outline" testo={it.data.comparse} /> : null}
          </View>
        ) : null}

        {it.data.note ? <Text style={s.body} numberOfLines={3}>{it.data.note}</Text> : null}
      </Pressable>
    );
  };

  const Etichetta = ({ icona, testo }: { icona: any; testo: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
      <Icon name={icona} size={12} color={colors.muted} />
      <Text style={[s.muted, { fontSize: 12 }]}>{testo}</Text>
    </View>
  );
  const Riga = ({ icona, testo }: { icona: any; testo: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon name={icona} size={14} color={colors.muted} />
      <Text style={s.muted}>{testo}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} giornate${items.length ? " · in ordine di data" : ""}`}
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
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
        >
          <View style={{ flexDirection: due ? "row" : "column", flexWrap: "wrap", gap: spacing.md }}>{items.map(scheda)}</View>
        </ScrollView>
      ) : (
        <Empty
          icon="calendar-month-outline"
          title="Nessuna giornata di lavorazione"
          subtitle="Aggiungi la prima giornata: data, orari, location, scene e persone."
          action={canEdit ? <Button testID="piano-empty-add" icon="plus" label="Nuova giornata" onPress={nuova} /> : undefined}
        />
      )}
      <ItemEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Eliminato")) })}
      />
    </View>
  );
}
