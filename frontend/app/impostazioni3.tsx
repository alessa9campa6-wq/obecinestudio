import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { setColorScheme, fonts, spacing, useTheme } from "@/src/theme";
import { Icon, IconName, toast } from "@/src/ui";
import { storage } from "@/src/utils/storage";

// ── Impostazioni 3, pagina di prova ──────────────────────────────────────────
// Nato dal portfolio: se pubblichi lavori, qui decidi chi li vede, se il
// portfolio compare nel profilo e con che aspetto. Stesso stile della Home 3.

const NERO = "#050708";
const TEAL_CHIARO = "#0A8FA6";
const VETRO = "rgba(255,255,255,0.05)";
const BORDO = "rgba(255,255,255,0.12)";
const TESTO = "#F2F6F7";
const TENUE = "rgba(242,246,247,0.56)";
const CHIAVE = "impostazioni3";

type Stato = {
  portfolio: boolean;
  chiVede: "tutti" | "follower" | "soloIo";
  notificheMessaggi: boolean;
  notificheCommenti: boolean;
  notificheScadenze: boolean;
  homePreferita: "normale" | "home3";
};

const INIZIALE: Stato = {
  portfolio: true,
  chiVede: "tutti",
  notificheMessaggi: true,
  notificheCommenti: true,
  notificheScadenze: true,
  homePreferita: "home3",
};

const DOCK: { icona: IconName; titolo: string; rotta: string; attivo?: boolean }[] = [
  { icona: "view-dashboard", titolo: "Oggi", rotta: "/home3" },
  { icona: "compass-outline", titolo: "Esplora", rotta: "/esplora" },
  { icona: "message-text-outline", titolo: "Messaggi", rotta: "/messaggi" },
  { icona: "wrench-outline", titolo: "Strumenti", rotta: "/strumenti" },
  { icona: "account-circle-outline", titolo: "Profilo", rotta: "/profilo3", attivo: true },
];

function Vetro({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{ backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO, borderRadius: 22, overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

function Etichetta({ children }: { children: string }) {
  return <Text style={{ fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 1.8, fontWeight: "800", color: TEAL_CHIARO }}>{children}</Text>;
}

function Gruppo({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Etichetta>{titolo}</Etichetta>
      <Vetro>
        <View style={{ paddingVertical: 2 }}>{children}</View>
      </Vetro>
    </View>
  );
}

function Riga({
  icona,
  titolo,
  sotto,
  primo,
  onPress,
  children,
}: {
  icona: IconName;
  titolo: string;
  sotto?: string;
  primo?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const corpo = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 12, borderTopWidth: primo ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
      <Icon name={icona} size={17} color={TEAL_CHIARO} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: TESTO }}>{titolo}</Text>
        {sotto ? <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: TENUE }}>{sotto}</Text> : null}
      </View>
      {children ?? (onPress ? <Icon name="chevron-right" size={17} color={TENUE} /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{corpo}</Pressable> : corpo;
}

function Interruttore({ acceso, onPress }: { acceso: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: "center", backgroundColor: acceso ? TEAL_CHIARO : "rgba(255,255,255,0.14)" }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: acceso ? "#050708" : "rgba(255,255,255,0.75)", alignSelf: acceso ? "flex-end" : "flex-start" }} />
    </Pressable>
  );
}

function Scelta({ voci, valore, onScelta }: { voci: { v: string; l: string }[]; valore: string; onScelta: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {voci.map((x) => (
        <Pressable key={x.v} onPress={() => onScelta(x.v)} style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: valore === x.v ? TEAL_CHIARO : BORDO, backgroundColor: valore === x.v ? "rgba(2,86,105,0.4)" : "transparent" }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: valore === x.v ? TESTO : TENUE }}>{x.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Impostazioni3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const { user } = useAuth();
  const { scheme } = useTheme();
  const [stato, setStato] = useState<Stato>(INIZIALE);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    void storage.getItem<string>(CHIAVE, "").then((raw) => {
      if (raw) {
        try {
          setStato({ ...INIZIALE, ...(JSON.parse(raw) as Partial<Stato>) });
        } catch {}
      }
      setPronto(true);
    });
  }, []);

  const cambia = (patch: Partial<Stato>) => {
    const nuovo = { ...stato, ...patch };
    setStato(nuovo);
    void storage.setItem(CHIAVE, JSON.stringify(nuovo));
  };

  return (
    <View style={{ flex: 1, backgroundColor: NERO }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 118 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: VETRO, borderWidth: 1, borderColor: BORDO }}>
              <Icon name="chevron-left" size={20} color={TESTO} />
            </Pressable>
            <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.4, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>IMPOSTAZIONI 3 · ESPERIMENTO</Text>
          </View>

          <View style={{ gap: 4, paddingTop: spacing.sm }}>
            <Text style={{ fontFamily: fonts.display, fontSize: wide ? 46 : 36, lineHeight: wide ? 48 : 38, color: TESTO }}>Impostazioni</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: TENUE }}>
              {user?.name ? `Per ${user.name}` : "Il tuo profilo, il portfolio, l’aspetto"}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, paddingTop: spacing.lg }}>
          {/* ── portfolio ─────────────────────────────────────────── */}
          <Gruppo titolo="PORTFOLIO">
            <Riga
              primo
              icona="image-multiple-outline"
              titolo="Mostra il portfolio nel profilo"
              sotto="La striscia dei lavori pubblicati"
            >
              <Interruttore acceso={stato.portfolio} onPress={() => cambia({ portfolio: !stato.portfolio })} />
            </Riga>
            <Riga icona="eye-outline" titolo="Chi può vedere i lavori" sotto="Si applica ai prossimi che pubblichi">
              <Scelta
                voci={[
                  { v: "tutti", l: "Tutti" },
                  { v: "follower", l: "Follower" },
                  { v: "soloIo", l: "Solo io" },
                ]}
                valore={stato.chiVede}
                onScelta={(v) => cambia({ chiVede: v as Stato["chiVede"] })}
              />
            </Riga>
            <Riga icona="file-pdf-box" titolo="Portfolio in PDF" sotto="Un fascicolo con i lavori scelti" onPress={() => router.push("/profilo3" as never)} />
            <Riga icona="plus-box-outline" titolo="Pubblica un lavoro" sotto="Titolo, tipo, anno, foto" onPress={() => router.push("/profilo3" as never)} />
          </Gruppo>

          {/* ── aspetto ───────────────────────────────────────────── */}
          <Gruppo titolo="ASPETTO">
            <Riga primo icona="theme-light-dark" titolo="Tema dell’app" sotto={scheme === "dark" ? "Scuro, come le home sperimentali" : "Chiaro, come le sezioni classiche"}>
              <Scelta
                voci={[
                  { v: "dark", l: "Scuro" },
                  { v: "light", l: "Chiaro" },
                ]}
                valore={scheme}
                onScelta={(v) => setColorScheme(v as "dark" | "light")}
              />
            </Riga>
            <Riga icona="home-outline" titolo="Home all’avvio" sotto="Solo impostazione, per ora">
              <Scelta
                voci={[
                  { v: "normale", l: "Classica" },
                  { v: "home3", l: "Home 3" },
                ]}
                valore={stato.homePreferita}
                onScelta={(v) => cambia({ homePreferita: v as Stato["homePreferita"] })}
              />
            </Riga>
            <Riga icona="format-font" titolo="Caratteri" sotto="Fraunces per i titoli, Geist per i testi" />
          </Gruppo>

          {/* ── notifiche ─────────────────────────────────────────── */}
          <Gruppo titolo="NOTIFICHE">
            <Riga primo icona="message-text-outline" titolo="Messaggi" sotto="Quando qualcuno ti scrive">
              <Interruttore acceso={stato.notificheMessaggi} onPress={() => cambia({ notificheMessaggi: !stato.notificheMessaggi })} />
            </Riga>
            <Riga icona="comment-outline" titolo="Commenti e mi piace" sotto="Sui lavori che pubblichi">
              <Interruttore acceso={stato.notificheCommenti} onPress={() => cambia({ notificheCommenti: !stato.notificheCommenti })} />
            </Riga>
            <Riga icona="calendar-clock" titolo="Scadenze dei progetti" sotto="Il giorno prima, alle 18">
              <Interruttore acceso={stato.notificheScadenze} onPress={() => cambia({ notificheScadenze: !stato.notificheScadenze })} />
            </Riga>
          </Gruppo>

          {/* ── dati ──────────────────────────────────────────────── */}
          <Gruppo titolo="DATI E ACCOUNT">
            <Riga primo icona="account-edit-outline" titolo="Nome, bio e contatti" sotto="Si modificano nel profilo vero" onPress={() => router.push("/account" as never)} />
            <Riga icona="cloud-download-outline" titolo="Esporta i miei dati" sotto="Progetti, calendario e lavori" onPress={() => toast("Prima versione: l’esportazione arriva dopo")} />
            <Riga icona="delete-outline" titolo="Elimina l’account" sotto="Operazione definitiva" onPress={() => toast("Non disponibile nella pagina di prova", "error")} />
          </Gruppo>

          <View style={{ gap: 4, alignItems: "center", paddingTop: spacing.sm }}>
            <Text style={{ fontFamily: fonts.script, fontSize: 10, color: TENUE }}>CineStudio · 3.0.0 (esperimento)</Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 10, color: "rgba(242,246,247,0.32)" }}>{pronto ? "Impostazioni salvate su questo dispositivo" : "Carico…"}</Text>
          </View>
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={{ position: "absolute", left: spacing.md, right: spacing.md, bottom: insets.bottom > 0 ? insets.bottom - 4 : 10 }}>
        <View style={{ height: 62, borderRadius: 31, backgroundColor: "rgba(10,14,16,0.78)", borderWidth: 1, borderColor: BORDO, flexDirection: "row", alignItems: "center", overflow: "hidden" }}>
          {DOCK.map((d) => {
            const acceso = !!d.attivo;
            return (
              <Pressable key={d.titolo} onPress={() => router.push(d.rotta as never)} style={({ pressed }) => ({ flex: 1, alignItems: "center", justifyContent: "center", gap: 2, opacity: pressed ? 0.7 : 1 })}>
                <Icon name={d.icona} size={21} color={acceso ? TEAL_CHIARO : "rgba(242,246,247,0.62)"} />
                <Text style={{ fontFamily: fonts.text, fontSize: 8.5, fontWeight: acceso ? "800" : "500", color: acceso ? TEAL_CHIARO : "rgba(242,246,247,0.62)" }}>{d.titolo}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
