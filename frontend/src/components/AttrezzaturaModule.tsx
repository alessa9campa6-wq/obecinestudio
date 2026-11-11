import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import AttrezzaturaEditor from "@/src/components/AttrezzaturaEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { eur, lineTotal, ModuleDef, num } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const CATEGORIE = ["Camera", "Ottiche", "Luci", "Grip", "Audio", "Monitor", "Media", "Altro"];

const ICONE: Record<string, IconName> = {
  Camera: "camera-outline",
  Ottiche: "camera-iris",
  Luci: "lightbulb-outline",
  Grip: "crane",
  Audio: "microphone-outline",
  Monitor: "monitor",
  Media: "harddisk",
  Altro: "package-variant-closed",
};

export default function AttrezzaturaModule({ def }: { def: ModuleDef }) {
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
  const [categoria, setCategoria] = useState<string | null>(null);
  const [soloDaPreparare, setSoloDaPreparare] = useState(false);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const costo = items.reduce((n, it) => n + lineTotal(def, it.data), 0);
  const pronti = items.filter((it) => it.data.pronto).length;
  const pezzi = items.reduce((n, it) => n + (num(it.data.quantita) || 1), 0);
  const categorieUsate = CATEGORIE.filter((c) => items.some((it) => (it.data.categoria ?? "Altro") === c));
  const filtrati = items.filter((it) => (categoria ? (it.data.categoria ?? "Altro") === categoria : true) && (soloDaPreparare ? !it.data.pronto : true));

  const cols = width > 1080 ? 2 : 1;

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Articolo aggiornato")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Articolo aggiunto")), onError: (e: Error) => toast(e.message, "error") });
  const prontaToggle = (it: Item) =>
    m.update.mutate({ id: it.id, title: it.title, data: { ...it.data, pronto: !it.data.pronto } }, { onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} voci · ${pezzi} pezzi · ${pronti} pronti · noleggio ${eur(costo)}`}
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
                <Icon name="camera-outline" size={170} color={colors.brandPrimary} />
              </View>
              <View style={{ padding: spacing.xl, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="camera-outline" size={14} color={colors.brandPrimary} />
                  <Text style={s.label}>L’attrezzatura</Text>
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
                  {project.title}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
                  {pillola("camera-outline", `${items.length} voci · ${pezzi} pezzi`)}
                  {pillola("check-decagram-outline", `${pronti} pronti`)}
                  {costo ? pillola("cash-multiple", eur(costo)) : null}
                </View>
                <View style={{ gap: 5, paddingTop: spacing.sm }}>
                  <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: "rgba(0,0,0,0.12)", overflow: "hidden" }}>
                    <LinearGradient colors={[colors.brandSecondary, colors.brandPrimary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 6, width: `${items.length ? Math.max(3, (pronti / items.length) * 100) : 3}%`, borderRadius: radius.pill }} />
                  </View>
                  <Text style={[s.muted, { fontSize: 11.5 }]}>{items.length - pronti} ancora da preparare o noleggiare</Text>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
              <Chip testID="attrezzatura-filter-tutte" label={`Tutte (${items.length})`} selected={!categoria} onPress={() => setCategoria(null)} />
              {categorieUsate.map((c) => (
                <Chip key={c} testID={`attrezzatura-filter-${c}`} label={`${c} (${items.filter((it) => (it.data.categoria ?? "Altro") === c).length})`} selected={categoria === c} onPress={() => setCategoria(categoria === c ? null : c)} />
              ))}
              <Chip testID="attrezzatura-filter-da-preparare" icon="progress-wrench" label={`Da preparare (${items.length - pronti})`} selected={soloDaPreparare} onPress={() => setSoloDaPreparare(!soloDaPreparare)} />
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
          ) : items.length && !filtrati.length ? (
            <Empty icon="filter-off-outline" title="Niente con questi filtri" action={<Button label="Azzera" variant="secondary" onPress={() => (setCategoria(null), setSoloDaPreparare(false))} />} />
          ) : (
            <Empty
              icon={def.icon}
              title="Attrezzatura ancora vuota"
              subtitle="Elenca ciò che serve: categoria, quantità, rental e costo del noleggio finiscono nel budget."
              action={canEdit ? <Button testID="attrezzatura-empty-add" icon="plus" label="Aggiungi articolo" onPress={() => apri(null)} /> : undefined}
            />
          )
        }
        renderItem={({ item }) => {
          const cat = String(item.data.categoria ?? "Altro");
          const tot = lineTotal(def, item.data);
          const qta = num(item.data.quantita) || 1;
          return (
            <Glass style={{ borderRadius: 18, borderWidth: 1, borderColor: item.data.pronto ? "rgba(76,175,80,0.45)" : colors.divider, paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                <Pressable testID={`item-card-${item.id}`} onPress={() => apri(item)} style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
                    <Icon name={ICONE[cat] ?? "package-variant-closed"} size={20} color={colors.brandPrimary} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                      {[cat, qta > 1 ? `${qta} pz` : "", item.data.noleggio].filter(Boolean).join(" · ")}
                    </Text>
                    <Text style={{ fontFamily: fonts.text, fontSize: 11, color: colors.muted }} numberOfLines={1}>
                      {[tot ? eur(tot) : "", item.data.unita, item.data.durata ? `× ${item.data.durata}` : "", item.data.date].filter(Boolean).join(" · ") || "Nessun costo indicato"}
                    </Text>
                  </View>
                </Pressable>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Pressable
                    testID={`attrezzatura-pronto-${item.id}`}
                    onPress={() => prontaToggle(item)}
                    hitSlop={8}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: item.data.pronto ? colors.success : colors.divider, backgroundColor: item.data.pronto ? "rgba(76,175,80,0.14)" : "transparent" }}
                  >
                    <Icon name={item.data.pronto ? "check-circle" : "circle-outline"} size={13} color={item.data.pronto ? colors.success : colors.muted} />
                    <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: item.data.pronto ? colors.success : colors.muted }}>{item.data.pronto ? "Pronto" : "Da preparare"}</Text>
                  </Pressable>
                  {item.data.link ? <Icon name="link-variant" size={14} color={colors.muted} /> : null}
                </View>
              </View>
            </Glass>
          );
        }}
      />

      <AttrezzaturaEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Articolo eliminato")) })}
      />
    </View>
  );
}
