import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { fileUrl } from "@/src/api";
import PersonAvatar from "@/src/components/PersonAvatar";
import { Post, PRIVACY_LABEL, tempoFa } from "@/src/social";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Icon } from "@/src/ui";

type Props = {
  post: Post;
  compact?: boolean;
  onOpen?: () => void;
  onLike?: () => void;
  onAuthor?: () => void;
};

// Il post come su Instagram: chi lo ha scritto, la foto, i cuori e la didascalia.
export default function PostCard({ post, compact, onOpen, onLike, onAuthor }: Props) {
  const { colors } = useTheme();
  const prima = post.media[0] ? fileUrl(post.media[0]) : null;
  const altre = post.media.length - 1;

  return (
    <View
      testID={`post-card-${post.id}`}
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: compact ? radius.md : radius.lg,
        overflow: "hidden",
        marginBottom: compact ? spacing.md : spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
      }}
    >
      <Pressable testID={`post-author-${post.id}`} onPress={onAuthor} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm }}>
        <PersonAvatar person={post.author} size={compact ? 28 : 34} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: compact ? 12 : 14 }} numberOfLines={1}>
            {post.author.name || "Persona"}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: fonts.text, fontSize: compact ? 10 : 12 }} numberOfLines={1}>
            @{post.author.username || "utente"} · {tempoFa(post.created_at)}
          </Text>
        </View>
        {post.kind === "rental" ? (
          <View style={{ backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
            <Text style={{ color: colors.onBrandTertiary, fontSize: 10, fontWeight: "700" }}>Noleggio</Text>
          </View>
        ) : null}
        {post.privacy !== "public" ? (
          <Icon name={post.privacy === "private" ? "lock" : "eye-off-outline"} size={15} color={colors.muted} />
        ) : null}
      </Pressable>

      {post.kind === "rental" && (post.price || post.place) ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.xs }}>
          {post.price ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
              <Icon name="currency-eur" size={12} color={colors.onBrandTertiary} />
              <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>{post.price}</Text>
            </View>
          ) : null}
          {post.place ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
              <Icon name="map-marker-outline" size={12} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600" }}>{post.place}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable onPress={onOpen}>
        {prima ? (
          <View>
            <Image source={{ uri: prima }} style={{ width: "100%", aspectRatio: 1 }} contentFit="cover" transition={150} />
            {altre > 0 ? (
              <View style={{ position: "absolute", right: spacing.sm, top: spacing.sm, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
                <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "600" }}>1/{post.media.length}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xs }}>
            <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: compact ? 15 : 18, lineHeight: compact ? 21 : 25 }} numberOfLines={compact ? 6 : 8}>
              {post.text}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        {onLike ? (
          <Pressable testID={`post-like-${post.id}`} onPress={onLike} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name={post.liked ? "heart" : "heart-outline"} size={compact ? 18 : 22} color={post.liked ? colors.error : colors.onSurface} />
            {post.likes > 0 ? (
              <Text style={{ color: colors.onSurface, fontSize: compact ? 11 : 13, fontFamily: fonts.text }}>{post.likes}</Text>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable testID={`post-comment-${post.id}`} onPress={onOpen} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Icon name="comment-outline" size={compact ? 17 : 21} color={colors.onSurface} />
          {post.comments > 0 ? (
            <Text style={{ color: colors.onSurface, fontSize: compact ? 11 : 13, fontFamily: fonts.text }}>{post.comments}</Text>
          ) : null}
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={{ color: colors.muted, fontSize: 10, fontFamily: fonts.text }}>{PRIVACY_LABEL[post.privacy]}</Text>
      </View>

      {prima && post.text ? (
        <Text style={{ color: colors.onSurface, padding: spacing.md, paddingTop: spacing.sm, fontSize: compact ? 12 : 14, lineHeight: compact ? 17 : 20 }} numberOfLines={compact ? 3 : 6}>
          <Text style={{ fontWeight: "700" }}>{post.author.name || "Persona"} </Text>
          {post.text}
        </Text>
      ) : (
        <View style={{ height: spacing.sm }} />
      )}
    </View>
  );
}
