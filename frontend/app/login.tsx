import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Field, Segmented, useStyles } from "@/src/ui";

const HERO =
  "https://images.unsplash.com/photo-1612544409025-e1f6a56c1152?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

type LoginView = "auth" | "forgot" | "reset";

// Piccolo marchio: linea d'oro + nome spaziato. È lo stesso segno che apre le
// schermate dell'app, così l'accesso non sembra un'altra applicazione.
function Marchio({ chiaro = true }: { chiaro?: boolean }) {
  const { colors } = useTheme();
  const colore = chiaro ? colors.brandPrimary : colors.onBrandTertiary;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 28, height: 1.5, backgroundColor: colore }} />
      <Text style={{ fontFamily: fonts.text, fontSize: 11, fontWeight: "700", letterSpacing: 4, color: colore }}>
        CINESTUDIO
      </Text>
    </View>
  );
}

export default function Login() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { colors, scheme } = useTheme();
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

  // --- animazioni -----------------------------------------------------------
  const entrata = useRef(new Animated.Value(0)).current; // comparsa iniziale
  const scambio = useRef(new Animated.Value(0)).current; // cambio vista/modo
  const scossa = useRef(new Animated.Value(0)).current; // errore
  const respiro = useRef(new Animated.Value(0)).current; // lento zoom dell'immagine

  useEffect(() => {
    Animated.timing(entrata, { toValue: 1, duration: 520, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(respiro, { toValue: 1, duration: 14000, useNativeDriver: true }),
        Animated.timing(respiro, { toValue: 0, duration: 14000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [entrata, respiro]);

  // Ogni cambio di form entra con una dissolvenza dal basso: niente scatti.
  useEffect(() => {
    scambio.setValue(0);
    Animated.timing(scambio, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [view, mode, scambio]);

  // Quando arriva un errore il pannello fa un piccolo cenno, così si nota.
  useEffect(() => {
    if (!error) return;
    Animated.sequence([
      Animated.timing(scossa, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(scossa, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(scossa, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(scossa, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [error, scossa]);

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
    if (!email || !code || !password) return setError("Compila email, codice e nuova password");
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

  const errore = error ? (
    <Text testID="login-error" style={{ color: colors.error, fontFamily: fonts.text, fontSize: 13.5 }}>
      {error}
    </Text>
  ) : null;

  const authForm = (
    <>
      <Text style={[s.h1, { fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36 }]}>
        {mode === "login" ? "Bentornato sul set" : "Crea il tuo studio"}
      </Text>
      <Text style={[s.muted, { lineHeight: 19 }]}>
        Dall’idea alla consegna, ogni fase del tuo film in un unico posto.
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
          <Text testID="register-username-hint" style={{ color: colors.muted, fontFamily: fonts.text, fontSize: 12.5, lineHeight: 17 }}>
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

      {errore}

      <Button
        testID="login-submit-button"
        label={mode === "login" ? "Accedi" : "Crea account"}
        onPress={submit}
        loading={busy}
      />

      {mode === "login" && (
        <Pressable onPress={() => setView("forgot")} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ color: colors.brandPrimary, textAlign: "center", fontFamily: fonts.text, fontSize: 13.5 }}>
            Password dimenticata?
          </Text>
        </Pressable>
      )}
    </>
  );

  const forgotForm = (
    <>
      <Text style={[s.h1, { fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36 }]}>Recupera la password</Text>
      <Text style={[s.muted, { lineHeight: 19 }]}>
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

      {errore}

      <Button testID="forgot-submit-button" label="Invia codice" onPress={sendCode} loading={busy} />

      <Pressable onPress={() => setView("auth")} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text style={{ color: colors.brandPrimary, textAlign: "center", fontFamily: fonts.text, fontSize: 13.5 }}>
          Torna al login
        </Text>
      </Pressable>
    </>
  );

  const resetForm = (
    <>
      <Text style={[s.h1, { fontSize: wide ? 40 : 32, lineHeight: wide ? 44 : 36 }]}>Reimposta la password</Text>
      {message ? (
        <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 13.5 }}>{message}</Text>
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

      {errore}

      <Button testID="reset-submit-button" label="Reimposta password" onPress={reset} loading={busy} />

      <Pressable onPress={() => setView("auth")} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text style={{ color: colors.brandPrimary, textAlign: "center", fontFamily: fonts.text, fontSize: 13.5 }}>
          Torna al login
        </Text>
      </Pressable>
    </>
  );

  const form = (
    <Animated.View
      key={`${view}-${mode}`}
      style={{
        gap: spacing.lg,
        width: "100%",
        maxWidth: 420,
        opacity: scambio,
        transform: [
          { translateY: scambio.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { translateX: scossa.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
        ],
      }}
    >
      {view === "auth" && authForm}
      {view === "forgot" && forgotForm}
      {view === "reset" && resetForm}
    </Animated.View>
  );

  // Pannello: su iPhone è una lastra di vetro sopra la foto, su iPad è la metà
  // destra piena, come le schermate interne dell'app.
  const pannello = (
    <Animated.View
      style={{
        width: "100%",
        maxWidth: wide ? 520 : 460,
        padding: wide ? spacing.xxl : spacing.xl,
        borderRadius: wide ? radius.lg : 26,
        borderWidth: 1,
        borderColor: scheme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)",
        backgroundColor: wide
          ? colors.surfaceSecondary
          : scheme === "dark"
            ? "rgba(16,16,18,0.90)"
            : "rgba(255,255,255,0.94)",
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 18 },
        opacity: entrata,
        transform: [{ translateY: entrata.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
      }}
    >
      <View style={{ marginBottom: spacing.xl }}>
        <Marchio />
      </View>
      {form}
    </Animated.View>
  );

  const hero = (
    <Animated.View style={{ flex: 1, overflow: "hidden" }}>
      <Animated.View
        style={{
          flex: 1,
          transform: [{ scale: respiro.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        }}
      >
        <Image source={{ uri: HERO }} style={{ flex: 1 }} contentFit="cover" transition={500} />
      </Animated.View>
      <LinearGradient
        colors={
          wide
            ? ["rgba(0,0,0,0.35)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.90)"]
            : ["rgba(0,0,0,0.45)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.94)"]
        }
        locations={[0, 0.55, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
    </Animated.View>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.surface }}>
        <View style={{ flex: 1 }}>
          {hero}
          <View style={{ position: "absolute", left: insets.left + spacing.xxl, right: spacing.xxl, bottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: "#FFFFFF", fontWeight: "600" }}>
              Il tuo studio,{"\n"}dal set alla consegna.
            </Text>
            <Text style={{ fontFamily: fonts.text, fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.78)", maxWidth: 420 }}>
              Storyboard, mirino, schede di lavorazione e PDF pronti da mandare: tutto quello che serve sul set, in un’app sola.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              {["Storyboard", "Mirino", "PDF"].map((t) => (
                <View key={t} style={{ borderWidth: 1, borderColor: "rgba(212,175,55,0.55)", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
                  <Text style={{ color: colors.brandPrimary, fontFamily: fonts.text, fontSize: 12, fontWeight: "600" }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View
          style={{
            width: 520,
            paddingHorizontal: spacing.xxl,
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.xl,
            justifyContent: "center",
            alignItems: "center",
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
          }}
        >
          {pannello}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>{hero}</View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        <Animated.View style={{ marginBottom: spacing.lg, opacity: entrata, transform: [{ translateY: entrata.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: "#FFFFFF", fontWeight: "600" }}>
            Il tuo studio,{"\n"}dal set alla consegna.
          </Text>
        </Animated.View>
        {pannello}
      </KeyboardAwareScrollView>
    </View>
  );
}
