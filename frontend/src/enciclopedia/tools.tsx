import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, useStyles } from "@/src/ui";

function Field({ label, value, onChange, keyboardType = "numeric" }: { label: string; value: string; onChange: (t: string) => void; keyboardType?: "numeric" | "default" }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={{ color: colors.onSurface, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, borderWidth: 1, borderColor: colors.border }}
      />
    </View>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.muted, fontSize: 10, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: colors.brandPrimary, fontSize: 18, fontWeight: "800", paddingTop: 2 }}>{value}</Text>
    </View>
  );
}

export function ToolExposure() {
  const [iso, setIso] = useState("800");
  const [aperture, setAperture] = useState("2.8");
  const [shutter, setShutter] = useState("1/50");
  const ev = useMemo(() => {
    const i = parseFloat(iso); const a = parseFloat(aperture);
    const s = shutter.includes("/") ? parseFloat(shutter.split("/")[1]) : parseFloat(shutter);
    if (!i || !a || !s) return null;
    return Math.log2((a * a) / s * (100 / i)).toFixed(1);
  }, [iso, aperture, shutter]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="ISO" value={iso} onChange={setIso} />
        <Field label="Apertura (f)" value={aperture} onChange={setAperture} />
        <Field label="Shutter (1/x)" value={shutter} onChange={setShutter} />
      </View>
      {ev !== null && <Result label="EV (esposizione)" value={ev} />}
    </View>
  );
}

export function ToolShutter() {
  const [fps, setFps] = useState("24");
  const [angle, setAngle] = useState("180");
  const speed = useMemo(() => {
    const f = parseFloat(fps); const a = parseFloat(angle);
    if (!f || !a) return null;
    return (1 / (f * (360 / a))).toFixed(4) + " s";
  }, [fps, angle]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Frame rate (fps)" value={fps} onChange={setFps} />
        <Field label="Shutter angle (°)" value={angle} onChange={setAngle} />
      </View>
      {speed && <Result label="Shutter speed" value={speed} />}
    </View>
  );
}

export function ToolDoF() {
  const [f, setF] = useState("50");
  const [n, setN] = useState("2.8");
  const [s, setS] = useState("3");
  const [c, setC] = useState("0.029");
  const res = useMemo(() => {
    const F = parseFloat(f); const N = parseFloat(n); const S = parseFloat(s); const C = parseFloat(c);
    if (!F || !N || !S || !C) return null;
    const H = (F * F) / (N * C) + F; // hyperfocal in mm... approximate
    const near = (S * (H - F)) / (H + (S - F) * 1000 - F); // rough
    return { hyperfocal: (H / 1000).toFixed(2) + " m", near: isFinite(near) ? near.toFixed(2) + " m" : "—" };
  }, [f, n, s, c]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        <Field label="Focale (mm)" value={f} onChange={setF} />
        <Field label="Apertura (f)" value={n} onChange={setN} />
        <Field label="Distanza (m)" value={s} onChange={setS} />
        <Field label="CoC (mm)" value={c} onChange={setC} />
      </View>
      {res && (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Result label="Iperfocale" value={res.hyperfocal} />
          <Result label="Limite vicino (appross.)" value={res.near} />
        </View>
      )}
      <Text style={{ color: "#8E8E93", fontSize: 11 }}>Calcolo approssimato. Il CoC tipico per FF è 0.029mm, per S35 0.019mm.</Text>
    </View>
  );
}

export function ToolCrop() {
  const [f, setF] = useState("50");
  const [crop, setCrop] = useState("1.5");
  const eq = useMemo(() => {
    const F = parseFloat(f); const c = parseFloat(crop);
    if (!F || !c) return null;
    return (F * c).toFixed(1) + " mm (FF equiv.)";
  }, [f, crop]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Focale (mm)" value={f} onChange={setF} />
        <Field label="Crop factor" value={crop} onChange={setCrop} />
      </View>
      {eq && <Result label="Focale equivalente (Full Frame)" value={eq} />}
    </View>
  );
}

export function ToolND() {
  const [stops, setStops] = useState("3");
  const [base, setBase] = useState("1/50");
  const res = useMemo(() => {
    const s = parseFloat(stops);
    if (!s) return null;
    return (Math.pow(2, s)).toFixed(0) + "× riduzione luce";
  }, [stops]);
  return (
    <View style={{ gap: spacing.md }}>
      <Field label="Stop di ND" value={stops} onChange={setStops} />
      {res && <Result label="Riduzione luce" value={res} />}
      <Text style={{ color: "#8E8E93", fontSize: 11 }}>1 stop = 0.3 ND, 2 stop = 0.6, 3 stop = 0.9, 4 stop = 1.2.</Text>
    </View>
  );
}

export function ToolLighting() {
  const [d1, setD1] = useState("2");
  const [e1, setE1] = useState("1000");
  const [d2, setD2] = useState("4");
  const e2 = useMemo(() => {
    const a = parseFloat(d1); const b = parseFloat(e1); const c = parseFloat(d2);
    if (!a || !b || !c) return null;
    return (b * (a * a) / (c * c)).toFixed(0) + " lux";
  }, [d1, e1, d2]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        <Field label="Distanza 1 (m)" value={d1} onChange={setD1} />
        <Field label="Illuminamento 1 (lux)" value={e1} onChange={setE1} />
        <Field label="Distanza 2 (m)" value={d2} onChange={setD2} />
      </View>
      {e2 && <Result label="Illuminamento a distanza 2" value={e2} />}
    </View>
  );
}

export function ToolBattery() {
  const [wh, setWh] = useState("98");
  const [w, setW] = useState("40");
  const rt = useMemo(() => {
    const a = parseFloat(wh); const b = parseFloat(w);
    if (!a || !b) return null;
    const h = a / b;
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}h ${mm}m`;
  }, [wh, w]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Capacità batteria (Wh)" value={wh} onChange={setWh} />
        <Field label="Consumo (W)" value={w} onChange={setW} />
      </View>
      {rt && <Result label="Autonomia stimata" value={rt} />}
    </View>
  );
}

export function ToolStorage() {
  const [bitrate, setBitrate] = useState("400");
  const [minutes, setMinutes] = useState("60");
  const res = useMemo(() => {
    const b = parseFloat(bitrate); const m = parseFloat(minutes);
    if (!b || !m) return null;
    const gb = (b * m * 60) / 8 / 1024;
    return gb.toFixed(1) + " GB";
  }, [bitrate, minutes]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Bitrate (Mbps)" value={bitrate} onChange={setBitrate} />
        <Field label="Durata (min)" value={minutes} onChange={setMinutes} />
      </View>
      {res && <Result label="Spazio richiesto" value={res} />}
    </View>
  );
}

export function ToolTimecode() {
  const [fps, setFps] = useState("24");
  const [frames, setFrames] = useState("86400");
  const tc = useMemo(() => {
    const f = parseFloat(fps); const fr = parseFloat(frames);
    if (!f || !fr) return null;
    const totalSec = fr / f;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    const ff = Math.round((totalSec - Math.floor(totalSec)) * f);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
  }, [fps, frames]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Frame rate (fps)" value={fps} onChange={setFps} />
        <Field label="Frame totali" value={frames} onChange={setFrames} />
      </View>
      {tc && <Result label="Timecode" value={tc} />}
    </View>
  );
}

export function ToolFramerate() {
  const [shoot, setShoot] = useState("120");
  const [play, setPlay] = useState("24");
  const factor = useMemo(() => {
    const s = parseFloat(shoot); const p = parseFloat(play);
    if (!s || !p) return null;
    return (s / p).toFixed(2) + "× slow motion";
  }, [shoot, play]);
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Frame rate ripresa (fps)" value={shoot} onChange={setShoot} />
        <Field label="Frame rate riproduzione (fps)" value={play} onChange={setPlay} />
      </View>
      {factor && <Result label="Fattore di rallentamento" value={factor} />}
    </View>
  );
}

import React from "react";
export const TOOLS: Record<string, () => React.ReactElement> = {
  exposure: ToolExposure,
  shutter: ToolShutter,
  dof: ToolDoF,
  crop: ToolCrop,
  focale: ToolCrop,
  nd: ToolND,
  lighting: ToolLighting,
  battery: ToolBattery,
  storage: ToolStorage,
  timecode: ToolTimecode,
  framerate: ToolFramerate,
};
