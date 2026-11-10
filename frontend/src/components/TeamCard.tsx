import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { api, Person } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PersonData, Avatar } from "@/src/components/PeopleLibrary";
import { useItemMutations, useItems, useLibrary } from "@/src/hooks";
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

// Una sola scheda per le persone del progetto: chi ha accesso all'app (Team),
// chi lavora sul set (Troupe) e chi è davanti alla camera (Cast). Si pescano
// dalla rubrica, così non si riscrivono i contatti ogni volta.
export default function TeamCard() {
  const { project, canEdit, canManage, go } = useHub();
  const { user } = useAuth();
  const qc = useQueryClient();
  const s = useStyles();
  const { colors } = useTheme();
  const rubrica = useLibrary("crew");
  const crew = useItems(project.id, "crew");
  const cast = useItems(project.id, "cast");
  const crewM = useItemMutations(project.id, "crew");

  const [aperto, setAperto] = useState(false);
  const [modo, setModo] = useState<"rubrica" | "invita">("rubrica");
  const [cerca, setCerca] = useState("");
  const [scelta, setScelta] = useState<{ nome: string; data: PersonData } | null>(null);
  const [ruoloSet, setRuoloSet] = useState("");
  const [accesso, setAccesso] = useState(false);
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
      toast("Persone aggiornate");
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

  // ---- una sola lista: team + troupe + cast, con le etichette ---------------
  type Riga = { key: string; titolo: string; sotto: string; tags: string[]; member?: Member; modulo?: string; id?: string };
  const righe = useMemo(() => {
    const out: Riga[] = [];
    members.forEach((m) =>
      out.push({
        key: `m-${m.user_id ?? m.email}`,
        titolo: nome(m),
        sotto: [m.username ? `@${m.username}` : "", m.job || ROLE_LABELS[m.role], m.user_id ? "" : "non ha ancora l'app"].filter(Boolean).join(" · "),
        tags: ["Team"],
        member: m,
      }),
    );
    (crew.data ?? []).forEach((i) => {
      const d = i.data ?? {};
      out.push({
        key: `c-${i.id}`,
        titolo: i.title,
        sotto: [d.ruolo, d.reparto, d.telefono].filter(Boolean).join(" · ") || "Nessun ruolo indicato",
        tags: ["Troupe"],
        modulo: "crew",
        id: i.id,
      });
    });
    (cast.data ?? []).forEach((i) => {
      const d = i.data ?? {};
      out.push({
        key: `k-${i.id}`,
        titolo: i.title,
        sotto: [d.personaggio ? `nel ruolo di ${d.personaggio}` : "", d.telefono].filter(Boolean).join(" · ") || "Cast",
        tags: ["Cast"],
        modulo: "cast",
        id: i.id,
      });
    });
    return out.sort((a, b) => a.titolo.localeCompare(b.titolo, "it"));
  }, [members, crew.data, cast.data]);

  const apri = (r: Riga) => {
    if (r.member) setManaging(r.member);
    else if (r.modulo && r.id) go(r.modulo, r.id);
  };

  // ---- dalla rubrica: aggiunge alla troupe e, se serve, dà l'accesso -------
  const personeRubrica = (rubrica.q.data ?? [])
    .filter((p) => !(crew.data ?? []).some((i) => i.title.trim().toLowerCase() === p.title.trim().toLowerCase()))
    .filter((p) => {
      const d = p.data as PersonData;
      const t = cerca.trim().toLowerCase();
      if (!t) return true;
      return [p.title, d.ruolo, d.reparto, d.username].filter(Boolean).some((x) => String(x).toLowerCase().includes(t));
    })
    .sort((a, b) => a.title.localeCompare(b.title, "it"));

  const aggiungiDallaRubrica = () => {
    if (!scelta) return;
    const d = scelta.data;
    crewM.create.mutate(
      {
        title: scelta.nome,
        data: { ruolo: ruoloSet || d.ruolo || "", reparto: d.reparto ?? "", telefono: d.telefono ?? "", email: d.email ?? "", username: d.username ?? "", note: d.note ?? "" },
      },
      {
        onSuccess: () => {
          const contatto = d.username ? { username: d.username, email: "" } : d.email ? { email: d.email } : null;
          if (accesso && contatto) {
            save.mutate([
              ...members,
              { username: contatto.username, email: contatto.email, name: scelta.nome, role: "editor" as Role, job: ruoloSet || d.ruolo || "" },
            ]);
          }
          toast(`${scelta.nome} aggiunto${accesso && contatto ? " con accesso" : " alla troupe"}`);
          setAperto(false);
          setScelta(null);
          setCerca("");
          setRuoloSet("");
          setAccesso(false);
        },
        onError: (e: Error) => toast(e.message, "error"),
      },
    );
  };

  const tag = (t: string) => {
    const colore = t === "Team" ? colors.brandPrimary : t === "Cast" ? colors.warning ?? colors.brandPrimary : colors.muted;
    return (
      <View key={t} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colore }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: colore }}>{t}</Text>
      </View>
    );
  };

  return (
    <>
      <Card testID="team-card" style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Icon name="account-multiple-outline" color={colors.brandPrimary} />
          <Text style={[s.h3, { flex: 1 }]}>Persone del progetto</Text>
          {!isOwner && <Text testID="team-my-role" style={s.muted}>Il tuo accesso: {ROLE_LABELS[myRole].toLowerCase()}</Text>}
        </View>

        {righe.length ? (
          righe.map((r) => (
            <Pressable
              key={r.key}
              testID={`project-person-${r.key}`}
              onPress={() => apri(r)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceTertiary,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Avatar nome={r.titolo} size={34} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>{r.titolo}</Text>
                  {r.tags.map(tag)}
                </View>
                <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{r.sotto}</Text>
              </View>
              <Icon name={r.member ? "shield-account-outline" : "chevron-right"} size={16} color={colors.muted} />
            </Pressable>
          ))
        ) : (
          <Text style={s.muted}>Per ora il progetto è solo tuo. Aggiungi chi ci lavora: dalla rubrica o cercandolo per @nome.</Text>
        )}

        {(canManage || canEdit) && (
          <Button
            testID="project-people-add"
            icon="account-plus-outline"
            label="Aggiungi persona"
            variant="secondary"
            onPress={() => {
              setAperto(true);
              setModo("rubrica");
              setScelta(null);
            }}
          />
        )}

        <Text style={s.muted}>
          {"Team = può entrare nell'app. Troupe e Cast = lavorano sul progetto. Tocca una persona per cambiare ruolo o accesso."}
        </Text>
      </Card>

      <Sheet
        testID="project-people-sheet"
        visible={aperto}
        onClose={() => setAperto(false)}
        title="Aggiungi persona"
        footer={
          scelta ? (
            <Button testID="project-people-confirm" icon="check" label="Aggiungi" loading={crewM.create.isPending || save.isPending} onPress={aggiungiDallaRubrica} />
          ) : undefined
        }
      >
        <Segmented
          testID="project-people-tab"
          value={modo}
          onChange={setModo}
          options={[
            { value: "rubrica", label: "Dalla rubrica" },
            { value: "invita", label: "Cerca persona" },
          ]}
        />

        {modo === "rubrica" ? (
          scelta ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Avatar nome={scelta.nome} />
                <View style={{ flex: 1 }}>
                  <Text style={s.h3} numberOfLines={1}>{scelta.nome}</Text>
                  <Text style={s.muted} numberOfLines={1}>{[scelta.data.ruolo, scelta.data.reparto].filter(Boolean).join(" · ") || "Dalla tua rubrica"}</Text>
                </View>
                <Button testID="project-people-change" icon="close" variant="ghost" onPress={() => setScelta(null)} />
              </View>
              <Field testID="project-people-role" label="Ruolo in questo progetto" value={ruoloSet} onChangeText={setRuoloSet} placeholder={scelta.data.ruolo || "es. Operatore, DOP, fonico"} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.body}>{"Puo entrare nell'app"}</Text>
                  <Text style={s.muted}>
                    {scelta.data.username ? `Accesso con @${scelta.data.username}` : scelta.data.email ? `Invito a ${scelta.data.email}` : "Aggiungi un @nome utente o un'email in rubrica per dargli l'accesso"}
                  </Text>
                </View>
                <Switch
                  testID="project-people-access"
                  value={accesso && !!(scelta.data.username || scelta.data.email)}
                  disabled={!scelta.data.username && !scelta.data.email}
                  onValueChange={setAccesso}
                  trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
                />
              </View>
            </>
          ) : (
            <>
              <Field testID="project-people-search" label="Cerca nella rubrica" value={cerca} onChangeText={setCerca} placeholder="Nome o ruolo" />
              {personeRubrica.length ? (
                personeRubrica.map((p) => {
                  const d = p.data as PersonData;
                  return (
                    <Pressable
                      key={p.id}
                      testID={`project-people-pick-${p.id}`}
                      onPress={() => {
                        setScelta({ nome: p.title, data: d });
                        setRuoloSet(d.ruolo ?? "");
                        setAccesso(false);
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}
                    >
                      <Avatar nome={p.title} size={32} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.body} numberOfLines={1}>{p.title}</Text>
                        <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{[d.ruolo, d.reparto].filter(Boolean).join(" · ") || "Nessun ruolo"}</Text>
                      </View>
                      <Icon name="plus" size={18} color={colors.brandPrimary} />
                    </Pressable>
                  );
                })
              ) : (
                <Text style={s.muted}>
                  {(rubrica.q.data ?? []).length ? "Sono già tutti nel progetto." : "La rubrica è vuota: aggiungi le persone in Strumenti → Persone, oppure cercale qui accanto per @nome utente."}
                </Text>
              )}
            </>
          )
        ) : (
          <>
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
                  {`${term} non è un nome utente: se non ha ancora l'app possiamo invitarla per email. Entrerà nel progetto appena si registra con questo indirizzo.`}
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
                    <Avatar nome={p.name || p.username} size={32} />
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
                <Text style={s.muted}>{`Nessuna persona trovata per “${term}”. Se non ha l'app, scrivi la sua email completa per invitarla.`}</Text>
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
      </Sheet>

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
