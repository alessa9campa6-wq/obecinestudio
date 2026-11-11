import { Linking, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Icon, useStyles } from "@/src/ui";

// Capisce che tipo di link è stato incollato nel brano.
type Tipo = "soundcloud" | "spotify" | "youtube" | "audio" | "altro";
const tipoDi = (link: string): Tipo => {
  const l = link.toLowerCase();
  if (/soundcloud\.com/.test(l)) return "soundcloud";
  if (/open\.spotify\.com\/(track|album|playlist|episode|artist)/.test(l)) return "spotify";
  if (/(youtube\.com\/watch|youtu\.be\/|music\.youtube\.com\/watch)/.test(l)) return "youtube";
  if (/\.(mp3|m4a|aac|wav|ogg|flac)(\?|$)/.test(l)) return "audio";
  return "altro";
};

// Dalla pagina normal si passa alla versione "embed": è quella che si può
// suonare dentro l'app, senza uscire sul browser.
const spotifyEmbed = (url: string) => {
  const m = /open\.spotify\.com\/(track|album|playlist|episode|artist)\/([A-Za-z0-9]+)/.exec(url);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` : null;
};
const youtubeId = (url: string) => /(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/.exec(url)?.[1] ?? null;

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
        <Text style={[s.muted, { flex: 1 }]}>Incolla il link del brano: Spotify, YouTube o SoundCloud si ascoltano qui dentro.</Text>
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

  if (tipo === "spotify") {
    const src = spotifyEmbed(url);
    if (src) {
      return (
        <View style={{ gap: spacing.sm }}>
          <View style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
            <WebView
              testID="song-player-spotify"
              originWhitelist={["*"]}
              source={{ html: pagina(`<iframe width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" src="${src}"></iframe>`) }}
              style={{ height: 158, backgroundColor: "transparent" }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
          <Button testID="song-player-open" icon="open-in-new" label="Apri in Spotify" variant="secondary" small onPress={() => Linking.openURL(url)} />
        </View>
      );
    }
  }

  if (tipo === "youtube") {
    const id = youtubeId(url);
    if (id) {
      const src = `https://www.youtube.com/embed/${id}?playsinline=1&rel=0`;
      return (
        <View style={{ gap: spacing.sm }}>
          <View style={{ borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.surfaceTertiary }}>
            <WebView
              testID="song-player-youtube"
              originWhitelist={["*"]}
              source={{ html: pagina(`<iframe width="100%" height="200" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen src="${src}"></iframe>`) }}
              style={{ height: 206, backgroundColor: "transparent" }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
          <Button testID="song-player-open" icon="open-in-new" label="Apri su YouTube" variant="secondary" small onPress={() => Linking.openURL(url)} />
        </View>
      );
    }
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
      <Text style={s.muted}>{"Per ascoltarlo dentro l'app incolla il link di un brano Spotify, YouTube o SoundCloud."}</Text>
    </View>
  );
}
