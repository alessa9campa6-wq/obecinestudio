import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import NetInfo from "@react-native-community/netinfo";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { fileUrl, saveLocalMedia, uploadImage } from "@/src/api";
import { isVideo } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Icon, toast, useStyles } from "@/src/ui";

export function RemoteImage({ path, style, testID, contentFit = "cover", onLoad }: { path: string; style?: any; testID?: string; contentFit?: "cover" | "contain"; onLoad?: (e: any) => void }) {
  const { colors } = useTheme();
  if (isVideo(path))
    return (
      <View testID={testID} style={[style, { backgroundColor: colors.surfaceInverse, alignItems: "center", justifyContent: "center" }]}>
        <Icon name="play-circle" size={36} color={colors.brandPrimary} />
      </View>
    );
  return <Image testID={testID} source={{ uri: fileUrl(path) }} style={style} contentFit={contentFit} onLoad={onLoad} transition={150} cachePolicy="disk" />;
}

export function RemoteVideo({ path, style }: { path: string; style?: any }) {
  const player = useVideoPlayer(fileUrl(path), (p) => {
    p.loop = true;
  });
  return <VideoView testID="remote-video" player={player} style={style} nativeControls contentFit="contain" />;
}

export async function pickAndUpload(allowVideo = false): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: allowVideo ? ["images", "videos"] : ["images"], quality: 0.7 });
  if (r.canceled || !r.assets?.[0]) return null;
  const a = r.assets[0];
  const video = a.type === "video";
  const asset = {
    uri: a.uri,
    fileName: a.fileName ?? (video ? "video.mp4" : "image.jpg"),
    mimeType: a.mimeType ?? (video ? "video/mp4" : "image/jpeg"),
  };

  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    toast("Foto salvata sul dispositivo · sarà inviata quando tornerà la rete");
    return saveLocalMedia(asset);
  }

  return uploadImage(asset);
}

export function ImageField({ value, onChange, testID, allowVideo }: { value?: string; onChange: (p: string | null) => void; testID?: string; allowVideo?: boolean }) {
  const { colors } = useTheme();
  const s = useStyles();
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    setBusy(true);
    try {
      const p = await pickAndUpload(allowVideo);
      if (p) onChange(p);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const label = (
    <Pressable testID={testID} onPress={pick} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: value ? colors.surfaceSecondary : "transparent", padding: spacing.sm, borderRadius: radius.sm }}>
      {busy ? <ActivityIndicator color={colors.brandPrimary} /> : <Icon name="image-plus" size={22} color={colors.onSurfaceTertiary} />}
      <Text style={s.muted}>{value ? "Cambia" : allowVideo ? "Scegli foto o video" : "Scegli dalla libreria"}</Text>
    </Pressable>
  );
  return (
    <View style={{ height: value && isVideo(value) ? 240 : 180, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary }}>
      {value ? isVideo(value) ? <RemoteVideo path={value} style={{ width: "100%", height: "100%" }} /> : <RemoteImage path={value} style={{ width: "100%", height: "100%" }} /> : null}
      <View style={value ? { position: "absolute", top: spacing.sm, right: spacing.sm } : undefined}>{label}</View>
    </View>
  );
}
