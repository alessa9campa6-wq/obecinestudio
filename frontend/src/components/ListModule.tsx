import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import ItemEditor, { Swatches } from "@/src/components/ItemEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub, useVisibility } from "@/src/hub";
import { displayValue, eur, lineTotal, ModuleDef, num } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Empty, Icon, toast, useStyles } from "@/src/ui";

function SumBar({ def, items }: { def: ModuleDef; items: Item[] }) {
  const s = useStyles();
  const { colors } = useTheme();
  const total = items.reduce((a, i) => a + lineTotal(def, i.data), 0);
  const groups: Record<string, number> = {};
  if (def.sum!.groupBy) items.forEach((i) => (groups[i.data[def.sum!.groupBy!] || "Altro"] = (groups[i.data[def.sum!.groupBy!] || "Altro"] ?? 0) + lineTotal(def, i.data)));
  return (
    <View style={{ backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md }}>
      <Text style={s.label}>Totale</Text>
      <Text testID="budget-total" style={[s.h1, { color: colors.brandPrimary }]}>
        {eur(total)}
      </Text>
      {Object.entries(groups).map(([k, v]) => (
        <View key={k} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={s.body}>{k}</Text>
            <Text style={s.body}>{eur(v)}</Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.surfaceTertiary, borderRadius: 2 }}>
            <View style={{ height: 4, width: `${total ? (v / total) * 100 : 0}%`, backgroundColor: colors.brandPrimary, borderRadius: 2 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function ListModule({ def }: { def: ModuleDef }) {
  const { project, focus, clearFocus } = useHub();
  const q = useItems(project.id, def.key);
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const items = q.data ?? [];
  const imgField = def.fields?.find((f) => f.type === "image" || f.type === "media")?.key;
  const colorField = def.fields?.find((f) => f.type === "colors")?.key;
  const paneW = width >= 768 ? width - 300 : width;
  const cols = def.grid ? (paneW > 900 ? 4 : paneW > 600 ? 3 : 2) : 1;
  const cellW = (paneW - spacing.xl * 2 - spacing.md * (cols - 1)) / cols;

  useEffect(() => {
    if (focus?.module !== def.key || !q.data) return;
    const it = q.data.find((x) => x.id === focus.id);
    if (it) {
      setEditing(it);
      setOpen(true);
    }
    clearFocus();
  }, [focus, q.data, def.key, clearFocus]);
  const fieldOf = (k: string) => def.fields?.find((f) => f.key === k);
  const vis = useVisibility();
  const groupKey = def.groupBy?.find((k) => {
    const f = fieldOf(k);
    return f && vis.field(f);
  });
  const groups = (() => {
    if (!groupKey) return null;
    const map = new Map<string, Item[]>();
    items.forEach((it) => {
      const v = it.data[groupKey];
      const label = (fieldOf(groupKey)?.type === "ref" ? lookup.get(v)?.title : v) || "Senza collegamento";
      map.set(label, [...(map.get(label) ?? []), it]);
    });
    return [...map.entries()].sort((a, b) => (a[0] === "Senza collegamento" ? 1 : b[0] === "Senza collegamento" ? -1 : a[0].localeCompare(b[0])));
  })();

  const move = (item: Item, dir: number) => {
    const b = items[items.indexOf(item) + dir];
    if (!b) return;
    m.update.mutate({ id: item.id, order: b.order === item.order ? b.order + dir : b.order });
    m.update.mutate({ id: b.id, order: item.order });
  };

  const save = (title: string, data: Record<string, any>) => {
    const opts = { onSuccess: () => (setOpen(false), toast("Salvato")), onError: (e: Error) => toast(e.message, "error") };
    if (editing) m.update.mutate({ id: editing.id, title, data }, opts);
    else m.create.mutate({ title, data }, opts);
  };

  const renderCard = ({ item }: { item: Item }) => {
    const sub = (def.subtitle ?? []).map((k) => displayValue(fieldOf(k), item.data[k], lookup)).filter(Boolean).join(" · ");
    const unitInfo = def.sum && def.sum.unit && item.data[def.sum.unit] && !["Forfait", "Per progetto"].includes(item.data[def.sum.unit])
      ? `${eur(num(item.data[def.sum.field]))} ${String(item.data[def.sum.unit]).toLowerCase()} × ${num(item.data[def.sum.qty!]) || 1}`
      : def.sum && item.data[def.sum.unit!] ? String(item.data[def.sum.unit!]) : "";
    const badge = def.badge ? item.data[def.badge] : null;
    const img = imgField ? item.data[imgField] : null;
    const openIt = () => (setEditing(item), setOpen(true));
    if (def.grid)
      return (
        <Pressable testID={`item-card-${item.id}`} onPress={openIt} style={({ pressed }) => ({ width: cellW, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}>
          {img ? <RemoteImage path={img} style={{ width: "100%", height: cellW * 0.75 }} /> : <View style={{ height: cellW * 0.75, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}><Icon name="image-outline" size={32} color={colors.muted} /></View>}
          <View style={{ padding: spacing.sm, gap: 2 }}>
            <Text style={[s.h3, { fontSize: 14 }]} numberOfLines={1}>{item.title}</Text>
            {badge ? <Text style={s.muted} numberOfLines={1}>{badge}</Text> : null}
          </View>
        </Pressable>
      );
    return (
      <Pressable testID={`item-card-${item.id}`} onPress={openIt} style={({ pressed }) => ({ flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.85 : 1 })}>
        {def.check ? (
          <Pressable testID={`item-check-${item.id}`} hitSlop={10} onPress={() => m.update.mutate({ id: item.id, data: { ...item.data, [def.check!]: !item.data[def.check!] } })} style={{ paddingTop: 2 }}>
            <Icon name={item.data[def.check] ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={24} color={item.data[def.check] ? colors.success : colors.muted} />
          </Pressable>
        ) : null}
        {img ? <RemoteImage path={img} style={{ width: 64, height: 64, borderRadius: radius.sm }} /> : null}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={[s.h3, { flex: 1 }, def.check && item.data[def.check] ? { textDecorationLine: "line-through", color: colors.muted } : null]} numberOfLines={1}>
              {item.title}
            </Text>
            {badge ? (
              <View style={{ backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.onBrandTertiary, fontWeight: "600" }}>{badge}</Text>
              </View>
            ) : null}
            {def.sum ? <Text testID={`item-total-${item.id}`} style={[s.h3, { color: colors.brandPrimary }]}>{eur(lineTotal(def, item.data))}</Text> : null}
          </View>
          {unitInfo ? <Text style={s.muted}>{unitInfo}</Text> : null}
          {sub ? <Text style={s.muted} numberOfLines={1}>{sub}</Text> : null}
          {def.longText && item.data[def.longText] ? <Text style={s.body} numberOfLines={3}>{item.data[def.longText]}</Text> : null}
          {colorField ? <Swatches value={item.data[colorField]} /> : null}
        </View>
        <View style={{ justifyContent: "center", gap: spacing.xs }}>
          <Pressable testID={`item-up-${item.id}`} hitSlop={6} disabled={items.indexOf(item) === 0} onPress={() => move(item, -1)} style={{ opacity: items.indexOf(item) === 0 ? 0.25 : 1 }}>
            <Icon name="chevron-up" size={22} color={colors.muted} />
          </Pressable>
          <Pressable testID={`item-down-${item.id}`} hitSlop={6} disabled={items.indexOf(item) === items.length - 1} onPress={() => move(item, 1)} style={{ opacity: items.indexOf(item) === items.length - 1 ? 0.25 : 1 }}>
            <Icon name="chevron-down" size={22} color={colors.muted} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${items.length} elementi${def.description ? " · " + def.description : ""}`}
        right={
          <>
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" onPress={() => exportModule(project, def, items, lookup)} disabled={!items.length} />
            <Button testID={`add-${def.key}-button`} icon="plus" label={width > 500 ? "Aggiungi" : undefined} onPress={() => (setEditing(null), setOpen(true))} />
          </>
        }
      />
      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : groups && groups.length ? (
        <ScrollView testID={`${def.key}-grouped`} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />} contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          {groups.map(([label, list]) => (
            <View key={label} style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: spacing.xs }}>
                <Icon name={groupKey === "scena" ? "movie-open-outline" : groupKey === "contenuto" ? "cellphone-play" : "television-play"} size={18} color={colors.brandPrimary} />
                <Text testID={`group-header-${label}`} style={[s.h3, { flex: 1 }]} numberOfLines={1}>{label}</Text>
                <Text style={s.muted}>{list.length}</Text>
              </View>
              <View style={{ flexDirection: cols > 1 ? "row" : "column", flexWrap: "wrap", gap: spacing.md }}>
                {list.map((item) => (
                  <View key={item.id}>{renderCard({ item })}</View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key={`${def.key}-${cols}`}
          testID={`${def.key}-list`}
          data={items}
          numColumns={cols}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={def.sum && items.length ? <SumBar def={def} items={items} /> : undefined}
          ListEmptyComponent={<Empty icon={def.icon} title={`Nessun elemento in ${def.label}`} subtitle="Aggiungi il primo elemento per iniziare." action={<Button testID={`empty-add-${def.key}`} icon="plus" label="Aggiungi" onPress={() => (setEditing(null), setOpen(true))} />} />}
        />
      )}
      <ItemEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={save}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Eliminato")) })}
      />
    </View>
  );
}
