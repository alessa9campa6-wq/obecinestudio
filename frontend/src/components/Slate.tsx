import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Glass, Icon, Segmented, toast, useStyles } from "@/src/ui";

const FPS = ["24", "25", "30", "50"] as const;
const ESITI = ["Buona", "NG", "Stampa", "Falso"];
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
// Il ciak è un oggetto fisico: lavagna nera e gesso anche nei due temi.
const BOARD = "#0C0B09";
const CHALK = "#F4EFE3";
const ORO = "#D4AF37";

const pad = (n: number) => String(n).padStart(2, "0");
function timecode(fps: number) {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(Math.floor((d.getMilliseconds() / 1000) * fps))}`;
}

function Board({ info, tc, big }: { info: Record<string, string>; tc: string; big?: boolean }) {
  const f = big ? 1.6 : 1;
  const Cell = ({ l, v, flex = 1 }: { l: string; v: string; flex?: number }) => (
    <View style={{ flex, borderColor: "rgba(244,239,227,0.32)", borderWidth: 1, padding: spacing.sm * f }}>
      <Text style={{ color: "rgba(244,239,227,0.62)", fontSize: 9.5 * f, fontFamily: fonts.text, letterSpacing: 1 }}>{l}</Text>
      <Text style={{ color: CHALK, fontSize: 30 * f, fontFamily: MONO, fontWeight: "700" }} numberOfLines={1} adjustsFontSizeToFit>
        {v || "—"}
      </Text>
    </View>
  );
  return (
    <View testID="slate-board" style={{ backgroundColor: BOARD, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(212,175,55,0.28)" }}>
      <View style={{ height: 30 * f, flexDirection: "row" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? ORO : "rgba(212,175,55,0.12)", transform: [{ skewX: "-32deg" }] }} />
        ))}
      </View>
      <View style={{ padding: spacing.md * f, gap: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          <Text style={{ color: ORO, fontFamily: fonts.text, fontSize: 9.5 * f, fontWeight: "800", letterSpacing: 2 }}>CIAK DIGITALE</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(212,175,55,0.3)" }} />
        </View>
        <Text style={{ color: CHALK, fontFamily: fonts.display, fontSize: 23 * f, marginBottom: spacing.sm }} numberOfLines={1}>
          {info.production}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Cell l="ROLL" v={info.roll} />
          <Cell l="SCENA" v={info.scene} flex={1.4} />
          <Cell l="INQ." v={info.shot} />
          <Cell l="TAKE" v={info.take} />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Cell l="REGIA" v={info.director} flex={2} />
          <Cell l="DOP" v={info.dop} flex={2} />
          <Cell l="CAM" v={info.cam} />
        </View>
        <Text testID="slate-timecode" style={{ color: ORO, fontFamily: MONO, fontSize: 42 * f, textAlign: "center", marginTop: spacing.md, fontWeight: "700", letterSpacing: 1 }} adjustsFontSizeToFit numberOfLines={1}>
          {tc}
        </Text>
        <Text style={{ color: "rgba(244,239,227,0.55)", textAlign: "center", fontFamily: fonts.text, fontSize: 11 * f }}>{new Date().toLocaleDateString("it-IT")} · {info.fps} fps</Text>
      </View>
    </View>
  );
}

export default function Slate({ def }: { def: ModuleDef }) {
  const { project, go } = useHub();
  const logs = useItems(project.id, "slatelog");
  const m = useItemMutations(project.id, "slatelog");
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ciak = useAudioPlayer(require("../../assets/sounds/ciak.wav"));
  const [info, setInfo] = useState<Record<string, string>>({ production: project.title, roll: "A001", scene: "1", shot: "A", take: "1", director: project.director, dop: "", cam: "A", fps: "25" });
  const [tc, setTc] = useState(timecode(25));
  const shots = useItems(project.id, "shotlist");
  const lookup = useLookup(project.id);
  const shotM = useItemMutations(project.id, "shotlist");
  const sup = useItemMutations(project.id, "supervisor");
  const [shotId, setShotId] = useState<string | null>(null);
  const pickShot = (id: string) => {
    const sh = shots.data?.find((x) => x.id === id);
    if (!sh) return;
    setShotId(id);
    const sc = lookup.get(sh.data.scena);
    setInfo((i) => ({ ...i, scene: sc?.data.numero || sc?.title || i.scene, shot: sh.title, take: "1" }));
  };
  const currentShot = shots.data?.find((x) => x.id === shotId);
  const [full, setFull] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setInterval(() => setTc(timecode(Number(info.fps))), 40);
    return () => clearInterval(t);
  }, [info.fps]);
  const set = (k: string) => (v: string) => setInfo((i) => ({ ...i, [k]: v }));

  // Il colpo del ciak: suono vero + vibrazione + lampo.
  const suono = () => {
    try {
      void ciak.seekTo(0);
      ciak.play();
    } catch {
      // se l'audio non è disponibile resta il colpo aptico
    }
  };

  const clap = () => {
    suono();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Animated.sequence([Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }), Animated.timing(flash, { toValue: 0, duration: 300, useNativeDriver: true })]).start();
    m.create.mutate({ title: `Sc ${info.scene} / ${info.shot} / T${info.take}`, data: { ...info, tc, esito: "Buona", shotId } });
    setInfo((i) => ({ ...i, take: String((parseInt(i.take, 10) || 0) + 1) }));
  };
  const two = width >= 1000;
  const list = [...(logs.data ?? [])].reverse();

  const exportLog = () =>
    exportHtml(
      "Camera report",
      wrap("Camera report", `<table><tr><th>Ora / TC</th><th>Roll</th><th>Scena</th><th>Inq.</th><th>Take</th><th>Esito</th></tr>${(logs.data ?? []).map((l) => `<tr><td>${l.data.tc}</td><td>${l.data.roll}</td><td>${l.data.scene}</td><td>${l.data.shot}</td><td>${l.data.take}</td><td>${l.data.esito}</td></tr>`).join("")}</table>`, project.title),
    );

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader def={def} subtitle={`${list.length} take registrati · timecode live`} right={<><Button testID="slate-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!list.length} onPress={exportLog} /><Button testID="slate-fullscreen" icon="fullscreen" variant="secondary" onPress={() => setFull(true)} /></>} />
      <ModuleScroll>
        <View style={{ flexDirection: two ? "row" : "column", gap: spacing.lg }}>
          <View style={{ flex: 1.25, gap: spacing.md }}>
            <View style={{ borderRadius: 26, borderWidth: 1, borderColor: "rgba(212,175,55,0.35)", backgroundColor: colors.surfaceSecondary, padding: spacing.sm }}>
              <Pressable onPress={() => setFull(true)}>
                <Board info={info} tc={tc} />
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: 2 }}>
                <Button testID="take-minus" icon="minus" variant="secondary" onPress={() => set("take")(String(Math.max(1, (parseInt(info.take, 10) || 1) - 1)))} />
                <View style={{ flex: 1 }}>
                  <Button testID="slate-clap-button" icon="movie-open-play" label={`CIAK · Take ${info.take}`} onPress={clap} />
                </View>
                <Button testID="take-plus" icon="plus" variant="secondary" onPress={() => set("take")(String((parseInt(info.take, 10) || 0) + 1))} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }}>
                <Icon name="volume-high" size={11} color={colors.muted} />
                <Text style={[s.muted, { fontSize: 10.5 }]}>Suono del ciak e vibrazione a ogni take</Text>
              </View>
            </View>
            <Segmented testID="slate-fps" value={info.fps as any} onChange={set("fps")} options={FPS.map((f) => ({ value: f, label: `${f} fps` }))} />
          </View>

          <View style={{ flex: 1, gap: spacing.md }}>
            <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Icon name="clipboard-text-outline" size={13} color={colors.brandPrimary} />
                <Text style={s.label}>Dati del ciak</Text>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}><Field testID="slate-roll-input" label="Roll" value={info.roll} onChangeText={set("roll")} autoCapitalize="characters" /></View>
                <View style={{ flex: 1 }}><Field testID="slate-scene-input" label="Scena" value={info.scene} onChangeText={set("scene")} /></View>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}><Field testID="slate-shot-input" label="Inquadratura" value={info.shot} onChangeText={set("shot")} autoCapitalize="characters" /></View>
                <View style={{ flex: 1 }}><Field testID="slate-cam-input" label="Camera" value={info.cam} onChangeText={set("cam")} autoCapitalize="characters" /></View>
              </View>
              <Field testID="slate-director-input" label="Regia" value={info.director} onChangeText={set("director")} />
              <Field testID="slate-dop-input" label="Direttore fotografia" value={info.dop} onChangeText={set("dop")} />
            </Glass>

            {(shots.data ?? []).length > 0 ? (
              <Glass style={{ borderRadius: 20, borderWidth: 1, borderColor: colors.divider, padding: spacing.md, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="format-list-numbered" size={13} color={colors.brandPrimary} />
                  <Text style={s.label}>Dalla shotlist</Text>
                </View>
                <ChipRow>
                  {(shots.data ?? []).map((sh) => (
                    <Chip key={sh.id} testID={`slate-shot-${sh.id}`} icon={sh.data.girata ? "check" : undefined} label={`${lookup.get(sh.data.scena)?.data.numero ?? ""} ${sh.title}`.trim()} selected={shotId === sh.id} onPress={() => pickShot(sh.id)} />
                  ))}
                </ChipRow>
                {currentShot && !currentShot.data.girata ? (
                  <Button testID="slate-mark-shot-done" icon="check-all" label={`Segna "${currentShot.title}" come girata`} variant="secondary" onPress={() => shotM.update.mutate({ id: currentShot.id, data: { ...currentShot.data, girata: true } }, { onSuccess: () => toast("Inquadratura segnata come girata") })} />
                ) : null}
              </Glass>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 22, color: colors.onSurface }}>Registro take</Text>
          <View style={{ borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2, backgroundColor: colors.surfaceTertiary }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", color: colors.onSurfaceSecondary }}>{list.length}</Text>
          </View>
        </View>

        {list.map((l) => {
          const buona = l.data.esito === "Buona" || l.data.esito === "Stampa";
          return (
            <Glass key={l.id} testID={`slate-log-${l.id}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: colors.divider }}>
              <Pressable testID={`slate-log-toggle-${l.id}`} hitSlop={8} onPress={() => m.update.mutate({ id: l.id, data: { ...l.data, esito: ESITI[(ESITI.indexOf(l.data.esito) + 1) % ESITI.length] } })} style={{ alignItems: "center", minWidth: 54, gap: 1 }}>
                <Icon name={buona ? "check-circle" : "close-circle"} size={26} color={buona ? colors.success : colors.error} />
                <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: buona ? colors.success : colors.error }}>{l.data.esito}</Text>
              </Pressable>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 14.5, fontWeight: "700", color: colors.onSurface }} numberOfLines={1}>{l.title}</Text>
                <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>
                  Roll {l.data.roll} · Cam {l.data.cam} · <Text style={{ fontFamily: MONO }}>{l.data.tc}</Text>
                </Text>
              </View>
              <Pressable
                testID={`slate-log-supervisor-${l.id}`}
                hitSlop={8}
                onPress={() =>
                  sup.create.mutate(
                    { title: l.title, data: { ciak: l.data.take, timecode: l.data.tc, esito: l.data.esito, inquadratura: l.data.shotId ?? "", scena: lookup.get(l.data.shotId)?.data.scena ?? "" } },
                    { onSuccess: (it) => (toast("Nota creata in Script supervisor"), go("supervisor", it.id)) },
                  )
                }
              >
                <Icon name="clipboard-edit-outline" size={21} color={colors.brandPrimary} />
              </Pressable>
              <Pressable testID={`slate-log-delete-${l.id}`} hitSlop={8} onPress={() => m.remove.mutate(l.id, { onSuccess: () => toast("Take rimosso") })}>
                <Icon name="trash-can-outline" size={19} color={colors.muted} />
              </Pressable>
            </Glass>
          );
        })}
      </ModuleScroll>

      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape"]}>
        <View style={{ flex: 1, backgroundColor: BOARD, padding: spacing.xl, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, justifyContent: "center", gap: spacing.lg }}>
          <Board info={info} tc={tc} big />
          <View style={{ flexDirection: "row", gap: spacing.md, justifyContent: "center", alignItems: "center" }}>
            <Button testID="slate-full-close" icon="fullscreen-exit" variant="secondary" onPress={() => setFull(false)} />
            <Button testID="slate-full-clap" icon="movie-open-play" label="CIAK" onPress={clap} />
          </View>
          <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: CHALK, opacity: flash }} />
        </View>
      </Modal>
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: CHALK, opacity: flash }} />
    </View>
  );
}
