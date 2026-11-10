import * as DocumentPicker from "expo-document-picker";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CameraPicker, KitLensChips } from "@/src/components/CameraPicker";
import { useLibrary } from "@/src/hooks";
import {
  BRAND_LOG,
  clamp,
  cropRect,
  DEVICE,
  frameGeom,
  LOGS,
  LOOKS,
  RATIOS,
  ratioLabel,
  readCube,
  Size,
} from "@/src/components/viewfinder/engine";
import { Camera } from "@/src/cameras";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

const AMBER = "#E9B949";
const MASK = "rgba(0,0,0,0.55)";

// La fotocamera principale del telefono: è il riferimento per capire quanto
// campo si vede davvero e quanto zoom digitale serve per le focali più lunghe.
const PRINCIPALE = 26;
// Il riquadro dell'anteprima ha le proporzioni delle foto scattate (4:3), così
// cornice e ritaglio lavorano esattamente sulla stessa immagine.
const ANTEPRIMA = 4 / 3;

// Il mirino: anteprima grande al centro, cornice del formato sopra, e sotto solo
// i comandi che si usano davvero. Camera, ottica, Log e LUT stanno nel Setup.
export default function ViewfinderScreen({
  camera,
  setCameraId,
  onSave,
  onExit,
  titolo = "Director’s viewfinder",
  sottoTitolo,
  rullinoDefault = false,
  rullinoObbligatorio = false,
  notaSalvataggio,
}: {
  camera: Camera;
  setCameraId: (id: string) => void;
  onSave: (uri: string, video: boolean, info: string) => Promise<void>;
  onExit?: () => void;
  titolo?: string;
  sottoTitolo?: string;
  rullinoDefault?: boolean;
  rullinoObbligatorio?: boolean;
  notaSalvataggio?: string;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const [perm, requestCam] = useCameraPermissions();
  const [mic, requestMic] = useMicrophonePermissions();
  const camRef = useRef<CameraView>(null);
  const luts = useLibrary("lut");

  const [focal, setFocal] = useState("35");
  const [squeeze, setSqueeze] = useState("1");
  const [ratio, setRatio] = useState(2.39);
  const [device, setDevice] = useState(PRINCIPALE);
  const [log, setLog] = useState<string>(BRAND_LOG[camera.brand] ?? "709");
  const [convert, setConvert] = useState(true);
  const [look, setLook] = useState("none");
  const [terzi, setTerzi] = useState(true);
  const [torch, setTorch] = useState(false);
  const [rullino, setRullino] = useState(rullinoDefault);
  const [mode, setMode] = useState<"picture" | "video">("picture");
  const [setup, setSetup] = useState(false);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);

  // Cambiando camera cambia anche lo spazio colore consigliato: prima restava
  // quello della camera precedente e i Log sembravano tutti uguali.
  useEffect(() => {
    setLog(BRAND_LOG[camera.brand] ?? "709");
  }, [camera.brand]);

  const f = parseFloat(focal.replace(",", ".")) || 35;
  const sq = parseFloat(squeeze.replace(",", ".")) || 1;

  // Riquadro dell'anteprima, con le proporzioni della foto.
  const topBar = insets.top + 52;
  const bottomBar = 176 + insets.bottom;
  const maxH = Math.max(160, size.h - topBar - bottomBar);
  const boxW = Math.max(120, Math.min(size.w, maxH * ANTEPRIMA));
  const boxH = boxW / ANTEPRIMA;
  const boxTop = topBar + Math.max(0, (maxH - boxH) / 2);
  const box: Size = { w: boxW, h: boxH };

  const frame = frameGeom({ size: box, sensorW: camera.w, focal: f, squeeze: sq, ratio, deviceFocal: device });

  // L'ottica del telefono ora si vede: sopra la focale principale la preview si
  // avvicina davvero, sotto serve l'ultra-grandangolo (iOS non la seleziona da sé).
  const zoomFattore = clamp(device / PRINCIPALE, 1, 5);
  const camZoom = clamp((zoomFattore - 1) / 4, 0, 1);

  const lg = LOGS.find((x) => x.k === log) ?? LOGS[0];
  const isLog = lg.k !== "709";
  const flat = isLog && !convert;
  const allLooks = [
    ...LOOKS,
    ...(luts.q.data ?? []).filter((l) => !!l.data.tint).map((l) => ({ k: l.id, l: l.title, tint: l.data.tint as string, o: 0.35 })),
  ];
  const lookAttiva = allLooks.find((x) => x.k === look) ?? allLooks[0];
  const focale = `${f}mm${sq > 1 ? ` ${sq}x` : ""}`;
  const lookLabel = isLog ? (convert ? `${lg.corto} → 709` : `${lg.corto} flat`) : "Rec.709";
  const info = `${focale} · ${camera.brand} ${camera.name} · ${ratioLabel(ratio)} · ${frame.hfov.toFixed(0)}° · ${lookLabel}`;
  const fuoriCampo = frame.k > 1.002 && size.w > 0;
  const telefonoStretto = device < PRINCIPALE;

  // Se esci mentre registri, la registrazione va chiusa, altrimenti la camera
  // resta occupata e il file non arriva mai.
  useEffect(
    () => () => {
      try {
        camRef.current?.stopRecording();
      } catch {}
    },
    [],
  );

  const inRullino = async (uri: string) => {
    if (!rullino && !rullinoObbligatorio) return true;
    let p = await MediaLibrary.getPermissionsAsync(true);
    if (!p.granted && p.canAskAgain) p = await MediaLibrary.requestPermissionsAsync(true);
    if (!p.granted) {
      toast("Rullino non consentito: salvo solo nell’app", "error");
      return true;
    }
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch {
      toast("Non sono riuscito a scrivere nel rullino", "error");
      return true;
    }
  };

  const scatta = async () => {
    if (!camRef.current || busy || recording) return;
    setBusy(true);
    try {
      const raw = await camRef.current.takePictureAsync({ quality: 0.9 });
      if (!raw) throw new Error("Scatto non riuscito");
      const pic = await manipulateAsync(raw.uri, [], { compress: 1, format: SaveFormat.JPEG });
      const crop = cropRect(pic, box, frame);
      const out = crop
        ? await manipulateAsync(pic.uri, [{ crop }], { compress: 0.9, format: SaveFormat.JPEG })
        : await manipulateAsync(pic.uri, [], { compress: 0.9, format: SaveFormat.JPEG });
      await inRullino(out.uri);
      await onSave(out.uri, false, info);
      toast("Foto salvata");
    } catch (e: any) {
      toast(e?.message ?? "Scatto non riuscito", "error");
    } finally {
      setBusy(false);
    }
  };

  const registra = async () => {
    if (!camRef.current || busy) return;
    if (recording) {
      camRef.current.stopRecording();
      return;
    }
    if (!mic?.granted) {
      const r = await requestMic();
      if (!r.granted) {
        toast("Serve il microfono per registrare", "error");
        return;
      }
    }
    setRecording(true);
    try {
      const v = await camRef.current.recordAsync({ maxDuration: 300 });
      setRecording(false);
      if (!v?.uri) return;
      setBusy(true);
      await inRullino(v.uri);
      await onSave(v.uri, true, info);
      toast("Video salvato");
    } catch (e: any) {
      toast(e?.message ?? "Registrazione non riuscita", "error");
    } finally {
      setRecording(false);
      setBusy(false);
    }
  };

  const importaLut = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const tint = await readCube(r.assets[0].uri);
      luts.create.mutate([{ title: r.assets[0].name.replace(/\.cube$/i, ""), data: { tint } }], {
        onSuccess: () => toast("LUT importata"),
      });
    } catch (e: any) {
      toast(e?.message ?? "Importazione non riuscita", "error");
    }
  };

  if (!perm) {
    return (
      <View testID="vf-loading" style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000000" }}>
        <ActivityIndicator color={AMBER} />
      </View>
    );
  }

  if (!perm.granted) {
    return (
      <View testID="vf-permission" style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000000", padding: spacing.xl, gap: spacing.md }}>
        <Icon name="camera-metering-center" size={44} color={AMBER} />
        <Text style={{ color: "#FFFFFF", fontFamily: fonts.display, fontSize: 24, textAlign: "center" }}>{titolo}</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.text, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 420 }}>
          Per inquadrare con la cornice della tua camera serve la fotocamera. Foto e video restano tuoi: nessun caricamento senza che tu lo decida.
        </Text>
        {!perm.canAskAgain ? (
          <Button testID="vf-open-settings" icon="cog-outline" label="Attiva la fotocamera nelle Impostazioni" onPress={() => Linking.openSettings()} />
        ) : (
          <Button testID="vf-request-camera" icon="camera" label="Attiva fotocamera" onPress={() => void requestCam()} />
        )}
        {onExit ? <Button testID="vf-exit" variant="ghost" label="Torna indietro" onPress={onExit} /> : null}
      </View>
    );
  }

  return (
    <View
      testID="vf-screen"
      style={{ flex: 1, backgroundColor: "#000000" }}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* anteprima: riquadro 4:3, quello che si vede è quello che si scatta */}
      {size.w > 0 ? (
        <View
          style={{
            position: "absolute",
            left: (size.w - boxW) / 2,
            top: boxTop,
            width: boxW,
            height: boxH,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "#0A0A0A",
          }}
        >
          <CameraView ref={camRef} style={{ flex: 1 }} facing="back" mode={mode} enableTorch={torch} zoom={camZoom} />

          <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: boxW, height: boxH }}>
            {flat ? <View style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.fw, height: frame.fh, backgroundColor: lg.tint, opacity: lg.o }} /> : null}
            {lookAttiva.o > 0 ? (
              <View style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.fw, height: frame.fh, backgroundColor: lookAttiva.tint, opacity: lookAttiva.o }} />
            ) : null}
            <View style={{ position: "absolute", left: 0, top: 0, right: 0, height: frame.y, backgroundColor: MASK }} />
            <View style={{ position: "absolute", left: 0, bottom: 0, right: 0, height: boxH - frame.y - frame.fh, backgroundColor: MASK }} />
            <View style={{ position: "absolute", left: 0, top: frame.y, width: frame.x, height: frame.fh, backgroundColor: MASK }} />
            <View style={{ position: "absolute", right: 0, top: frame.y, width: boxW - frame.x - frame.fw, height: frame.fh, backgroundColor: MASK }} />
            <View style={{ position: "absolute", left: frame.x, top: frame.y, width: frame.fw, height: frame.fh, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" }} />
            {terzi ? (
              <>
                <View style={{ position: "absolute", left: frame.x + frame.fw / 3, top: frame.y, width: 1, height: frame.fh, backgroundColor: "rgba(255,255,255,0.26)" }} />
                <View style={{ position: "absolute", left: frame.x + (frame.fw * 2) / 3, top: frame.y, width: 1, height: frame.fh, backgroundColor: "rgba(255,255,255,0.26)" }} />
                <View style={{ position: "absolute", left: frame.x, top: frame.y + frame.fh / 3, width: frame.fw, height: 1, backgroundColor: "rgba(255,255,255,0.26)" }} />
                <View style={{ position: "absolute", left: frame.x, top: frame.y + (frame.fh * 2) / 3, width: frame.fw, height: 1, backgroundColor: "rgba(255,255,255,0.26)" }} />
              </>
            ) : null}
            {[
              { left: frame.x, top: frame.y, borderTopWidth: 2, borderLeftWidth: 2 },
              { left: frame.x + frame.fw - 16, top: frame.y, borderTopWidth: 2, borderRightWidth: 2 },
              { left: frame.x, top: frame.y + frame.fh - 16, borderBottomWidth: 2, borderLeftWidth: 2 },
              { left: frame.x + frame.fw - 16, top: frame.y + frame.fh - 16, borderBottomWidth: 2, borderRightWidth: 2 },
            ].map((c, i) => (
              <View key={i} style={{ position: "absolute", width: 16, height: 16, borderColor: AMBER, ...c }} />
            ))}
            <View style={{ position: "absolute", left: frame.x, top: Math.max(4, frame.y - 18) }}>
              <Text style={{ color: AMBER, fontFamily: fonts.text, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>{ratioLabel(ratio)}</Text>
            </View>
            {fuoriCampo ? (
              <View style={{ position: "absolute", right: 8, bottom: 8, backgroundColor: "rgba(0,0,0,0.66)", borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 3 }}>
                <Text style={{ color: AMBER, fontFamily: fonts.text, fontSize: 9.5 }}>telefono non copre tutta la cornice</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* barra alta: chiudi, info, torcia, griglia */}
      <View style={{ position: "absolute", top: insets.top + spacing.xs, left: spacing.md, right: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        {onExit ? (
          <Pressable testID="vf-close" onPress={onExit} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" }}>
            <Icon name="close" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {recording ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.error }} /> : null}
          <Text testID="vf-info" numberOfLines={1} style={{ flex: 1, color: "#FFFFFF", fontFamily: fonts.text, fontSize: 11.5 }}>
            {recording ? "REC · " : ""}
            {info}
          </Text>
        </View>
        <Pressable testID="vf-torch" onPress={() => setTorch((t) => !t)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: torch ? AMBER : "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="flashlight" size={18} color={torch ? "#000000" : "#FFFFFF"} />
        </Pressable>
        <Pressable testID="vf-grid" onPress={() => setTerzi((t) => !t)} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: terzi ? "rgba(233,185,73,0.9)" : "rgba(255,255,255,0.10)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="grid" size={18} color={terzi ? "#000000" : "#FFFFFF"} />
        </Pressable>
      </View>

      {sottoTitolo ? (
        <View pointerEvents="none" style={{ position: "absolute", top: insets.top + 48, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.text, fontSize: 11.5 }}>{sottoTitolo}</Text>
        </View>
      ) : null}

      {/* barra bassa: formati, modalità, scatto, setup */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.sm, gap: spacing.sm }}>
        {(telefonoStretto || fuoriCampo) && (
          <Text style={{ color: AMBER, fontFamily: fonts.text, fontSize: 10.5, textAlign: "center", paddingHorizontal: spacing.lg }}>
            {telefonoStretto
              ? "Otica del telefono più larga della principale: serve l’ultra-grandangolo"
              : "Il telefono non arriva a questa focale: scegli un’ottica più stretta"}
          </Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.lg }}>
          {RATIOS.map((r) => (
            <Chip key={r} testID={`vf-ratio-${r}`} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <Pressable
            testID="vf-switch-mode"
            onPress={() => !recording && setMode((m) => (m === "picture" ? "video" : "picture"))}
            style={{ width: 84, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 }}
          >
            <Icon name={mode === "picture" ? "camera" : "video"} size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700" }}>{mode === "picture" ? "Foto" : "Video"}</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Pressable
              testID="vf-shutter"
              onPress={mode === "picture" ? scatta : registra}
              disabled={busy}
              style={({ pressed }) => ({
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 3,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View
                  style={{
                    width: recording ? 26 : 62,
                    height: recording ? 26 : 62,
                    borderRadius: recording ? 7 : 31,
                    backgroundColor: mode === "video" ? colors.error : "#FFFFFF",
                  }}
                />
              )}
            </Pressable>
          </View>

          <Pressable
            testID="vf-open-setup"
            onPress={() => setSetup(true)}
            style={{ width: 84, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 }}
          >
            <Icon name="tune-variant" size={15} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700" }}>Setup</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.42)", fontFamily: fonts.text, fontSize: 10.5, textAlign: "center", paddingHorizontal: spacing.lg }}>
          {mode === "picture" ? `La foto viene ritagliata in ${ratioLabel(ratio)}` : "Il video registra tutto il sensore: il formato è solo la cornice"}
        </Text>
      </View>

      <Sheet visible={setup} onClose={() => setSetup(false)} title="Setup del mirino" testID="vf-setup">
        <CameraPicker camera={camera} onChange={setCameraId} />
        <KitLensChips focal={String(f)} onPick={(fl, q) => (setFocal(fl), setSqueeze(q ?? "1"))} />
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Field testID="vf-focal-input" label="Focale (mm)" value={focal} onChangeText={setFocal} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field testID="vf-squeeze-input" label="Squeeze anamorfico" value={squeeze} onChangeText={setSqueeze} keyboardType="decimal-pad" />
          </View>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Formato</Text>
          <ChipRow>
            {RATIOS.map((r) => (
              <Chip key={r} testID={`vf-setup-ratio-${r}`} label={ratioLabel(r)} selected={ratio === r} onPress={() => setRatio(r)} />
            ))}
          </ChipRow>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Spazio colore della camera</Text>
          <ChipRow>
            {LOGS.map((x) => (
              <Chip key={x.k} testID={`vf-log-${x.k}`} label={x.l} selected={log === x.k} onPress={() => setLog(x.k)} />
            ))}
          </ChipRow>
          {isLog ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Switch testID="vf-convert-switch" value={convert} onValueChange={setConvert} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
              <Text style={[s.body, { flex: 1 }]}>Mostra già convertito in Rec.709</Text>
            </View>
          ) : null}
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Look creative (anteprima)</Text>
          <ChipRow>
            {allLooks.map((x) => (
              <Chip key={x.k} testID={`vf-look-${x.k}`} label={x.l} selected={look === x.k} onPress={() => setLook(x.k)} />
            ))}
            <Chip testID="vf-import-lut" icon="file-import-outline" label="Importa LUT .cube" onPress={importaLut} />
          </ChipRow>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Ottica del telefono</Text>
          <ChipRow>
            {DEVICE.map((d) => (
              <Chip key={d.v} testID={`vf-device-${d.v}`} label={d.l} selected={device === d.v} onPress={() => setDevice(d.v)} />
            ))}
          </ChipRow>
          <Text style={s.muted}>
            {device === PRINCIPALE
              ? "Anteprima a 1x, come la fotocamera principale."
              : device > PRINCIPALE
                ? `L’anteprima si avvicina a ${zoomFattore.toFixed(1)}x per mostrarti il campo di un’ottica più stretta.`
                : "Sotto la focale principale serve l’ultra-grandangolo: iOS non permette di sceglierla, la cornice ti dice quanto campo manca."}
          </Text>
        </View>
        {rullinoObbligatorio ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Icon name="check-circle-outline" size={16} color={colors.brandPrimary} />
            <Text style={[s.body, { flex: 1 }]}>Ogni scatto viene salvato nel rullino del telefono</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Switch testID="vf-roll-switch" value={rullino} onValueChange={setRullino} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
            <Text style={[s.body, { flex: 1 }]}>Salva anche nel rullino del telefono</Text>
          </View>
        )}
        <Text style={s.muted}>
          {notaSalvataggio ?? "Ogni scatto finisce nelle Reference del progetto."} Log e LUT sono solo anteprima: il file resta puro, pronto per il grading.
        </Text>
        <Button testID="vf-setup-done" label="Torna al mirino" onPress={() => setSetup(false)} />
      </Sheet>
    </View>
  );
}
