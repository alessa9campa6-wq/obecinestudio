import { CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraPicker, KitLensChips } from "@/src/components/CameraPicker";
import { BRAND_LOG, clamp, DEVICE, LOGS, LOOKS, RATIOS, ratioLabel } from "@/src/components/Viewfinder";
import { Camera, findCamera } from "@/src/cameras";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, Icon, toast, useStyles } from "@/src/ui";

const MASK = "rgba(0,0,0,0.6)";

// Il mirino del regista, senza progetto: si apre dagli strumenti, inquadra con
// la cornice di camera e ottica e scatta foto ritagliate nel formato scelto.
export default function ViewfinderFree() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [perm, requestCam] = useCameraPermissions();
  const [camera, setCamera] = useState<Camera>(findCamera(null));
  const [focal, setFocal] = useState("35");
  const [squeeze, setSqueeze] = useState("1");
  const [ratio, setRatio] = useState(2.39);
  const [device, setDevice] = useState("26");
  const [look, setLook] = useState("none");
  const [log, setLog] = useState<string>(BRAND_LOG[camera.brand] ?? "709");
  const [full, setFull] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const camRef = useRef<CameraView>(null);

  const f = parseFloat(focal) || 35;
  const sq = parseFloat(squeeze) || 1;
  const k = parseFloat(device) / ((f * 36) / (camera.w * sq));
  let fw = Math.min(1, k) * size.w;
  let fh = fw / ratio;
  if (fh > size.h) {
    fh = size.h;
    fw = fh * ratio;
  }
  const hfov = (2 * Math.atan((camera.w * sq) / (2 * f)) * 180) / Math.PI;
  const lk = LOOKS.find((x) => x.k === look) ?? LOOKS[0];
  const info = `${f}mm${sq > 1 ? ` ${sq}x` : ""} · ${camera.brand} ${camera.name} · ${ratioLabel(ratio)} · HFOV ${hfov.toFixed(0)}°`;

  const apri = async () => {
    if (!perm?.granted) {
      if (perm && !perm.canAskAgain) return Linking.openSettings();
      const r = await requestCam();
      if (!r.granted) return;
    }
    setFull(true);
  };

  const scatta = async () => {
    if (!camRef.current) return;
    setBusy(true);
    try {
      const raw = await camRef.current.takePictureAsync({ quality: 0.9 });
      if (!raw) throw new Error("Scatto non riuscito");
      const pic = await manipulateAsync(raw.uri, [], { compress: 1, format: SaveFormat.JPEG });
      const scale = Math.max(size.w / pic.width, size.h / pic.height);
      const ox = (pic.width * scale - size.w) / 2;
      const oy = (pic.height * scale - size.h) / 2;
      const crop = {
        originX: clamp(((size.w - fw) / 2 + ox) / scale, 0, pic.width - 1),
        originY: clamp(((size.h - fh) / 2 + oy) / scale, 0, pic.height - 1),
        width: Math.min(fw / scale, pic.width),
        height: Math.min(fh / scale, pic.height),
      };
      const out = await manipulateAsync(pic.uri, [{ crop }], { compress: 0.9, format: SaveFormat.JPEG });
      let p = await MediaLibrary.getPermissionsAsync(true);
      if (!p.granted && p.canAskAgain) p = await MediaLibrary.requestPermissionsAsync(true);
      if (!p.granted) {
        toast("Serve il permesso per salvare nel rullino", "error");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(out.uri);
      toast("Scatto salvato nel rullino");
    } catch (e: any) {
      toast(e?.message ?? "Scatto non riuscito", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Icon name="camera-metering-center" size={38} color={colors.brandPrimary} />
        <Text style={[s.h3, { textAlign: "center" }]}>Director’s viewfinder</Text>
        <Text style={[s.muted, { textAlign: "center" }]}>
          Scegli camera, focale e formato, poi apri il mirino: vedi la cornice che avresti sul set e scatti una foto già ritagliata.
        </Text>
        {perm && !perm.granted && !perm.canAskAgain ? (
          <Button icon="cog-outline" label="Consenti fotocamera" onPress={() => void Linking.openSettings()} />
        ) : (
          <Button testID="vf-free-open" icon="fullscreen" label="Apri il mirino" onPress={() => void apri()} />
        )}
      </Card>

      <CameraPicker camera={camera} onChange={(id) => setCamera(findCamera(id))} />
      <KitLensChips focal={String(f)} onPick={(fl, q) => (setFocal(fl), setSqueeze(q ?? "1"))} />

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Field label="Focale (mm)" value={focal} onChangeText={setFocal} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Squeeze" value={squeeze} onChangeText={setSqueeze} keyboardType="decimal-pad" />
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Formato</Text>
        <ChipRow>
          {RATIOS.map((r) => (
            <Chip key={r} testID={`vf-free-ratio-${r}`} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Spazio Log</Text>
        <ChipRow>
          {LOGS.map((x) => (
            <Chip key={x.k} label={x.l} selected={log === x.k} onPress={() => setLog(x.k)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Look (anteprima a schermo)</Text>
        <ChipRow>
          {LOOKS.map((x) => (
            <Chip key={x.k} label={x.l} selected={look === x.k} onPress={() => setLook(x.k)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Obiettivo del telefono</Text>
        <ChipRow>
          {DEVICE.map((d) => (
            <Chip key={d.v} label={d.l} selected={device === d.v} onPress={() => setDevice(d.v)} />
          ))}
        </ChipRow>
      </View>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape", "landscape-left", "landscape-right"]}>
        <View style={{ flex: 1, backgroundColor: "#000000" }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <CameraView ref={camRef} style={{ flex: 1 }} facing="back" mode="picture" />
          {size.w > 0 && (
            <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}>
              <View style={{ position: "absolute", left: (size.w - fw) / 2, top: (size.h - fh) / 2, width: fw, height: fh, backgroundColor: lk.tint, opacity: lk.o }} />
              <View style={{ position: "absolute", left: 0, top: 0, right: 0, height: (size.h - fh) / 2, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: 0, bottom: 0, right: 0, height: (size.h - fh) / 2, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: 0, top: (size.h - fh) / 2, width: (size.w - fw) / 2, height: fh, backgroundColor: MASK }} />
              <View style={{ position: "absolute", right: 0, top: (size.h - fh) / 2, width: (size.w - fw) / 2, height: fh, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: (size.w - fw) / 2, top: (size.h - fh) / 2, width: fw, height: fh, borderWidth: 2, borderColor: colors.brandPrimary }} />
              {k > 1 && <Text style={{ position: "absolute", top: insets.top + 56, alignSelf: "center", color: colors.warning, fontFamily: fonts.text }}>Ottica più larga del telefono: usa l’ultra-grandangolo</Text>}
            </View>
          )}
          <View style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Button testID="vf-free-close" icon="close" variant="secondary" onPress={() => setFull(false)} />
            <View style={{ flex: 1, backgroundColor: MASK, borderRadius: radius.sm, padding: spacing.xs }}>
              <Text numberOfLines={1} style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 12, fontWeight: "700" }}>{info}</Text>
            </View>
          </View>
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + spacing.md, paddingTop: spacing.sm, paddingHorizontal: spacing.lg, gap: spacing.sm, backgroundColor: MASK }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ width: 72 }} />
              <Pressable testID="vf-free-shutter" onPress={scatta} disabled={busy} style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFFFFF" }} />}
              </Pressable>
              <View style={{ width: 72 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {RATIOS.map((r) => (
                <Chip key={r} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
