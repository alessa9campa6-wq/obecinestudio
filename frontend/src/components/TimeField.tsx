import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, useStyles } from "@/src/ui";

// ---------------------------------------------------------------- orario
// Selettore d'orario a rotella: si fa scorrere l'ora e i minuti, come su una
// sveglia. Niente da scrivere a mano.
const ITEM_H = 44;
const VISIBILI = 5;

const _due = (n: number) => String(n).padStart(2, "0");

// Legge gli orari già salvati (14:30) e anche quelli scritti a mano in passato
// (14.30, 1430, 9, 7.5).
export function oraHm(testo: string): string {
  const t = String(testo ?? "")
    .trim()
    .toLowerCase()
    .replace(/\./g, ":")
    .replace(/\s+/g, "");
  if (!t) return "";

  const hm = t.match(/^(\d{1,2}):(\d{1,2})$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    return h <= 23 && m <= 59 ? `${_due(h)}:${_due(m)}` : "";
  }

  const attaccato = t.match(/^(\d{3,4})$/);
  if (attaccato) {
    const h = Number(attaccato[1].slice(0, -2));
    const m = Number(attaccato[1].slice(-2));
    return h <= 23 && m <= 59 ? `${_due(h)}:${_due(m)}` : "";
  }

  const solaOra = t.match(/^(\d{1,2})$/);
  if (solaOra) {
    const h = Number(solaOra[1]);
    return h <= 23 ? `${_due(h)}:00` : "";
  }

  return "";
}

const adessoHm = () => {
  const d = new Date();
  return `${_due(d.getHours())}:${_due(d.getMinutes())}`;
};

const piuMinuti = (hm: string, quanti: number) => {
  const [h, m] = (hm || adessoHm()).split(":").map(Number);
  const totali = ((((h || 0) * 60 + (m || 0) + quanti) % 1440) + 1440) % 1440;
  return `${_due(Math.floor(totali / 60))}:${_due(totali % 60)}`;
};

// Una colonna della rotella: scorre e si ferma sul valore al centro.
function Rotella({
  valori,
  valore,
  onChange,
  testIDPrefix,
  visible,
}: {
  valori: string[];
  valore: string;
  onChange: (v: string) => void;
  testIDPrefix: string;
  visible: boolean;
}) {
  const { colors } = useTheme();
  const ref = useRef<ScrollView | null>(null);
  const indice = Math.max(0, valori.indexOf(valore));

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => ref.current?.scrollTo({ y: indice * ITEM_H, animated: false }), 30);
    return () => clearTimeout(t);
  }, [visible, indice]);

  const vai = (i: number) => {
    const k = Math.min(valori.length - 1, Math.max(0, i));
    if (valori[k] !== valore) onChange(valori[k]);
  };

  return (
    <View style={{ flex: 1, height: ITEM_H * VISIBILI }}>
      <ScrollView
        ref={ref}
        testID={`${testIDPrefix}-rotella`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBILI / 2) }}
        onScroll={(e) => vai(Math.round(e.nativeEvent.contentOffset.y / ITEM_H))}
      >
        {valori.map((v) => {
          const attivo = v === valore;
          return (
            <Pressable
              key={v}
              testID={`${testIDPrefix}-${v}`}
              onPress={() => {
                onChange(v);
                ref.current?.scrollTo({ y: valori.indexOf(v) * ITEM_H, animated: true });
              }}
              style={{ height: ITEM_H, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{
                  fontFamily: "Geist",
                  fontSize: attivo ? 26 : 18,
                  color: attivo ? colors.onSurface : colors.muted,
                  fontWeight: attivo ? "700" : "400",
                }}
              >
                {v}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SelettoreOra({
  visible,
  valore,
  onClose,
  onScegli,
}: {
  visible: boolean;
  valore?: string;
  onClose: () => void;
  onScegli: (scelto: string) => void;
}) {
  const { colors } = useTheme();
  const [ora, setOra] = useState("08");
  const [minuto, setMinuto] = useState("00");

  useEffect(() => {
    if (!visible) return;
    const hm = oraHm(valore ?? "") || adessoHm();
    const [h, m] = hm.split(":");
    setOra(h);
    setMinuto(m);
  }, [visible, valore]);

  const scelto = `${ora}:${minuto}`;
  const ore = Array.from({ length: 24 }, (_, h) => _due(h));
  const minuti = Array.from({ length: 60 }, (_, m) => _due(m));

  const prendi = (hm: string) => {
    const [h, m] = hm.split(":");
    setOra(h);
    setMinuto(m);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Pressable accessibilityLabel="Chiudi il selettore d'orario" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: "100%", maxWidth: 420, gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name="clock-outline" size={20} color={colors.brandPrimary} />
            <Text style={{ flex: 1, fontFamily: "Fraunces", fontSize: 18, color: colors.onSurface }}>Che ora?</Text>
            <Text testID="ora-anteprima" style={{ fontFamily: "Geist", fontSize: 26, color: colors.onSurface }}>{scelto}</Text>
          </View>

          <ChipRow>
            <Chip testID="ora-adesso" label="Adesso" onPress={() => prendi(adessoHm())} />
            <Chip testID="ora-piu-30" label="+30 min" onPress={() => prendi(piuMinuti(scelto, 30))} />
            <Chip
              testID="ora-svuota"
              icon="close"
              label="Svuota"
              onPress={() => {
                onScegli("");
                onClose();
              }}
            />
          </ChipRow>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Rotella valori={ore} valore={ora} onChange={setOra} testIDPrefix="ora" visible={visible} />
            <Text style={{ fontFamily: "Geist", fontSize: 26, color: colors.muted }}>:</Text>
            <Rotella valori={minuti} valore={minuto} onChange={setMinuto} testIDPrefix="minuti" visible={visible} />
            <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: ITEM_H * Math.floor(VISIBILI / 2), height: ITEM_H, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary, opacity: 0.35 }} />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
            <Button label="Annulla" variant="secondary" onPress={onClose} />
            <Button
              testID="ora-fatto"
              label="Fatto"
              onPress={() => {
                onScegli(scelto);
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function TimeField({ label, value, onChange, testID }: { label?: string; value?: string; onChange: (v: string) => void; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [aperto, setAperto] = useState(false);
  const hm = oraHm(String(value ?? ""));
  const scrittoAMano = value && !hm ? String(value) : "";

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <ChipRow>
        <Chip testID={`${testID}-adesso`} label="Adesso" onPress={() => onChange(adessoHm())} />
        <Chip testID={`${testID}-mezzora`} label="+30 min" onPress={() => onChange(piuMinuti(hm, 30))} />
        {value ? <Chip testID={`${testID}-svuota`} icon="close" label="Svuota" onPress={() => onChange("")} /> : null}
      </ChipRow>
      <Pressable
        testID={testID}
        onPress={() => setAperto(true)}
        style={({ pressed }) => ({
          minHeight: 48,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfaceTertiary : colors.surfaceSecondary,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        })}
      >
        <Icon name="clock-outline" size={18} color={colors.brandPrimary} />
        <Text numberOfLines={1} style={{ flex: 1, color: hm ? colors.onSurface : colors.muted, fontFamily: "Geist", fontSize: 15 }}>
          {hm || "Tocca per scegliere l'orario"}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {scrittoAMano ? <Text style={s.muted}>Orario scritto a mano: {scrittoAMano}</Text> : null}
      <SelettoreOra visible={aperto} valore={hm} onClose={() => setAperto(false)} onScegli={onChange} />
    </View>
  );
}
