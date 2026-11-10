import { useRouter } from "expo-router";
import { View } from "react-native";

import ViewfinderFree from "@/src/components/ViewfinderFree";

// Il mirino del regista, aperto dagli strumenti: non serve un progetto.
export default function ViewfinderScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ViewfinderFree onExit={() => router.back()} />
    </View>
  );
}
