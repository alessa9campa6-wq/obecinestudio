import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { LibItem, useItems, useLibrary } from "@/src/hooks";
import { SectionHero } from "@/src/components/SectionHero";
import { ModuleHeader, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

// La rubrica: le persone salvate una volta e riutilizzabili in ogni progetto.
// Righe compatte, ricerca e filtro per reparto: si trova qualcuno in due secondi.
export type PersonData = {
  ruolo?: string;
  reparto?: string;
  telefono?: string;
  email?: string;
  username?: string;
  tariffa?: string;
  note?: string;
};

export const REPARTI = ["Regia", "Produzione", "Fotografia", "Elettricisti", "Macchinisti", "Suono", "Scenografia", "Costumi", "Trucco", "Post"];
const VUOTO: PersonData = { ruolo: "", reparto: "", telefono: "", email: "", username: "", tariffa: "", note: "" };

export const iniziali = (nome: string) =>
  (nome.replace("@", "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();

export function Avatar({ nome, size = 38 }: { nome: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.onBrandTertiary, fontWeight: "700", fontSize: size / 3 }}>{iniziali(nome)}</Text>
    </View>
  );
}

export default function PeopleLibrary({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const crew = useItems(project.id, "crew");
  const { q, create, update, remove } = useLibrary("crew");
  const { colors } = useTheme();
  const s = useStyles();
  const [edit, setEdit] = useState<LibItem | "new" | null>(null);
  const [nome, setNome] = useState("");
  const [form, setForm] = useState<PersonData>(VUOTO);
  const [cerca, setCerca] = useState("");
  const [reparto, setReparto] = useState("");
  const people = q.data ?? [];

  const openNew = () => (setNome(""), setForm(VUOTO), setEdit("new"));
  const openEdit = (p: LibItem) => (setNome(p.title), setForm({ ...VUOTO, ...(p.data as PersonData) }), setEdit(p));
  const set = (k: keyof PersonData) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const title = nome.trim();
    if (!title) return toast("Scrivi il nome della persona", "error");
    const body = { title, data: form };
    const done = { onSuccess: () => (setEdit(null), toast("Persona salvata")) };
    if (edit === "new") create.mutate([body], done);
    else if (edit) update.mutate({ id: edit.id, ...body }, done);
  };

  // Porta nella rubrica chi è già nella troupe di questo progetto.
  const importa = () => {
    const esistenti = new Set(people.map((p) => p.title.trim().toLowerCase()));
    const nuovi = (crew.data ?? [])
      .filter((i) => !esistenti.has(i.title.trim().toLowerCase()))
      .map((i) => {
        const d = i.data ?? {};
        return {
          title: i.title,
          data: { ruolo: d.ruolo ?? "", reparto: d.reparto ?? "", telefono: d.telefono ?? "", email: d.email ?? "", username: d.username ?? "", tariffa: d.tariffa ?? "", note: d.note ?? "" },
        };
      });
    if (!nuovi.length) return toast("La troupe di questo progetto è già in rubrica");
    create.mutate(nuovi, { onSuccess: () => toast(`${nuovi.length} persone aggiunte alla rubrica`) });
  };

  const termine = cerca.trim().toLowerCase().replace(/^@/, "");
  const visibili = people
    .filter((p) => {
      const d = p.data as PersonData;
      if (reparto && d.reparto !== reparto) return false;
      if (!termine) return true;
      return [p.title, d.ruolo, d.reparto, d.username, d.telefono, d.email]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(termine));
    })
    // In ordine alfabetico, come una rubrica vera.
    .sort((a, b) => a.title.localeCompare(b.title, "it"));

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${people.length} persone · le ritrovi in tutti i progetti`}
        right={
          <>
            <Button testID="people-import-project" icon="account-multiple-plus" variant="secondary" label="Da questo progetto" loading={create.isPending} onPress={importa} />
            <Button testID="people-add-button" icon="plus" label="Persona" onPress={openNew} />
          </>
        }
      />

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm }}>
        <Field testID="people-search" label="Cerca" value={cerca} onChangeText={setCerca} placeholder="Nome, ruolo, reparto, @nome utente..." />
        <ChipRow>
          <Chip testID="people-dept-all" label="Tutti" selected={!reparto} onPress={() => setReparto("")} />
          {REPARTI.map((r) => (
            <Chip key={r} testID={`people-filter-${r}`} label={r} selected={reparto === r} onPress={() => setReparto(reparto === r ? "" : r)} />
          ))}
        </ChipRow>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxxl }}>
        <SectionHero icon="account-multiple-outline" eyebrow="Persone" />
        {q.isLoading ? null : visibili.length ? (
          visibili.map((p) => {
            const d = p.data as PersonData;
            const dettagli = [d.ruolo, d.reparto].filter(Boolean).join(" · ");
            const contatto = [d.telefono, d.email].filter(Boolean)[0];
            return (
              <Pressable key={p.id} testID={`person-${p.id}`} onPress={() => openEdit(p)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                  <Avatar nome={p.title} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.h3} numberOfLines={1}>{p.title}</Text>
                    <Text style={[s.muted, { fontSize: 13 }]} numberOfLines={1}>
                      {dettagli || "Nessun ruolo indicato"}
                      {d.username ? ` · @${d.username}` : ""}
                    </Text>
                    {contatto ? <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{contatto}</Text> : null}
                  </View>
                  {d.username ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.brandTertiary }}>
                      <Icon name="account-check-outline" size={12} color={colors.onBrandTertiary} />
                      <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>app</Text>
                    </View>
                  ) : null}
                  <Icon name="chevron-right" size={18} color={colors.muted} />
                </Card>
              </Pressable>
            );
          })
        ) : people.length ? (
          <Empty icon="account-search-outline" title="Nessuna persona con questi filtri" subtitle="Prova a togliere il reparto o a cercare un'altra parola." />
        ) : (
          <Empty
            icon="account-multiple-outline"
            title="La rubrica è vuota"
            subtitle="Aggiungi le persone con cui lavori: le ritrovi in ogni progetto, con ruolo e contatti già pronti."
            action={<Button testID="people-empty-add" icon="plus" label="Aggiungi persona" onPress={openNew} />}
          />
        )}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.sm }}>
          <Icon name="information-outline" size={16} color={colors.muted} />
          <Text style={[s.muted, { flex: 1 }]}>La rubrica è personale: nessun altro vede i tuoi contatti.</Text>
        </View>
      </ScrollView>

      <Sheet
        testID="person-editor-sheet"
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Nuova persona" : "Modifica persona"}
        footer={
          <>
            {edit && edit !== "new" ? (
              <Button testID="person-delete-button" icon="trash-can-outline" variant="ghost" onPress={() => remove.mutate(edit.id, { onSuccess: () => setEdit(null) })} />
            ) : null}
            <Button testID="person-save-button" icon="check" label="Salva" onPress={save} loading={create.isPending || update.isPending} />
          </>
        }
      >
        <Field testID="person-name-field" label="Nome e cognome" value={nome} onChangeText={setNome} placeholder="es. Marco Rossi" />
        <Field testID="person-role-field" label="Ruolo principale" value={form.ruolo ?? ""} onChangeText={set("ruolo")} placeholder="es. Direttore della fotografia" />
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Reparto</Text>
          <ChipRow>
            {REPARTI.map((r) => (
              <Chip key={r} testID={`person-dept-${r}`} label={r} selected={form.reparto === r} onPress={() => set("reparto")(form.reparto === r ? "" : r)} />
            ))}
          </ChipRow>
        </View>
        <Field testID="person-phone-field" label="Telefono" value={form.telefono ?? ""} onChangeText={set("telefono")} keyboardType="phone-pad" />
        <Field testID="person-email-field" label="Email" value={form.email ?? ""} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" />
        <Field testID="person-username-field" label="@nome utente (se ha l'app)" value={form.username ?? ""} onChangeText={(v) => set("username")(v.replace(/^@/, "").toLowerCase())} autoCapitalize="none" placeholder="es. marco" />
        <Field testID="person-rate-field" label="Tariffa abituale (€)" value={form.tariffa ?? ""} onChangeText={set("tariffa")} keyboardType="decimal-pad" placeholder="es. 350 al giorno" />
        <Field testID="person-note-field" label="Note" value={form.note ?? ""} onChangeText={set("note")} multiline minHeight={80} placeholder="Disponibilità, attrezzatura personale, patente..." />
      </Sheet>
    </View>
  );
}
