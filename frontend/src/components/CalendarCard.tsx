import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import dayjs, { Dayjs } from "dayjs";

import { api, Item, Project } from "@/src/api";
import { TimeField, oraHm } from "@/src/components/TimeField";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Icon, toast } from "@/src/ui";

// Evento del calendario. Vive sul server (collezione "calendar", un documento
// per utente), così lo stesso account lo vede su tutti i dispositivi.
// Il server parla snake_case, qui si usa camelCase.
type EventItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  note: string;
  time: string;
  projectId: string | null;
  locationId: string | null;
};

type EventDoc = {
  id: string;
  date: string;
  type: string;
  title: string;
  note?: string | null;
  time?: string | null;
  project_id?: string | null;
  location_id?: string | null;
};

const KEY = ["calendar"] as const;
const TYPES = ["Ripresa", "Scadenza", "Altro"];

const fromDoc = (d: EventDoc): EventItem => ({
  id: d.id,
  date: d.date,
  type: d.type,
  title: d.title,
  note: d.note ?? "",
  time: d.time ?? "",
  projectId: d.project_id ?? null,
  locationId: d.location_id ?? null,
});

export function CalendarCard({ projects }: { projects: Project[] }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => dayjs().startOf("month"));
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

  const eventi = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api<EventDoc[]>("/calendar")).map(fromDoc),
  });
  const events = eventi.data ?? [];

  const salva = useMutation({
    mutationFn: (v: { id: string | null; body: Record<string, unknown> }) =>
      v.id
        ? api(`/calendar/${v.id}`, { method: "PUT", body: v.body })
        : api("/calendar", { method: "POST", body: v.body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const elimina = useMutation({
    mutationFn: (id: string) => api(`/calendar/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

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

  // Il progetto collegato al giorno serve per proporre la location giusta.
  const linkedProjectId = (byDate[selected] ?? []).find((e) => e.projectId)?.projectId ?? null;
  const checklist = useQuery({
    queryKey: ["items", linkedProjectId, "__all"],
    queryFn: () => api<Item[]>(`/projects/${linkedProjectId}/items`),
    enabled: !!linkedProjectId,
  });
  const checklistItems = (checklist.data ?? []).filter((i) => i.module === "checklist");
  const locations = (checklist.data ?? []).filter((i) => i.module === "location");
  const isDateInRange = (v: unknown, date: string) => {
    const s = String(v ?? "");
    const parts = s.includes("|") ? s.split("|") : s.split(",");
    return parts.includes(date) || (parts.length === 2 && date >= parts[0] && date <= parts[1]);
  };
  const activeLocation = locations.find((l) => isDateInRange(l.data?.date, selected));

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
    setTime(e.time);
    setProjectId(e.projectId);
    setLocationId(e.locationId);
    setOpen(true);
  };

  const add = () => {
    if (!title.trim()) {
      toast("Aggiungi un titolo", "error");
      return;
    }
    salva.mutate({
      id: editingId,
      body: {
        date: selected,
        type,
        title: title.trim(),
        note: note.trim(),
        time: oraHm(time) || time.trim() || null,
        project_id: projectId,
        location_id: locationId ?? activeLocation?.id ?? null,
      },
    });
    setEditingId(null);
    setNote("");
    setOpen(false);
  };

  const remove = (id: string) => elimina.mutate(id);

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
        <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 18, color: colors.onSurface }}>Calendario</Text>
        <Button icon="plus" variant="secondary" onPress={startNew} />
        <Button icon={expanded ? "chevron-up" : "chevron-down"} variant="secondary" onPress={() => setExpanded(!expanded)} />
      </Pressable>

{expanded && (
        <>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Button icon="chevron-left" variant="secondary" onPress={() => setMonth(month.subtract(1, "month"))} />
        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.onSurface }}>
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
              <Text style={{ color: isSel ? colors.onBrandPrimary : colors.onSurface, fontSize: 14 }}>
                {d.date()}
              </Text>
              {has ? <View style={{ position: "absolute", bottom: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: isSel ? colors.onBrandPrimary : colors.brandPrimary }} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.onSurface }}>
        {dayjs(selected).format("DD MMMM YYYY")}
      </Text>

      {(byDate[selected] ?? []).length === 0 ? (
        <Text style={{ color: colors.muted }}>Nessun evento in questa data.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {(byDate[selected] ?? []).map((e) => (
            <Pressable key={e.id} onPress={() => startEdit(e)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{e.title}</Text>
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
            <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.onSurface }}>{editingId ? "Modifica evento" : "Nuovo evento"}</Text>
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
              style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface }}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Nota"
              placeholderTextColor={colors.muted}
              style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface }}
            />
            <TimeField testID="calendar-orario" label="Orario" value={time} onChange={setTime} />
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
              <Button label="Salva" onPress={add} loading={salva.isPending} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
