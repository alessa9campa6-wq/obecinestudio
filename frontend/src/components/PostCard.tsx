import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import MediaCarousel from "@/src/components/MediaCarousel";
import SendToSheet from "@/src/components/SendToSheet";
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

// Il cuore che rimbalza quando metti like: è il gesto che rende vivo il post.
function LikeButton({ liked, likes, onPress, compact }: { liked: boolean; likes: number; onPress?: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  const scala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!liked) return;
    Animated.sequence([
      Animated.spring(scala, { toValue: 1.35, useNativeDriver: true, friction: 3, tension: 160 }),
      Animated.spring(scala, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
    ]).start();
  }, [liked, scala]);

  return (
    <Pressable testID="post-like" onPress={onPress} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Animated.View style={{ transform: [{ scale: scala }] }}>
        <Icon name={liked ? "heart" : "heart-outline"} size={compact ? 20 : 25} color={liked ? "#FF3B5C" : colors.onSurface} />
      </Animated.View>
      {likes > 0 ? (
        <Text style={{ color: colors.onSurface, fontSize: compact ? 11 : 13.5, fontWeight: "700", fontFamily: fonts.text }}>{likes}</Text>
      ) : null}
    </Pressable>
  );
}

// Il post come su Instagram: chi lo ha scritto, foto o video nel formato
// originale, e i gesti (like, doppio tocco, commenti).
export default function PostCard({ post, compact, onOpen, onLike, onAuthor }: Props) {
  const { colors } = useTheme();
  const senzaMedia = post.media.length === 0;

  // Invia il post a una persona dell'app, non fuori dall'app: qui si sceglie chi.
  const [inviaA, setInviaA] = useState(false);
  const condividi = () => setInviaA(true);

  return (
    <View
      testID={`post-card-${post.id}`}
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: compact ? radius.lg : 22,
        overflow: "hidden",
        marginBottom: compact ? spacing.md : spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Pressable testID={`post-author-${post.id}`} onPress={onAuthor} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm }}>
        <PersonAvatar person={post.author} size={compact ? 30 : 38} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: compact ? 12 : 14 }} numberOfLines={1}>
            {post.author.name || "Persona"}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: fonts.text, fontSize: compact ? 10 : 12 }} numberOfLines={1}>
            @{post.author.username || "utente"} · {tempoFa(post.created_at)}
          </Text>
        </View>
        {post.kind === "rental" ? (
          <View style={{ backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 }}>
            <Text style={{ color: colors.onBrandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 0.4 }}>NOLEGGIO</Text>
          </View>
        ) : null}
        {post.privacy !== "public" ? <Icon name={post.privacy === "private" ? "lock" : "eye-off-outline"} size={15} color={colors.muted} /> : null}
      </Pressable>

      {post.price || post.place ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
          {post.price ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
              <Icon name="currency-eur" size={12} color={colors.onBrandTertiary} />
              <Text style={{ color: colors.onBrandTertiary, fontSize: 11.5, fontWeight: "800" }}>{post.price}</Text>
            </View>
          ) : null}
          {post.place ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
              <Icon name="map-marker-outline" size={12} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 11.5, fontWeight: "600" }} numberOfLines={1}>
                {post.place}
                {post.distance_km != null ? ` · ${post.distance_km.toLocaleString("it-IT")} km` : ""}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {senzaMedia ? (
        <Pressable onPress={onOpen} style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={{ color: colors.onSurface, fontFamily: fonts.display, fontSize: compact ? 16 : 20, lineHeight: compact ? 22 : 27 }} numberOfLines={compact ? 6 : 10}>
            {post.text}
          </Text>
        </Pressable>
      ) : (
        <MediaCarousel media={post.media} ratios={post.ratios} onOpen={onOpen} onDoubleTap={onLike} />
      )}

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
        {onLike ? <LikeButton liked={post.liked} likes={post.likes} onPress={onLike} compact={compact} /> : null}
        <Pressable testID={`post-comment-${post.id}`} onPress={onOpen} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="chat-outline" size={compact ? 19 : 24} color={colors.onSurface} />
          {post.comments > 0 ? (
            <Text style={{ color: colors.onSurface, fontSize: compact ? 11 : 13.5, fontWeight: "700", fontFamily: fonts.text }}>{post.comments}</Text>
          ) : null}
        </Pressable>
        <Pressable onPress={condividi} hitSlop={10}>
          <Icon name="send-outline" size={compact ? 19 : 23} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={{ color: colors.muted, fontSize: 10, fontFamily: fonts.text, letterSpacing: 0.3 }}>{PRIVACY_LABEL[post.privacy].toUpperCase()}</Text>
      </View>

      {!senzaMedia && post.text ? (
        <Text style={{ color: colors.onSurface, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, fontSize: compact ? 12.5 : 14.5, lineHeight: compact ? 18 : 21 }} numberOfLines={compact ? 3 : 8}>
          <Text style={{ fontWeight: "700" }}>{post.author.name || "Persona"} </Text>
          {post.text}
        </Text>
      ) : (
        <View style={{ height: spacing.md }} />
      )}

      <SendToSheet visible={inviaA} onClose={() => setInviaA(false)} post={{ id: post.id }} />
    </View>
  );
}
