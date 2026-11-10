import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from "react-native";

import { RemoteVideo } from "@/src/components/Images";
import { fileUrl } from "@/src/api";
import { isVideo } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

// Più foto nello stesso post: si scorrono con il dito, con puntini e contatore.
export default function MediaCarousel({
  media,
  ratios,
  onOpen,
  onDoubleTap,
}: {
  media: string[];
  ratios?: number[];
  onOpen?: () => void;
  onDoubleTap?: () => void;
}) {
  const { colors } = useTheme();
  const [largo, setLargo] = useState(0);
  const [indice, setIndice] = useState(0);
  const ref = useRef<ScrollView>(null);
  const ultimoTocco = useRef(0);
  const cuore = useRef(new Animated.Value(0)).current;
  const tot = media.length;

  // Proporzione del primo elemento (larghezza/altezza), con limiti per non
  // avere riquadri assurdi.
  const ratioPrimo = Math.min(1.9, Math.max(0.62, ratios?.[0] ?? 1));
  const altezza = largo > 0 ? Math.round(largo / ratioPrimo) : 0;

  const cambia = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!largo) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / largo);
    setIndice(Math.max(0, Math.min(tot - 1, i)));
  };

  const tocca = () => {
    const adesso = Date.now();
    if (adesso - ultimoTocco.current < 320 && onDoubleTap) {
      ultimoTocco.current = 0;
      cuore.setValue(0);
      Animated.sequence([
        Animated.spring(cuore, { toValue: 1, useNativeDriver: true, friction: 4, tension: 90 }),
        Animated.timing(cuore, { toValue: 0, duration: 260, delay: 320, useNativeDriver: true }),
      ]).start();
      onDoubleTap();
      return;
    }
    ultimoTocco.current = adesso;
    onOpen?.();
  };

  if (!tot) return null;

  return (
    <View onLayout={(e) => setLargo(e.nativeEvent.layout.width)} style={{ width: "100%", backgroundColor: "#000" }}>
      <View style={{ height: altezza || undefined, aspectRatio: altezza ? undefined : 1 }}>
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
            <Pressable key={`${m}-${i}`} onPress={tocca} style={{ width: largo, height: "100%", backgroundColor: "#000" }}>
              {isVideo(m) ? (
                <RemoteVideo path={m} style={{ width: "100%", height: "100%" }} />
              ) : (
                <Image source={{ uri: fileUrl(m) }} style={{ width: "100%", height: "100%" }} contentFit="contain" transition={180} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Image source={{ uri: fileUrl(media[0]) }} style={{ width: "100%", height: "100%" }} contentFit="contain" transition={150} />
      )}

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          alignSelf: "center",
          top: "34%",
          opacity: cuore,
          transform: [{ scale: cuore.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }],
        }}
      >
        <Icon name="heart" size={92} color="#FFFFFF" />
      </Animated.View>

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
    </View>
  );
}
