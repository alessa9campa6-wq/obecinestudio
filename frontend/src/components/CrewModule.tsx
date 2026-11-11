import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import CrewEditor from "@/src/components/CrewEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { eur, ModuleDef, num, unitTotal } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

export const REPARTI = ["Regia", "Produzione", "Fotografia", "Elettricisti", "Macchinisti", "Suono", "Scenografia", "Costumi", "Trucco", "Post"];

// Costo di una persona: ruolo principale + tutti i ruoli aggiuntivi, con la
// formula unica dell'app.
export const costoPersona = (data: Record<string, any>) => {
  const base = unitTotal(num(data.tariffa), data.unita, 1, num(data.durata) || 1);
  const extra = ((data.ruoli ?? []) as any[]).reduce((n, r) => n + unitTotal(num(r?.tariffa), r?.unita, 1, num(r?.durata) || 1), 0);
  return base + extra;
};

export default function CrewModule({ def }: { def: ModuleDef }) {
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
  const [reparto, setReparto] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const costo = items.reduce((n, it) => n + costoPersona(it.data), 0);
  const filtrati = reparto ? items.filter((it) => it.data.reparto === reparto) : items;
  const repartiUsati = REPARTI.filter((r) => items.some((it) => it.data.reparto === r));

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Persona aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Persona aggiunta")), onError: (e: Error) => toast(e.message, "error") });

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const cols = width > 1080 ? 2 : 1;
  const cellW = Math.min(width, 1080) - 48 - (cols > 1 ? spacing.lg : 0);
  const cardW = cols > 1 ? cellW / 2 : cellW;

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} ${items.length === 1 ? "persona" : "persone"} · ${repartiUsati.length} reparti · costo ${eur(costo)}`}
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
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
              <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
                <Icon name="account-group-outline" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="account-group-outline" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>La troupe</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                  {pillola("account-multiple-outline", `${items.length} ${items.length === 1 ? "persona" : "persone"}`)}
                  {pillola("layers-outline", `${repartiUsati.length} reparti`)}
                  {costo ? pillola("cash-multiple", eur(costo)) : null}
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Chip testID="crew-filter-tutti" label={`Tutti (${items.length})`} selected={!reparto} onPress={() => setReparto(null)} />
              {repartiUsati.map((r) => (
                <Chip key={r} testID={`crew-filter-${r}`} label={`${r} (${items.filter((it) => it.data.reparto === r).length})`} selected={reparto === r} onPress={() => setReparto(reparto === r ? null : r)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrati.length ? (
            <Empty icon="filter-off-outline" title="Nessuno in questo reparto" action={<Button label="Mostra tutti" variant="secondary" onPress={() => setReparto(null)} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Troupe ancora vuota"
              subtitle="Aggiungi le persone con ruolo, reparto e tariffa: il costo entra da solo nel budget."
              action={canEdit ? <Button testID="crew-empty-add" icon="plus" label="Aggiungi persona" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const ruoli = ((item.data.ruoli ?? []) as any[]).filter((r) => r && (r.ruolo || r.tariffa));
          const tot = costoPersona(item.data);
          return (
            <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1 })}>
              <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 17, color: colors.brandPrimary }}>
                      {item.title.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {tot ? <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: colors.brandPrimary }}>{eur(tot)}</Text> : null}
                    </View>
                    <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                      {[item.data.ruolo, item.data.reparto].filter(Boolean).join(" · ") || "Ruolo da compilare"}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                      {item.data.reparto ? (
                        <View style={{ borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
                          <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: colors.onSurfaceSecondary }}>{item.data.reparto}</Text>
                        </View>
                      ) : null}
                      {item.data.telefono ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <Icon name="phone-outline" size={10} color={colors.muted} />
                          <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>{item.data.telefono}</Text>
                        </View>
                      ) : null}
                      {ruoli.length ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <Icon name="account-multiple-plus-outline" size={10} color={colors.muted} />
                          <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: colors.muted }}>+{ruoli.length} ruoli</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.muted} />
                </View>
              </Glass>
            </Pressable>
          );
        }}
      />

      <CrewEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Persona eliminata")) })}
      />
    </View>
  );
}
