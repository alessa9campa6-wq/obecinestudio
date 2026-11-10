import { Linking, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Icon, useStyles } from "@/src/ui";

// Capisce che tipo di link è stato incollato nel brano.
type Tipo = "soundcloud" | "audio" | "altro";
const tipoDi = (link: string): Tipo => {
  const l = link.toLowerCase();
  if (/soundcloud\.com/.test(l)) return "soundcloud";
  if (/\.(mp3|m4a|aac|wav|ogg|flac)(\?|$)/.test(l)) return "audio";
  return "altro";
};

const pagina = (corpo: string) =>
  `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;font-family:-apple-system,Helvetica,Arial;color:#111}audio{width:100%}</style></head><body>${corpo}</body></html>`;

// Player minimale: si sente il brano e si va avanti/indietro, senza copertine
// né anteprime. Se il link non è riproducibile si apre nel browser.
export function SongPlayer({ link }: { link?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const url = String(link ?? "").trim();

  if (!url) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border }}>
        <Icon name="music-note-off-outline" size={20} color={colors.muted} />
        <Text style={[s.muted, { flex: 1 }]}>Incolla il link del brano e qui compare il player.</Text>
      </View>
    );
  }

  const tipo = tipoDi(url);
  if (!/^https?:\/\//.test(url)) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={s.muted}>Link non riconosciuto: usa un indirizzo che inizia con https://</Text>
        <Text style={s.body} numberOfLines={2}>{url}</Text>
      </View>
    );
  }

  if (tipo === "soundcloud") {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23c9a227&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
          <WebView
            testID="song-player-soundcloud"
            originWhitelist={["*"]}
            source={{ html: pagina(`<iframe width="100%" height="110" scrolling="no" frameborder="no" allow="autoplay" src="${src}"></iframe>`) }}
            style={{ height: 116, backgroundColor: "transparent" }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
        <Button testID="song-player-open" icon="open-in-new" label="Apri in SoundCloud" variant="secondary" small onPress={() => Linking.openURL(url)} />
      </View>
    );
  }

  if (tipo === "audio") {
    return (
      <View style={{ gap: spacing.sm }}>
        <View style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
          <WebView
            testID="song-player-audio"
            originWhitelist={["*"]}
            source={{ html: pagina(`<audio controls preload="metadata" src="${url}"></audio>`) }}
            style={{ height: 60, backgroundColor: "transparent" }}
            javaScriptEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
        <Button testID="song-player-open" icon="open-in-new" label="Apri il file" variant="secondary" small onPress={() => Linking.openURL(url)} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="link-variant" size={18} color={colors.brandPrimary} />
        <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>{url}</Text>
      </View>
      <Button testID="song-player-open" icon="play-circle-outline" label="Apri e ascolta" variant="secondary" onPress={() => Linking.openURL(url)} />
      <Text style={s.muted}>{"Per un player dentro l'app usa SoundCloud o un file audio diretto (mp3, m4a, wav)."}</Text>
    </View>
  );
}
