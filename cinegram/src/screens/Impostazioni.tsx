import { Pressable, Text, View } from "react-native";

import { useApp, type Impostazioni as Imp } from "@/store";
import { Badge, Etichetta, Icon, Page, Vetro, type IconName } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

function Interruttore({ acceso, onPress }: { acceso: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: "center", backgroundColor: acceso ? palette.tealChiaro : "rgba(255,255,255,0.14)" }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: acceso ? palette.nero : "rgba(255,255,255,0.75)", alignSelf: acceso ? "flex-end" : "flex-start" }} />
    </Pressable>
  );
}

function Scelta({ voci, valore, onScelta }: { voci: { v: string; l: string }[]; valore: string; onScelta: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {voci.map((x) => (
        <Pressable key={x.v} onPress={() => onScelta(x.v)} style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: valore === x.v ? palette.tealChiaro : palette.bordo, backgroundColor: valore === x.v ? "rgba(2,86,105,0.4)" : "transparent" }}>
          <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "700", color: valore === x.v ? palette.testo : palette.tenue }}>{x.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Riga({ icona, titolo, sotto, primo, children, onPress }: { icona: IconName; titolo: string; sotto?: string; primo?: boolean; children?: React.ReactNode; onPress?: () => void }) {
  const corpo = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 12, borderTopWidth: primo ? 0 : 1, borderTopColor: "rgba(255,255,255,0.07)" }}>
      <Icon name={icona} size={16} color={palette.tealChiaro} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.text, fontSize: 12.5, fontWeight: "600", color: palette.testo }}>{titolo}</Text>
        {sotto ? <Text style={{ fontFamily: fonts.text, fontSize: 10.5, color: palette.tenue }}>{sotto}</Text> : null}
      </View>
      {children ?? (onPress ? <Icon name="chevron-right" size={16} color={palette.tenue} /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{corpo}</Pressable> : corpo;
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

export default function Impostazioni() {
  const { go, imp, setImp, lavori } = useApp();
  const cambia = (patch: Partial<Imp>) => setImp(patch);

  return (
    <Page attivo="profilo" go={go}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable onPress={() => go("profilo")} hitSlop={8} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.bordo }}>
          <Icon name="chevron-left" size={18} color={palette.testo} />
        </Pressable>
        <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 9.5, letterSpacing: 2.2, fontWeight: "800", color: "rgba(242,246,247,0.7)" }}>IMPOSTAZIONI</Text>
        <Badge testo="bozza" />
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: palette.testo }}>Impostazioni</Text>
        <Text style={{ fontFamily: fonts.text, fontSize: 12, color: palette.tenue }}>Portfolio, notifiche, dati. Restano sul dispositivo.</Text>
      </View>

      <Gruppo titolo="PORTFOLIO">
        <Riga primo icona="image-multiple-outline" titolo="Mostra il portfolio nel profilo" sotto={`${lavori.length} lavori pubblicati`}>
          <Interruttore acceso={imp.portfolio} onPress={() => cambia({ portfolio: !imp.portfolio })} />
        </Riga>
        <Riga icona="eye-outline" titolo="Chi può vedere i lavori" sotto="Per i prossimi che pubblichi">
          <Scelta
            voci={[{ v: "tutti", l: "Tutti" }, { v: "follower", l: "Follower" }, { v: "soloIo", l: "Solo io" }]}
            valore={imp.chiVede}
            onScelta={(v) => cambia({ chiVede: v as Imp["chiVede"] })}
          />
        </Riga>
        <Riga icona="plus-box-outline" titolo="Pubblica un lavoro" sotto="Dal profilo, con foto e anno" onPress={() => go("profilo")} />
      </Gruppo>

      <Gruppo titolo="NOTIFICHE">
        <Riga primo icona="message-text-outline" titolo="Messaggi" sotto="Quando qualcuno ti scrive">
          <Interruttore acceso={imp.notificheMessaggi} onPress={() => cambia({ notificheMessaggi: !imp.notificheMessaggi })} />
        </Riga>
        <Riga icona="comment-outline" titolo="Commenti e mi piace" sotto="Sui lavori che pubblichi">
          <Interruttore acceso={imp.notificheCommenti} onPress={() => cambia({ notificheCommenti: !imp.notificheCommenti })} />
        </Riga>
        <Riga icona="calendar-clock" titolo="Scadenze dei progetti" sotto="Il giorno prima, alle 18">
          <Interruttore acceso={imp.notificheScadenze} onPress={() => cambia({ notificheScadenze: !imp.notificheScadenze })} />
        </Riga>
      </Gruppo>

      <Gruppo titolo="ASPETTO">
        <Riga primo icona="theme-light-dark" titolo="Tema" sotto="Cinegram è solo notturno, per ora">
          <Badge testo="scuro" />
        </Riga>
        <Riga icona="format-font" titolo="Caratteri" sotto="Fraunces, Geist, Courier Prime" />
        <Riga icona="palette-outline" titolo="Colori" sotto="Nero, #025669, vetro" />
      </Gruppo>

      <Gruppo titolo="DATI">
        <Riga primo icona="cloud-download-outline" titolo="Esporta i miei dati" sotto="Non ancora disponibile" />
        <Riga icona="information-outline" titolo="Versione" sotto="Cinegram 0.1.0 · prototipo" />
      </Gruppo>

      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>Le impostazioni valgono per questa sessione</Text>
    </Page>
  );
}
