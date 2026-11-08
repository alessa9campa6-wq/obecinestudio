import { Pressable, Text, View } from "react-native";

import { parseRoles, RowField, Ruolo, ruoloTotale, ruoloVuoto, eur } from "@/src/modules";
import { radius, spacing, type, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon } from "@/src/ui";

// Campo a righe ripetibili: ogni riga ha i suoi sotto-campi (ruolo, tariffa,
// unità, giorni) e il suo totale. Serve alla troupe, dove una persona può avere
// più ruoli con tariffe diverse, ma è generico: si riusa per altri moduli.
export function RowsField({
  label,
  fields,
  value,
  onChange,
  testID,
}: {
  label: string;
  fields: RowField[];
  value: any;
  onChange: (v: any) => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  const righe: Ruolo[] = Array.isArray(value) ? value : [];
  // Prima era testo libero: si mostra e si può convertire, senza perdere nulla.
  const vecchio = typeof value === "string" ? value.trim() : "";

  const cambia = (indice: number, patch: Partial<Ruolo>) =>
    onChange(righe.map((riga, i) => (i === indice ? { ...riga, ...patch } : riga)));

  const rimuovi = (indice: number) => onChange(righe.filter((_, i) => i !== indice));

  const aggiungi = () => onChange([...righe, ruoloVuoto()]);

  const totale = righe.reduce((somma, riga) => somma + ruoloTotale(riga), 0);

  return (
    <View testID={testID} style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.muted, fontSize: type.sm, fontWeight: "600" }}>{label}</Text>

      {vecchio ? (
        <View
          testID={testID ? `${testID}-legacy` : undefined}
          style={{
            gap: spacing.xs,
            padding: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceTertiary,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: type.sm }}>Testo delle versioni precedenti</Text>
          <Text style={{ color: colors.onSurface, fontSize: type.base }}>{vecchio}</Text>
          <Button
            testID={testID ? `${testID}-converti` : undefined}
            icon="swap-horizontal"
            label="Converti in ruoli"
            variant="secondary"
            small
            onPress={() => onChange(parseRoles(vecchio))}
          />
        </View>
      ) : null}

      {righe.map((riga, indice) => {
        const valori = riga as Record<string, any>;

        return (
          <View
            key={indice}
            testID={testID ? `${testID}-row-${indice}` : undefined}
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceSecondary,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: colors.muted, fontSize: type.sm, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>
                Ruolo {indice + 1}
              </Text>
              <Pressable
                testID={testID ? `${testID}-row-${indice}-remove` : undefined}
                accessibilityLabel={`Rimuovi ruolo ${indice + 1}`}
                hitSlop={10}
                onPress={() => rimuovi(indice)}
                style={{ minHeight: 32, minWidth: 32, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="trash-can-outline" size={18} color={colors.error} />
              </Pressable>
            </View>

            {fields.map((f) =>
              f.type === "select" ? (
                <View key={f.key} style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.muted, fontSize: type.sm, fontWeight: "600" }}>{f.label}</Text>
                  <ChipRow>
                    {(f.options ?? []).map((opzione) => (
                      <Chip
                        key={opzione}
                        testID={testID ? `${testID}-row-${indice}-${f.key}-${opzione}` : undefined}
                        label={opzione}
                        selected={valori[f.key] === opzione}
                        onPress={() => cambia(indice, { [f.key]: valori[f.key] === opzione ? "" : opzione } as Partial<Ruolo>)}
                      />
                    ))}
                  </ChipRow>
                </View>
              ) : (
                <Field
                  key={f.key}
                  testID={testID ? `${testID}-row-${indice}-${f.key}` : undefined}
                  label={f.label}
                  value={String(valori[f.key] ?? "")}
                  onChangeText={(testo) => cambia(indice, { [f.key]: testo } as Partial<Ruolo>)}
                  placeholder={f.placeholder}
                  keyboardType={f.type === "number" ? "decimal-pad" : "default"}
                />
              ),
            )}

            <Text style={{ color: colors.onSurface, fontSize: type.base, fontWeight: "700", textAlign: "right" }}>
              {eur(ruoloTotale(riga))}
            </Text>
          </View>
        );
      })}

      <Button
        testID={testID ? `${testID}-add` : undefined}
        icon="plus"
        label="Aggiungi ruolo"
        variant="secondary"
        onPress={aggiungi}
      />

      {righe.length ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            paddingTop: spacing.sm,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: type.sm, fontWeight: "600" }}>Totale ruoli</Text>
          <Text style={{ color: colors.brandPrimary, fontSize: type.lg, fontWeight: "700" }}>{eur(totale)}</Text>
        </View>
      ) : null}
    </View>
  );
}
