import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";

import { api, Item, Project } from "@/src/api";
import { useItemMutations } from "@/src/hooks";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

type EventItem = { id: string; date: string; type: string; title: string; note: string; time?: string; projectId?: string };

const KEY = "calendar_events";

export function TodayCard({ projects }: { projects: Project[] }) {
  const { colors } = useTheme();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openChecklist, setOpenChecklist] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setEvents(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const today = dayjs().format("YYYY-MM-DD");
  const items = events.filter((e) => e.date === today);
  const linkedProjectId = items.find((e) => e.projectId)?.projectId ?? null;
  const { update } = useItemMutations(linkedProjectId ?? "", "checklist");
  const toggleChecklistItem = (i: Item) => update.mutate({ id: i.id, data: { ...i.data, fatto: !i.data?.fatto } });
  const checklist = useQuery({
    queryKey: ["items", linkedProjectId, "checklist"],
    queryFn: () => api<Item[]>(`/projects/${linkedProjectId}/items`),
    enabled: !!linkedProjectId,
  });
  const checklistItems = (checklist.data ?? []).filter((i) => i.module === "checklist");
  const locationsQuery = useQuery({
    queryKey: ["items", linkedProjectId, "location"],
    queryFn: () => api<Item[]>(`/projects/${linkedProjectId}/items`),
    enabled: !!linkedProjectId,
  });
  const locationItems = (locationsQuery.data ?? []).filter((i) => i.module === "location");
  const isTodayInRange = (v: any) => {
    const s = String(v ?? "");
    const parts = s.includes("|") ? s.split("|") : s.split(",");
    return parts.includes(today) || (parts.length === 2 && today >= parts[0] && today <= parts[1]);
  };
  const activeLocations = locationItems.filter((l) => isTodayInRange(l.data?.date));

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
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="calendar-today" size={18} color={colors.brandPrimary} />
        <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 18, color: colors.onSurface }}>Oggi</Text>
      </View>

      {items.length === 0 ? (
        <Text style={{ color: colors.muted }}>Nessuna cosa in programma oggi.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((e) => (
            <View key={e.id} style={{ gap: 2 }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>
                {e.title}
                {e.time ? ` · ${e.time}` : ""}
              </Text>
              <Text style={{ color: colors.muted }}>
                {e.type}
                {e.projectId ? ` · ${projects.find((p) => p.id === e.projectId)?.title ?? "Progetto"}` : ""}
              </Text>
              {e.note ? <Text style={{ color: colors.muted }}>{e.note}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {activeLocations.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          {activeLocations.map((l) => (
            <View key={l.id} style={{ gap: 2 }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{l.title}</Text>
              {l.data?.indirizzo ? <Text style={{ color: colors.muted }}>{l.data.indirizzo}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {linkedProjectId ? (
        <Pressable onPress={() => setOpenChecklist(!openChecklist)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Icon name="checkbox-marked-outline" size={18} color={colors.brandPrimary} />
          <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 16, color: colors.onSurface }}>Checklist</Text>
          <Icon name={openChecklist ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
        </Pressable>
      ) : null}

      {openChecklist && linkedProjectId ? (
        <View style={{ gap: spacing.sm }}>
          {checklist.isLoading ? (
            <Text style={{ color: colors.muted }}>Caricamento checklist...</Text>
          ) : checklistItems.filter((i) => i.data?.data_richiesta === today).length === 0 ? (
            <Text style={{ color: colors.muted }}>Nessuna attrezzatura richiesta oggi.</Text>
          ) : (
            <View style={{ gap: spacing.xs }}>
              {checklistItems.filter((i) => i.data?.data_richiesta === today).map((i) => (
                <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Pressable onPress={() => toggleChecklistItem(i)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Icon name={i.data?.fatto ? "checkbox-marked" : "checkbox-blank-outline"} size={18} color={i.data?.fatto ? colors.brandPrimary : colors.muted} />
                    <Text style={{ color: colors.onSurface }}>{i.title}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

    </View>
  );
}
