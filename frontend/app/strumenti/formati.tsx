import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormatsTool } from "@/src/components/CalcTools";
import { moduleByKey } from "@/src/modules";
import { spacing, useTheme } from "@/src/theme";
import { Icon, useStyles } from "@/src/ui";

// Formati fuori dai progetti: risoluzioni, aspect ratio, storage, shutter e slow motion.
export default function FormatiScreen() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const def = moduleByKey("formats")!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable testID="formati-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.h1, { flex: 1, fontSize: 24 }]} numberOfLines={1}>Formati</Text>
      </View>
      <FormatsTool def={def} noHeader />
    </View>
  );
}
