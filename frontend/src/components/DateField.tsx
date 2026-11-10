import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { DateModo, descriviDate, leggiDate, scriviDate } from "@/src/dates";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, Segmented, useStyles } from "@/src/ui";

export const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

const MODI: { value: DateModo; label: string }[] = [
  { value: "giorno", label: "Un giorno" },
  { value: "piu", label: "Più giorni" },
  { value: "intervallo", label: "Da … a …" },
];

// Un solo calendario per tutti i casi: un giorno, più giorni anche non
// consecutivi, oppure dal primo giorno all'ultimo.
export function SelettoreDate({
  visible,
  modo: modoIniziale,
  giorni: giorniIniziali,
  onClose,
  onScegli,
}: {
  visible: boolean;
  modo: DateModo;
  giorni: string[];
  onClose: () => void;
  onScegli: (modo: DateModo, giorni: string[]) => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [modo, setModo] = useState<DateModo>(modoIniziale);
  const [giorni, setGiorni] = useState<string[]>([]);
  const [mese, setMese] = useState(() => dayjs(giorniIniziali[0] || undefined).startOf("month"));

  useEffect(() => {
    if (!visible) return;
    setModo(modoIniziale);
    setGiorni(giorniIniziali);
    setMese(dayjs(giorniIniziali[0] || undefined).startOf("month"));
  }, [visible, modoIniziale, giorniIniziali.join(",")]);

  const primo = mese.startOf("month");
  const vuote = (primo.day() + 6) % 7;
  const totale = mese.endOf("month").date();
  const celle: (dayjs.Dayjs | null)[] = [
    ...Array.from({ length: vuote }, () => null),
    ...Array.from({ length: totale }, (_, i) => primo.add(i, "day")),
  ];
  while (celle.length % 7 !== 0) celle.push(null);

  const oggi = dayjs().format("YYYY-MM-DD");
  const inizio = modo === "intervallo" ? giorni[0] ?? "" : "";
  const fine = modo === "intervallo" ? giorni[1] ?? "" : "";

  const cambiaModo = (m: DateModo) => {
    setModo(m);
    setGiorni((g) => (m === "giorno" ? g.slice(0, 1) : m === "intervallo" ? g.slice(0, 2) : g));
  };

  const tocca = (iso: string) => {
    if (modo === "giorno") {
      onScegli("giorno", [iso]);
      onClose();
      return;
    }
    if (modo === "piu") {
      setGiorni((g) => (g.includes(iso) ? g.filter((x) => x !== iso) : [...g, iso].sort()));
      return;
    }
    if (!inizio || fine) {
      setGiorni([iso]);
      return;
    }
    if (iso < inizio) {
      setGiorni([iso]);
      return;
    }
    onScegli("intervallo", [inizio, iso]);
    onClose();
  };

  const scelto = (iso: string) => (modo === "intervallo" ? iso === inizio || iso === fine : giorni.includes(iso));
  const tra = (iso: string) => modo === "intervallo" && !!inizio && !!fine && iso > inizio && iso < fine;

  const nota =
    modo === "giorno"
      ? "Tocca il giorno"
      : modo === "piu"
        ? giorni.length
          ? `${giorni.length} giorni scelti · tocca ancora per togliere`
          : "Tocca tutti i giorni che ti servono"
        : inizio && !fine
          ? "Ora tocca l'ultimo giorno"
          : "Tocca il primo giorno, poi l'ultimo";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Pressable accessibilityLabel="Chiudi il calendario" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: "100%", maxWidth: 460, gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <Segmented testID="date-modo" value={modo} onChange={cambiaModo} options={MODI} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Button testID="date-mese-prima" icon="chevron-left" variant="secondary" small onPress={() => setMese(mese.subtract(1, "month"))} />
            <Text style={{ fontFamily: "Fraunces", fontSize: 18, color: colors.onSurface }}>
              {MESI[mese.month()]} {mese.year()}
            </Text>
            <Button testID="date-mese-dopo" icon="chevron-right" variant="secondary" small onPress={() => setMese(mese.add(1, "month"))} />
          </View>

          <View style={{ flexDirection: "row" }}>
            {["L", "M", "M", "G", "V", "S", "D"].map((g, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", color: colors.muted, fontFamily: "Geist", fontSize: 12 }}>{g}</Text>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {celle.map((giorno, i) => {
              if (!giorno) return <View key={`vuota-${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
              const iso = giorno.format("YYYY-MM-DD");
              const isScelto = scelto(iso);
              const isTra = tra(iso);
              const isOggi = iso === oggi;
              return (
                <Pressable key={iso} testID={`date-giorno-${iso}`} onPress={() => tocca(iso)} style={{ width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center" }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isScelto ? colors.brandPrimary : isTra ? colors.brandTertiary : "transparent",
                      borderWidth: isOggi && !isScelto ? 1 : 0,
                      borderColor: colors.brandPrimary,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Geist",
                        fontSize: 15,
                        color: isScelto ? colors.onBrandPrimary : isTra ? colors.onBrandTertiary : colors.onSurface,
                        fontWeight: isOggi && !isScelto ? "700" : "400",
                      }}
                    >
                      {giorno.date()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.muted}>{nota}</Text>

          <View style={{ flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end", alignItems: "center" }}>
            {giorni.length ? (
              <Button testID="date-pulisci" label="Pulisci" variant="ghost" onPress={() => (onScegli(modo, []), onClose())} />
            ) : null}
            <Button testID="date-annulla" label="Annulla" variant="secondary" onPress={onClose} />
            {modo === "piu" ? (
              <Button testID="date-conferma" label="Conferma" disabled={!giorni.length} onPress={() => (onScegli("piu", giorni), onClose())} />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ApriData({ testo, onPress, testID }: { testo: string; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
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
      <Icon name="calendar-month-outline" size={18} color={colors.brandPrimary} />
      <Text numberOfLines={1} style={{ flex: 1, color: colorOf(testo, colors), fontFamily: "Geist", fontSize: 15 }}>{testo}</Text>
      <Icon name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
  );
}

const colorOf = (testo: string, colors: any) => (testo.startsWith("Tocca") ? colors.muted : colors.onSurface);

// Campo data usato da tutte le liste: un giorno, più giorni o un intervallo,
// con lo stesso calendario. Il valore resta salvato in un testo semplice.
export function DateField({ label, value, onChange, testID }: { label?: string; value?: string; onChange: (v: string) => void; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [aperto, setAperto] = useState(false);
  const oggi = dayjs();
  const { modo, giorni } = leggiDate(value);
  const scrittaAMano = value && !giorni.length ? String(value) : "";

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <ChipRow>
        <Chip testID={`${testID}-oggi`} label="Oggi" selected={giorni.length === 1 && giorni[0] === oggi.format("YYYY-MM-DD")} onPress={() => onChange(oggi.format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-domani`} label="Domani" selected={giorni.length === 1 && giorni[0] === oggi.add(1, "day").format("YYYY-MM-DD")} onPress={() => onChange(oggi.add(1, "day").format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-tre`} label="3 giorni" onPress={() => onChange(`${oggi.format("YYYY-MM-DD")}|${oggi.add(2, "day").format("YYYY-MM-DD")}`)} />
        <Chip testID={`${testID}-settimana`} label="1 settimana" onPress={() => onChange(`${oggi.format("YYYY-MM-DD")}|${oggi.add(6, "day").format("YYYY-MM-DD")}`)} />
        {value ? <Chip testID={`${testID}-svuota`} icon="close" label="Svuota" onPress={() => onChange("")} /> : null}
      </ChipRow>
      <ApriData testID={testID} testo={giorni.length ? descriviDate(value) : "Tocca per scegliere le date"} onPress={() => setAperto(true)} />
      {giorni.length ? (
        <Pressable testID={`${testID}-modo-rapido`} onPress={() => setAperto(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="calendar-edit" size={14} color={colors.muted} />
          <Text style={s.muted}>{modo === "giorno" ? "Un giorno" : modo === "piu" ? "Più giorni" : "Intervallo"} · modifica</Text>
        </Pressable>
      ) : null}
      {scrittaAMano ? <Text style={s.muted}>Data scritta a mano: {scrittaAMano}</Text> : null}
      <SelettoreDate
        visible={aperto}
        modo={modo}
        giorni={giorni}
        onClose={() => setAperto(false)}
        onScegli={(m, g) => onChange(scriviDate(m, g))}
      />
    </View>
  );
}
