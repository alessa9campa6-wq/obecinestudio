import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Item } from "@/src/api";
import NoteEditor from "@/src/components/NoteEditor";
import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportModule } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, Empty, Field, Glass, Icon, IconName, toast, useStyles } from "@/src/ui";

const ICONE: Record<string, IconName> = {
  Idea: "lightbulb-on-outline",
  Regia: "movie-open-outline",
  Produzione: "briefcase-outline",
  Fotografia: "camera-outline",
  Suono: "microphone-outline",
  Altro: "note-text-outline",
};

const dataCorta = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function NoteModule({ def }: { def: ModuleDef }) {
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
  const [cerca, setCerca] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const items = useMemo(() => q.data ?? [], [q.data]);
  const campoTag = (def.fields ?? []).find((f) => f.type === "select" && f.options?.length);
  const tagKey = campoTag?.key ?? "tag";
  const tags = campoTag?.options ?? [];
  const bodyKey = def.longText ?? "body";

  const termine = cerca.trim().toLowerCase();
  const filtrate = useMemo(
    () =>
      items.filter((it) => {
        if (tag && it.data[tagKey] !== tag) return false;
        if (!termine) return true;
        return [it.title, it.data[bodyKey]].filter(Boolean).join(" ").toLowerCase().includes(termine);
      }),
    [items, tag, termine, tagKey, bodyKey],
  );

  const perTag = tags.map((t) => ({ t, n: items.filter((it) => it.data[tagKey] === t).length })).filter((x) => x.n > 0);
  const larghezza = width >= 900 ? 2 : 1;
  const colonna = (width - spacing.lg * 2 - spacing.md * (larghezza - 1)) / larghezza;

  const tinta = (t: string) => ({ Idea: colors.info, Regia: colors.brandPrimary, Produzione: colors.warning, Fotografia: colors.brandSecondary, Suono: colors.success }[t] ?? colors.muted);

  const apri = (it: Item | null) => {
    setEditing(it);
    setOpen(true);
  };
  const salva = (title: string, data: Record<string, any>) =>
    editing
      ? m.update.mutate({ id: editing.id, title, data }, { onSuccess: () => (setOpen(false), toast("Nota aggiornata")), onError: (e: Error) => toast(e.message, "error") })
      : m.create.mutate({ title, data }, { onSuccess: () => (setOpen(false), toast("Nota aggiunta")), onError: (e: Error) => toast(e.message, "error") });

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
        subtitle={`${items.length} ${items.length === 1 ? "nota" : "note"}${filtrate.length !== items.length ? ` · ${filtrate.length} visibili` : ""}`}
        right={
          <>
            <Button testID={`export-${def.key}-pdf`} icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={() => exportModule(project, def, items, lookup)} />
            {canEdit ? <Button testID={`add-${def.key}-button`} icon="plus" label={width > 520 ? "Aggiungi" : undefined} onPress={() => apri(null)} /> : null}
          </>
        }
      />

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
          <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <View style={{ position: "absolute", right: -16, bottom: -24, opacity: 0.09 }} pointerEvents="none">
            <Icon name="note-text-outline" size={170} color={colors.brandPrimary} />
          </View>
          <View style={{ padding: spacing.xl, gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Icon name="note-text-outline" size={14} color={colors.brandPrimary} />
              <Text style={s.label}>Le note del progetto</Text>
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
              {project.title}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
              {pillola("note-multiple-outline", `${items.length} ${items.length === 1 ? "nota" : "note"}`)}
              {perTag.slice(0, 2).map((x) => pillola(ICONE[x.t] ?? "tag-outline", `${x.t} ${x.n}`))}
            </View>
          </View>
        </View>

        <Field testID="note-search" value={cerca} onChangeText={setCerca} placeholder="Cerca nelle note" />

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          <Chip testID="note-filter-tutte" label={`Tutte (${items.length})`} selected={!tag} onPress={() => setTag(null)} />
          {perTag.map((x) => (
            <Chip key={x.t} testID={`note-filter-${x.t}`} icon={ICONE[x.t] ?? "tag-outline"} label={`${x.t} (${x.n})`} selected={tag === x.t} onPress={() => setTag(tag === x.t ? null : x.t)} />
          ))}
        </View>

        {q.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : !items.length ? (
          <Empty
            icon={def.icon}
            title="Nessuna nota"
            subtitle="Idee, richieste del cliente, cose da non dimenticare: qui restano ordinate per reparto."
            action={canEdit ? <Button testID="empty-add-note" icon="plus" label="Scrivi la prima" onPress={() => apri(null)} /> : undefined}
          />
        ) : !filtrate.length ? (
          <Empty icon="text-search" title="Nessuna nota con questi filtri" subtitle="Prova a togliere la ricerca o il reparto." action={<Button label="Azzera" variant="secondary" icon="filter-off-outline" onPress={() => (setCerca(""), setTag(null))} />} />
        ) : (
          <View style={{ flexDirection: larghezza > 1 ? "row" : "column", flexWrap: "wrap", gap: spacing.md }}>
            {filtrate.map((it) => {
              const t = String(it.data[tagKey] ?? "");
              const c = tinta(t);
              return (
                <Pressable
                  key={it.id}
                  testID={`item-card-${it.id}`}
                  onPress={() => apri(it)}
                  style={({ pressed }) => ({ width: larghezza > 1 ? colonna : "100%", opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}
                >
                  <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: t ? "rgba(212,175,55,0.32)" : colors.divider, padding: spacing.lg, gap: spacing.sm, minHeight: 148 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          borderRadius: radius.pill,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderWidth: 1,
                          borderColor: t ? c : colors.divider,
                          backgroundColor: t ? "rgba(212,175,55,0.1)" : "transparent",
                        }}
                      >
                        <Icon name={ICONE[t] ?? "tag-outline"} size={11} color={t ? c : colors.muted} />
                        <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: t ? c : colors.muted }} numberOfLines={1}>
                          {t || "Senza reparto"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      <Text style={[s.muted, { fontSize: 11 }]}>{dataCorta(it.created_at)}</Text>
                    </View>

                    {it.title ? (
                      <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.onSurface }} numberOfLines={1}>
                        {it.title}
                      </Text>
                    ) : null}
                    <Text style={{ fontFamily: fonts.text, fontSize: 13.5, lineHeight: 19, color: colors.onSurfaceSecondary }} numberOfLines={5}>
                      {String(it.data[bodyKey] ?? "")}
                    </Text>
                  </Glass>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <NoteEditor
        def={def}
        item={editing}
        visible={open}
        saving={m.create.isPending || m.update.isPending}
        onClose={() => setOpen(false)}
        onSave={salva}
        onDelete={() => editing && m.remove.mutate(editing.id, { onSuccess: () => (setOpen(false), toast("Nota eliminata")) })}
      />
    </View>
  );
}
