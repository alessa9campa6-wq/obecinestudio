import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Field, Segmented, useStyles } from "@/src/ui";

const HERO =
  "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

type LoginView = "auth" | "forgot" | "reset";

export default function Login() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const [view, setView] = useState<LoginView>("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    setError("");
    if (!email || !password) return setError("Inserisci email e password");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name, username);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    setError("");
    setMessage("");
    if (!email) return setError("Inserisci la tua email");
    setBusy(true);
    try {
      await forgotPassword(email);
      setMessage("Codice inviato via email.");
      setView("reset");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError("");
    if (!email || !code || !password)
      return setError("Compila email, codice e nuova password");
    setBusy(true);
    try {
      await resetPassword(email, code, password);
      await login(email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const authForm = (
    <>
      <Text style={s.label}>CineStudio</Text>
      <Text style={s.h1}>
        {mode === "login" ? "Bentornato sul set" : "Crea il tuo studio"}
      </Text>
      <Text style={s.muted}>
        Dall'idea alla consegna, ogni fase del tuo film in un unico posto.
      </Text>

      <Segmented
        testID="auth-mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: "login", label: "Accedi" },
          { value: "register", label: "Registrati" },
        ]}
      />

      {mode === "register" && (
        <>
          <Field
            testID="register-name-input"
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Il tuo nome"
          />
          <Field
            testID="register-username-input"
            label="Nome utente (facoltativo)"
            value={username}
            onChangeText={(v) => setUsername(v.replace(/^@/, "").toLowerCase())}
            keyboardType="default"
            autoCapitalize="none"
            placeholder="es. alessandro"
          />
          <Text testID="register-username-hint" style={{ color: colors.muted, fontFamily: fonts.text, fontSize: 13 }}>
            Con un nome utente i tuoi collaboratori ti trovano scrivendo @{username.trim() || "nome"} e ti invitano nel team.
          </Text>
        </>
      )}

      <Field
        testID="login-email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="nome@email.com"
      />

      <Field
        testID="login-password-input"
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="Minimo 6 caratteri"
      />

      {error ? (
        <Text testID="login-error" style={{ color: colors.error, fontFamily: fonts.text }}>
          {error}
        </Text>
      ) : null}

      <Button
        testID="login-submit-button"
        label={mode === "login" ? "Accedi" : "Crea account"}
        onPress={submit}
        loading={busy}
      />

      {mode === "login" && (
        <Pressable onPress={() => setView("forgot")}>
          <Text style={{ color: colors.brandPrimary, textAlign: "center" }}>
            Password dimenticata?
          </Text>
        </Pressable>
      )}
    </>
  );

  const forgotForm = (
    <>
      <Text style={s.h1}>Recupera la password</Text>
      <Text style={s.muted}>
        Inserisci la tua email: ti invieremo un codice a 6 cifre.
      </Text>

      <Field
        testID="forgot-email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="nome@email.com"
      />

      {error ? (
        <Text style={{ color: colors.error, fontFamily: fonts.text }}>{error}</Text>
      ) : null}

      <Button
        testID="forgot-submit-button"
        label="Invia codice"
        onPress={sendCode}
        loading={busy}
      />

      <Pressable onPress={() => setView("auth")}>
        <Text style={{ color: colors.brandPrimary, textAlign: "center" }}>
          Torna al login
        </Text>
      </Pressable>
    </>
  );

  const resetForm = (
    <>
      <Text style={s.h1}>Reimposta la password</Text>
      {message ? (
        <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text }}>
          {message}
        </Text>
      ) : null}

      <Field
        testID="reset-email-input"
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Field
        testID="reset-code-input"
        label="Codice ricevuto via email"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        placeholder="123456"
      />

      <Field
        testID="reset-password-input"
        label="Nuova password"
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="Minimo 6 caratteri"
      />

      {error ? (
        <Text style={{ color: colors.error, fontFamily: fonts.text }}>{error}</Text>
      ) : null}

      <Button
        testID="reset-submit-button"
        label="Reimposta password"
        onPress={reset}
        loading={busy}
      />

      <Pressable onPress={() => setView("auth")}>
        <Text style={{ color: colors.brandPrimary, textAlign: "center" }}>
          Torna al login
        </Text>
      </Pressable>
    </>
  );

  const form = (
    <View style={{ gap: spacing.lg, width: "100%", maxWidth: 420 }}>
      {view === "auth" && authForm}
      {view === "forgot" && forgotForm}
      {view === "reset" && resetForm}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
        <Image source={{ uri: HERO }} style={{ flex: 1 }} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
          }}
        />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl + 80,
        }}
      >
        {form}
      </KeyboardAwareScrollView>
    </View>
  );
}
