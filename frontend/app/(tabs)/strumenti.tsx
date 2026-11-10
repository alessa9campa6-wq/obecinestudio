import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LensTool from "@/src/components/LensTool";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon, IconName, Sheet, useStyles } from "@/src/ui";

type Voce = { id: string; icona: IconName; titolo: string; testo: string; route?: string };

const VOCI: Voce[] = [
  { id: "persone", icona: "account-multiple-outline", titolo: "Persone", testo: "La tua rubrica: la troupe che ritrovi in ogni progetto", route: "/strumenti/persone" },
  { id: "attrezzatura", icona: "camera-outline", titolo: "La mia attrezzatura", testo: "Il tuo kit e le tue ottiche, pronti da portare sul set", route: "/strumenti/attrezzatura" },
  { id: "ottiche", icona: "camera-iris", titolo: "Calcolatore ottiche", testo: "Campo inquadrato, iperfocale e profondità di campo" },
];

// Gli strumenti del filmmaker, fuori dai progetti: quelli personali stanno qui,
// quelli di lavorazione (sceneggiatura, budget, storyboard...) dentro il progetto.
export default function Strumenti() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ottiche, setOttiche] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text style={[s.h1, { flex: 1, fontSize: 26 }]}>Strumenti</Text>
        <Icon name="toolbox-outline" size={22} color={colors.brandPrimary} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + 90 }}>
        <Text style={s.label}>Personali</Text>
        {VOCI.map((v) => (
          <Pressable
            key={v.id}
            testID={`tool-${v.id}`}
            onPress={() => (v.route ? router.push(v.route as never) : setOttiche(true))}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.surfaceTertiary : colors.surfaceSecondary,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
              <Icon name={v.icona} size={20} color={colors.onBrandTertiary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 15 }}>{v.titolo}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{v.testo}</Text>
            </View>
            <Icon name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        ))}

        <Text style={[s.label, { paddingTop: spacing.md }]}>Dentro i progetti</Text>
        <View style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.divider, gap: spacing.xs }}>
          <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Gli strumenti di lavorazione</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            Sceneggiatura, storyboard, budget, piano di lavorazione, ciak, meteo e diagrammi luce lavorano sui dati di un progetto: li trovi aprendo un progetto, nella colonna degli strumenti. Quelli qui sopra invece sono tuoi, valgono per tutti i set.
          </Text>
        </View>
      </ScrollView>

      <Sheet testID="tool-ottiche-sheet" visible={ottiche} onClose={() => setOttiche(false)} title="Calcolatore ottiche">
        <LensTool />
      </Sheet>
    </View>
  );
}
