import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { LibItem, useItems, useLibrary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

// La rubrica: le persone della troupe salvate una volta e riutilizzabili in
// ogni progetto. I campi hanno gli stessi nomi di quelli della troupe, così
// una persona scelta qui entra nel progetto già compilata.
type PersonData = { ruolo?: string; reparto?: string; telefono?: string; email?: string; username?: string; note?: string };

const REPARTI = ["Regia", "Produzione", "Fotografia", "Elettricisti", "Macchinisti", "Suono", "Scenografia", "Costumi", "Trucco", "Post"];
const VUOTO: PersonData = { ruolo: "", reparto: "", telefono: "", email: "", username: "", note: "" };

const iniziali = (nome: string) =>
  (nome.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();

export default function PeopleLibrary({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const crew = useItems(project.id, "crew");
  const { q, create, update, remove } = useLibrary("crew");
  const { colors } = useTheme();
  const s = useStyles();
  const [edit, setEdit] = useState<LibItem | "new" | null>(null);
  const [nome, setNome] = useState("");
  const [form, setForm] = useState<PersonData>(VUOTO);
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
          data: { ruolo: d.ruolo ?? "", reparto: d.reparto ?? "", telefono: d.telefono ?? "", email: d.email ?? "", username: d.username ?? "", note: d.note ?? "" },
        };
      });
    if (!nuovi.length) return toast("La troupe di questo progetto è già in rubrica");
    create.mutate(nuovi, { onSuccess: () => toast(`${nuovi.length} persone aggiunte alla rubrica`) });
  };

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
      <ModuleScroll>
        {q.isLoading ? null : people.length ? (
          people.map((p) => {
            const d = p.data as PersonData;
            const dettagli = [d.ruolo, d.reparto, d.telefono].filter(Boolean).join(" · ");
            return (
              <Pressable key={p.id} testID={`person-${p.id}`} onPress={() => openEdit(p)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.onBrandTertiary, fontWeight: "700" }}>{iniziali(p.title)}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.h3} numberOfLines={1}>{p.title}</Text>
                    {dettagli ? <Text style={s.muted} numberOfLines={1}>{dettagli}</Text> : null}
                    {d.username ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Icon name="account-check-outline" size={14} color={colors.success} />
                        <Text style={[s.muted, { fontSize: 12 }]}>@{d.username} · ha un account</Text>
                      </View>
                    ) : d.email ? (
                      <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{d.email}</Text>
                    ) : null}
                  </View>
                  <Icon name="pencil" size={18} color={colors.muted} />
                </Card>
              </Pressable>
            );
          })
        ) : (
          <Empty
            icon="account-multiple-outline"
            title="La rubrica è vuota"
            subtitle="Salva qui le persone con cui lavori: la prossima volta le aggiungi a un progetto con un tocco, senza riscrivere i dati."
            action={<Button testID="people-empty-add" icon="plus" label="Aggiungi la prima persona" onPress={openNew} />}
          />
        )}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Icon name="information-outline" size={16} color={colors.muted} />
          <Text style={[s.muted, { flex: 1 }]}>
            La rubrica è personale: la vedi solo tu. Nella troupe di un progetto, “Dalla rubrica” aggiunge una persona con i dati già compilati.
          </Text>
        </View>
      </ModuleScroll>

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
        <Field testID="person-note-field" label="Note" value={form.note ?? ""} onChangeText={set("note")} multiline minHeight={80} placeholder="Disponibilità, attrezzatura personale, patente..." />
      </Sheet>
    </View>
  );
}
