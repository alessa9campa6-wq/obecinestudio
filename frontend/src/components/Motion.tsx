import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

// Comparsa morbida: il contenuto sale di pochi pixel mentre prende colore.
// Si usa dove un blocco appare dal nulla (card nel feed, pannelli, elenchi).
export function FadeIn({
  children,
  delay = 0,
  offset = 12,
  duration = 320,
  style,
  testID,
}: {
  children?: ReactNode;
  delay?: number;
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [v, delay, duration]);

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Pressione "gommosa" per le superfici che non sono bottoni (card, riquadri).
// Restituisce gli handler da spalmare su un Pressable.
export function usePressione(scala = 0.97) {
  const v = useRef(new Animated.Value(1)).current;
  const anima = (to: number) =>
    Animated.spring(v, { toValue: to, useNativeDriver: true, friction: 6, tension: 180 }).start();
  return {
    value: v,
    onPressIn: () => anima(scala),
    onPressOut: () => anima(1),
  };
}
