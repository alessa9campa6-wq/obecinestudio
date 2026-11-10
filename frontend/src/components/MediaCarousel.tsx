import { Image } from "expo-image";
import { useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from "react-native";

import { fileUrl } from "@/src/api";
import { radius, spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

// Più foto nello stesso post: si scorrono con il dito, con puntini e contatore.
export default function MediaCarousel({ media, onOpen }: { media: string[]; onOpen?: () => void }) {
  const { colors } = useTheme();
  const [largo, setLargo] = useState(0);
  const [indice, setIndice] = useState(0);
  const ref = useRef<ScrollView>(null);
  const tot = media.length;

  const cambia = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!largo) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / largo);
    setIndice(Math.max(0, Math.min(tot - 1, i)));
  };

  if (!tot) return null;

  return (
    <View onLayout={(e) => setLargo(e.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceTertiary }}>
      {largo > 0 ? (
        <ScrollView
          ref={ref}
          testID="post-media-scroll"
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={cambia}
          onScrollEndDrag={cambia}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {media.map((m, i) => (
            <Pressable key={`${m}-${i}`} onPress={onOpen} style={{ width: largo, height: "100%" }}>
              <Image source={{ uri: fileUrl(m) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Image source={{ uri: fileUrl(media[0]) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
      )}

      {tot > 1 ? (
        <>
          <View style={{ position: "absolute", right: spacing.sm, top: spacing.sm, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>
              {indice + 1}/{tot}
            </Text>
          </View>
          <View style={{ position: "absolute", left: 0, right: 0, bottom: spacing.sm, flexDirection: "row", justifyContent: "center", gap: 5 }}>
            {media.map((m, i) => (
              <View key={`dot-${m}-${i}`} style={{ width: i === indice ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === indice ? colors.brandPrimary : "rgba(255,255,255,0.6)" }} />
            ))}
          </View>
          {largo > 0 ? (
            <>
              {indice > 0 ? (
                <Pressable
                  testID="post-media-prev"
                  onPress={() => ref.current?.scrollTo({ x: (indice - 1) * largo, animated: true })}
                  style={{ position: "absolute", left: spacing.sm, top: "48%", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 18, padding: 4 }}
                >
                  <Icon name="chevron-left" size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
              {indice < tot - 1 ? (
                <Pressable
                  testID="post-media-next"
                  onPress={() => ref.current?.scrollTo({ x: (indice + 1) * largo, animated: true })}
                  style={{ position: "absolute", right: spacing.sm, top: "48%", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 18, padding: 4 }}
                >
                  <Icon name="chevron-right" size={18} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
