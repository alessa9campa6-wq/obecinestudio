import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useItemMutations, useItems, useLookup } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon, Segmented, toast, useStyles } from "@/src/ui";

const FPS = ["24", "25", "30", "50"] as const;
const ESITI = ["Buona", "NG", "Stampa", "Falso"];
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
// The slate is a physical prop: always black board, white chalk, in both themes.
const BOARD = "#0B0B0B";
const CHALK = "#F5F5F5";

const pad = (n: number) => String(n).padStart(2, "0");
function timecode(fps: number) {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${pad(Math.floor((d.getMilliseconds() / 1000) * fps))}`;
}

function Board({ info, tc, big }: { info: Record<string, string>; tc: string; big?: boolean }) {
  const f = big ? 1.6 : 1;
  const Cell = ({ l, v, flex = 1 }: { l: string; v: string; flex?: number }) => (
    <View style={{ flex, borderColor: CHALK, borderWidth: 1, padding: spacing.sm * f }}>
      <Text style={{ color: CHALK, fontSize: 10 * f, fontFamily: fonts.text, letterSpacing: 1 }}>{l}</Text>
      <Text style={{ color: CHALK, fontSize: 30 * f, fontFamily: MONO, fontWeight: "700" }} numberOfLines={1} adjustsFontSizeToFit>
        {v || "—"}
      </Text>
    </View>
  );
  return (
    <View testID="slate-board" style={{ backgroundColor: BOARD, borderRadius: radius.md, overflow: "hidden" }}>
      <View style={{ height: 28 * f, flexDirection: "row" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? CHALK : BOARD, transform: [{ skewX: "-30deg" }] }} />
        ))}
      </View>
      <View style={{ padding: spacing.md * f, gap: 0 }}>
        <Text style={{ color: CHALK, fontFamily: fonts.display, fontSize: 22 * f, marginBottom: spacing.sm }} numberOfLines={1}>
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
        <Text testID="slate-timecode" style={{ color: CHALK, fontFamily: MONO, fontSize: 44 * f, textAlign: "center", marginTop: spacing.md, fontWeight: "700" }} adjustsFontSizeToFit numberOfLines={1}>
          {tc}
        </Text>
        <Text style={{ color: CHALK, opacity: 0.6, textAlign: "center", fontFamily: fonts.text }}>{new Date().toLocaleDateString("it-IT")} · {info.fps} fps</Text>
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

  const clap = () => {
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
      <ModuleHeader def={def} subtitle="Ciak con timecode e registro take" right={<><Button testID="slate-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!list.length} onPress={exportLog} /><Button testID="slate-fullscreen" icon="fullscreen" variant="secondary" onPress={() => setFull(true)} /></>} />
      <ModuleScroll>
        <View style={{ flexDirection: two ? "row" : "column", gap: spacing.lg }}>
          <View style={{ flex: 1.3, gap: spacing.md }}>
            <Pressable onPress={() => setFull(true)}>
              <Board info={info} tc={tc} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button testID="take-minus" icon="minus" variant="secondary" onPress={() => set("take")(String(Math.max(1, (parseInt(info.take, 10) || 1) - 1)))} />
              <View style={{ flex: 1 }}>
                <Button testID="slate-clap-button" icon="movie-open-play" label={`CIAK · Take ${info.take}`} onPress={clap} />
              </View>
              <Button testID="take-plus" icon="plus" variant="secondary" onPress={() => set("take")(String((parseInt(info.take, 10) || 0) + 1))} />
            </View>
            <Segmented testID="slate-fps" value={info.fps as any} onChange={set("fps")} options={FPS.map((f) => ({ value: f, label: `${f} fps` }))} />
          </View>
          <View style={{ flex: 1, gap: spacing.md }}>
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
          </View>
        </View>
        {(shots.data ?? []).length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Dalla shotlist</Text>
            <ChipRow>
              {(shots.data ?? []).map((sh) => (
                <Chip key={sh.id} testID={`slate-shot-${sh.id}`} icon={sh.data.girata ? "check" : undefined} label={`${lookup.get(sh.data.scena)?.data.numero ?? ""} ${sh.title}`.trim()} selected={shotId === sh.id} onPress={() => pickShot(sh.id)} />
              ))}
            </ChipRow>
            {currentShot && !currentShot.data.girata ? (
              <Button testID="slate-mark-shot-done" icon="check-all" label={`Segna "${currentShot.title}" come girata`} variant="secondary" onPress={() => shotM.update.mutate({ id: currentShot.id, data: { ...currentShot.data, girata: true } }, { onSuccess: () => toast("Inquadratura segnata come girata") })} />
            ) : null}
          </View>
        )}
        <Text style={s.h3}>Registro take ({list.length})</Text>
        {list.map((l) => (
          <View key={l.id} testID={`slate-log-${l.id}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
            <Pressable testID={`slate-log-toggle-${l.id}`} hitSlop={8} onPress={() => m.update.mutate({ id: l.id, data: { ...l.data, esito: ESITI[(ESITI.indexOf(l.data.esito) + 1) % ESITI.length] } })} style={{ alignItems: "center", minWidth: 52 }}>
              <Icon name={l.data.esito === "Buona" || l.data.esito === "Stampa" ? "check-circle" : "close-circle"} size={26} color={l.data.esito === "Buona" || l.data.esito === "Stampa" ? colors.success : colors.error} />
              <Text style={[s.muted, { fontSize: 11 }]}>{l.data.esito}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.h3}>{l.title}</Text>
              <Text style={s.muted}>Roll {l.data.roll} · Cam {l.data.cam} · TC {l.data.tc}</Text>
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
              <Icon name="clipboard-edit-outline" size={22} color={colors.brandPrimary} />
            </Pressable>
            <Pressable testID={`slate-log-delete-${l.id}`} hitSlop={8} onPress={() => m.remove.mutate(l.id, { onSuccess: () => toast("Take rimosso") })}>
              <Icon name="trash-can-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ))}
      </ModuleScroll>
      <Modal visible={full} animationType="fade" onRequestClose={() => setFull(false)} supportedOrientations={["portrait", "landscape"]}>
        <View style={{ flex: 1, backgroundColor: BOARD, padding: spacing.xl, paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md, justifyContent: "center", gap: spacing.lg }}>
          <Board info={info} tc={tc} big />
          <View style={{ flexDirection: "row", gap: spacing.md, justifyContent: "center" }}>
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
