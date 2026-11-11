import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LensTool from "@/src/components/LensTool";
import { HeroCard } from "@/src/components/SectionHero";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Glass, Icon, IconName, Sheet, useStyles } from "@/src/ui";

type Voce = { id: string; icona: IconName; titolo: string; testo: string; route?: string; tinta: string };

const VOCI: Voce[] = [
  { id: "viewfinder", icona: "camera-metering-center", titolo: "Director's viewfinder", testo: "Inquadra con la cornice della tua camera: formato, focale e look", route: "/strumenti/viewfinder", tinta: "#D4AF37" },
  { id: "persone", icona: "account-multiple", titolo: "Persone", testo: "La tua rubrica: la troupe che ritrovi in ogni progetto", route: "/strumenti/persone", tinta: "#5B8DEF" },
  { id: "attrezzatura", icona: "camera", titolo: "La mia attrezzatura", testo: "Il tuo kit e le tue ottiche, pronti da portare sul set", route: "/strumenti/attrezzatura", tinta: "#E0663F" },
  { id: "formati", icona: "aspect-ratio", titolo: "Formati", testo: "Aspect ratio, risoluzioni, storage, shutter e slow motion", route: "/strumenti/formati", tinta: "#A06CD5" },
  { id: "ottiche", icona: "camera-iris", titolo: "Calcolatore ottiche", testo: "Campo inquadrato, iperfocale e profondità di campo", tinta: "#3FA796" },
];

// Gli strumenti del filmmaker, fuori dai progetti: quelli personali stanno qui,
// quelli di lavorazione (sceneggiatura, budget, storyboard...) dentro il progetto.
export default function Strumenti() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [ottiche, setOttiche] = useState(false);
  const cols = width > 900 ? 2 : 1;
  const cardW = (Math.min(width, 1000) - spacing.lg * 2 - (cols > 1 ? spacing.md : 0)) / cols;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.md, paddingBottom: insets.bottom + 120 }}>
        <HeroCard
          icon="toolbox"
          eyebrow="Strumenti"
          title="Il tuo kit di filmmaker"
          pills={[
            { icon: "toolbox-outline", text: `${VOCI.length} strumenti` },
            { icon: "camera-metering-center", text: "Viewfinder" },
            { icon: "camera-iris", text: "Ottiche & formati" },
          ]}
        />

        <Pressable testID="tool-home2" onPress={() => router.push("/home2" as never)} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
          <Glass style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: 22, borderWidth: 1, borderColor: "rgba(2,86,105,0.55)", padding: spacing.md }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.28)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
              <Icon name="flask-outline" size={21} color="#0A8FA6" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 18 }}>Home 2</Text>
              <Text style={{ color: colors.muted, fontSize: 11.5 }}>Esperimento: nero, teal e vetro</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#0A8FA6" />
          </Glass>
        </Pressable>

        <Text style={[s.label, { paddingTop: spacing.xs }]}>Personali</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {VOCI.map((v) => (
            <Pressable
              key={v.id}
              testID={`tool-${v.id}`}
              onPress={() => (v.route ? router.push(v.route as never) : setOttiche(true))}
              style={({ pressed }) => ({ width: cardW, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
            >
              <Glass style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, padding: spacing.lg, gap: spacing.sm, minHeight: 148 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: `${v.tinta}22`, borderWidth: 1, borderColor: `${v.tinta}55` }}>
                    <Icon name={v.icona} size={22} color={v.tinta} />
                  </View>
                  <View style={{ flex: 1 }} />
                  <Icon name="arrow-top-right" size={18} color={colors.brandPrimary} />
                </View>
                <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
                  {v.titolo}
                </Text>
                <Text style={{ color: colors.muted, fontFamily: fonts.text, fontSize: 12, lineHeight: 17 }} numberOfLines={3}>
                  {v.testo}
                </Text>
              </Glass>
            </Pressable>
          ))}
        </View>

        <View style={{ borderRadius: 22, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary, padding: spacing.lg, gap: spacing.xs, marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Icon name="movie-open-outline" size={13} color={colors.brandPrimary} />
            <Text style={s.label}>Dentro i progetti</Text>
          </View>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 18 }}>Gli strumenti di lavorazione</Text>
          <Text style={{ color: colors.muted, fontSize: 12.5, lineHeight: 18 }}>
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
