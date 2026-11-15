import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIE, Categoria, ENCICLOPEDIA, fascia, Voce } from "@/src/enciclopedia";
import { ENCICLOPEDIA_EXTRA } from "@/src/enciclopedia-extra";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Icon, IconName, Sheet, useStyles } from "@/src/ui";

const TUTTE: Voce[] = [...ENCICLOPEDIA, ...ENCICLOPEDIA_EXTRA];

const COPERTINE: Record<Categoria, string> = {
  camere: "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?q=80&w=1200&auto=format&fit=crop",
  ottiche: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop",
  luci: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop",
};

const ICONA: Record<Categoria, IconName> = {
  camere: "video-outline",
  ottiche: "camera-iris",
  luci: "lightbulb-on-outline",
};

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
    return TUTTE.filter((v) => categoria === "tutte" || v.categoria === categoria).filter((v) =>
      termine
        ? [v.marca, v.nome, v.sintesi, v.ideale ?? "", ...v.specifiche, ...(v.pro ?? []), ...(v.contro ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(termine)
        : true,
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
        <Text style={s.muted}>
          {TUTTE.length} schede tra camere, ottiche e luci: specifiche, pro e contro, uso consigliato e prezzi indicativi in Italia.
        </Text>
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
                <Card style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.divider }}>
                  <View style={{ height: 128 }}>
                    <Image source={{ uri: v.immagine ?? COPERTINE[v.categoria] }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                    <View style={{ position: "absolute", left: spacing.md, bottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill }}>
                      <Icon name={ICONA[v.categoria]} size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{v.marca.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={{ padding: spacing.md, gap: spacing.xs }}>
                    <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: "700" }} numberOfLines={1}>{v.nome}</Text>
                    <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12.5 }} numberOfLines={2}>{v.sintesi}</Text>
                    {v.ideale ? <Text style={{ color: colors.muted, fontSize: 11.5 }} numberOfLines={2}>Ideale per: {v.ideale}</Text> : null}
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
            <View style={{ borderRadius: radius.md, overflow: "hidden", height: 180 }}>
              <Image source={{ uri: aperta.immagine ?? COPERTINE[aperta.categoria] }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
            </View>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 20 }}>{aperta.sintesi}</Text>
            {aperta.ideale ? (
              <View style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }}>
                <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>IDEALE PER</Text>
                <Text style={{ color: colors.onSurface, fontSize: 12.5, paddingTop: 2 }}>{aperta.ideale}</Text>
              </View>
            ) : null}
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
            {aperta.pro || aperta.contro ? (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {aperta.pro ? (
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>PRO</Text>
                    {aperta.pro.map((p) => (
                      <Text key={p} style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>+ {p}</Text>
                    ))}
                  </View>
                ) : null}
                {aperta.contro ? (
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>CONTRO</Text>
                    {aperta.contro.map((c) => (
                      <Text key={c} style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>− {c}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {aperta.approfondimento ? (
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20 }}>{aperta.approfondimento}</Text>
            ) : null}
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 19 }}>{aperta.nota}</Text>
          </>
        ) : null}
      </Sheet>
    </View>
  );
}
