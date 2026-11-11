import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import BudgetEditor from "@/src/components/BudgetEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { BUDGET_CATEGORIE, eur, lineTotal, ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const STATI = ["Preventivo", "Confermato", "Pagato"];

export default function BudgetModule({ def }: { def: ModuleDef }) {
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
  const [categoria, setCategoria] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const totale = items.reduce((n, it) => n + lineTotal(def, it.data), 0);
  const perStato = (st: string) => items.filter((it) => (it.data.stato ?? "Preventivo") === st).reduce((n, it) => n + lineTotal(def, it.data), 0);
  const filtrate = items.filter((it) => (stato ? (it.data.stato ?? "Preventivo") === stato : true) && (categoria ? it.data.categoria === categoria : true));

  const gruppi = BUDGET_CATEGORIE.map((c) => ({ c, n: items.filter((it) => it.data.categoria === c).length, tot: items.filter((it) => it.data.categoria === c).reduce((n, it) => n + lineTotal(def, it.data), 0) })).filter((g) => g.n);
  const max = Math.max(1, ...gruppi.map((g) => g.tot));

  const cols = width > 1080 ? 2 : 1;
  const cellW = Math.min(width, 1080) - 48 - (cols > 1 ? spacing.lg : 0);
  const cardW = cols > 1 ? cellW / 2 : cellW;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Voce aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Voce aggiunta")), onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} voci · totale ${eur(totale)}`}
        right={
          <>
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
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
              <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
              <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
                <Icon name="cash-multiple" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="cash-multiple" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>Il budget</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.onSurface }}>{eur(totale)}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                  {pillola("format-list-bulleted", `${items.length} voci`)}
                  {pillola("file-document-outline", `preventivi ${eur(perStato("Preventivo"))}`)}
                  {pillola("check-decagram-outline", `confermati ${eur(perStato("Confermato"))}`)}
                  {pillola("cash-check", `pagati ${eur(perStato("Pagato"))}`)}
                </View>
              </View>
            </View>

            {gruppi.length ? (
              <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm }}>
                <Text style={s.label}>Ripartizione per categoria</Text>
                {gruppi.map((g) => (
                  <Pressable key={g.c} onPress={() => setCategoria(categoria === g.c ? null : g.c)} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: categoria === g.c ? "700" : "500", color: colors.onSurface, flex: 1 }} numberOfLines={1}>
                        {g.c}
                      </Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.muted }}>{g.n}</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: colors.brandPrimary }}>{eur(g.tot)}</Text>
                    </View>
                    <View style={{ height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}>
                      <View style={{ width: `${Math.max(2, (g.tot / max) * 100)}%`, height: 5, borderRadius: radius.pill, backgroundColor: categoria === g.c ? colors.brandPrimary : "rgba(212,175,55,0.55)" }} />
                    </View>
                  </Pressable>
                ))}
              </Glass>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Chip testID="budget-filter-tutte" label={`Tutte (${items.length})`} selected={!stato} onPress={() => setStato(null)} />
              {STATI.map((st) => (
                <Chip key={st} testID={`budget-filter-${st}`} label={`${st} (${items.filter((it) => (it.data.stato ?? "Preventivo") === st).length})`} selected={stato === st} onPress={() => setStato(stato === st ? null : st)} />
              ))}
              {categoria ? <Chip testID="budget-filter-categoria" icon="close" label={categoria} selected onPress={() => setCategoria(null)} /> : null}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrate.length ? (
            <Empty icon="filter-off-outline" title="Nessuna voce con questo filtro" action={<Button label="Azzera" variant="secondary" onPress={() => (setStato(null), setCategoria(null))} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Budget vuoto"
              subtitle="Aggiungi le voci una alla volta: costo, unità, quantità e durata fanno il totale da sole."
              action={canEdit ? <Button testID="budget-empty-add" icon="plus" label="Aggiungi voce" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const st = String(item.data.stato ?? "Preventivo");
          const tot = lineTotal(def, item.data);
          const tinta = st === "Pagato" ? colors.success : st === "Confermato" ? colors.brandPrimary : colors.muted;
          return (
            <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1 })}>
              <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.xs }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                      {[item.data.categoria, item.data.fornitore, item.data.quantita ? `${item.data.quantita} pz` : ""].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 15, fontWeight: "700", color: colors.brandPrimary }}>{eur(tot)}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: tinta }}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tinta }} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: tinta }}>{st}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[s.muted, { fontSize: 11 }]} numberOfLines={1}>
                  {[item.data.importo ? eur(Number(String(item.data.importo).replace(",", ".")) || 0) : "", item.data.unita, item.data.durata ? `× ${item.data.durata}` : "", item.data.date].filter(Boolean).join(" · ")}
                </Text>
                {item.data.note ? (
                  <Text style={{ fontFamily: fonts.text, fontSize: 12, lineHeight: 16, color: colors.onSurfaceSecondary }} numberOfLines={2}>
                    {item.data.note}
                  </Text>
                ) : null}
              </Glass>
            </Pressable>
          );
        }}
      />

      <BudgetEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Voce eliminata")) })}
      />
    </View>
  );
}
