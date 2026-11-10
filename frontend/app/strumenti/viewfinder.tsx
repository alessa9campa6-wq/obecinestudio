import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ViewfinderFree from "@/src/components/ViewfinderFree";
import { spacing, useTheme } from "@/src/theme";
import { Icon, useStyles } from "@/src/ui";

// Il mirino del regista, aperto dagli strumenti: non serve un progetto.
export default function ViewfinderScreen() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable testID="viewfinder-back" onPress={() => router.back()} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[s.h1, { flex: 1, fontSize: 24 }]}>Director’s viewfinder</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <ViewfinderFree />
      </ScrollView>
    </View>
  );
}
