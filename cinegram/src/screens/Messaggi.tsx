import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { CONVERSAZIONI, MESSAGGI } from "@/data";
import { useApp } from "@/store";
import { Badge, Etichetta, Icon, Page, Testata, Vetro } from "@/ui";
import { fonts, palette, spacing } from "@/theme";

const iniziali = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export default function Messaggi() {
  const { go } = useApp();
  const [aperta, setAperta] = useState<string | null>(null);
  const [thread, setThread] = useState(MESSAGGI);
  const [bozza, setBozza] = useState("");
  const [nonLetti, setNonLetti] = useState<Record<string, number>>(
    Object.fromEntries(CONVERSAZIONI.map((c) => [c.id, c.nonLetti]))
  );

  const conversazione = CONVERSAZIONI.find((c) => c.id === aperta) ?? null;
  const messaggi = aperta ? thread[aperta] ?? [] : [];
  const totaleNonLetti = Object.values(nonLetti).reduce((a, b) => a + b, 0);

  const apri = (id: string) => {
    setAperta(id);
    setNonLetti((n) => ({ ...n, [id]: 0 }));
  };

  const invia = () => {
    const t = bozza.trim();
    if (!t || !aperta) return;
    const ora = new Date();
    setThread((th) => ({
      ...th,
      [aperta]: [...(th[aperta] ?? []), { io: true, t, ora: `${String(ora.getHours()).padStart(2, "0")}:${String(ora.getMinutes()).padStart(2, "0")}` }],
    }));
    setBozza("");
  };

  if (conversazione) {
    return (
      <Page attivo="messaggi" go={go}>
        <Pressable onPress={() => setAperta(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 }}>
          <Icon name="chevron-left" size={18} color={palette.tealChiaro} />
          <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "700", color: palette.tealChiaro }}>Tutte le conversazioni</Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,86,105,0.55)", borderWidth: 1, borderColor: "rgba(10,143,166,0.45)" }}>
            <Text style={{ fontFamily: fonts.text, fontSize: 13, fontWeight: "800", color: "#DCEFF3" }}>{iniziali(conversazione.nome)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, color: palette.testo }} numberOfLines={1}>{conversazione.nome}</Text>
            <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tenue }}>sul set · risponde di solito in 10 min</Text>
          </View>
          <Icon name="phone-outline" size={19} color={palette.tenue} />
        </View>

        <View style={{ gap: spacing.sm }}>
          {messaggi.map((m, i) => (
            <View key={`${m.ora}-${i}`} style={{ alignSelf: m.io ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <View style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: m.io ? palette.teal : "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: m.io ? "rgba(10,143,166,0.7)" : palette.bordo }}>
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17, color: m.io ? "#FFFFFF" : palette.testo }}>{m.t}</Text>
              </View>
              <Text style={{ fontFamily: fonts.script, fontSize: 8.5, color: palette.tenue, textAlign: m.io ? "right" : "left", paddingTop: 3 }}>{m.ora}</Text>
            </View>
          ))}
        </View>

        <Vetro>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm }}>
            <TextInput
              value={bozza}
              onChangeText={setBozza}
              onSubmitEditing={invia}
              placeholder="Scrivi un messaggio"
              placeholderTextColor="rgba(242,246,247,0.35)"
              style={{ flex: 1, color: palette.testo, fontFamily: fonts.text, fontSize: 13, paddingHorizontal: 8, paddingVertical: 6 }}
            />
            <Pressable onPress={invia} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.tealChiaro, opacity: pressed ? 0.8 : 1 })}>
              <Icon name="send" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </Vetro>
      </Page>
    );
  }

  return (
    <Page attivo="messaggi" go={go}>
      <Testata sopra="CINEGRAM" titolo="Messaggi" icona="message-text-outline" azione={totaleNonLetti ? <Badge testo={`${totaleNonLetti} non letti`} /> : undefined} />

      <View style={{ gap: spacing.sm }}>
        {CONVERSAZIONI.map((c) => {
          const n = nonLetti[c.id] ?? 0;
          return (
            <Vetro key={c.id}>
              <Pressable onPress={() => apri(c.id)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: n ? "rgba(2,86,105,0.7)" : "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: n ? "rgba(10,143,166,0.6)" : palette.bordo }}>
                  <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "800", color: n ? "#DCEFF3" : palette.tenue }}>{iniziali(c.nome)}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 13, fontWeight: n ? "800" : "600", color: palette.testo }} numberOfLines={1}>{c.nome}</Text>
                    <Text style={{ fontFamily: fonts.script, fontSize: 9, color: n ? palette.tealChiaro : palette.tenue }}>{c.quando}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: n ? "rgba(242,246,247,0.8)" : palette.tenue }} numberOfLines={1}>{c.ultimo}</Text>
                </View>
                {n ? (
                  <View style={{ minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, backgroundColor: palette.tealChiaro }}>
                    <Text style={{ fontFamily: fonts.text, fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>{n}</Text>
                  </View>
                ) : (
                  <Icon name="chevron-right" size={17} color={palette.tenue} />
                )}
              </Pressable>
            </Vetro>
          );
        })}
      </View>

      <Vetro>
        <View style={{ padding: spacing.lg, gap: 4 }}>
          <Etichetta>RICHIESTE</Etichetta>
          <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: palette.testo }}>Luca Sarti vuole entrare nel team di Notturno</Text>
          <Text style={{ fontFamily: fonts.script, fontSize: 9.5, color: palette.tenue }}>Elettricista · 3 progetti insieme</Text>
          <View style={{ flexDirection: "row", gap: 6, paddingTop: 6 }}>
            <Pressable style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: palette.teal }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", color: "#FFFFFF" }}>Accetta</Text>
            </Pressable>
            <Pressable style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: palette.bordo }}>
              <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "700", color: palette.tenue }}>Rifiuta</Text>
            </Pressable>
          </View>
        </View>
      </Vetro>

      <Text style={{ fontFamily: fonts.script, fontSize: 9, color: "rgba(242,246,247,0.3)", textAlign: "center" }}>CINEGRAM · messaggi di esempio, restano sul dispositivo</Text>
    </Page>
  );
}
