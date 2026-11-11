// Ruota colori in SVG: angolo = tonalità, distanza dal centro = saturazione,
// con un fader separato per la luminosità. Nessuna dipendenza nuova e nessun
// motore grafico da montare: resta leggera dentro la tavola da disegno.
import { useRef } from "react";
import { PanResponder, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";

import { Fader } from "@/src/components/Fader";
import { fonts, spacing, useTheme } from "@/src/theme";

export type Hsv = { h: number; s: number; v: number };

export function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const [r1, g1, b1] =
    hh < 1 ? [c, x, 0] : hh < 2 ? [x, c, 0] : hh < 3 ? [0, c, x] : hh < 4 ? [0, x, c] : hh < 5 ? [x, 0, c] : [c, 0, x];
  const m = v - c;
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r1)}${to(g1)}${to(b1)}`.toUpperCase();
}

export function hexToHsv(hex: string): Hsv {
  const clean = (hex || "").replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max ? d / max : 0, v: max };
}

const WEDGES = 60;

function wedge(cx: number, cy: number, r: number, a0: number, a1: number) {
  const rad = (a: number) => (a * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  return `M${cx} ${cy} L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

export function ColorWheel({ hsv, onChange, size = 200 }: { hsv: Hsv; onChange: (v: Hsv) => void; size?: number }) {
  const { colors } = useTheme();
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const cb = useRef(onChange);
  cb.current = onChange;
  const current = useRef(hsv);
  current.current = hsv;

  const pick = (x: number, y: number) => {
    const s2 = sizeRef.current;
    const c = s2 / 2;
    const dx = x - c;
    const dy = y - c;
    const dist = Math.hypot(dx, dy);
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const sat = Math.max(0, Math.min(1, dist / (c - 6)));
    cb.current({ ...current.current, h: hue, s: sat });
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const thumbR = Math.max(0, Math.min(1, hsv.s)) * (r - 2);
  const thumbX = cx + thumbR * Math.cos((hsv.h * Math.PI) / 180);
  const thumbY = cy + thumbR * Math.sin((hsv.h * Math.PI) / 180);
  const hex = hsvToHex(hsv);

  return (
    <View style={{ gap: spacing.sm, alignItems: "center" }}>
      <View testID="color-wheel" {...responder.panHandlers} style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="cw-sat" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <G>
            {Array.from({ length: WEDGES }, (_, i) => {
              const a0 = (i * 360) / WEDGES;
              const a1 = ((i + 1) * 360) / WEDGES;
              return <Path key={i} d={wedge(cx, cy, r, a0, a1)} fill={hsvToHex({ h: a0, s: 1, v: 1 })} />;
            })}
            <Circle cx={cx} cy={cy} r={r} fill="url(#cw-sat)" />
            <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
          </G>
          <Circle cx={thumbX} cy={thumbY} r={11} fill={hex} stroke="#FFFFFF" strokeWidth={3} />
          <Circle cx={thumbX} cy={thumbY} r={11} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
        </Svg>
      </View>
      <View style={{ width: size }}>
        <Fader
          testID="color-wheel-brightness"
          label="Luminosità"
          value={hsv.v}
          min={0.05}
          max={1}
          step={0.01}
          onChange={(v) => onChange({ ...hsv, v })}
          format={(v) => `${Math.round(v * 100)}%`}
          gradient={["#000000", hsvToHex({ h: hsv.h, s: hsv.s, v: 1 })]}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: hex, borderWidth: 1, borderColor: colors.border }} />
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.divider }}>
          <Text style={{ fontFamily: fonts.script, fontSize: 12.5, color: colors.onSurface }}>{hex}</Text>
        </View>
      </View>
    </View>
  );
}
