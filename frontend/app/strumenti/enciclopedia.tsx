import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ALL_ARTICLES,
  ARTICLES_BY_SLUG,
  Article,
  ArticleLevel,
  CATEGORIES,
  Category,
  LEVEL_LABELS,
  loadFavorites,
  loadRecent,
  searchArticles,
  FavoriteItem,
  RecentItem,
} from "@/src/enciclopedia/index";
import { categoryImage } from "@/src/enciclopedia/images";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Icon, IconName, useStyles } from "@/src/ui";

export default function Enciclopedia() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [level, setLevel] = useState<ArticleLevel | "all">("all");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [f, r] = await Promise.all([loadFavorites(), loadRecent()]);
      if (mounted) {
        setFavorites(f);
        setRecent(r);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const favSlugs = useMemo(() => new Set(favorites.map((f) => f.slug)), [favorites]);

  const results = useMemo(() => {
    let list = query.trim() ? searchArticles(query) : ALL_ARTICLES;
    if (categoryId !== "all") list = list.filter((a) => a.categoryId === categoryId);
    if (level !== "all") list = list.filter((a) => a.difficulty === level);
    return list;
  }, [query, categoryId, level]);

  const recentArticles = useMemo(
    () => recent.map((r) => ARTICLES_BY_SLUG[r.slug]).filter(Boolean) as Article[],
    [recent],
  );
  const favoriteArticles = useMemo(
    () => favorites.map((f) => ARTICLES_BY_SLUG[f.slug]).filter(Boolean) as Article[],
    [favorites],
  );

  const cols = width >= 900 ? 3 : width >= 600 ? 2 : 1;
  const cardW = (Math.min(width, 1100) - spacing.lg * 2 - spacing.md * (cols - 1)) / cols;

  const openArticle = (slug: string) => {
    router.push(`/strumenti/enciclopedia/${slug}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.md, paddingBottom: insets.bottom + 80 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Button testID="enciclopedia-back" icon="chevron-left" small variant="secondary" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>STRUMENTI</Text>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: 28 }}>Enciclopedia</Text>
          </View>
          <Button testID="enciclopedia-gear-link" icon="camera-outline" label="Schede" variant="secondary" small onPress={() => router.push("/strumenti/schede-attrezzatura" as any)} />
        </View>

        <Text style={s.muted}>
          Knowledge base cinematografica: {ALL_ARTICLES.length} voci in {CATEGORIES.length} categorie. Cerca per termine italiano o inglese.
        </Text>

        <TextInput
          testID="enciclopedia-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Cerca: Alexa, 50mm, key light, LUT…"
          placeholderTextColor={colors.muted}
          style={{ color: colors.onSurface, backgroundColor: colors.surfaceSecondary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, borderWidth: 1, borderColor: colors.border }}
        />

        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Categoria</Text>
          <ChipRow>
            <Chip testID="enciclopedia-cat-all" label="Tutte" selected={categoryId === "all"} onPress={() => setCategoryId("all")} />
            {CATEGORIES.map((c) => (
              <Chip key={c.id} testID={`enciclopedia-cat-${c.id}`} label={c.title.split(" ")[0]} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </ChipRow>
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Livello</Text>
          <ChipRow>
            <Chip testID="enciclopedia-level-all" label="Tutti" selected={level === "all"} onPress={() => setLevel("all")} />
            {(["principiante", "intermedio", "avanzato"] as ArticleLevel[]).map((l) => (
              <Chip key={l} testID={`enciclopedia-level-${l}`} label={LEVEL_LABELS[l]} selected={level === l} onPress={() => setLevel(l)} />
            ))}
          </ChipRow>
        </View>

        {recentArticles.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Consultati di recente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {recentArticles.slice(0, 8).map((a) => (
                <Pressable key={a.slug} onPress={() => openArticle(a.slug)} style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, maxWidth: 200 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>{a.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {favoriteArticles.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={s.label}>Preferiti</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {favoriteArticles.slice(0, 8).map((a) => (
                <Pressable key={a.slug} onPress={() => openArticle(a.slug)} style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, maxWidth: 200 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>{a.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {categoryId === "all" && !query.trim() && level === "all" ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {CATEGORIES.map((c) => {
              const count = ALL_ARTICLES.filter((a) => a.categoryId === c.id).length;
              return (
                <Pressable
                  key={c.id}
                  testID={`enciclopedia-category-${c.id}`}
                  onPress={() => setCategoryId(c.id)}
                  style={({ pressed }) => ({ width: cols > 1 ? cardW : "100%", opacity: pressed ? 0.8 : 1 })}
                >
                  <Card style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.divider }}>
                    <View style={{ height: 104 }}>
                      <Image source={{ uri: categoryImage(c.id) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
                    </View>
                    <View style={{ padding: spacing.md, gap: spacing.xs }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: c.color + "22" }}>
                        <Icon name={c.icon} size={22} color={c.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: "700" }} numberOfLines={2}>{c.title}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{count} voci</Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }} numberOfLines={2}>{c.subtitle}</Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <>
            <Text style={[s.muted, { fontSize: 12 }]}>{results.length} voci trovate</Text>
            {results.length === 0 ? (
              <Empty icon="magnify" title="Nessuna voce trovata" subtitle="Prova con un altro termine o rimuovi i filtri." />
            ) : (
              <View style={{ gap: spacing.sm }}>
                {results.map((a) => {
                  const cat = CATEGORIES.find((c) => c.id === a.categoryId);
                  return (
                    <Pressable
                      key={a.slug}
                      testID={`enciclopedia-article-${a.slug}`}
                      onPress={() => openArticle(a.slug)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    >
                      <Card style={{ padding: spacing.md, borderRadius: radius.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.divider }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: (cat?.color ?? colors.brandPrimary) + "22" }}>
                            <Icon name={(cat?.icon ?? "book-open-outline") as IconName} size={18} color={cat?.color ?? colors.brandPrimary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: "700" }} numberOfLines={1}>{a.title}</Text>
                            <Text style={{ color: colors.muted, fontSize: 11 }} numberOfLines={1}>{a.subtitle}</Text>
                          </View>
                          {favSlugs.has(a.slug) && <Icon name="bookmark" size={16} color={colors.brandPrimary} />}
                          <Icon name="chevron-right" size={18} color={colors.muted} />
                        </View>
                        <Text style={{ color: colors.onSurfaceSecondary, fontSize: 12 }} numberOfLines={2}>{a.shortDescription}</Text>
                        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
                            <Text style={{ color: colors.muted, fontSize: 10 }}>{LEVEL_LABELS[a.difficulty]}</Text>
                          </View>
                          {a.tool && (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brandTertiary }}>
                              <Text style={{ color: colors.onBrandTertiary, fontSize: 10 }}>Strumento</Text>
                            </View>
                          )}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
