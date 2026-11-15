import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ALL_ARTICLES,
  ARTICLES_BY_SLUG,
  Article,
  ArticleLevel,
  CATEGORIES,
  LEVEL_LABELS,
  isFavorite,
  pushRecent,
  toggleFavorite,
} from "@/src/enciclopedia/index";
import { DIAGRAMS } from "@/src/enciclopedia/diagrams";
import { categoryImage } from "@/src/enciclopedia/images";
import { TOOLS } from "@/src/enciclopedia/tools";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, Icon, IconName, Segmented, useStyles } from "@/src/ui";

export default function Articolo() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const article = slug ? ARTICLES_BY_SLUG[slug] : undefined;
  const [level, setLevel] = useState<ArticleLevel>("principiante");
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (!article) return;
    let mounted = true;
    (async () => {
      await pushRecent(article.slug);
      const f = await isFavorite(article.slug);
      if (mounted) {
        setFav(f);
        setLevel(article.difficulty);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [article]);

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Text style={s.h2}>Voce non trovata</Text>
        <Button label="Torna all'enciclopedia" onPress={() => router.back()} />
      </View>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === article.categoryId);
  const relatedArticles = article.related.map((r) => ARTICLES_BY_SLUG[r]).filter(Boolean) as Article[];
  const Diagram = article.diagram ? DIAGRAMS[article.diagram] : null;
  const Tool = article.tool ? TOOLS[article.tool] : null;

  const onToggleFav = async () => {
    const items = await toggleFavorite(article.slug);
    setFav(items.some((i) => i.slug === article.slug));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.md, paddingBottom: insets.bottom + 80 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Button testID="article-back" icon="chevron-left" small variant="secondary" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>{cat?.title?.toUpperCase()}</Text>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 22 }} numberOfLines={2}>{article.title}</Text>
          </View>
          <Button testID="article-favorite" icon={fav ? "bookmark" : "bookmark-outline"} small variant="secondary" onPress={onToggleFav} />
        </View>

        <Text style={s.muted}>{article.subtitle}</Text>

        <View style={{ borderRadius: radius.lg, overflow: "hidden", height: 190 }}>
          <Image source={{ uri: categoryImage(article.categoryId) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={250} />
          <View style={{ position: "absolute", left: spacing.sm, bottom: spacing.sm, right: spacing.sm }}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", backgroundColor: "rgba(0,0,0,0.5)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill }}>
              Immagine di repertorio · {cat?.title}
            </Text>
          </View>
        </View>

        {/* Breadcrumb */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
          <Pressable onPress={() => router.push("/strumenti/enciclopedia" as any)}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Enciclopedia</Text>
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12 }}>›</Text>
          <Pressable onPress={() => router.push("/strumenti/enciclopedia" as any)}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{cat?.title}</Text>
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12 }}>›</Text>
          <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "600" }}>{article.title}</Text>
        </View>

        {/* Level selector */}
        <Segmented
          testID="article-level"
          options={[
            { value: "principiante", label: "Principiante" },
            { value: "intermedio", label: "Intermedio" },
            { value: "avanzato", label: "Avanzato" },
          ]}
          value={level}
          onChange={setLevel}
        />

        <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.divider }}>
          <Text style={{ color: colors.onSurface, fontSize: 14, lineHeight: 22 }}>{article.content[level]}</Text>
        </Card>

        {article.howItWorks && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Come funziona</Text>
            <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.divider }}>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20 }}>{article.howItWorks}</Text>
            </Card>
          </View>
        )}

        {article.practical && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Applicazioni pratiche sul set</Text>
            <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.divider }}>
              <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20 }}>{article.practical}</Text>
            </Card>
          </View>
        )}

        {article.examples && article.examples.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Esempi concreti</Text>
            {article.examples.map((e, i) => (
              <Text key={i} style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20 }}>• {e}</Text>
            ))}
          </View>
        )}

        {(article.pros || article.cons) && (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {article.pros && (
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={s.label}>Vantaggi</Text>
                {article.pros.map((p, i) => (
                  <Text key={i} style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>+ {p}</Text>
                ))}
              </View>
            )}
            {article.cons && (
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text style={s.label}>Svantaggi</Text>
                {article.cons.map((c, i) => (
                  <Text key={i} style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>- {c}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {article.commonMistakes && article.commonMistakes.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Errori comuni</Text>
            {article.commonMistakes.map((m, i) => (
              <Text key={i} style={{ color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 20 }}>• {m}</Text>
            ))}
          </View>
        )}

        {article.formulas && article.formulas.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Formule</Text>
            {article.formulas.map((f, i) => (
              <View key={i} style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary }}>
                <Text style={{ color: colors.onSurface, fontSize: 13 }}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {article.tables && article.tables.map((t, ti) => (
          <View key={ti} style={{ gap: spacing.xs }}>
            {t.title && <Text style={s.label}>{t.title}</Text>}
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", backgroundColor: colors.surfaceTertiary }}>
                {t.columns.map((col, ci) => (
                  <Text key={ci} style={{ flex: 1, padding: spacing.sm, color: colors.onSurface, fontSize: 11, fontWeight: "700" }}>{col}</Text>
                ))}
              </View>
              {t.rows.map((row, ri) => (
                <View key={ri} style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.divider }}>
                  {row.map((cell, ci) => (
                    <Text key={ci} style={{ flex: 1, padding: spacing.sm, color: colors.onSurfaceSecondary, fontSize: 11 }}>{cell}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}

        {Diagram && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Diagramma</Text>
            <Card style={{ padding: spacing.md, borderRadius: radius.lg, alignItems: "center", borderWidth: 1, borderColor: colors.divider }}>
              <Diagram />
            </Card>
          </View>
        )}

        {Tool && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Strumento interattivo</Text>
            <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.divider }}>
              <Tool />
            </Card>
          </View>
        )}

        {article.inDepth && article.inDepth.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <Text style={s.label}>Approfondimento</Text>
            {article.inDepth.map((sec, i) => (
              <View key={i} style={{ gap: 4 }}>
                <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: "700" }}>{sec.title}</Text>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 13.5, lineHeight: 21 }}>{sec.body}</Text>
              </View>
            ))}
          </View>
        )}

        {article.glossary && article.glossary.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Glossario</Text>
            {article.glossary.map((g, i) => (
              <View key={i} style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary }}>
                <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "700" }}>{g.term}</Text>
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>{g.def}</Text>
              </View>
            ))}
          </View>
        )}

        {relatedArticles.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Argomenti correlati</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {relatedArticles.map((r) => (
                <Pressable key={r.slug} onPress={() => router.push(`/strumenti/enciclopedia/${r.slug}` as any)} style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "600" }}>{r.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {article.sources && article.sources.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Fonti e riferimenti</Text>
            {article.sources.map((src, i) => (
              <Text key={i} style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>• {src.title}{src.url ? ` — ${src.url}` : ""}</Text>
            ))}
          </View>
        )}

        <Text style={[s.muted, { fontSize: 10 }]}>Ultimo aggiornamento: {article.lastUpdated}</Text>
      </ScrollView>
    </View>
  );
}
