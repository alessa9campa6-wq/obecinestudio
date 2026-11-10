import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Camera, CAMERAS } from "@/src/cameras";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Chip, ChipRow, Field, useStyles } from "@/src/ui";

const num = (v: string) => parseFloat(v.replace(",", ".")) || 0;
const grad = (rad: number) => (rad * 180) / Math.PI;
const metri = (mm: number) => (Number.isFinite(mm) && mm > 0 ? (mm / 1000).toFixed(2) + " m" : "lontano");

export default function LensTool() {
  const { colors } = useTheme();
  const s = useStyles();
  const [camera, setCamera] = useState<Camera>(CAMERAS[1] ?? CAMERAS[0]);
  const [focale, setFocale] = useState("35");
  const [apertura, setApertura] = useState("2.8");
  const [distanza, setDistanza] = useState("3");

  const r = useMemo(() => {
    const f = num(focale);
    const N = num(apertura) || 2.8;
    const d = num(distanza);
    if (!f || !d) return null;
    const diag = Math.sqrt(camera.w * camera.w + camera.h * camera.h);
    const coc = diag / 1500;
    const H = (f * f) / (N * coc) + f;
    const mm = d * 1000;
    const vicino = (H * mm) / (H + mm);
    const lontano = mm < H ? (H * mm) / (H - mm) : Infinity;
    return {
      orizzontale: grad(2 * Math.atan(camera.w / (2 * f))),
      verticale: grad(2 * Math.atan(camera.h / (2 * f))),
      equivalente: f * (36 / camera.w),
      larghezza: 2 * d * Math.tan(Math.atan(camera.w / (2 * f))),
      altezza: 2 * d * Math.tan(Math.atan(camera.h / (2 * f))),
      iperfocale: H / 1000,
      vicino: vicino / 1000,
      lontano: lontano / 1000,
    };
  }, [camera, focale, apertura, distanza]);

  const dato = (l: string, v: string) => (
    <View style={{ minWidth: 140, flex: 1, padding: spacing.md, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, gap: 2 }}>
      <Text style={s.label}>{l}</Text>
      <Text style={{ fontFamily: fonts.text, fontSize: 19, fontWeight: "700", color: colors.onSurface }}>{v}</Text>
    </View>
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Sensore</Text>
        <ChipRow>
          {CAMERAS.slice(0, 12).map((c) => (
            <Chip key={c.brand + "-" + c.name} label={c.name} selected={camera.name === c.name && camera.brand === c.brand} onPress={() => setCamera(c)} />
          ))}
        </ChipRow>
        <Text style={s.muted}>
          {camera.brand} {camera.name} · {camera.w}x{camera.h} mm{camera.format ? " · " + camera.format : ""}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Field label="Focale (mm)" value={focale} onChangeText={setFocale} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Apertura" value={apertura} onChangeText={setApertura} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Distanza (m)" value={distanza} onChangeText={setDistanza} keyboardType="decimal-pad" />
        </View>
      </View>

      {r ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {dato("Campo orizzontale", r.orizzontale.toFixed(1) + "°")}
            {dato("Campo verticale", r.verticale.toFixed(1) + "°")}
            {dato("Inquadratura", r.larghezza.toFixed(2) + " x " + r.altezza.toFixed(2) + " m")}
            {dato("Equivalente full frame", r.equivalente.toFixed(0) + " mm")}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {dato("Iperfocale", metri(r.iperfocale * 1000))}
            {dato("A fuoco da", metri(r.vicino * 1000))}
            {dato("A fuoco fino a", metri(r.lontano * 1000))}
          </View>
          <Text style={s.muted}>
            Con un {focale || "?"} mm a f/{apertura || "?"} con {camera.name}, a {distanza || "?"} m. La profondita di campo usa un cerchio di confusione pari alla diagonale diviso 1500.
          </Text>
        </>
      ) : (
        <Text style={s.muted}>Scrivi focale e distanza per vedere i numeri.</Text>
      )}
    </ScrollView>
  );
}

