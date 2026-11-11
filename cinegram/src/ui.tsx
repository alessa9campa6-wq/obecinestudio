import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, palette, spacing } from "@/theme";

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function Icon({ name, size = 18, color = palette.tealChiaro }: { name: IconName; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export function Vetro({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: palette.vetro, borderWidth: 1, borderColor: palette.bordo, borderRadius: 22, overflow: "hidden" }, style]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.01)", "rgba(2,86,105,0.18)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}

export function Etichetta({ children }: { children: string }) {
  return <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.8, fontWeight: "800", color: palette.tealChiaro }}>{children}</Text>;
}

export function Badge({ testo }: { testo: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: palette.bordo }}>
      <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: "700", color: palette.tenue }}>{testo}</Text>
    </View>
  );
}

export function Pill({ icona, testo }: { icona: IconName; testo: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: palette.bordo }}>
      <Icon name={icona} size={11} color={palette.tealChiaro} />
      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "600", color: palette.testo }} numberOfLines={1}>{testo}</Text>
    </View>
  );
}

export type Riga = { t: string; s?: string; b?: string; check?: boolean };

export function Righi({ righe }: { righe: Riga[] }) {
  return (
    <View>
      {righe.map((r, i) => (
        <View key={`${r.t}-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: i === 0 ? 0 : 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)", marginTop: i === 0 ? 0 : 9 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: palette.testo }} numberOfLines={2}>{r.t}</Text>
            {r.s ? <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: palette.tenue }} numberOfLines={2}>{r.s}</Text> : null}
          </View>
          {r.check ? <Icon name="check-circle" size={15} color="rgba(10,143,166,0.75)" /> : null}
          {r.b ? <Badge testo={r.b} /> : null}
        </View>
      ))}
    </View>
  );
}

export type ScreenName = "oggi" | "esplora" | "messaggi" | "strumenti" | "profilo" | "progetto" | "impostazioni";

const DOCK: { s: ScreenName; icona: IconName; l: string }[] = [
  { s: "oggi", icona: "view-dashboard", l: "Oggi" },
  { s: "esplora", icona: "compass-outline", l: "Esplora" },
  { s: "messaggi", icona: "message-text-outline", l: "Messaggi" },
  { s: "strumenti", icona: "wrench-outline", l: "Strumenti" },
  { s: "profilo", icona: "account-circle-outline", l: "Profilo" },
];

export function Dock({ attivo, go }: { attivo: ScreenName; go: (s: ScreenName) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: insets.bottom > 0 ? insets.bottom - 4 : 10 }}>
      <View style={{ height: 62, borderRadius: 31, backgroundColor: "rgba(10,14,16,0.82)", borderWidth: 1, borderColor: palette.bordo, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
        {DOCK.map((d) => {
          const acceso = d.s === attivo;
          return (
            <Pressable key={d.s} onPress={() => go(d.s)} style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.7 : 1 })}>
              <Icon name={d.icona} size={21} color={acceso ? palette.tealChiaro : "rgba(242,246,247,0.62)"} />
              <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: acceso ? "800" : "500", color: acceso ? palette.tealChiaro : "rgba(242,246,247,0.62)" }}>{d.l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Page({ children, attivo, go }: { children: ReactNode; attivo: ScreenName; go: (s: ScreenName) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={{ flex: 1, backgroundColor: palette.nero }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 118, paddingHorizontal: spacing.lg, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 980, width: "100%", alignSelf: "center", gap: spacing.lg, paddingHorizontal: width >= 1000 ? spacing.sm : 0 }}>{children}</View>
      </ScrollView>
      <Dock attivo={attivo} go={go} />
    </View>
  );
}

export function Testata({ titolo, sopra, icona, azione }: { titolo: string; sopra?: string; icona?: IconName; azione?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
      <View style={{ flex: 1, gap: 4 }}>
        {sopra ? <Etichetta>{sopra}</Etichetta> : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icona ? <Icon name={icona} size={22} color={palette.tealChiaro} /> : null}
          <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: palette.testo }} numberOfLines={1}>{titolo}</Text>
        </View>
      </View>
      {azione}
    </View>
  );
}
