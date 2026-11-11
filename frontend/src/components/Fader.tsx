// Fader orizzontale riutilizzabile: niente dipendenze nuove, solo PanResponder.
// Il valore è continuo con passo, così tratto e opacità si regolano con il dito.
import { useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { useStyles } from "@/src/ui";

export function Fader({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  testID,
  gradient,
  disabled,
  tone = "light",
}: {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  testID?: string;
  gradient?: string[];
  disabled?: boolean;
  tone?: "light" | "dark";
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const [w, setW] = useState(0);
  const wRef = useRef(0);
  wRef.current = w;
  const cb = useRef(onChange);
  cb.current = onChange;

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const dark = tone === "dark";
  const track = dark ? "rgba(255,255,255,0.16)" : colors.surfaceTertiary;
  const line = dark ? "rgba(255,255,255,0.22)" : colors.divider;
  const labelColor = dark ? "#B4AC9A" : colors.muted;
  const valueColor = dark ? "#F4EFE3" : colors.onSurface;
  const fill = dark ? "#D4AF37" : colors.brandPrimary;

  const pick = (x: number) => {
    const width = wRef.current;
    if (!width) return;
    const raw = min + Math.max(0, Math.min(1, x / width)) * (max - min);
    const snapped = Math.round(raw / step) * step;
    cb.current(Math.max(min, Math.min(max, Number(snapped.toFixed(4)))));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={{ gap: spacing.xs, opacity: disabled ? 0.4 : 1 }}>
      {label || format ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {label ? <Text style={[s.label, { color: labelColor }]}>{label}</Text> : null}
          <View style={{ flex: 1 }} />
          {format ? (
            <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: valueColor }}>{format(value)}</Text>
          ) : null}
        </View>
      ) : null}
      <View
        testID={testID}
        {...(disabled ? {} : responder.panHandlers)}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: 32, justifyContent: "center" }}
      >
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: track, borderWidth: 1, borderColor: line, overflow: "hidden" }}>
          {gradient ? (
            <View style={{ flexDirection: "row", height: 8 }}>
              {gradient.map((c) => (
                <View key={c} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </View>
          ) : (
            <View style={{ width: `${pct * 100}%`, height: 8, backgroundColor: fill }} />
          )}
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: Math.max(0, Math.min(w - 24, pct * w - 12)),
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: dark ? "#F4EFE3" : "#FFFFFF",
            borderWidth: 2,
            borderColor: gradient ? colors.border : dark ? "#8A7A45" : colors.brandPrimary,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        />
      </View>
    </View>
  );
}
