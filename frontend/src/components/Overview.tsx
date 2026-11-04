import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";

import { api } from "@/src/api";
import { ImageField } from "@/src/components/Images";
import TeamCard from "@/src/components/TeamCard";
import { useSummary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub, useVisibility } from "@/src/hub";
import { COUNT_KEY, forType, MODULES, PHASES, PROJECT_TYPES } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, Icon, toast, useStyles } from "@/src/ui";

export default function Overview() {
  const { project, go } = useHub();
  const vis = useVisibility();
  const summary = useSummary(project.id);
  const qc = useQueryClient();
  const router = useRouter();
  const s = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [form, setForm] = useState(project);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setForm(project), [project]);

  const save = useMutation({
    mutationFn: (body: typeof form) => api(`/projects/${project.id}`, { method: "PUT", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast("Progetto aggiornato");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });
  const del = useMutation({
    mutationFn: () => api(`/projects/${project.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    },
  });

  const two = width >= 1000;
  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader title="Panoramica" subtitle={project.logline || "Informazioni e avanzamento del progetto"} right={<Button testID="save-project-button" icon="check" label="Salva" loading={save.isPending} onPress={() => save.mutate(form)} />} />
      <ModuleScroll>
        <View style={{ flexDirection: two ? "row" : "column", gap: spacing.lg }}>
          <Card style={{ flex: 1, gap: spacing.lg }}>
            <Text style={s.h3}>Informazioni</Text>
            <Field testID="overview-title-input" label="Titolo" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Tipo</Text>
              <ChipRow>
                {PROJECT_TYPES.map((t) => (
                  <Chip key={t} testID={`overview-type-${t}`} label={t} selected={form.type === t} onPress={() => setForm({ ...form, type: t })} />
                ))}
              </ChipRow>
            </View>
            <Field testID="overview-logline-input" label="Logline" value={form.logline} onChangeText={(t) => setForm({ ...form, logline: t })} multiline minHeight={80} />
            <Field testID="overview-genre-input" label="Genere" value={form.genre} onChangeText={(t) => setForm({ ...form, genre: t })} />
            <Field testID="overview-director-input" label="Regia" value={form.director} onChangeText={(t) => setForm({ ...form, director: t })} />
            <Field testID="overview-client-input" label="Cliente / Committente" value={form.client ?? ""} onChangeText={(t) => setForm({ ...form, client: t })} />
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Fase attuale</Text>
              <ChipRow>
                {PHASES.filter((p) => p.key !== "tools").map((p) => (
                  <Chip key={p.key} testID={`overview-status-${p.key}`} label={p.label} selected={form.status === p.key} onPress={() => setForm({ ...form, status: p.key })} />
                ))}
              </ChipRow>
            </View>
          </Card>
          <View style={{ flex: 1, gap: spacing.lg }}>
            <Card style={{ gap: spacing.md }}>
              <Text style={s.h3}>Copertina</Text>
              <ImageField testID="cover-image-field" value={form.cover_path ?? undefined} onChange={(p) => { const next = { ...form, cover_path: p }; setForm(next); save.mutate(next); }} />
            </Card>
            <TeamCard />
            <Card style={{ gap: spacing.md }}>
              <Text style={s.h3}>Contenuti del progetto</Text>
              {PHASES.filter((p) => p.key !== "tools").map((ph) => {
                const mods = MODULES.filter((m) => m.phase === ph.key && m.kind !== "overview" && m.kind !== "weather" && vis.module(m));
                const filled = mods.filter((m) => (summary.data?.[COUNT_KEY(m.key)] ?? 0) > 0).length;
                return (
                  <View key={ph.key} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={s.body}>{ph.label}</Text>
                      <Text style={s.muted}>{filled}/{mods.length} moduli</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill }}>
                      <View style={{ height: 6, width: `${(filled / mods.length) * 100}%`, backgroundColor: colors.brandPrimary, borderRadius: radius.pill }} />
                    </View>
                    <ChipRow>
                      {mods.map((m) => (
                        <Chip key={m.key} testID={`overview-go-${m.key}`} icon={m.icon} label={`${m.label}${summary.data?.[COUNT_KEY(m.key)] ? ` · ${summary.data[COUNT_KEY(m.key)]}` : ""}`} selected={(summary.data?.[COUNT_KEY(m.key)] ?? 0) > 0} onPress={() => go(m.key)} />
                      ))}
                    </ChipRow>
                  </View>
                );
              })}
            </Card>
            <Card style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <Icon name="alert-outline" color={colors.error} />
                <Text style={[s.h3, { flex: 1 }]}>Zona pericolosa</Text>
              </View>
              {confirm ? (
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button testID="delete-project-cancel" label="Annulla" variant="secondary" onPress={() => setConfirm(false)} />
                  <Button testID="delete-project-confirm" label="Elimina definitivamente" variant="danger" loading={del.isPending} onPress={() => del.mutate()} />
                </View>
              ) : (
                <Button testID="delete-project-button" label="Elimina progetto" variant="ghost" icon="trash-can-outline" onPress={() => setConfirm(true)} />
              )}
            </Card>
          </View>
        </View>
      </ModuleScroll>
    </View>
  );
}
