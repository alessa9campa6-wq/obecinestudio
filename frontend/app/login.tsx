import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Field, Icon, Segmented, useStyles } from "@/src/ui";

const HERO = "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

export default function Login() {
  const { login, register, loginGoogle } = useAuth();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email || !password) return setError("Inserisci email e password");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const form = (
    <View style={{ gap: spacing.lg, width: "100%", maxWidth: 420 }}>
      <View style={{ gap: spacing.xs }}>
        <Text style={[s.label, { color: colors.brandPrimary }]}>CineStudio</Text>
        <Text style={s.h1}>{mode === "login" ? "Bentornato sul set" : "Crea il tuo studio"}</Text>
        <Text style={s.muted}>Dall'idea alla consegna, ogni fase del tuo film in un unico posto.</Text>
      </View>
      <Segmented
        testID="auth-mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "login", label: "Accedi" },
          { value: "register", label: "Registrati" },
        ]}
      />
      {mode === "register" && <Field testID="register-name-input" label="Nome" value={name} onChangeText={setName} placeholder="Il tuo nome" />}
      <Field testID="login-email-input" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nome@email.com" />
      <Field testID="login-password-input" label="Password" value={password} onChangeText={setPassword} secure placeholder="Minimo 6 caratteri" />
      {error ? (
        <Text testID="login-error" style={{ color: colors.error, fontFamily: fonts.text }}>
          {error}
        </Text>
      ) : null}
      <Button testID="login-submit-button" label={mode === "login" ? "Accedi" : "Crea account"} onPress={submit} loading={busy} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
        <Text style={s.muted}>oppure</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
      </View>
      <Pressable
        testID="google-login-button"
        onPress={loginGoogle}
        style={({ pressed }) => ({ minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}
      >
        <Icon name="google" size={20} />
        <Text style={[s.h3, { fontSize: 15 }]}>Continua con Google</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, flexDirection: wide ? "row" : "column" }}>
      {wide && (
        <View style={{ flex: 1 }}>
          <Image source={{ uri: HERO }} style={{ flex: 1 }} contentFit="cover" />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end", padding: spacing.xxl }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 44, color: "#FFFFFF" }}>Ogni grande film{"\n"}inizia da un'idea.</Text>
          </LinearGradient>
        </View>
      )}
      <KeyboardAwareScrollView
        style={{ flex: wide ? 0.9 : 1 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }}
      >
        {form}
      </KeyboardAwareScrollView>
    </View>
  );
}
