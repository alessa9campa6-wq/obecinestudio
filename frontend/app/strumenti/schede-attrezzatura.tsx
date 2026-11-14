import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIE, Categoria, ENCICLOPEDIA, fascia, Voce } from "@/src/enciclopedia";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Icon, IconName, Sheet, useStyles } from "@/src/ui";

export default function SchedeAttrezzatura() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [categoria, setCategoria] = useState<Categoria | "tutte">("tutte");
  const [cerca, setCerca] = useState("");
  const [aperta, setAperta] = useState<Voce | null>(null);

  const cols = width > 900 ? 2 : 1;
  const cardW = (Math.min(width, 1000) - spacing.lg * 2 - (cols > 1 ? spacing.md : 0)) / cols;

  const voci = useMemo(() => {
    const termine = cerca.trim().toLowerCase();
    return ENCICLOPEDIA.filter((v) => categoria === "tutte" || v.categoria === categoria).filter((v) =>
      termine ? [v.marca, v.nome, v.sintesi, ...v.specifiche].join(" ").toLowerCase().includes(termine) : true,
    ).sort((a, b) => a.marca.localeCompare(b.marca) || a.nome.localeCompare(b.nome));
  }, [categoria, cerca]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.md, paddingBottom: insets.bottom + 80 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Button testID="schede-back" icon="chevron-left" small variant="secondary" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>STRUMENTI</Text>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 28 }}>Schede attrezzatura</Text>
          </View>
        </View>
        <Text style={s.muted}>Camere, ottiche e luci con prezzi di mercato indicativi in Italia.</Text>
        <TextInput
          testID="schede-search"
          value={cerca}
          onChangeText={setCerca}
          placeholder="Cerca: Alexa, 50mm, SkyPanel…"
          placeholderTextColor={colors.muted}
          style={{ color: colors.onSurface, backgroundColor: colors.surfaceSecondary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.border }}
        />
        <ChipRow>
          {CATEGORIE.map((c) => (
            <Chip key={c.id} testID={`schede-cat-${c.id}`} label={c.label} selected={categoria === c.id} onPress={() => setCategoria(c.id)} />
          ))}
        </ChipRow>
        <Text style={[s.muted, { fontSize: 12 }]}>{voci.length} modelli · prezzi indicativi, IVA esclusa</Text>
        {voci.length === 0 ? (
          <Text style={s.muted}>Nessun modello trovato.</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {voci.map((v) => (
              <Pressable key={v.id} testID={`schede-item-${v.id}`} onPress={() => setAperta(v)} style={({ pressed }) => ({ width: cols > 1 ? cardW : "100%", opacity: pressed ? 0.8 : 1 })}>
                <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.divider }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
                      <Icon name={(v.categoria === "camere" ? "video-outline" : v.categoria === "ottiche" ? "camera-iris" : "lightbulb-on-outline") as IconName} size={20} color={colors.brandPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 10.5, fontWeight: "800", letterSpacing: 1 }}>{v.marca.toUpperCase()}</Text>
                      <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>{v.nome}</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={colors.muted} />
                  </View>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12.5 }} numberOfLines={2}>{v.sintesi}</Text>
                  <View style={{ flexDirection: "row", gap: spacing.md, paddingTop: 2 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 10 }}>Acquisto</Text>
                      <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "800" }}>{fascia(v.acquisto)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.muted, fontSize: 10 }}>Noleggio / giorno</Text>
                      <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: "800" }}>{fascia(v.noleggio)}</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      <Sheet testID="schede-sheet" visible={!!aperta} onClose={() => setAperta(null)} title={aperta ? `${aperta.marca} ${aperta.nome}` : ""}>
        {aperta ? (
          <>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 20 }}>{aperta.sintesi}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {aperta.specifiche.map((sp) => (
                <View key={sp} style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.onSurfaceSecondary, fontSize: 11.5 }}>{sp}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }}>
                <Text style={s.muted}>Acquisto (usato)</Text>
                <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: "800", paddingTop: 2 }}>{fascia(aperta.acquisto)}</Text>
              </View>
              <View style={{ flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }}>
                <Text style={s.muted}>Noleggio / giorno</Text>
                <Text style={{ color: colors.brandPrimary, fontSize: 17, fontWeight: "800", paddingTop: 2 }}>{fascia(aperta.noleggio)}</Text>
              </View>
            </View>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19 }}>{aperta.nota}</Text>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
