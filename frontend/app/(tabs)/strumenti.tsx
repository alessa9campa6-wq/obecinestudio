import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LensTool from "@/src/components/LensTool";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Glass, Icon, IconName, Sheet, useStyles } from "@/src/ui";

type Voce = { id: string; icona: IconName; titolo: string; testo: string; route?: string; tinta: string };

const VOCI: Voce[] = [
  { id: "viewfinder", icona: "camera-metering-center", titolo: "Director's viewfinder", testo: "Inquadra con la cornice della tua camera: formato, focale e look", route: "/strumenti/viewfinder", tinta: "#D4AF37" },
  { id: "persone", icona: "account-multiple", titolo: "Persone", testo: "La tua rubrica: la troupe che ritrovi in ogni progetto", route: "/strumenti/persone", tinta: "#5B8DEF" },
  { id: "attrezzatura", icona: "camera", titolo: "La mia attrezzatura", testo: "Il tuo kit e le tue ottiche, pronti da portare sul set", route: "/strumenti/attrezzatura", tinta: "#E0663F" },
  { id: "ottiche", icona: "camera-iris", titolo: "Calcolatore ottiche", testo: "Campo inquadrato, iperfocale e profondità di campo", tinta: "#3FA796" },
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
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text style={[s.h1, { flex: 1, fontSize: 26 }]}>Strumenti</Text>
        <Icon name="toolbox" size={22} color={colors.brandPrimary} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: insets.bottom + 120 }}>
        <Text style={s.label}>Personali</Text>
        {VOCI.map((v) => (
          <Pressable
            key={v.id}
            testID={`tool-${v.id}`}
            onPress={() => (v.route ? router.push(v.route as never) : setOttiche(true))}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
          >
            <Glass
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.divider,
              }}
            >
              <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: `${v.tinta}22`, borderWidth: 1, borderColor: `${v.tinta}55` }}>
                <Icon name={v.icona} size={22} color={v.tinta} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 15 }}>{v.titolo}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{v.testo}</Text>
              </View>
              <Icon name="chevron-right" size={22} color={colors.muted} />
            </Glass>
          </Pressable>
        ))}

        <Text style={[s.label, { paddingTop: spacing.md }]}>Dentro i progetti</Text>
        <Glass style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider, gap: spacing.xs }}>
          <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Gli strumenti di lavorazione</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
            Sceneggiatura, storyboard, budget, piano di lavorazione, ciak, meteo e diagrammi luce lavorano sui dati di un progetto: li trovi aprendo un progetto, nella colonna degli strumenti. Quelli qui sopra invece sono tuoi, valgono per tutti i set.
          </Text>
        </Glass>
      </ScrollView>

      <Sheet testID="tool-ottiche-sheet" visible={ottiche} onClose={() => setOttiche(false)} title="Calcolatore ottiche">
        <LensTool />
      </Sheet>
    </View>
  );
}
