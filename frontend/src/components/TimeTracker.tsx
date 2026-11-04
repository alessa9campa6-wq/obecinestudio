import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Item } from "@/src/api";
import { useItemMutations, useItems } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Field, Icon, useStyles } from "@/src/ui";

const CATS = ["Scrittura", "Pre-produzione", "Riprese", "Montaggio", "Color", "VFX", "Audio", "Riunioni"];
const dur = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(t / 3600)}h ${String(Math.floor((t % 3600) / 60)).padStart(2, "0")}m ${String(t % 60).padStart(2, "0")}s`;
};
const elapsed = (i: Item, now: number) => (i.data.end ?? now) - i.data.start;

export default function TimeTracker({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const q = useItems(project.id, def.key);
  const m = useItemMutations(project.id, def.key);
  const { colors } = useTheme();
  const s = useStyles();
  const [activity, setActivity] = useState("");
  const [cat, setCat] = useState(CATS[2]);
  const [now, setNow] = useState(Date.now());
  const items = [...(q.data ?? [])].reverse();
  const running = items.filter((i) => !i.data.end);
  useEffect(() => {
    if (!running.length) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running.length]);

  const totals: Record<string, number> = {};
  items.forEach((i) => (totals[i.data.category] = (totals[i.data.category] ?? 0) + elapsed(i, now)));
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);

  const start = () => {
    m.create.mutate({ title: activity.trim() || cat, data: { category: cat, start: Date.now(), end: null } });
    setActivity("");
  };
  const exportPdf = () =>
    exportHtml(
      "Time tracker",
      wrap("Time tracker", `<p><b>Totale: ${dur(grand)}</b></p><table><tr><th>Attività</th><th>Categoria</th><th>Inizio</th><th>Durata</th></tr>${items.map((i) => `<tr><td>${i.title}</td><td>${i.data.category}</td><td>${new Date(i.data.start).toLocaleString("it-IT")}</td><td>${dur(elapsed(i, now))}</td></tr>`).join("")}</table>`, project.title),
    );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader def={def} subtitle={`Totale: ${dur(grand)}`} right={<Button testID="time-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!items.length} onPress={exportPdf} />} />
      <ModuleScroll>
        <Card style={{ gap: spacing.md }}>
          <Field testID="time-activity-input" label="Attività" value={activity} onChangeText={setActivity} placeholder="es. Sopralluogo location" />
          <ChipRow>
            {CATS.map((c) => (
              <Chip key={c} testID={`time-cat-${c}`} label={c} selected={cat === c} onPress={() => setCat(c)} />
            ))}
          </ChipRow>
          <Button testID="time-start-button" icon="play" label="Avvia timer" onPress={start} loading={m.create.isPending} />
        </Card>
        {running.map((r) => (
          <View key={r.id} testID={`time-running-${r.id}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.brandTertiary }}>
            <Icon name="record-circle" color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[s.h3, { color: colors.onBrandTertiary }]}>{r.title}</Text>
              <Text style={{ fontFamily: fonts.text, color: colors.onBrandTertiary }}>{r.data.category}</Text>
            </View>
            <Text testID="time-running-elapsed" style={{ fontFamily: fonts.text, fontSize: 20, fontWeight: "700", color: colors.onBrandTertiary }}>{dur(elapsed(r, now))}</Text>
            <Button testID={`time-stop-${r.id}`} icon="stop" variant="danger" onPress={() => m.update.mutate({ id: r.id, data: { ...r.data, end: Date.now() } })} />
          </View>
        ))}
        {Object.keys(totals).length > 0 && (
          <Card style={{ gap: spacing.sm }}>
            <Text style={s.h3}>Per categoria</Text>
            {Object.entries(totals).map(([k, v]) => (
              <View key={k} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.body}>{k}</Text>
                  <Text style={s.body}>{dur(v)}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.surfaceTertiary, borderRadius: 2 }}>
                  <View style={{ height: 4, width: `${grand ? (v / grand) * 100 : 0}%`, backgroundColor: colors.brandPrimary, borderRadius: 2 }} />
                </View>
              </View>
            ))}
          </Card>
        )}
        {!items.length && <Empty icon="timer-outline" title="Nessuna sessione registrata" subtitle="Avvia un timer per tracciare il tempo dedicato a ogni fase." />}
        {items
          .filter((i) => i.data.end)
          .map((i) => (
            <View key={i.id} testID={`time-entry-${i.id}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={s.h3}>{i.title}</Text>
                <Text style={s.muted}>{i.data.category} · {new Date(i.data.start).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
              <Text style={s.body}>{dur(elapsed(i, now))}</Text>
              <Pressable testID={`time-delete-${i.id}`} hitSlop={8} onPress={() => m.remove.mutate(i.id)}>
                <Icon name="trash-can-outline" size={20} color={colors.muted} />
              </Pressable>
            </View>
          ))}
      </ModuleScroll>
    </View>
  );
}
