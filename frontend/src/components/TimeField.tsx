import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, useStyles } from "@/src/ui";

// ---------------------------------------------------------------- orario
// Selettore d'orario: si toccano le ore e i minuti, non si scrive niente.
const MINUTI = Array.from({ length: 12 }, (_, i) => i * 5);

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
  const [ora, setOra] = useState<number | null>(null);
  const [minuto, setMinuto] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const hm = oraHm(valore ?? "");
    const pezzi = hm ? hm.split(":").map(Number) : [];
    setOra(pezzi.length ? pezzi[0] : null);
    setMinuto(pezzi.length ? pezzi[1] : null);
  }, [visible, valore]);

  const scelto = ora !== null && minuto !== null ? `${_due(ora)}:${_due(minuto)}` : "";
  const minuti = minuto !== null && !MINUTI.includes(minuto) ? [...MINUTI, minuto].sort((a, b) => a - b) : MINUTI;

  const cella = (testo: string, attivo: boolean, onPress: () => void, testID: string) => (
    <Pressable
      key={testID}
      testID={testID}
      accessibilityLabel={testo}
      onPress={onPress}
      style={{
        width: 54,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: attivo ? colors.brandPrimary : colors.border,
        backgroundColor: attivo ? colors.brandPrimary : colors.surfaceSecondary,
      }}
    >
      <Text style={{ fontFamily: "Geist", fontSize: 15, color: attivo ? colors.onBrandPrimary : colors.onSurface }}>{testo}</Text>
    </Pressable>
  );

  const prendi = (hm: string) => {
    const p = hm.split(":").map(Number);
    setOra(p[0]);
    setMinuto(p[1]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Pressable accessibilityLabel="Chiudi il selettore d'orario" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: "100%", maxWidth: 420, gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name="clock-outline" size={20} color={colors.brandPrimary} />
            <Text style={{ flex: 1, fontFamily: "Fraunces", fontSize: 18, color: colors.onSurface }}>Che ora?</Text>
            <Text style={{ fontFamily: "Geist", fontSize: 22, color: scelto ? colors.onSurface : colors.muted }}>{scelto || "--:--"}</Text>
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

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: spacing.sm }}>
            <Text style={{ fontFamily: "Geist", fontSize: 12, color: colors.muted }}>Ore</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {Array.from({ length: 24 }, (_, h) => cella(_due(h), ora === h, () => setOra(h), `ora-${_due(h)}`))}
            </View>
            <Text style={{ fontFamily: "Geist", fontSize: 12, color: colors.muted }}>Minuti</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {minuti.map((m) => cella(_due(m), minuto === m, () => setMinuto(m), `minuti-${_due(m)}`))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
            <Button label="Annulla" variant="secondary" onPress={onClose} />
            <Button
              testID="ora-fatto"
              label="Fatto"
              disabled={!scelto}
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
