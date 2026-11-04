import { ScrollView, Text, View } from "react-native";

import { BRANDS, Camera, cameraId, CAMERAS } from "@/src/cameras";
import { useLibrary } from "@/src/hooks";
import { focalNum, Lens } from "@/src/lenses";
import { spacing } from "@/src/theme";
import { Chip, ChipRow, useStyles } from "@/src/ui";
import { useState } from "react";

export function CameraPicker({ camera, onChange }: { camera: Camera; onChange: (id: string) => void }) {
  const s = useStyles();
  const [brand, setBrand] = useState(camera.brand);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>Camera · {camera.brand} {camera.name} ({camera.w}×{camera.h} mm)</Text>
      <ChipRow>
        {BRANDS.map((b) => (
          <Chip key={b} testID={`camera-brand-${b}`} label={b} selected={brand === b} onPress={() => setBrand(b)} />
        ))}
      </ChipRow>
      <ChipRow>
        {CAMERAS.filter((c) => c.brand === brand).map((c) => (
          <Chip key={c.name} testID={`camera-model-${c.name}`} label={c.name} selected={cameraId(c) === cameraId(camera)} onPress={() => onChange(cameraId(c))} />
        ))}
      </ChipRow>
    </View>
  );
}

// Lens chips from the user's kit; falls back to common focal lengths.
export function KitLensChips({ focal, onPick }: { focal: string; onPick: (focal: string, squeeze?: string) => void }) {
  const { q } = useLibrary("lens");
  const kit = (q.data ?? []).map((l) => l.data as Lens);
  const s = useStyles();
  const list = kit.length ? kit : [18, 25, 35, 50, 85, 135].map((f) => ({ focal: String(f), series: "", squeeze: "1" }) as Lens);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>{kit.length ? "Dal tuo kit" : "Focali comuni"}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {list.map((l, i) => (
          <Chip key={i} testID={`kit-chip-${i}`} label={`${l.focal}mm${l.series ? " " + l.series : ""}`} selected={String(focalNum(l.focal)) === focal} onPress={() => onPick(String(focalNum(l.focal)), l.squeeze)} />
        ))}
      </ScrollView>
    </View>
  );
}
