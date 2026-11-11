import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Project } from "@/src/api";
import { cameraId, CAMERAS, findCamera } from "@/src/cameras";
import { useSummary } from "@/src/hooks";
import { FieldDef, ModuleDef } from "@/src/modules";
import { spacing, useTheme } from "@/src/theme";
import { Button, Glass, Icon, useStyles } from "@/src/ui";
import { storage } from "@/src/utils/storage";

type Focus = { module: string; id: string } | null;
type Hub = {
  project: Project;
  back: (() => void) | null;
  go: (module: string, itemId?: string) => void;
  focus: Focus;
  clearFocus: () => void;
  canEdit: boolean;
  canManage: boolean;
};
export const ROLE_LABELS: Record<string, string> = { owner: "Proprietario", admin: "Amministratore", editor: "Può modificare", viewer: "Solo visione" };
export const HubContext = createContext<Hub>(null as any);
export const useHub = () => useContext(HubContext);

// Main camera of the project, shared by lens calculator and director viewfinder.
export function useProjectCamera(pid: string) {
  const key = `cam_${pid}`;
  const [id, setId] = useState<string>(cameraId(CAMERAS[1]));
  useEffect(() => {
    storage.getItem<string>(key, cameraId(CAMERAS[1])).then((v) => v && setId(v));
  }, [key]);
  const set = (v: string) => {
    setId(v);
    storage.setItem(key, v);
  };
  return [findCamera(id), set] as const;
}

// Type-specific modules are featured for their project type but never exclusive:
// any project can enable them, and they also show up as soon as they contain items.
export function useVisibility() {
  const { project } = useHub();
  const summary = useSummary(project.id);
  const count = (k: string) => summary.data?.[k] ?? 0;
  const enabled = project.modules ?? [];
  const module = (m: ModuleDef) => !m.types || m.types.includes(project.type) || enabled.includes(m.key) || count(m.key) > 0;
  const field = (f: FieldDef) => {
    if (!f.types || f.types.includes(project.type)) return true;
    const source = f.ref ?? (f.key === "sezione" ? "brano" : "");
    return !!source && (enabled.includes(source) || count(source) > 0);
  };
  return { module, field };
}

export function ModuleHeader({ def, title, subtitle, right }: { def?: ModuleDef; title?: string; subtitle?: string; right?: ReactNode }) {
  const { back, canEdit } = useHub();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const badge = !canEdit && (
    <View testID="read-only-badge" style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, height: 28, borderRadius: 14, backgroundColor: colors.surfaceTertiary }}>
      <Icon name="eye-outline" size={14} color={colors.muted} />
      <Text style={[s.muted, { fontSize: 12 }]}>Solo visione</Text>
    </View>
  );
  return (
    <Glass
      tint={colors.surfaceSecondary}
      style={{
        marginHorizontal: spacing.lg,
        marginTop: insets.top + spacing.sm,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.divider,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      {back && <Button testID="module-back-button" icon="chevron-left" variant="secondary" onPress={back} />}
      <View style={{ flex: 1 }}>
        <Text testID="module-title" style={[s.h2, { fontSize: 22, lineHeight: 27 }]} numberOfLines={1}>
          {title ?? def?.label}
        </Text>
        {(subtitle ?? def?.description) ? (
          <Text style={s.muted} numberOfLines={1}>
            {subtitle ?? def?.description}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
        {badge}
        {right}
      </View>
    </Glass>
  );
}

export function ModuleScroll({ children, scrollEnabled = true }: { children: ReactNode; scrollEnabled?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView scrollEnabled={scrollEnabled} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
      {children}
    </ScrollView>
  );
}
