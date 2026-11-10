import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LibItem, useLibrary } from "@/src/hooks";
import { PersonData, REPARTI } from "@/src/components/PeopleLibrary";
import PersonAvatar from "@/src/components/PersonAvatar";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

const VUOTO: PersonData = { ruolo: "", reparto: "", telefono: "", email: "", username: "", tariffa: "", note: "" };

// La rubrica fuori dai progetti: le persone salvate una volta, pronte per ogni set.
export default function Rubrica() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { q, create, update, remove } = useLibrary("crew");
  const [cerca, setCerca] = useState("");
  const [reparto, setReparto] = useState("");
  const [edit, setEdit] = useState<LibItem | "new" | null>(null);
  const [nome, setNome] = useState("");
  const [form, setForm] = useState<PersonData>(VUOTO);

  const persone = q.data ?? [];
  const lista = useMemo(() => {
    const t = cerca.trim().toLowerCase();
    return persone
      .filter((p) => !reparto || (p.data as PersonData).reparto === reparto)
      .filter((p) => {
        if (!t) return true;
        const d = p.data as PersonData;
        return [p.title, d.ruolo, d.reparto, d.telefono, d.email, d.username].filter(Boolean).join(" ").toLowerCase().includes(t);
      })
      .sort((a, b) => a.title.localeCompare(b.title, "it"));
  }, [persone, cerca, reparto]);

  const apri = (p?: LibItem) => {
    if (p) {
      setNome(p.title);
      setForm({ ...VUOTO, ...(p.data as PersonData) });
      setEdit(p);
    } else {
      setNome("");
      setForm(VUOTO);
      setEdit("new");
    }
  };

  const salva = () => {
    const titolo = nome.trim();
    if (!titolo) return toast("Scrivi il nome della persona", "error");
    const body = { title: titolo, data: form };
    const fine = { onSuccess: () => (setEdit(null), toast("Persona salvata")) };
    if (edit === "new") create.mutate([body], fine);
    else if (edit) update.mutate({ id: edit.id, ...body }, fine);
  };

  const cancella = (p: LibItem) => {
    remove.mutate(p.id, { onSuccess: () => (setEdit(null), toast("Persona tolta dalla rubrica")) });
  };

  const campo = (k: keyof PersonData) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable testID="rubrica-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 16, flex: 1 }}>Persone</Text>
        <Button testID="rubrica-new" icon="plus" label="Persona" onPress={() => apri()} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Field testID="rubrica-search" value={cerca} onChangeText={setCerca} placeholder="Cerca per nome, ruolo, reparto, telefono…" />
        <ChipRow>
          <Chip label="Tutti" selected={!reparto} onPress={() => setReparto("")} />
          {REPARTI.map((r) => (
            <Chip key={r} label={r} selected={reparto === r} onPress={() => setReparto(reparto === r ? "" : r)} />
          ))}
        </ChipRow>

        {q.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : lista.length === 0 ? (
          <Empty
            icon="account-multiple-outline"
            title={persone.length ? "Nessuno con questi filtri" : "La rubrica è vuota"}
            subtitle={persone.length ? "Prova a togliere il reparto o a cambiare la ricerca." : "Salva qui la troupe con cui lavori: la ritrovi in ogni progetto."}
            action={<Button label="Aggiungi persona" icon="plus" onPress={() => apri()} />}
          />
        ) : (
          lista.map((p) => {
            const d = p.data as PersonData;
            return (
              <Pressable
                key={p.id}
                testID={`rubrica-person-${p.id}`}
                onPress={() => apri(p)}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm }}
              >
                <PersonAvatar person={{ user_id: p.id, username: d.username ?? "", name: p.title, picture: null }} size={42} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{p.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                    {[d.ruolo, d.reparto, d.telefono].filter(Boolean).join(" · ") || "Nessun dettaglio"}
                  </Text>
                </View>
                {d.tariffa ? <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: "600" }}>{d.tariffa} €</Text> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet
        testID="rubrica-sheet"
        visible={edit !== null}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Nuova persona" : "Modifica persona"}
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button testID="rubrica-save" label="Salva" loading={create.isPending || update.isPending} onPress={salva} />
            {edit && edit !== "new" ? <Button label="Togli dalla rubrica" variant="secondary" icon="trash-can-outline" onPress={() => cancella(edit)} /> : null}
          </View>
        }
      >
        <Field label="Nome e cognome" value={nome} onChangeText={setNome} placeholder="Marco Rossi" />
        <Field label="Ruolo" value={form.ruolo ?? ""} onChangeText={campo("ruolo")} placeholder="Direttore della fotografia" />
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Reparto</Text>
          <ChipRow>
            {REPARTI.map((r) => (
              <Chip key={r} label={r} selected={form.reparto === r} onPress={() => campo("reparto")(form.reparto === r ? "" : r)} />
            ))}
          </ChipRow>
        </View>
        <Field label="Telefono" value={form.telefono ?? ""} onChangeText={campo("telefono")} keyboardType="phone-pad" />
        <Field label="Email" value={form.email ?? ""} onChangeText={campo("email")} keyboardType="email-address" autoCapitalize="none" />
        <Field label="@nome utente (se ha l'app)" value={form.username ?? ""} onChangeText={campo("username")} autoCapitalize="none" />
        <Field label="Tariffa abituale (€)" value={form.tariffa ?? ""} onChangeText={campo("tariffa")} keyboardType="decimal-pad" />
        <Field label="Note" value={form.note ?? ""} onChangeText={campo("note")} multiline minHeight={70} placeholder="Mezzi propri, disponibilità, referenze…" />
      </Sheet>
    </View>
  );
}
