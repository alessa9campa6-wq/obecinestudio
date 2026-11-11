import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useHub } from "@/src/hub";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon, IconName, useStyles } from "@/src/ui";

// Pastiglia dorata usata nelle schede di apertura di tutte le sezioni.
export function GoldPill({ icon, text }: { icon?: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(212,175,55,0.14)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }}>
      {icon ? <Icon name={icon} size={13} color={colors.brandPrimary} /> : null}
      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: colors.brandPrimary }}>{text}</Text>
    </View>
  );
}

// La scheda di apertura: gradiente, icona in filigrana, etichetta e titolo del
// progetto. La usano tutte le sezioni, così la prima schermata è sempre la stessa.
export function SectionHero({
  icon,
  eyebrow,
  title,
  pills,
  children,
}: {
  icon: IconName;
  eyebrow: string;
  title?: string;
  pills?: { icon?: IconName; text: string }[];
  children?: ReactNode;
}) {
  const { project } = useHub();
  const { colors } = useTheme();
  const s = useStyles();
  return (
    <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
      <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", right: -14, bottom: -26, opacity: 0.09 }} pointerEvents="none">
        <Icon name={icon} size={170} color={colors.brandPrimary} />
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Icon name={icon} size={14} color={colors.brandPrimary} />
          <Text style={s.label}>{eyebrow}</Text>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.onSurface }} numberOfLines={2}>
          {title ?? project.title}
        </Text>
        {pills?.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingTop: spacing.xs }}>
            {pills.map((p, i) => (
              <GoldPill key={`${p.text}-${i}`} icon={p.icon} text={p.text} />
            ))}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  );
}
