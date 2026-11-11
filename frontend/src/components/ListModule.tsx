import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import { SectionHero } from "@/src/components/SectionHero";
import ItemEditor, { Swatches } from "@/src/components/ItemEditor";
import { MoodBoard } from "@/src/components/MoodBoard";
import { LibItem, useItemMutations, useItems, useLibrary, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub, useVisibility } from "@/src/hub";
import { displayValue, eur, lineTotal, ModuleDef, num, VECCHIO_PREFISSO } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

function SumBar({ def, items, compatto }: { def: ModuleDef; items: Item[]; compatto?: boolean }) {
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
      {(compatto ? [] : Object.entries(groups)).map(([k, v]) => (
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
  const { project, focus, clearFocus, canEdit } = useHub();
  const q = useItems(project.id, def.key);
  const gear = useItemMutations(project.id, "attrezzatura");
  const gearQ = useItems(project.id, "attrezzatura");
  const lookup = useLookup(project.id);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const items = q.data ?? [];
  const [filtro, setFiltro] = useState<string | null>(null);
  const badgeVals = def.badge ? [...new Set(items.map((i) => String(i.data[def.badge!] ?? "")).filter(Boolean))] : [];
  const visibili = filtro ? items.filter((i) => String(i.data[def.badge!] ?? "") === filtro) : items;

  // La troupe si ricorda le persone: quello che scrivi qui finisce nella rubrica
  // personale (Strumenti → Persone) e da lì lo riusi negli altri progetti.
  const people = useLibrary("crew");
  const [peopleOpen, setPeopleOpen] = useState(false);

  // Le voci di budget salvate prima portavano il titolo "Troupe: Alessandro".
  // Una volta sola, e solo se si può scrivere, quel prefisso viene tolto: resta
  // il nome. La categoria non si perde, ha già il suo campo e il suo gruppo.
  const ripulito = useRef(false);
  const aggiornaTitolo = m.update.mutate;

  useEffect(() => {
    const voci = q.data;
    if (ripulito.current || def.key !== "budget" || !canEdit || !voci?.length) return;
    ripulito.current = true;

    voci
      .filter((it) => VECCHIO_PREFISSO.test(it.title))
      .forEach((it) => {
        const title = it.title.replace(VECCHIO_PREFISSO, "").trim();
        if (title) aggiornaTitolo({ id: it.id, title });
      });
  }, [def.key, canEdit, q.data, aggiornaTitolo]);
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
    visibili.forEach((it) => {
      const v = it.data[groupKey];
      const label = (fieldOf(groupKey)?.type === "ref" ? lookup.get(v)?.title : v) || (fieldOf(groupKey)?.type === "ref" ? "Senza collegamento" : "Senza categoria");
      map.set(label, [...(map.get(label) ?? []), it]);
    });
    // I gruppi seguono l'ordine delle opzioni del campo (nel budget: l'ordine di
    // produzione), il resto in ordine alfabetico, i vuoti sempre in fondo.
    const ordine = fieldOf(groupKey)?.options ?? [];
    const posizione = (label: string) => {
      if (label.startsWith("Senza ")) return 9999;
      const i = ordine.indexOf(label);
      return i < 0 ? 9998 : i;
    };

    return [...map.entries()].sort((a, b) => posizione(a[0]) - posizione(b[0]) || a[0].localeCompare(b[0]));
  })();
  const iconaGruppo =
    groupKey === "scena" ? "movie-open-outline" : groupKey === "contenuto" ? "cellphone-play" : groupKey === "episodio" || groupKey === "stagione" ? "television-play" : def.icon;

  const move = (item: Item, dir: number) => {
    const b = items[items.indexOf(item) + dir];
    if (!b) return;
    m.update.mutate({ id: item.id, order: b.order === item.order ? b.order + dir : b.order });
    m.update.mutate({ id: b.id, order: item.order });
  };

  // Checklist <-> equipment: ticking a checklist row marks its linked gear as ready (and back).
  const toggleCheck = (item: Item) => {
    const v = !item.data[def.check!];
    m.update.mutate({ id: item.id, data: { ...item.data, [def.check!]: v } });
    if (def.key === "checklist")
      ((item.data.articoli ?? []) as string[]).forEach((gid) => {
        const g = lookup.get(gid) as Item | undefined;
        if (g && !!g.data.pronto !== v) gear.update.mutate({ id: gid, data: { ...g.data, pronto: v } });
      });
  };
  const importGear = () => {
    const linked = new Set(items.flatMap((i) => (i.data.articoli ?? []) as string[]));
    const todo = (gearQ.data ?? []).filter((g) => !linked.has(g.id));
    if (!todo.length) return toast("Tutta l'attrezzatura è già in checklist");
    const cat: Record<string, string> = { Camera: "Camera", Ottiche: "Camera", Luci: "Luci", Grip: "Grip", Audio: "Audio", Media: "Batterie & media", Monitor: "Camera" };
    todo.forEach((g) => m.create.mutate({ title: `${g.data.quantita ? `${g.data.quantita}× ` : ""}${g.title}`, data: { categoria: cat[g.data.categoria] ?? "Altro", articoli: [g.id], fatto: !!g.data.pronto } }));
    toast(`${todo.length} articoli aggiunti alla checklist`);
  };

  const rememberPerson = (title: string, data: Record<string, any>) => {
    const existing = (people.q.data ?? []).find((p) => p.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (existing) people.update.mutate({ id: existing.id, title, data });
    else people.create.mutate([{ title, data }]);
  };
  const addFromPeople = (person: LibItem) =>
    m.create.mutate({ title: person.title, data: { ...person.data } }, { onSuccess: () => toast(`${person.title} aggiunto alla troupe`) });
  const peopleAvailable = (people.q.data ?? []).filter((p) => !items.some((i) => i.title.trim().toLowerCase() === p.title.trim().toLowerCase()));

  const save = (title: string, data: Record<string, any>) => {
    const opts = {
      onSuccess: () => {
        setOpen(false);
        toast("Salvato");
        if (def.key === "crew") rememberPerson(title, data);
      },
      onError: (e: Error) => toast(e.message, "error"),
    };
    if (editing) m.update.mutate({ id: editing.id, title, data }, opts);
    else m.create.mutate({ title, data }, opts);
  };

  const renderCard = ({ item }: { item: Item }) => {
    const sub = (def.subtitle ?? []).map((k) => displayValue(fieldOf(k), item.data[k], lookup)).filter(Boolean).join(" · ");
    const unitInfo = def.sum && def.sum.unit && item.data[def.sum.unit] && !["Forfait", "Per progetto"].includes(item.data[def.sum.unit])
      ? `${eur(num(item.data[def.sum.field]))} ${String(item.data[def.sum.unit]).toLowerCase()} × ${num(item.data[def.sum.qty!]) || 1} pz${["Per giorno", "Per ora", "Per settimana"].includes(item.data[def.sum.unit]) ? ` × ${num(item.data.durata) || 1} ${({ "Per giorno": "gg", "Per ora": "h", "Per settimana": "sett." } as Record<string, string>)[item.data[def.sum.unit]]}` : ""}`
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
      <Pressable testID={`item-card-${item.id}`} onPress={openIt} style={({ pressed }) => ({ flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: 22, borderWidth: 1, borderColor: colors.divider, opacity: pressed ? 0.88 : 1 })}>
        {def.check ? (
          <Pressable testID={`item-check-${item.id}`} hitSlop={10} onPress={() => toggleCheck(item)} style={{ paddingTop: 2 }}>
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
          {item.data.link && /^https?:\/\//.test(item.data.link) ? (
            <Pressable testID={`item-link-${item.id}`} hitSlop={6} onPress={() => Linking.openURL(item.data.link)} style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" }}>
              <Icon name="open-in-new" size={14} color={colors.brandPrimary} />
              <Text style={[s.muted, { color: colors.brandPrimary }]} numberOfLines={1}>{def.key === "reference" ? "Apri link" : "Apri sul sito del rental"}</Text>
            </Pressable>
          ) : null}
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
            {canEdit && def.key === "checklist" && <Button testID="checklist-import-gear" icon="camera-plus-outline" label={width > 700 ? "Da attrezzatura" : undefined} variant="secondary" loading={m.create.isPending} onPress={importGear} />}
            {canEdit && def.key === "crew" && <Button testID="crew-from-people" icon="account-multiple-plus" label={width > 700 ? "Dalla rubrica" : undefined} variant="secondary" onPress={() => setPeopleOpen(true)} />}
            {canEdit && <Button testID={`add-${def.key}-button`} icon="plus" label={width > 500 ? "Aggiungi" : undefined} onPress={() => (setEditing(null), setOpen(true))} />}
          </>
        }
      />
      {q.isLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.brandPrimary} />
      ) : def.key === "moodboard" ? (
        <MoodBoard
          def={def}
          gruppi={groups && groups.length ? groups : [["Moodboard", items]]}
          canEdit={canEdit}
          onOpen={(it) => (setEditing(it), setOpen(true))}
        />
      ) : groups && groups.length ? (
        <ScrollView testID={`${def.key}-grouped`} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />} contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          <SectionHero icon={def.icon} eyebrow={def.label} pills={[{ icon: def.icon, text: `${items.length} ${items.length === 1 ? "elemento" : "elementi"}` }, { icon: "shape-outline", text: `${groups.length} ${groups.length === 1 ? "gruppo" : "gruppi"}` }]} />
          {def.sum && items.length ? <SumBar def={def} items={items} compatto /> : null}
          {groups.map(([label, list]) => (
            <View key={label} style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: spacing.xs }}>
                <Icon name={iconaGruppo} size={18} color={colors.brandPrimary} />
                <Text testID={`group-header-${label}`} style={[s.h3, { flex: 1 }]} numberOfLines={1}>{label}</Text>
                {def.sum ? (
                  <Text testID={`group-subtotal-${label}`} style={[s.h3, { color: colors.brandPrimary }]}>
                    {eur(list.reduce((a, i) => a + lineTotal(def, i.data), 0))}
                  </Text>
                ) : null}
                <Text style={s.muted}>{list.length}</Text>
              </View>
              <View style={cols > 1 ? { flexDirection: "row", flexWrap: "wrap", gap: spacing.md } : { gap: spacing.md }}>
                {list.map((item) => (
                  <View key={item.id} style={cols > 1 ? undefined : { width: "100%" }}>{renderCard({ item })}</View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          key={`${def.key}-${cols}`}
          testID={`${def.key}-list`}
          data={visibili}
          numColumns={cols}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.brandPrimary} />}
          columnWrapperStyle={cols > 1 ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
              <SectionHero icon={def.icon} eyebrow={def.label} pills={[{ icon: def.icon, text: `${items.length} ${items.length === 1 ? "elemento" : "elementi"}` }, ...(badgeVals.length > 1 ? [{ icon: "shape-outline" as IconName, text: `${badgeVals.length} ${badgeVals.length === 1 ? "valore" : "valori"}` }] : [])]} />
              {badgeVals.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                  <Chip testID={`filter-${def.key}-tutti`} label={`Tutti (${items.length})`} selected={!filtro} onPress={() => setFiltro(null)} />
                  {badgeVals.map((v) => (
                    <Chip key={v} testID={`filter-${def.key}-${v}`} label={`${v} (${items.filter((i) => String(i.data[def.badge!] ?? "") === v).length})`} selected={filtro === v} onPress={() => setFiltro(filtro === v ? null : v)} />
                  ))}
                </ScrollView>
              ) : null}
              {def.sum && items.length ? <SumBar def={def} items={items} /> : null}
            </View>
          }
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
      <Sheet visible={peopleOpen} onClose={() => setPeopleOpen(false)} title="Dalla rubrica" testID="crew-people-sheet">
        {peopleAvailable.length ? (
          peopleAvailable.map((p) => (
            <Pressable
              key={p.id}
              testID={`crew-person-${p.id}`}
              onPress={() => (addFromPeople(p), setPeopleOpen(false))}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}
            >
              <Icon name="account-circle-outline" size={26} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={s.body} numberOfLines={1}>{p.title}</Text>
                <Text style={s.muted} numberOfLines={1}>
                  {[p.data.ruolo, p.data.reparto].filter(Boolean).join(" · ") || "Nessun ruolo indicato"}
                </Text>
              </View>
              <Icon name="plus" size={20} color={colors.brandPrimary} />
            </Pressable>
          ))
        ) : (
          <Empty
            icon="account-multiple-outline"
            title="Nessuna persona da aggiungere"
            subtitle="Aggiungi qualcuno in Strumenti → Persone, oppure salva una persona della troupe: la ritrovi qui anche negli altri progetti."
          />
        )}
      </Sheet>
    </View>
  );
}
