import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import CastEditor from "@/src/components/CastEditor";
import { RemoteImage } from "@/src/components/Images";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { eur, ModuleDef, num, unitTotal } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const STATI = ["Provino", "Opzionato", "Confermato"];

export default function CastModule({ def }: { def: ModuleDef }) {
  const { project, go, canEdit } = useHub();
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
  const costo = items.reduce((n, it) => n + unitTotal(num(it.data.tariffa), it.data.unita, 1, num(it.data.durata) || 1), 0);
  const confermati = items.filter((it) => it.data.stato === "Confermato").length;
  const filtrati = stato ? items.filter((it) => (it.data.stato ?? "Provino") === stato) : items;

  const cols = width > 1080 ? 2 : 1;
  const cellW = Math.min(width, 1080) - 48 - (cols > 1 ? spacing.lg : 0);
  const cardW = cols > 1 ? cellW / 2 : cellW;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Attore aggiornato")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Attore aggiunto")), onError: (e: Error) => toast(e.message, "error") });

  const pillola = (icon: IconName, testo: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      <Icon name={icon} size={13} color={colors.brandPrimary} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{testo}</Text>
    </View>
  );

  const tinta = (st: string) => (st === "Confermato" ? colors.success : st === "Opzionato" ? colors.brandPrimary : colors.muted);

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} ${items.length === 1 ? "attore" : "attori"} · ${confermati} confermati · ${items.length - confermati} da definire`}
        right={
          <>
            <Button testID="cast-goto-personaggi" icon="drama-masks" label={width > 900 ? "Personaggi" : undefined} variant="secondary" onPress={() => go("personaggi")} />
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
              <View style={{ position: "absolute", right: -14, bottom: -24, opacity: 0.09 }} pointerEvents="none">
                <Icon name="account-star-outline" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="account-star-outline" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>Il cast</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                  {pillola("account-group-outline", `${items.length} ${items.length === 1 ? "attore" : "attori"}`)}
                  {pillola("check-decagram-outline", `${confermati} confermati`)}
                  {costo ? pillola("cash-multiple", eur(costo)) : null}
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Chip testID="cast-filter-tutti" label={`Tutti (${items.length})`} selected={!stato} onPress={() => setStato(null)} />
              {STATI.map((st) => (
                <Chip key={st} testID={`cast-filter-${st}`} label={`${st} (${items.filter((it) => (it.data.stato ?? "Provino") === st).length})`} selected={stato === st} onPress={() => setStato(stato === st ? null : st)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrati.length ? (
            <Empty icon="filter-off-outline" title="Nessun attore in questo stato" action={<Button label="Mostra tutti" variant="secondary" onPress={() => setStato(null)} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Cast ancora vuoto"
              subtitle="Aggiungi attori e attrici, collegali ai personaggi e tieni tariffe e provini nello stesso posto."
              action={canEdit ? <Button testID="cast-empty-add" icon="plus" label="Aggiungi attore" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const foto = String(item.data.foto ?? "");
          const st = String(item.data.stato ?? "Provino");
          const personaggio = lookup.get(item.data.personaggio)?.title;
          return (
            <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1 })}>
              <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 62, height: 62, borderRadius: 31, overflow: "hidden", backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.divider }}>
                    {foto ? (
                      <RemoteImage path={foto} style={{ width: 62, height: 62 }} />
                    ) : (
                      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.brandPrimary }}>
                        {item.title
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join("") || "?"}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: tinta(st) }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tinta(st) }} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: tinta(st) }}>{st}</Text>
                      </View>
                    </View>
                    <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                      {[personaggio ? `per ${personaggio}` : "", item.data.agenzia, item.data.telefono].filter(Boolean).join(" · ") || "Dati da compilare"}
                    </Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.muted }} numberOfLines={1}>
                      {[item.data.tariffa ? eur(num(item.data.tariffa)) : "", item.data.unita, item.data.durata ? `× ${item.data.durata}` : "", item.data.date].filter(Boolean).join(" · ")}
                    </Text>
                  </View>

                  <Icon name="chevron-right" size={18} color={colors.muted} />
                </View>
              </Glass>
            </Pressable>
          );
        }}
      />

      <CastEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Attore eliminato")) })}
      />
    </View>
  );
}
