import { Pressable, Text } from "react-native";

import { fonts, radius, useTheme } from "@/src/theme";
import { Glass, Icon, IconName } from "@/src/ui";

export type GlassSwitchOption<T extends string> = { value: T; label: string; icon?: IconName };

// L'interruttore di vetro a due (o più) pulsanti: un tocco per cambiare vista.
// Lo usano Esplora, il profilo e gli elenchi di follower e seguiti.
export default function GlassSwitch<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: GlassSwitchOption<T>[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Glass
      style={{ flexDirection: "row", borderRadius: radius.pill, padding: 4, gap: 4, borderWidth: 1, borderColor: colors.divider }}
      tint={colors.surfaceSecondary}
    >
      {options.map((o) => {
        const attivo = value === o.value;
        return (
          <Pressable
            key={o.value}
            testID={testID ? `${testID}-${o.value}` : undefined}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
              borderRadius: radius.pill,
              backgroundColor: attivo ? colors.brandPrimary : "transparent",
            }}
          >
            {o.icon ? <Icon name={o.icon} size={17} color={attivo ? colors.onBrandPrimary : colors.muted} /> : null}
            <Text numberOfLines={1} style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: attivo ? "700" : "500", color: attivo ? colors.onBrandPrimary : colors.muted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </Glass>
  );
}
