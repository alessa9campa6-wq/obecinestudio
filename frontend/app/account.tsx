import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, User } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PROFILES } from "@/src/modules";
import { setColorScheme, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, IconName, Segmented, toast, useStyles } from "@/src/ui";

// Account: the user can be several things at once (filmmaker, crew, cast, producer,
// client, rental) and switch the view mode that decides which tools are featured.
export default function Account() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const s = useStyles();
  const [name, setName] = useState(user?.name ?? "");
  const [profiles, setProfiles] = useState<string[]>(user?.profiles?.length ? user.profiles : ["filmmaker"]);
  const [crewRole, setCrewRole] = useState(user?.crew_role ?? "");
  const [mode, setMode] = useState(user?.view_mode ?? "filmmaker");
  const [busy, setBusy] = useState(false);

  const toggle = (k: string) => setProfiles((p) => (p.includes(k) ? (p.length > 1 ? p.filter((x) => x !== k) : p) : [...p, k]));
  const save = async () => {
    setBusy(true);
    try {
      const view_mode = profiles.includes(mode) ? mode : profiles[0];
      setUser(await api<User>("/auth/me", { method: "PUT", body: { name, profiles, crew_role: crewRole, view_mode } }));
      setMode(view_mode);
      toast("Account aggiornato");
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Button testID="account-back-button" icon="chevron-left" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
        <Text style={[s.h2, { flex: 1 }]}>Account</Text>
        <Button testID="account-save-button" icon="check" label="Salva" loading={busy} onPress={save} />
      </View>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + spacing.xl, maxWidth: 760, width: "100%", alignSelf: "center" }}>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.muted}>{user?.email}</Text>
          <Field testID="account-name-input" label="Nome" value={name} onChangeText={setName} />
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Chi sei? (puoi sceglierne più di uno)</Text>
          <ChipRow>
            {PROFILES.map((p) => (
              <Chip key={p.key} testID={`profile-${p.key}`} label={p.label} selected={profiles.includes(p.key)} onPress={() => toggle(p.key)} />
            ))}
          </ChipRow>
          {profiles.includes("crew") && <Field testID="account-crew-role-input" label="Il tuo ruolo nella crew" value={crewRole} onChangeText={setCrewRole} placeholder="es. Direttore della fotografia, fonico..." />}
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Modalità di visualizzazione</Text>
          <Text style={s.muted}>Mette in evidenza gli strumenti più utili per il ruolo scelto, senza nascondere gli altri. Cambiala quando vuoi.</Text>
          <ChipRow>
            {PROFILES.filter((p) => profiles.includes(p.key)).map((p) => (
              <Chip key={p.key} testID={`view-mode-${p.key}`} icon={p.icon as IconName} label={p.label} selected={mode === p.key} onPress={() => setMode(p.key)} />
            ))}
          </ChipRow>
          <Text testID="view-mode-hint" style={s.body}>{PROFILES.find((p) => p.key === mode)?.hint}</Text>
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Text style={s.h3}>Tema</Text>
          <Segmented testID="account-theme" value={scheme} onChange={setColorScheme} options={[{ value: "dark", label: "Scuro cinematografico" }, { value: "light", label: "Chiaro" }]} />
        </Card>
        <Button testID="account-logout" icon="logout" label="Esci" variant="ghost" onPress={logout} />
      </KeyboardAwareScrollView>
    </View>
  );
}
