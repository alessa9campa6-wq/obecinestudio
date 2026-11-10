import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import PlacePicker, { Luogo } from "@/src/components/PlacePicker";
import { storage } from "@/src/utils/storage";
import { api, uploadImage } from "@/src/api";
import { PRIVACY_HINT, PostPrivacy } from "@/src/social";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";
import GlassSwitch from "@/src/components/GlassSwitch";

type Foto = { uri: string; fileName?: string | null; mimeType?: string | null; ratio?: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  hasRental?: boolean;
  defaultKind?: "post" | "rental";
};

// Il composer: testo, foto, e la scelta di chi può vedere il post.
export default function PostComposer({ visible, onClose, hasRental, defaultKind = "post" }: Props) {
  const { colors } = useTheme();
  const s = useStyles();
  const qc = useQueryClient();
  const [testo, setTesto] = useState("");
  const [privacy, setPrivacy] = useState<PostPrivacy>("public");
  const [prezzo, setPrezzo] = useState("");
  const [luogo, setLuogo] = useState<Luogo | null>(null);
  const [kind, setKind] = useState<"post" | "rental">(defaultKind);
  const [foto, setFoto] = useState<Foto[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setKind(defaultKind);
  }, [visible, defaultKind]);

  const scegliLuogo = (v: Luogo | null) => {
    setLuogo(v);
    if (v) void storage.setItem("my_place", JSON.stringify(v));
  };

  const scegli = async () => {
    const permesso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permesso.granted) return toast("Serve il permesso per le foto", "error");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 10 - foto.length),
      quality: 0.85,
    });
    if (!res.canceled) {
      // Mi segno la proporzione di ogni file: la card poi lo mostra nel formato
      // originale, non tagliato in un quadrato.
      const nuovi = res.assets.map((a) => ({
        ...a,
        ratio: a.width && a.height ? Math.round((a.width / a.height) * 1000) / 1000 : undefined,
      }));
      setFoto((f) => [...f, ...nuovi].slice(0, 10));
    }
  };

  const pubblica = async () => {
    if (!testo.trim() && !foto.length) return toast("Scrivi qualcosa o scegli una foto", "error");
    setBusy(true);
    try {
      const media: string[] = [];
      for (const f of foto) media.push(await uploadImage(f));
      await api("/posts", {
        method: "POST",
        body: {
          text: testo.trim(),
          media,
          kind,
          privacy,
          price: kind === "rental" ? prezzo.trim() : "",
          place: luogo?.place ?? "",
          city: luogo?.city ?? "",
          lat: luogo?.lat ?? null,
          lng: luogo?.lng ?? null,
          ratios: foto.map((f) => f.ratio ?? 1),
        },
      });
      for (const chiave of ["feed", "explore", "profile-posts", "profile"]) void qc.invalidateQueries({ queryKey: [chiave] });
      toast(kind === "rental" ? "Noleggio pubblicato" : "Post pubblicato");
      setTesto("");
      setPrezzo("");
      setLuogo(null);
      setFoto([]);
      setPrivacy("public");
      onClose();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      testID="post-composer"
      visible={visible}
      onClose={onClose}
      title={kind === "rental" ? "Pubblica un noleggio" : "Nuovo post"}
      footer={<Button testID="post-submit" label={kind === "rental" ? "Pubblica noleggio" : "Pubblica"} loading={busy} onPress={pubblica} />}
    >
      {hasRental ? (
        <GlassSwitch
          testID="post-kind"
          value={kind}
          onChange={(v) => setKind(v)}
          options={[
            { value: "post", label: "Post", icon: "movie-open" },
            { value: "rental", label: "Noleggio", icon: "video-vintage" },
          ]}
        />
      ) : null}

      <Field
        testID="post-text"
        label={kind === "rental" ? "Cosa noleggi" : "Didascalia"}
        value={testo}
        onChangeText={setTesto}
        placeholder={kind === "rental" ? "Alexa 35 + set Cooke S4, disponibile da lunedì a Milano" : "Racconta il progetto, il set, un'idea..."}
        multiline
        minHeight={110}
      />

      {kind === "rental" ? (
        <Field testID="post-price" label="Prezzo" value={prezzo} onChangeText={setPrezzo} placeholder="es. 350 €/giorno" />
      ) : null}

      <PlacePicker
        value={luogo}
        onChange={scegliLuogo}
        label={kind === "rental" ? "Dove si trova l'attrezzatura" : "Dove è stato scattato"}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {foto.map((f, i) => (
          <View key={`${f.uri}-${i}`} style={{ width: 84, height: 84, borderRadius: radius.md, overflow: "hidden" }}>
            <Image source={{ uri: f.uri }} style={{ width: 84, height: 84 }} contentFit="cover" />
            <Pressable
              onPress={() => setFoto((lista) => lista.filter((_, j) => j !== i))}
              style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 2 }}
            >
              <Icon name="close" size={13} color="#FFF" />
            </Pressable>
          </View>
        ))}
        {foto.length < 10 ? (
          <Pressable
            testID="post-pick-photo"
            onPress={scegli}
            style={{ width: 84, height: 84, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", gap: 2 }}
          >
            <Icon name="image-plus" size={22} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 10 }}>Foto</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Chi può vederlo</Text>
        <ChipRow>
          {(["public", "unlisted", "private"] as PostPrivacy[]).map((p) => (
            <Chip
              key={p}
              testID={`post-privacy-${p}`}
              label={p === "public" ? "Pubblico" : p === "unlisted" ? "Non in elenco" : "Solo io"}
              selected={privacy === p}
              onPress={() => setPrivacy(p)}
            />
          ))}
        </ChipRow>
        <Text style={s.muted}>{PRIVACY_HINT[privacy]}</Text>
      </View>
    </Sheet>
  );
}
