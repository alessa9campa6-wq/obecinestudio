import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs, { Dayjs } from "dayjs";

import { api, Item, Project } from "@/src/api";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Icon, toast } from "@/src/ui";

type EventItem = { id: string; date: string; type: string; title: string; note: string; time?: string; projectId?: string; locationId?: string };

const KEY = "calendar_events";
const TYPES = ["Ripresa", "Scadenza", "Altro"];

export function CalendarCard({ projects }: { projects: Project[] }) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Ripresa");
  const [note, setNote] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (next: EventItem[]) => {
    setEvents(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of events) {
      (map[e.date] ||= []).push(e);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = month.startOf("month");
    const offset = (start.day() + 6) % 7;
    const cells: (Dayjs | null)[] = Array.from({ length: offset }, () => null);
    const end = month.endOf("month").date();
    for (let i = 1; i <= end; i++) cells.push(start.date(i));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const startNew = () => {
    setEditingId(null);
    setType("Ripresa");
    setTitle("");
    setNote("");
    setTime("");
    setProjectId(null);
    setLocationId(activeLocation?.id ?? null);
    setOpen(true);
  };

  const startEdit = (e: EventItem) => {
    setEditingId(e.id);
    setSelected(e.date);
    setType(e.type);
    setTitle(e.title);
    setNote(e.note);
    setTime(e.time ?? "");
    setProjectId(e.projectId ?? null);
    setLocationId(e.locationId ?? null);
    setOpen(true);
  };

  const add = () => {
    if (!title.trim()) {
      toast("Aggiungi un titolo", "error");
      return;
    }
    const item: EventItem = { id: editingId ?? String(Date.now()), date: selected, type, title: title.trim(), note: note.trim(), time: time.trim(), projectId: projectId ?? undefined, locationId: locationId ?? activeLocation?.id };
    const next = editingId ? events.map((e) => (e.id === editingId ? item : e)) : [...events, item];
    void save(next);
    setEditingId(null);
    setNote("");
    setOpen(false);
  };

  const remove = (id: string) => void save(events.filter((e) => e.id !== id));

  const linkedProjectId = (byDate[selected] ?? []).find((e) => e.projectId)?.projectId ?? null;
  const checklist = useQuery({
    queryKey: ["items", linkedProjectId, "__all"],
    queryFn: () => api<Item[]>(`/projects/${linkedProjectId}/items`),
    enabled: !!linkedProjectId,
  });
  const checklistItems = (checklist.data ?? []).filter((i) => i.module === "checklist");
  const locations = (checklist.data ?? []).filter((i) => i.module === "location");
  const isDateInRange = (v: any, date: string) => {
    const s = String(v ?? "");
    const parts = s.includes("|") ? s.split("|") : s.split(",");
    return parts.includes(date) || (parts.length === 2 && date >= parts[0] && date <= parts[1]);
  };
  const activeLocation = locations.find((l) => isDateInRange(l.data?.date, selected));

  return (
    <View
      style={{
        marginHorizontal: spacing.xl,
        marginTop: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceTertiary,
        borderWidth: 1,
        borderColor: colors.divider,
        gap: spacing.md,
      }}
    >
      <Pressable onPress={() => setExpanded(!expanded)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="calendar-month-outline" size={18} color={colors.brandPrimary} />
        <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 18, color: colors.text }}>Calendario</Text>
        <Button icon="plus" variant="secondary" onPress={startNew} />
        <Button icon={expanded ? "chevron-up" : "chevron-down"} variant="secondary" onPress={() => setExpanded(!expanded)} />
      </Pressable>

{expanded && (
        <>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Button icon="chevron-left" variant="secondary" onPress={() => setMonth(month.subtract(1, "month"))} />
        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.text }}>
          {month.format("MMMM YYYY")}
        </Text>
        <Button icon="chevron-right" variant="secondary" onPress={() => setMonth(month.add(1, "month"))} />
      </View>

      <View style={{ flexDirection: "row" }}>
        {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: "center", color: colors.muted, fontSize: 12 }}>
            {d}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {days.map((d, i) => {
          if (!d) return <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
          const key = d.format("YYYY-MM-DD");
          const has = (byDate[key] ?? []).length > 0;
          const isSel = key === selected;
          return (
            <Pressable
              key={key}
              onPress={() => setSelected(key)}
              style={{
                width: `${100 / 7}%`,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.md,
                backgroundColor: isSel ? colors.brandPrimary : "transparent",
              }}
            >
              <Text style={{ color: isSel ? colors.onBrandPrimary : colors.text, fontSize: 14 }}>
                {d.date()}
              </Text>
              {has ? <View style={{ position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: isSel ? colors.onBrandPrimary : colors.brandPrimary }} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.text }}>
        {dayjs(selected).format("DD MMMM YYYY")}
      </Text>

      {(byDate[selected] ?? []).length === 0 ? (
        <Text style={{ color: colors.muted }}>Nessun evento in questa data.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {(byDate[selected] ?? []).map((e) => (
            <Pressable key={e.id} onPress={() => startEdit(e)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>{e.title}</Text>
                <Text style={{ color: colors.muted }}>{e.type}{e.time ? ` · ${e.time}` : ""}{e.projectId ? ` · ${projects.find((p) => p.id === e.projectId)?.title ?? "Progetto"}` : ""}{e.locationId ? ` · ${locations.find((l) => l.id === e.locationId)?.title ?? "Location"}` : ""}</Text>
                <Text style={{ color: colors.muted }}>{e.note}</Text>
              </View>
              <Button icon="pencil" variant="secondary" onPress={() => startEdit(e)} />
              <Button icon="delete-outline" variant="secondary" onPress={() => remove(e.id)} />
            </Pressable>
          ))}
        </View>
      )}

        </>
      )}


      <Modal visible={open} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <View style={{ width: "100%", maxWidth: 420, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.md }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.text }}>{editingId ? "Modifica evento" : "Nuovo evento"}</Text>
            <Text style={{ color: colors.muted }}>{dayjs(selected).format("DD MMMM YYYY")}</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {TYPES.map((t) => (
                <Button key={t} label={t} variant={type === t ? "primary" : "secondary"} onPress={() => setType(t)} />
              ))}
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Titolo"
              placeholderTextColor={colors.muted}
              style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, color: colors.text }}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nota"
              placeholderTextColor={colors.muted}
              style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, color: colors.text }}
            />
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="Orario (es. 14:30)"
              placeholderTextColor={colors.muted}
              style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, color: colors.text }}
            />
            <Text style={{ color: colors.muted, fontSize: 12 }}>Progetto collegato</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Button label="Nessuno" variant={projectId === null ? "primary" : "secondary"} onPress={() => setProjectId(null)} />
              {projects.map((pr) => (
                <Button key={pr.id} label={pr.title} variant={projectId === pr.id ? "primary" : "secondary"} onPress={() => setProjectId(pr.id)} />
              ))}
            </View>
            {projectId ? (
              <>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Location</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  <Button label="Nessuna" variant={locationId === null ? "primary" : "secondary"} onPress={() => setLocationId(null)} />
                  {locations.map((l) => (
                    <Button key={l.id} label={l.title} variant={locationId === l.id ? "primary" : "secondary"} onPress={() => setLocationId(l.id)} />
                  ))}
                </View>
              </>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
              <Button label="Annulla" variant="secondary" onPress={() => setOpen(false)} />
              <Button label="Salva" onPress={add} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
