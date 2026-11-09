import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { api, Person } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ROLE_LABELS, useHub } from "@/src/hub";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Field, Icon, Segmented, Sheet, toast, useStyles } from "@/src/ui";

type Role = "viewer" | "editor" | "admin";
type Member = { user_id?: string; username?: string; name?: string; email: string; role: Role; job?: string };

const ROLES: { value: Role; label: string }[] = [
  { value: "viewer", label: "Solo visione" },
  { value: "editor", label: "Può modificare" },
  { value: "admin", label: "Amministratore" },
];

// Le tre possibilità spiegate come le direbbe una persona, non come un manuale.
const SPIEGAZIONE: Record<Role, string> = {
  viewer: "Vede scene, piano, budget e calendario. Non può cambiare niente.",
  editor: "Crea e modifica tutto il contenuto del progetto.",
  admin: "Modifica tutto e in più invita o rimuove le persone del team.",
};

const same = (a: Member, b: Member) => (a.user_id && b.user_id ? a.user_id === b.user_id : a.email.trim().toLowerCase() === b.email.trim().toLowerCase());
const nome = (m: { name?: string; username?: string; email: string }) => m.name?.trim() || (m.username ? `@${m.username}` : m.email);
const iniziali = (m: { name?: string; username?: string; email: string }) =>
  (nome(m).replace("@", "").trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2) || "?").toUpperCase();

function Avatar({ member }: { member: { name?: string; email: string } }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.onBrandTertiary, fontWeight: "700", fontSize: 13 }}>{iniziali(member)}</Text>
    </View>
  );
}

// Team del progetto: si invita cercando una persona per @nome utente o per nome,
// oppure per email se non ha ancora l'app. Il ruolo si sceglie da un foglio con
// la spiegazione di ogni livello, non più ciclando una scritta.
export default function TeamCard() {
  const { project, canManage } = useHub();
  const { user } = useAuth();
  const qc = useQueryClient();
  const s = useStyles();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Person | null>(null);
  const [role, setRole] = useState<Role>("editor");
  const [job, setJob] = useState("");
  const [managing, setManaging] = useState<Member | null>(null);
  const members = (project.members ?? []) as Member[];
  const isOwner = project.owner_id === user?.user_id;
  const myRole = project.my_role ?? "owner";
  const term = query.trim().replace(/^@/, "").toLowerCase();
  const isEmail = term.includes("@") && term.includes(".");

  const search = useQuery({
    queryKey: ["people", "search", term],
    queryFn: () => api<Person[]>(`/people/search?q=${encodeURIComponent(term)}`),
    enabled: canManage && term.length >= 2 && !isEmail,
  });

  const save = useMutation({
    mutationFn: (list: Member[]) => api(`/projects/${project.id}/members`, { method: "PUT", body: { members: list } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["summary", project.id] });
      toast("Team aggiornato");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const found = (search.data ?? []).filter((p) => !members.some((m) => m.user_id === p.user_id));
  const done = { onSuccess: () => (setPicked(null), setQuery(""), setJob("")) };

  const addPerson = () => {
    if (!picked) return;
    save.mutate([...members, { user_id: picked.user_id, username: picked.username, name: picked.name, email: "", role, job: job.trim() }], done);
  };
  const inviteEmail = () => save.mutate([...members, { email: term, role, job: job.trim() }], done);
  const changeRole = (member: Member, next: Role) =>
    save.mutate(members.map((m) => (same(m, member) ? { ...m, role: next } : m)), { onSuccess: () => setManaging(null) });
  const removeMember = (member: Member) =>
    save.mutate(members.filter((m) => !same(m, member)), { onSuccess: () => setManaging(null) });

  return (
    <>
      <Card testID="team-card" style={{ gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Icon name="account-multiple-outline" color={colors.brandPrimary} />
          <Text style={[s.h3, { flex: 1 }]}>Team del progetto</Text>
          {!isOwner && <Text testID="team-my-role" style={s.muted}>Il tuo accesso: {ROLE_LABELS[myRole].toLowerCase()}</Text>}
        </View>

        {members.length ? (
          members.map((m) => (
            <View
              key={m.user_id ?? m.email}
              testID={`team-member-${m.email || m.username || m.user_id}`}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary }}
            >
              <Avatar member={m} />
              <View style={{ flex: 1 }}>
                <Text style={s.body} numberOfLines={1}>{nome(m)}</Text>
                <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>
                  {m.username ? `@${m.username} · ` : ""}
                  {m.job || ROLE_LABELS[m.role]}
                  {m.user_id ? "" : " · non ancora iscritto"}
                </Text>
              </View>
              {canManage ? (
                <Pressable testID={`team-role-${m.email || m.username || m.user_id}`} hitSlop={8} onPress={() => setManaging(m)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[s.muted, { color: colors.brandPrimary }]}>{ROLE_LABELS[m.role]}</Text>
                  <Icon name="chevron-down" size={16} color={colors.brandPrimary} />
                </Pressable>
              ) : (
                <Text style={s.muted}>{ROLE_LABELS[m.role]}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={s.muted}>Per ora il progetto è solo tuo. Invita chi ci lavora con te.</Text>
        )}

        {canManage && (
          <>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <Text style={s.label}>Invita una persona</Text>
            <Field
              testID="team-search-input"
              label="Cerca per nome o @nome utente"
              value={query}
              onChangeText={(v) => (setQuery(v), setPicked(null))}
              autoCapitalize="none"
              placeholder="@alessandro"
            />

            {isEmail ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={s.muted}>
                  {term} non è un nome utente: se non ha ancora l'app possiamo invitarla per email. Entrerà nel progetto appena si registra con questo indirizzo.
                </Text>
                <Button testID="team-invite-email" icon="email-plus-outline" label={`Invita ${term}`} loading={save.isPending} onPress={inviteEmail} />
              </View>
            ) : term.length >= 2 ? (
              search.isLoading ? (
                <Text style={s.muted}>Cerco…</Text>
              ) : found.length ? (
                found.map((p) => (
                  <Pressable
                    key={p.user_id}
                    testID={`team-result-${p.username || p.user_id}`}
                    onPress={() => setPicked(p)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      padding: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: picked?.user_id === p.user_id ? colors.brandTertiary : colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: picked?.user_id === p.user_id ? colors.brandPrimary : colors.border,
                    }}
                  >
                    <Avatar member={{ name: p.name, email: p.username }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.body, picked?.user_id === p.user_id && { color: colors.onBrandTertiary }]} numberOfLines={1}>
                        {p.name || `@${p.username}`}
                      </Text>
                      <Text style={[s.muted, { fontSize: 12 }, picked?.user_id === p.user_id && { color: colors.onBrandTertiary }]} numberOfLines={1}>
                        @{p.username}
                      </Text>
                    </View>
                    {picked?.user_id === p.user_id ? <Icon name="check" size={18} color={colors.onBrandTertiary} /> : null}
                  </Pressable>
                ))
              ) : (
                <Text style={s.muted}>Nessuna persona trovata per “{term}”. Se non ha l'app, scrivi la sua email completa per invitarla.</Text>
              )
            ) : null}

            {picked && (
              <View style={{ gap: spacing.sm }}>
                <Text style={s.label}>Cosa può fare {picked.name || `@${picked.username}`}</Text>
                <Segmented testID="team-role" value={role} onChange={setRole} options={ROLES} />
                <Text style={s.muted}>{SPIEGAZIONE[role]}</Text>
                <Field testID="team-job-input" label="Ruolo sul set (facoltativo)" value={job} onChangeText={setJob} placeholder="es. DOP, attrice protagonista, cliente" />
                <Button testID="team-add-button" icon="account-plus-outline" label="Aggiungi al team" loading={save.isPending} onPress={addPerson} />
              </View>
            )}

            <Text style={s.muted}>
              Solo visione: legge tutto. Può modificare: lavora sul progetto. Amministratore: modifica e gestisce il team. Solo il proprietario può eliminare il progetto.
            </Text>
          </>
        )}
      </Card>

      <Sheet visible={!!managing} onClose={() => setManaging(null)} title={managing ? `Accesso di ${nome(managing)}` : ""}>
        {managing && (
          <>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                testID={`team-set-role-${r.value}`}
                onPress={() => changeRole(managing, r.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: managing.role === r.value ? colors.brandTertiary : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: managing.role === r.value ? colors.brandPrimary : colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.body, { fontWeight: "700" }, managing.role === r.value && { color: colors.onBrandTertiary }]}>{r.label}</Text>
                  <Text style={[s.muted, { fontSize: 12 }, managing.role === r.value && { color: colors.onBrandTertiary }]}>{SPIEGAZIONE[r.value]}</Text>
                </View>
                {managing.role === r.value ? <Icon name="check" size={18} color={colors.onBrandTertiary} /> : null}
              </Pressable>
            ))}
            <Button testID="team-remove-button" icon="account-remove-outline" label="Rimuovi dal team" variant="ghost" loading={save.isPending} onPress={() => removeMember(managing)} />
          </>
        )}
      </Sheet>
    </>
  );
}
