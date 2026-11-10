import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, Pressable, Switch, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, fileUrl, Rental, uploadImage, User } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PROFILES } from "@/src/modules";
import { setColorScheme, spacing, useTheme } from "@/src/theme";
import {
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  Icon,
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
  const [username, setUsername] = useState(user?.username ?? "");
  const [unameCheck, setUnameCheck] = useState<{ valid: boolean; free: boolean; reason: string } | null>(null);
  const [profiles, setProfiles] = useState<string[]>(
    user?.profiles?.length ? user.profiles : ["filmmaker"]
  );
  const [crewRole, setCrewRole] = useState(user?.crew_role ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [link, setLink] = useState(user?.link ?? "");
  const [mode, setMode] = useState(user?.view_mode ?? "filmmaker");
  // Noleggio: resta spento finché non lo si accende, così chi non ce l'ha non
  // vede nessun campo in più.
  const rentalSalvato = user?.rental ?? {};
  const [rentalAttivo, setRentalAttivo] = useState(!!(rentalSalvato.nome || rentalSalvato.telefono));
  const [rental, setRental] = useState<Rental>({
    nome: "",
    citta: "",
    telefono: "",
    email: "",
    sito: "",
    attrezzatura: "",
    note: "",
    ...rentalSalvato,
  });
  const setRentalCampo = (k: keyof Rental) => (v: string) => setRental((r) => ({ ...r, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  // Chiede al server se il nome utente è valido e libero, un attimo dopo che
  // hai smesso di scrivere: così non scopri il problema solo al salvataggio.
  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u || u === (user?.username ?? "")) {
      setUnameCheck(null);
      return;
    }
    const timer = setTimeout(() => {
      api<{ valid: boolean; free: boolean; reason: string }>(`/people/username/${encodeURIComponent(u)}`)
        .then(setUnameCheck)
        .catch(() => setUnameCheck(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [username, user?.username]);

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
          bio: bio.trim(),
          link: link.trim(),
          picture: serverPath,
          rental: rentalAttivo ? rental : {},
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

  // Foto di vetrina del noleggio: la prima cosa che si vede nella scheda.
  const scegliCopertina = async () => {
    if (uploadingCover) return;
    setUploadingCover(true);
    try {
      const permesso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permesso.granted) return toast("Serve il permesso per le foto", "error");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const serverPath = await uploadImage({
        uri: asset.uri,
        fileName: asset.fileName ?? "vetrina.jpg",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      setRental((r) => ({ ...r, cover: serverPath }));
      toast("Immagine scelta: salva per applicarla");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploadingCover(false);
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
          username,
          profiles,
          crew_role: crewRole,
          view_mode,
          bio: bio.trim(),
          link: link.trim(),
          picture: user?.picture ?? null,
          rental: rentalAttivo ? rental : {},
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
        {rentalAttivo && (rental.nome || rental.attrezzatura) ? (
          <Card testID="account-rental-summary" style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="warehouse" size={18} color={colors.brandPrimary} />
              <Text style={[s.h3, { flex: 1 }]} numberOfLines={1}>{rental.nome || "Il mio noleggio"}</Text>
            </View>
            <Text style={s.muted} numberOfLines={2}>
              {[rental.citta, rental.telefono, rental.email, rental.sito].filter(Boolean).join(" · ") || "Aggiungi città e contatti qui sotto"}
            </Text>
            {rental.attrezzatura ? <Text style={s.body} numberOfLines={3}>{rental.attrezzatura}</Text> : null}
          </Card>
        ) : null}

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
          <Field
            testID="account-username-input"
            label="Nome utente"
            value={username}
            onChangeText={(v) => setUsername(v.replace(/^@/, "").toLowerCase())}
            autoCapitalize="none"
            placeholder="es. alessandro"
          />
          <Text
            testID="account-username-hint"
            style={[
              s.muted,
              unameCheck && !unameCheck.valid
                ? { color: colors.error }
                : unameCheck && !unameCheck.free
                  ? { color: colors.error }
                  : unameCheck?.free
                    ? { color: colors.success }
                    : null,
            ]}
          >
            {unameCheck
              ? unameCheck.reason || `@${username.trim()} è libero`
              : username.trim()
                ? `I collaboratori ti trovano scrivendo @${username.trim()}`
                : "Scegli un nome utente: serve ai colleghi per trovarti e invitarti nel team."}
          </Text>
          <Field
            testID="account-bio-input"
            label="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            minHeight={80}
            placeholder="Due righe su di te: cosa fai, dove lavori, cosa ami girare."
          />
          <Field
            testID="account-link-input"
            label="Link (sito, showreel, Instagram...)"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://"
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name="warehouse" size={20} color={colors.brandPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={s.h3}>Il mio noleggio</Text>
              <Text style={s.muted}>Se hai un noleggio, mostralo sul profilo.</Text>
            </View>
            <Switch
              testID="account-rental-toggle"
              value={rentalAttivo}
              onValueChange={setRentalAttivo}
              trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
            />
          </View>

          {rentalAttivo ? (
            <>
              <View style={{ gap: spacing.xs }}>
                <Text style={s.label}>Immagine di vetrina</Text>
                <Pressable testID="account-rental-cover" onPress={scegliCopertina} style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary, height: 150, alignItems: "center", justifyContent: "center" }}>
                  {rental.cover ? (
                    <Image source={{ uri: fileUrl(rental.cover) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Icon name="image-plus" size={24} color={colors.muted} />
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{uploadingCover ? "Carico..." : "Scegli una foto grande (16:9)"}</Text>
                    </View>
                  )}
                </Pressable>
                {rental.cover ? (
                  <Button label="Togli l'immagine" variant="ghost" small icon="close-circle-outline" onPress={() => setRental((r) => ({ ...r, cover: "" }))} />
                ) : null}
              </View>
              <Field testID="account-rental-nome" label="Nome del noleggio" value={rental.nome ?? ""} onChangeText={setRentalCampo("nome")} placeholder="es. Rental Rossi" />
              <Field testID="account-rental-citta" label="Città / Zona" value={rental.citta ?? ""} onChangeText={setRentalCampo("citta")} placeholder="es. Milano e provincia" />
              <Field testID="account-rental-telefono" label="Telefono" value={rental.telefono ?? ""} onChangeText={setRentalCampo("telefono")} keyboardType="phone-pad" />
              <Field testID="account-rental-email" label="Email" value={rental.email ?? ""} onChangeText={setRentalCampo("email")} autoCapitalize="none" keyboardType="email-address" />
              <Field testID="account-rental-sito" label="Sito o pagina" value={rental.sito ?? ""} onChangeText={setRentalCampo("sito")} autoCapitalize="none" keyboardType="url" placeholder="https://" />
              <Field testID="account-rental-note" label="Note" value={rental.note ?? ""} onChangeText={setRentalCampo("note")} multiline minHeight={70} placeholder="Consegna, trasporto, condizioni..." />
              <Text style={s.muted}>Lo vedono le persone con cui lavori, quando apri un progetto con loro.</Text>
            </>
          ) : (
            <Text style={s.muted}>{"Se non hai un noleggio lascia spento: non cambia niente nel resto dell'app."}</Text>
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
