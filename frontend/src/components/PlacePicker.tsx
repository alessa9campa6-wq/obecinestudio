import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { api } from "@/src/api";
import { radius, spacing, useTheme } from "@/src/theme";
import { Field, Icon, useStyles } from "@/src/ui";

// La posizione è un posto vero, non una parola scritta: si cerca (città o via)
// e si sceglie dal risultato, così l'annuncio sa dove si trova davvero.
export type Luogo = { label: string; place: string; city: string; lat: number; lng: number };

export default function PlacePicker({
  value,
  onChange,
  label = "Posizione",
  placeholder = "Cerca una città, una via, un quartiere",
}: {
  value?: Luogo | null;
  onChange: (v: Luogo | null) => void;
  label?: string;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const [testo, setTesto] = useState("");
  const [cerca, setCerca] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setCerca(testo.trim()), 400);
    return () => clearTimeout(t);
  }, [testo]);

  const luoghi = useQuery({
    queryKey: ["places", cerca],
    queryFn: () => api<Luogo[]>(`/places?q=${encodeURIComponent(cerca)}`),
    enabled: cerca.length >= 3,
    staleTime: 60_000,
  });

  if (value) {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Icon name="map-marker" size={18} color={colors.onBrandTertiary} />
          <Text style={{ flex: 1, color: colors.onBrandTertiary, fontSize: 13, fontWeight: "600" }} numberOfLines={2}>
            {value.label}
          </Text>
          <Pressable testID="place-clear" onPress={() => onChange(null)} hitSlop={8}>
            <Icon name="close-circle" size={18} color={colors.onBrandTertiary} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <Field testID="place-search" label={label} value={testo} onChangeText={setTesto} placeholder={placeholder} autoCapitalize="words" />
      {cerca.length >= 3 ? (
        luoghi.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : (luoghi.data ?? []).length === 0 ? (
          <Text style={s.muted}>Nessun posto trovato: prova con “Milano”, “Via Roma” o il nome del paese.</Text>
        ) : (
          <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.lg, overflow: "hidden" }}>
            {(luoghi.data ?? []).map((l, i) => (
              <Pressable
                key={`${l.label}-${i}`}
                testID={`place-result-${i}`}
                onPress={() => {
                  onChange(l);
                  setTesto("");
                  setCerca("");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: pressed ? colors.surfaceTertiary : colors.surfaceSecondary,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.divider,
                })}
              >
                <Icon name="map-marker-outline" size={16} color={colors.brandPrimary} />
                <Text style={{ flex: 1, color: colors.onSurface, fontSize: 13 }} numberOfLines={2}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : (
        <Text style={[s.muted, { fontSize: 12 }]}>Scrivi almeno tre lettere: ti mostro i luoghi veri da scegliere.</Text>
      )}
    </View>
  );
}
