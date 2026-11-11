import { useState } from "react";
import { Text, View } from "react-native";

import { CameraPicker, KitLensChips } from "@/src/components/CameraPicker";
import { SectionHero } from "@/src/components/SectionHero";
import { ModuleHeader, ModuleScroll, useHub, useProjectCamera } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, useStyles } from "@/src/ui";

const SQUEEZE = ["1", "1.33", "1.5", "1.6", "1.8", "2"];
const n = (v: string) => parseFloat(v.replace(",", ".")) || 0;
const deg = (r: number) => (r * 180) / Math.PI;
const fmtM = (mm: number) => (isFinite(mm) ? `${(mm / 1000).toFixed(2)} m` : "∞");

function Metric({ l, v, testID }: { l: string; v: string; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ minWidth: 140, flex: 1, padding: spacing.md, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, gap: 2 }}>
      <Text style={s.label}>{l}</Text>
      <Text testID={testID} style={{ fontFamily: fonts.text, fontSize: 20, fontWeight: "700", color: colors.onSurface }}>{v}</Text>
    </View>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>{children}</View>;
const Half = ({ children }: { children: React.ReactNode }) => <View style={{ flex: 1, minWidth: 140 }}>{children}</View>;

export function LensCalculator({ def }: { def: ModuleDef }) {
  const s = useStyles();
  const { project } = useHub();
  const [sensor, setCamera] = useProjectCamera(project.id);
  const [focal, setFocal] = useState("35");
  const [stop, setStop] = useState("2.8");
  const [dist, setDist] = useState("3");
  const [sq, setSq] = useState("1");
  const f = n(focal);
  const N = n(stop);
  const sMM = n(dist) * 1000;
  const sqz = n(sq) || 1;
  const diag = Math.hypot(sensor.w, sensor.h);
  const crop = 43.27 / diag;
  const coc = diag / 1500;
  const H = f && N ? (f * f) / (N * coc) + f : 0;
  const near = H ? (sMM * (H - f)) / (H + sMM - 2 * f) : 0;
  const far = H && sMM < H ? (sMM * (H - f)) / (H - sMM) : Infinity;
  const hfov = f ? deg(2 * Math.atan((sensor.w * sqz) / (2 * f))) : 0;
  const vfov = f ? deg(2 * Math.atan(sensor.h / (2 * f))) : 0;
  const dfov = f ? deg(2 * Math.atan(Math.hypot(sensor.w * sqz, sensor.h) / (2 * f))) : 0;
  const fieldW = f ? (sMM * sensor.w * sqz) / f / 1000 : 0;
  const results: [string, string][] = [
    ["FOV orizzontale", `${hfov.toFixed(1)}°`], ["FOV verticale", `${vfov.toFixed(1)}°`], ["FOV diagonale", `${dfov.toFixed(1)}°`],
    ["Crop factor", `${crop.toFixed(2)}x`], ["Equivalente FF", `${(f * crop).toFixed(0)} mm`], ["Larghezza inquadrata", `${fieldW.toFixed(2)} m`],
    ["Iperfocale", fmtM(H)], ["Fuoco vicino", fmtM(near)], ["Fuoco lontano", fmtM(far)], ["Profondità di campo", isFinite(far) ? fmtM(far - near) : "∞"],
  ];
  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader def={def} subtitle="Campo visivo, profondità di campo e iperfocale" right={<Button testID="lens-export-pdf" icon="file-pdf-box" variant="secondary" onPress={() => exportHtml("Lens calculator", wrap("Lens calculator", `<p>${sensor.brand} ${sensor.name} (${sensor.w}×${sensor.h} mm) · ${f}mm · T/f ${N} · fuoco ${dist} m · squeeze ${sq}x</p><table>${results.map((r) => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join("")}</table>`))} />} />
      <ModuleScroll>
        <SectionHero icon="camera-iris" eyebrow="Lens calculator" />
        <CameraPicker camera={sensor} onChange={setCamera} />
        <KitLensChips focal={focal} onPick={(fl, q) => (setFocal(fl), setSq(SQUEEZE.includes(q ?? "1") ? (q ?? "1") : "1"))} />
        <Row>
          <Half><Field testID="lens-focal-input" label="Focale (mm)" value={focal} onChangeText={setFocal} keyboardType="decimal-pad" /></Half>
          <Half><Field testID="lens-stop-input" label="Diaframma (f/T)" value={stop} onChangeText={setStop} keyboardType="decimal-pad" /></Half>
          <Half><Field testID="lens-distance-input" label="Distanza fuoco (m)" value={dist} onChangeText={setDist} keyboardType="decimal-pad" /></Half>
        </Row>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Anamorfico (squeeze)</Text>
          <ChipRow>
            {SQUEEZE.map((x) => (
              <Chip key={x} testID={`squeeze-${x}`} label={`${x}x`} selected={sq === x} onPress={() => setSq(x)} />
            ))}
          </ChipRow>
        </View>
        <Row>
          {results.map(([l, v]) => (
            <Metric key={l} l={l} v={v} testID={`lens-result-${l}`} />
          ))}
        </Row>
        <Text style={s.muted}>Circolo di confusione: {coc.toFixed(3)} mm (diagonale/1500).</Text>
      </ModuleScroll>
    </View>
  );
}

const RATIOS = [
  { r: 1.33, l: "4:3 Academy" }, { r: 1.66, l: "1.66 Europeo" }, { r: 1.78, l: "16:9 HD" }, { r: 1.85, l: "1.85 Flat" },
  { r: 2.0, l: "2:1 Univisium" }, { r: 2.39, l: "2.39 Scope" }, { r: 2.76, l: "2.76 Ultra Panavision" }, { r: 0.5625, l: "9:16 Verticale" }, { r: 0.8, l: "4:5 Social" }, { r: 1, l: "1:1" },
];
const RES = [
  { l: "HD", w: 1920, h: 1080 }, { l: "DCI 2K", w: 2048, h: 1080 }, { l: "UHD", w: 3840, h: 2160 }, { l: "DCI 4K", w: 4096, h: 2160 }, { l: "6K", w: 6144, h: 3240 },
];
const CODECS = [
  { l: "ProRes 422 Proxy", m: 145 }, { l: "ProRes 422 LT", m: 328 }, { l: "ProRes 422", m: 471 }, { l: "ProRes 422 HQ", m: 707 }, { l: "ProRes 4444", m: 1061 },
  { l: "BRAW 8:1", m: 270 }, { l: "BRAW 3:1", m: 720 }, { l: "H.264 / XAVC", m: 100 }, { l: "H.265 10bit", m: 150 },
];

export function FormatsTool({ def, noHeader }: { def: ModuleDef; noHeader?: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [res, setRes] = useState(RES[2]);
  const [ratio, setRatio] = useState(RATIOS[5]);
  const [codec, setCodec] = useState(CODECS[3]);
  const [mbps, setMbps] = useState(String(CODECS[3].m));
  const [minutes, setMinutes] = useState("60");
  const [fps, setFps] = useState("25");
  const [shootFps, setShootFps] = useState("100");
  const [clip, setClip] = useState("10");
  const containerR = res.w / res.h;
  const active = ratio.r >= containerR ? { w: res.w, h: Math.round(res.w / ratio.r) } : { w: Math.round(res.h * ratio.r), h: res.h };
  const gb = (n(mbps) * 60 * n(minutes)) / 8 / 1000;
  const speed = n(fps) ? (n(fps) / n(shootFps)) * 100 : 0;
  const slowLen = n(fps) ? (n(clip) * n(shootFps)) / n(fps) : 0;
  const prevW = 280;
  return (
    <View style={{ flex: 1 }}>
      {noHeader ? null : <ModuleHeader def={def} subtitle="Aspect ratio, risoluzioni, storage, shutter e slow motion" />}
      <ModuleScroll>
        {noHeader ? null : <SectionHero icon="aspect-ratio" eyebrow="Formati" pills={[{ icon: "aspect-ratio", text: `${res.w}×${res.h}` }, { icon: "crop", text: ratio.l }]} />}
        <SectionHero icon="camera-iris" eyebrow="Lens calculator" />
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Aspect ratio & area attiva</Text>
          <ChipRow>{RES.map((x) => <Chip key={x.l} testID={`res-${x.l}`} label={`${x.l} ${x.w}×${x.h}`} selected={res.l === x.l} onPress={() => setRes(x)} />)}</ChipRow>
          <ChipRow>{RATIOS.map((x) => <Chip key={x.l} testID={`ratio-${x.r}`} label={x.l} selected={ratio.l === x.l} onPress={() => setRatio(x)} />)}</ChipRow>
          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center", flexWrap: "wrap" }}>
            <View style={{ width: prevW, height: prevW / containerR, backgroundColor: colors.surfaceInverse, alignItems: "center", justifyContent: "center", borderRadius: 4 }}>
              <View style={{ width: (active.w / res.w) * prevW, height: (active.h / res.h) * (prevW / containerR), backgroundColor: colors.brandPrimary, opacity: 0.85 }} />
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text testID="format-active-area" style={s.h3}>Area attiva: {active.w} × {active.h}</Text>
              <Text style={s.body}>Bande: {Math.round((res.h - active.h) / 2)} px sopra/sotto · {Math.round((res.w - active.w) / 2)} px lati</Text>
              <Text style={s.muted}>Container {containerR.toFixed(2)}:1</Text>
            </View>
          </View>
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Calcolo storage</Text>
          <ChipRow>{CODECS.map((c) => <Chip key={c.l} testID={`codec-${c.l}`} label={c.l} selected={codec.l === c.l} onPress={() => (setCodec(c), setMbps(String(c.m)))} />)}</ChipRow>
          <Row>
            <Half><Field testID="storage-mbps-input" label="Bitrate (Mbps)" value={mbps} onChangeText={setMbps} keyboardType="decimal-pad" /></Half>
            <Half><Field testID="storage-minutes-input" label="Minuti girati" value={minutes} onChangeText={setMinutes} keyboardType="decimal-pad" /></Half>
          </Row>
          <Row>
            <Metric testID="storage-gb" l="Spazio" v={`${gb.toFixed(1)} GB`} />
            <Metric l="Per ora" v={`${((n(mbps) * 3600) / 8 / 1000).toFixed(0)} GB/h`} />
            <Metric l="Con backup x2" v={`${(gb * 2 / 1000).toFixed(2)} TB`} />
          </Row>
          <Text style={s.muted}>Bitrate indicativi per UHD 25p; modificali secondo la tua camera.</Text>
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Shutter & slow motion</Text>
          <Row>
            <Half><Field testID="fps-project-input" label="FPS progetto" value={fps} onChangeText={setFps} keyboardType="decimal-pad" /></Half>
            <Half><Field testID="fps-shoot-input" label="FPS ripresa" value={shootFps} onChangeText={setShootFps} keyboardType="decimal-pad" /></Half>
            <Half><Field testID="clip-seconds-input" label="Durata ripresa (s)" value={clip} onChangeText={setClip} keyboardType="decimal-pad" /></Half>
          </Row>
          <Row>
            <Metric l="Shutter 180°" v={`1/${Math.round(n(shootFps) * 2)}`} />
            <Metric testID="slowmo-speed" l="Velocità" v={`${speed.toFixed(0)}%`} />
            <Metric l="Durata in timeline" v={`${slowLen.toFixed(1)} s`} />
          </Row>
        </Card>
      </ModuleScroll>
    </View>
  );
}

