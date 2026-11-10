import { Image } from "expo-image";
import { Text, View } from "react-native";

import { fotoPersona, nomePersona, Person } from "@/src/social";
import { useTheme } from "@/src/theme";

const iniziali = (nome: string) =>
  (nome.replace("@", "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();

// Foto se c'è, altrimenti le iniziali sul colore del marchio.
export default function PersonAvatar({ person, size = 36 }: { person?: Person | null; size?: number }) {
  const { colors } = useTheme();
  const uri = fotoPersona(person);
  const bordo = { width: size, height: size, borderRadius: size / 2, overflow: "hidden" as const };
  if (uri) {
    return (
      <View style={[bordo, { backgroundColor: colors.surfaceTertiary }]}>
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={120} />
      </View>
    );
  }
  return (
    <View style={[bordo, { backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ color: colors.onBrandTertiary, fontWeight: "700", fontSize: Math.max(11, size / 3) }}>
        {iniziali(nomePersona(person))}
      </Text>
    </View>
  );
}
