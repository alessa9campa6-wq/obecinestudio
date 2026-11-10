import * as DocumentPicker from "expo-document-picker";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { File } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { uploadImage } from "@/src/api";
import { CameraPicker, KitLensChips } from "@/src/components/CameraPicker";
import { useItemMutations, useLibrary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub, useProjectCamera } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, Icon, toast, useStyles } from "@/src/ui";

export const RATIOS = [2.39, 2.0, 1.85, 1.78, 1.33, 1, 0.5625];
export const DEVICE = [{ v: "13", l: "Ultra-wide 13mm" }, { v: "24", l: "24mm" }, { v: "26", l: "26mm (iPhone)" }, { v: "29", l: "29mm (iPad)" }];
// Overlays sit on a live camera feed, so they stay identical in both themes.
const MASK = "rgba(0,0,0,0.6)";
export const LOGS = [
  { k: "709", l: "Rec.709 (nessun Log)", tint: "transparent", o: 0 },
  { k: "slog3", l: "Sony S-Log3", tint: "rgb(128,128,128)", o: 0.4 },
  { k: "logc4", l: "ARRI LogC4", tint: "rgb(130,128,124)", o: 0.38 },
  { k: "log3g10", l: "RED Log3G10", tint: "rgb(126,126,130)", o: 0.42 },
  { k: "bmdfilm", l: "BMD Film Gen5", tint: "rgb(128,126,120)", o: 0.36 },
  { k: "vlog", l: "Panasonic V-Log", tint: "rgb(126,128,128)", o: 0.38 },
  { k: "clog3", l: "Canon C-Log3", tint: "rgb(128,128,126)", o: 0.34 },
  { k: "flog2", l: "Fuji F-Log2", tint: "rgb(124,128,126)", o: 0.4 },
  { k: "nlog", l: "Nikon N-Log", tint: "rgb(128,127,125)", o: 0.37 },
  { k: "dlog", l: "DJI D-Log", tint: "rgb(127,127,127)", o: 0.39 },
  { k: "applelog", l: "Apple Log", tint: "rgb(127,128,129)", o: 0.36 },
];
// Brand log profile suggested from the project camera.
export const BRAND_LOG: Record<string, string> = { ARRI: "logc4", Sony: "slog3", RED: "log3g10", Blackmagic: "bmdfilm", Panasonic: "vlog", Canon: "clog3", Fujifilm: "flog2", Nikon: "nlog", DJI: "dlog", Apple: "applelog" };
export const LOOKS = [
  { k: "none", l: "Nessuna LUT creativa", tint: "transparent", o: 0 },
  { k: "teal", l: "Teal & Orange", tint: "rgb(0,128,128)", o: 0.2 },
  { k: "kodak", l: "Kodak 2383", tint: "rgb(255,150,60)", o: 0.2 },
  { k: "bleach", l: "Bleach bypass", tint: "rgb(210,210,200)", o: 0.3 },
  { k: "night", l: "Notte blu", tint: "rgb(20,40,120)", o: 0.3 },
];
export const ratioLabel = (r: number) => (r === 0.5625 ? "9:16" : r === 1 ? "1:1" : `${r.toFixed(2)}:1`);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Reads a .cube LUT and derives the colour it gives to mid-grey, used as an indicative look preview.
async function readCube(uri: string) {
  const text = Platform.OS === "web" ? await (await fetch(uri)).text() : await new File(uri).text();
  const size = parseInt(text.match(/LUT_3D_SIZE\s+(\d+)/)?.[1] ?? "0", 10);
  const rows = text.split("\n").map((l) => l.trim()).filter((l) => /^[-\d.]/.test(l)).map((l) => l.split(/\s+/).map(Number)).filter((v) => v.length === 3);
  if (!size || rows.length < size ** 3) throw new Error("File .cube non valido");
  const mid = Math.floor((size - 1) / 2);
  const v = rows[mid + mid * size + mid * size * size];
  return `rgb(${v.map((x) => Math.round(clamp(x, 0, 1) * 255)).join(",")})`;
}

export default function Viewfinder({ def }: { def: ModuleDef }) {
  const { project, go } = useHub();
  const [perm, requestCam] = useCameraPermissions();
  const [mic, requestMic] = useMicrophonePermissions();
  const [camera, setCamera] = useProjectCamera(project.id);
  const refs = useItemMutations(project.id, "reference");
  const luts = useLibrary("lut");
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [focal, setFocal] = useState("35");
  const [squeeze, setSqueeze] = useState("1");
  const [ratio, setRatio] = useState(2.39);
  const [device, setDevice] = useState("26");
  const [look, setLook] = useState("none");
  const [log, setLog] = useState<string>(BRAND_LOG[camera.brand] ?? "709");
  const [convert, setConvert] = useState(true);
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [toRoll, setToRoll] = useState(false);
  const [rollBlocked, setRollBlocked] = useState(false);
  const [full, setFull] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
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
  const allLooks = [...LOOKS, ...(luts.q.data ?? []).map((l) => ({ k: l.id, l: l.title, tint: l.data.tint as string, o: 0.35 }))];
  const lk = allLooks.find((x) => x.k === look) ?? LOOKS[0];
  const lg = LOGS.find((x) => x.k === log) ?? LOGS[0];
  const isLog = lg.k !== "709";
  // Log footage looks flat; the brand conversion LUT (Log -> Rec.709) restores contrast, then the creative LUT goes on top.
  const showFlat = isLog && !convert;
  const lookLabel = [isLog ? (convert ? `${lg.l} → Rec.709` : `${lg.l} (flat)`) : "Rec.709", lk.k !== "none" ? lk.l : ""].filter(Boolean).join(" + ");
  const info = `${f}mm${sq > 1 ? ` ${sq}x` : ""} · ${camera.brand} ${camera.name} · ${ratioLabel(ratio)} · HFOV ${hfov.toFixed(0)}° · ${lookLabel}`;

  const saveRoll = async (uri: string) => {
    if (!toRoll || Platform.OS === "web") return;
    let p = await MediaLibrary.getPermissionsAsync(true);
    if (!p.granted && p.canAskAgain) p = await MediaLibrary.requestPermissionsAsync(true);
    if (!p.granted) return setRollBlocked(!p.canAskAgain), toast("Permesso rullino negato: salvato solo nel progetto", "error");
    await MediaLibrary.saveToLibraryAsync(uri);
  };
  const store = async (uri: string, video: boolean) => {
    await saveRoll(uri);
    const path = await uploadImage({ uri, fileName: `viewfinder-${Date.now()}.${video ? "mp4" : "jpg"}`, mimeType: video ? "video/mp4" : "image/jpeg" });
    await refs.create.mutateAsync({ title: `Viewfinder ${f}mm${video ? " (video)" : ""}`, data: { immagine: path, tipo: "Viewfinder", note: info } });
    toast(toRoll ? "Salvato in Reference e nel rullino" : "Salvato in Reference");
  };

  const shoot = async () => {
    if (!camRef.current) return;
    setBusy(true);
    try {
      const raw = await camRef.current.takePictureAsync({ quality: 0.9 });
      if (!raw) throw new Error("Scatto non riuscito");
      // Bake EXIF orientation first so width/height match what the preview showed.
      const pic = await manipulateAsync(raw.uri, [], { compress: 1, format: SaveFormat.JPEG });
      // Crop to the selected format exactly as framed on screen (preview is "cover" scaled).
      const scale = Math.max(size.w / pic.width, size.h / pic.height);
      const ox = (pic.width * scale - size.w) / 2;
      const oy = (pic.height * scale - size.h) / 2;
      const crop = {
        originX: clamp(((size.w - fw) / 2 + ox) / scale, 0, pic.width - 1),
        originY: clamp(((size.h - fh) / 2 + oy) / scale, 0, pic.height - 1),
        width: Math.min(fw / scale, pic.width),
        height: Math.min(fh / scale, pic.height),
      };
      const out = await manipulateAsync(pic.uri, [{ crop }], { compress: 0.85, format: SaveFormat.JPEG });
      await store(out.uri, false);
    } catch (e: any) {
      toast(e.message ?? "Scatto non riuscito", "error");
    } finally {
      setBusy(false);
    }
  };

  const record = async () => {
    if (!camRef.current) return;
    if (recording) return camRef.current.stopRecording();
    if (!mic?.granted) {
      const r = await requestMic();
      if (!r.granted) return toast("Serve il microfono per registrare video", "error");
    }
    setRecording(true);
    try {
      const v = await camRef.current.recordAsync({ maxDuration: 300 });
      setRecording(false);
      if (v?.uri) {
        setBusy(true);
        await store(v.uri, true);
      }
    } catch (e: any) {
      toast(e.message ?? "Registrazione non riuscita", "error");
    } finally {
      setRecording(false);
      setBusy(false);
    }
  };

  const importLut = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const tint = await readCube(r.assets[0].uri);
      luts.create.mutate([{ title: r.assets[0].name.replace(/\.cube$/i, ""), data: { tint } }], { onSuccess: () => toast("LUT importata") });
    } catch (e: any) {
      toast(e.message ?? "Importazione non riuscita", "error");
    }
  };

  const logChips = (
    <ChipRow>
      {LOGS.map((x) => (
        <Chip key={x.k} testID={`vf-log-${x.k}`} label={x.l} selected={log === x.k} onPress={() => setLog(x.k)} />
      ))}
    </ChipRow>
  );
  const convertSwitch = (light?: boolean) =>
    isLog ? (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Switch testID={light ? "vf-full-convert-switch" : "vf-convert-switch"} value={convert} onValueChange={setConvert} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
        <Text style={light ? { color: "#FFFFFF", fontFamily: fonts.text, fontSize: 12 } : [s.body, { flex: 1 }]}>Converti {lg.l} in Rec.709</Text>
      </View>
    ) : null;
  const lookChips = (
    <ChipRow>
      {allLooks.map((x) => (
        <Chip key={x.k} testID={`vf-look-${x.k}`} label={x.l} selected={look === x.k} onPress={() => setLook(x.k)} />
      ))}
      <Chip testID="vf-import-lut" icon="file-import-outline" label="Importa LUT .cube" onPress={importLut} />
    </ChipRow>
  );

  const openFull = async () => {
    if (!perm?.granted) {
      if (perm && !perm.canAskAgain) return;
      const r = await requestCam();
      if (!r.granted) return;
    }
    setFull(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader def={def} subtitle="Simula camera, ottica, formato e look sul set" right={<Button testID="vf-open-reference" icon="bookmark-multiple-outline" variant="secondary" onPress={() => go("reference")} />} />
      <ModuleScroll>
        <Card testID="vf-permission-card" style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
          <Icon name="camera-metering-center" size={40} color={colors.brandPrimary} />
          <Text style={s.h3}>Viewfinder a tutto schermo</Text>
          <Text style={[s.muted, { textAlign: "center", maxWidth: 460 }]}>Inquadra dal vivo con le cornici della tua camera e ottica, scatta foto ritagliate nel formato e registra video. Tutto finisce nelle Reference del progetto.</Text>
          {perm && !perm.granted && !perm.canAskAgain ? (
            <Button testID="vf-open-settings" icon="cog-outline" label="Consenti fotocamera nelle Impostazioni" onPress={() => Linking.openSettings()} />
          ) : (
            <Button testID="vf-open-full" icon="fullscreen" label={perm?.granted ? "Apri viewfinder" : "Attiva fotocamera e apri"} onPress={openFull} />
          )}
        </Card>
        <CameraPicker camera={camera} onChange={setCamera} />
        <KitLensChips focal={String(f)} onPick={(fl, q) => (setFocal(fl), setSqueeze(q ?? "1"))} />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Field testID="vf-focal-input" label="Focale libera (mm)" value={focal} onChangeText={setFocal} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field testID="vf-squeeze-input" label="Squeeze anamorfico" value={squeeze} onChangeText={setSqueeze} keyboardType="decimal-pad" />
          </View>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Formato</Text>
          <ChipRow>
            {RATIOS.map((r) => (
              <Chip key={r} testID={`vf-ratio-${r}`} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
            ))}
          </ChipRow>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Spazio Log della camera</Text>
          {logChips}
          {convertSwitch()}
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>LUT creativa sopra il Log (anteprima indicativa)</Text>
          {lookChips}
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Obiettivo del dispositivo (equivalente 35mm)</Text>
          <ChipRow>
            {DEVICE.map((d) => (
              <Chip key={d.v} testID={`vf-device-${d.v}`} label={d.l} selected={device === d.v} onPress={() => setDevice(d.v)} />
            ))}
          </ChipRow>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Switch testID="vf-roll-switch" value={toRoll} onValueChange={setToRoll} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
          <Text style={[s.body, { flex: 1 }]}>Salva anche nel rullino</Text>
          {rollBlocked && <Button testID="vf-roll-settings" small variant="secondary" label="Apri Impostazioni" onPress={() => Linking.openSettings()} />}
        </View>
        <Text style={s.muted}>Il look è un'anteprima a schermo: foto e video vengono salvati senza LUT, pronti per il grading.</Text>
      </ModuleScroll>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape", "landscape-left", "landscape-right"]}>
        <View testID="vf-fullscreen" style={{ flex: 1, backgroundColor: "#000000" }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <CameraView ref={camRef} style={{ flex: 1 }} facing="back" mode={mode} />
          {size.w > 0 && (
            <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}>
              {showFlat && <View style={{ position: "absolute", left: (size.w - fw) / 2, top: (size.h - fh) / 2, width: fw, height: fh, backgroundColor: lg.tint, opacity: lg.o }} />}
              <View style={{ position: "absolute", left: (size.w - fw) / 2, top: (size.h - fh) / 2, width: fw, height: fh, backgroundColor: lk.tint, opacity: lk.o }} />
              <View style={{ position: "absolute", left: 0, top: 0, right: 0, height: (size.h - fh) / 2, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: 0, bottom: 0, right: 0, height: (size.h - fh) / 2, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: 0, top: (size.h - fh) / 2, width: (size.w - fw) / 2, height: fh, backgroundColor: MASK }} />
              <View style={{ position: "absolute", right: 0, top: (size.h - fh) / 2, width: (size.w - fw) / 2, height: fh, backgroundColor: MASK }} />
              <View style={{ position: "absolute", left: (size.w - fw) / 2, top: (size.h - fh) / 2, width: fw, height: fh, borderWidth: 2, borderColor: colors.brandPrimary }} />
              {k > 1 && <Text style={{ position: "absolute", top: insets.top + 56, alignSelf: "center", color: colors.warning, fontFamily: fonts.text }}>Ottica più larga del dispositivo: usa l'ultra-grandangolo</Text>}
            </View>
          )}
          <View style={{ position: "absolute", top: insets.top + spacing.sm, left: spacing.lg, right: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Button testID="vf-close" icon="close" variant="secondary" onPress={() => setFull(false)} />
            <View style={{ flex: 1, backgroundColor: MASK, borderRadius: radius.sm, padding: spacing.xs }}>
              <Text testID="vf-info" numberOfLines={1} style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 12, fontWeight: "700" }}>{recording ? "● REC  " : ""}{info}</Text>
            </View>
          </View>
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm, backgroundColor: MASK, paddingTop: spacing.sm }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {RATIOS.map((r) => (
                <Chip key={r} testID={`vf-full-ratio-${r}`} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
              ))}
              {LOGS.map((x) => (
                <Chip key={x.k} testID={`vf-full-log-${x.k}`} label={x.l} selected={log === x.k} onPress={() => setLog(x.k)} />
              ))}
              {allLooks.map((x) => (
                <Chip key={x.k} testID={`vf-full-look-${x.k}`} label={x.l} selected={look === x.k} onPress={() => setLook(x.k)} />
              ))}
            </ScrollView>
            {convertSwitch(true)}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Chip testID="vf-mode-photo" icon="camera" label="Foto" selected={mode === "picture"} onPress={() => !recording && setMode("picture")} />
                <Chip testID="vf-mode-video" icon="video" label="Video" selected={mode === "video"} onPress={() => !recording && setMode("video")} />
              </View>
              <Pressable testID="vf-shutter" onPress={mode === "picture" ? shoot : record} disabled={busy} style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <View style={{ width: recording ? 28 : 56, height: recording ? 28 : 56, borderRadius: recording ? 6 : 28, backgroundColor: mode === "video" ? colors.error : "#FFFFFF" }} />}
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Switch testID="vf-full-roll-switch" value={toRoll} onValueChange={setToRoll} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 12 }}>Rullino</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
