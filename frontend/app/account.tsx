import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, uploadImage, User } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PROFILES } from "@/src/modules";
import { setColorScheme, spacing, useTheme } from "@/src/theme";
import {
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  IconName,
  Segmented,
  toast,
  useStyles,
} from "@/src/ui";

export default function Account() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const s = useStyles();

  const [name, setName] = useState(user?.name ?? "");
  const [profiles, setProfiles] = useState<string[]>(
    user?.profiles?.length ? user.profiles : ["filmmaker"]
  );
  const [crewRole, setCrewRole] = useState(user?.crew_role ?? "");
  const [mode, setMode] = useState(user?.view_mode ?? "filmmaker");
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const toggle = (key: string) => {
    setProfiles((current) =>
      current.includes(key)
        ? current.length > 1
          ? current.filter((value) => value !== key)
          : current
        : [...current, key]
    );
  };

  const changePhoto = async () => {
    if (uploadingPhoto || busy) return;
    setUploadingPhoto(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const serverPath = await uploadImage({
        uri: asset.uri,
        fileName: asset.fileName ?? "profile.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });

      const view_mode = profiles.includes(mode) ? mode : profiles[0];
      const updated = await api<User>("/auth/me", {
        method: "PUT",
        body: {
          name,
          profiles,
          crew_role: crewRole,
          view_mode,
          picture: serverPath,
        },
      });

      setUser(updated);
      setMode(view_mode);
      setPhotoFailed(false);

      if (updated.picture !== serverPath) {
        toast(
          "Foto caricata, ma il backend non ha confermato il salvataggio nel profilo",
          "error"
        );
        return;
      }

      toast("Foto profilo aggiornata");
    } catch (error: any) {
      toast(error?.message ?? "Caricamento non riuscito", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async () => {
    if (busy || uploadingPhoto) return;
    setBusy(true);

    try {
      const view_mode = profiles.includes(mode) ? mode : profiles[0];
      const updated = await api<User>("/auth/me", {
        method: "PUT",
        body: {
          name,
          profiles,
          crew_role: crewRole,
          view_mode,
          picture: user?.picture ?? null,
        },
      });

      setUser(updated);
      setMode(view_mode);
      toast("Account aggiornato");
    } catch (error: any) {
      toast(error?.message ?? "Salvataggio non riuscito", "error");
    } finally {
      setBusy(false);
    }
  };

  const initials =
    (user?.name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const picture = user?.picture;
  const avatarUri = picture
    ? /^https?:\/\//i.test(picture)
      ? picture
      : fileUrl(picture)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      >
        <Button
          testID="account-back-button"
          icon="chevron-left"
          variant="secondary"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <Text style={[s.h2, { flex: 1 }]}>Account</Text>
        <Button
          testID="account-save-button"
          icon="check"
          label="Salva"
          loading={busy}
          onPress={save}
        />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          maxWidth: 760,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <Card style={{ gap: spacing.md }}>
          <View style={{ alignItems: "center", gap: spacing.md }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cambia foto profilo"
              onPress={changePhoto}
              disabled={uploadingPhoto || busy}
              style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                overflow: "hidden",
                backgroundColor: colors.surfaceTertiary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.divider,
              }}
            >
              {avatarUri && !photoFailed ? (
                <Image
                  source={{ uri: avatarUri }}
                  resizeMode="cover"
                  onError={() => setPhotoFailed(true)}
                  style={{ width: 112, height: 112 }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 34,
                    fontWeight: "700",
                    color: colors.muted,
                  }}
                >
                  {initials}
                </Text>
              )}
            </Pressable>

            <Button
              label="Cambia foto profilo"
              variant="secondary"
              loading={uploadingPhoto}
              onPress={changePhoto}
            />
          </View>

          <Text style={s.muted}>{user?.email}</Text>
          <Field
            testID="account-name-input"
            label="Nome"
            value={name}
            onChangeText={setName}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Chi sei? (puoi sceglierne più di uno)</Text>
          <ChipRow>
            {PROFILES.map((profile) => (
              <Chip
                key={profile.key}
                testID={`profile-${profile.key}`}
                label={profile.label}
                selected={profiles.includes(profile.key)}
                onPress={() => toggle(profile.key)}
              />
            ))}
          </ChipRow>

          {profiles.includes("crew") && (
            <Field
              testID="account-crew-role-input"
              label="Il tuo ruolo nella crew"
              value={crewRole}
              onChangeText={setCrewRole}
              placeholder="es. Direttore della fotografia, fonico..."
            />
          )}
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Modalità di visualizzazione</Text>
          <Text style={s.muted}>
            Mette in evidenza gli strumenti più utili per il ruolo scelto,
            senza nascondere gli altri. Cambiala quando vuoi.
          </Text>

          <ChipRow>
            {PROFILES.filter((profile) =>
              profiles.includes(profile.key)
            ).map((profile) => (
              <Chip
                key={profile.key}
                testID={`view-mode-${profile.key}`}
                icon={profile.icon as IconName}
                label={profile.label}
                selected={mode === profile.key}
                onPress={() => setMode(profile.key)}
              />
            ))}
          </ChipRow>

          <Text testID="view-mode-hint" style={s.body}>
            {PROFILES.find((profile) => profile.key === mode)?.hint}
          </Text>
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Tema</Text>
          <Segmented
            testID="account-theme"
            value={scheme}
            onChange={setColorScheme}
            options={[
              { value: "dark", label: "Scuro cinematografico" },
              { value: "light", label: "Chiaro" },
            ]}
          />
        </Card>

        <Button
          testID="account-logout"
          icon="logout"
          label="Esci"
          variant="ghost"
          onPress={logout}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
