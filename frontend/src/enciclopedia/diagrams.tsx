import { View } from "react-native";
import Svg, { Circle, Line, Rect, Text as SvgText, G, Path } from "react-native-svg";

import { useTheme } from "@/src/theme";

export function DiagramRuleOfThirds() {
  const { colors } = useTheme();
  const size = 220;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size * 0.66} viewBox={`0 0 ${size} ${size * 0.66}`}>
        <Rect x={0} y={0} width={size} height={size * 0.66} fill={colors.surfaceTertiary} stroke={colors.border} />
        {[1, 2].map((i) => (
          <Line key={`v${i}`} x1={(size / 3) * i} y1={0} x2={(size / 3) * i} y2={size * 0.66} stroke={colors.brandPrimary} strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {[1, 2].map((i) => (
          <Line key={`h${i}`} x1={0} y1={(size * 0.66 / 3) * i} x2={size} y2={(size * 0.66 / 3) * i} stroke={colors.brandPrimary} strokeWidth={1} strokeDasharray="4 4" />
        ))}
        {[
          [size / 3, size * 0.66 / 3],
          [(size / 3) * 2, size * 0.66 / 3],
          [size / 3, (size * 0.66 / 3) * 2],
          [(size / 3) * 2, (size * 0.66 / 3) * 2],
        ].map((p, i) => (
          <Circle key={i} cx={p[0]} cy={p[1]} r={6} fill={colors.brandPrimary} />
        ))}
      </Svg>
    </View>
  );
}

export function DiagramExposureTriangle() {
  const { colors } = useTheme();
  const w = 240;
  const h = 200;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Path d={`M ${w / 2} 20 L ${w - 20} ${h - 20} L 20 ${h - 20} Z`} fill="none" stroke={colors.brandPrimary} strokeWidth={2} />
        <SvgText x={w / 2} y={16} fill={colors.onSurface} fontSize={12} textAnchor="middle">Apertura</SvgText>
        <SvgText x={24} y={h - 8} fill={colors.onSurface} fontSize={12} textAnchor="start">Tempo</SvgText>
        <SvgText x={w - 24} y={h - 8} fill={colors.onSurface} fontSize={12} textAnchor="end">ISO</SvgText>
      </Svg>
    </View>
  );
}

export function DiagramThreePoint() {
  const { colors } = useTheme();
  const w = 260;
  const h = 180;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={w / 2} cy={h / 2} r={18} fill={colors.surfaceTertiary} stroke={colors.border} />
        <SvgText x={w / 2} y={h / 2 + 4} fill={colors.onSurface} fontSize={10} textAnchor="middle">Soggetto</SvgText>
        <Circle cx={w / 2 - 70} cy={h / 2 - 40} r={8} fill={colors.brandPrimary} />
        <SvgText x={w / 2 - 70} y={h / 2 - 52} fill={colors.onSurface} fontSize={9} textAnchor="middle">Key</SvgText>
        <Circle cx={w / 2 + 70} cy={h / 2 - 20} r={8} fill={colors.onSurfaceTertiary} />
        <SvgText x={w / 2 + 70} y={h / 2 - 32} fill={colors.onSurface} fontSize={9} textAnchor="middle">Fill</SvgText>
        <Circle cx={w / 2} cy={h / 2 + 60} r={8} fill={colors.muted} />
        <SvgText x={w / 2} y={h / 2 + 78} fill={colors.onSurface} fontSize={9} textAnchor="middle">Back</SvgText>
      </Svg>
    </View>
  );
}

export function DiagramSensorSizes() {
  const { colors } = useTheme();
  const w = 260;
  const h = 160;
  const sizes = [
    { label: "FF", w: 120, h: 80 },
    { label: "S35", w: 90, h: 50 },
    { label: "APS-C", w: 80, h: 53 },
    { label: "MFT", w: 65, h: 49 },
  ];
  let x = 10;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {sizes.map((s, i) => {
          const cx = 10 + i * 62;
          const cy = (h - s.h) / 2;
          return (
            <G key={s.label}>
              <Rect x={cx} y={cy} width={s.w * 0.5} height={s.h * 0.5} fill="none" stroke={colors.brandPrimary} strokeWidth={1.5} />
              <SvgText x={cx + (s.w * 0.5) / 2} y={cy + (s.h * 0.5) / 2 + 4} fill={colors.onSurface} fontSize={9} textAnchor="middle">{s.label}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export function DiagramColorWheel() {
  const { colors } = useTheme();
  const w = 200;
  const h = 200;
  const r = 80;
  const cx = w / 2;
  const cy = h / 2;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.border} strokeWidth={1} />
        {["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF"].map((c, i) => {
          const ang = (i * 60 * Math.PI) / 180;
          const x = cx + (r - 10) * Math.cos(ang);
          const y = cy + (r - 10) * Math.sin(ang);
          return <Circle key={i} cx={x} cy={y} r={8} fill={c} />;
        })}
        <Circle cx={cx} cy={cy} r={4} fill={colors.onSurface} />
      </Svg>
    </View>
  );
}

import React from "react";
export function DiagramShotSizes() {
  const { colors } = useTheme();
  const w = 320;
  const h = 120;
  const shots = [
    { label: "Campo lungo", body: 0.28 },
    { label: "Figura intera", body: 0.42 },
    { label: "Mezzo busto", body: 0.6 },
    { label: "Primo piano", body: 0.82 },
    { label: "Dettaglio", body: 1 },
  ];
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {shots.map((s, i) => {
          const x = 8 + i * 62;
          const bw = 54;
          const bh = 82;
          const head = 6 + s.body * 8;
          const bodyH = 16 + s.body * 40;
          return (
            <G key={s.label}>
              <Rect x={x} y={10} width={bw} height={bh} fill={colors.surfaceTertiary} stroke={colors.border} />
              <Circle cx={x + bw / 2} cy={20 + head} r={head} fill={colors.onSurfaceSecondary} />
              <Rect x={x + bw / 2 - bodyH / 4} y={20 + head * 2} width={bodyH / 2} height={bodyH} rx={4} fill={colors.onSurfaceSecondary} />
              <SvgText x={x + bw / 2} y={h - 2} fill={colors.muted} fontSize={7} textAnchor="middle">{s.label}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export const DIAGRAMS: Record<string, () => React.ReactElement> = {
  "shot-sizes": DiagramShotSizes,
  "rule-of-thirds": DiagramRuleOfThirds,
  "exposure-triangle": DiagramExposureTriangle,
  "three-point": DiagramThreePoint,
  "sensor-sizes": DiagramSensorSizes,
  "color-wheel": DiagramColorWheel,
};
