import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { ROLE_LABELS, useHub } from "@/src/hub";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Field, Icon, Segmented, toast, useStyles } from "@/src/ui";

type Member = { email: string; role: "admin" | "editor" | "viewer"; job?: string };
const ROLES = [
  { value: "viewer" as const, label: "Solo visione" },
  { value: "editor" as const, label: "Può modificare" },
  { value: "admin" as const, label: "Amministratore" },
];
const NEXT: Record<Member["role"], Member["role"]> = { viewer: "editor", editor: "admin", admin: "viewer" };

// Project team: owner and admins invite collaborators by email and pick their access level.
export default function TeamCard() {
  const { project, canManage } = useHub();
  const { user } = useAuth();
  const qc = useQueryClient();
  const s = useStyles();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [job, setJob] = useState("");
  const [role, setRole] = useState<Member["role"]>("editor");
  const members = (project.members ?? []) as Member[];
  const isOwner = project.owner_id === user?.user_id;
  const myRole = project.my_role ?? "owner";

  const save = useMutation({
    mutationFn: (list: Member[]) => api(`/projects/${project.id}/members`, { method: "PUT", body: { members: list } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      toast("Team aggiornato");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });

  const add = () => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return toast("Inserisci un'email valida", "error");
    save.mutate([...members.filter((m) => m.email !== e), { email: e, role, job: job.trim() }]);
    setEmail("");
    setJob("");
  };

  return (
    <Card testID="team-card" style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Icon name="account-multiple-outline" color={colors.brandPrimary} />
        <Text style={[s.h3, { flex: 1 }]}>Team del progetto</Text>
        {!isOwner && <Text testID="team-my-role" style={s.muted}>Il tuo accesso: {ROLE_LABELS[myRole].toLowerCase()}</Text>}
      </View>
      <Text style={s.muted}>Solo visione: legge tutto. Può modificare: crea e modifica i contenuti. Amministratore: modifica e gestisce il team. Solo il proprietario può eliminare il progetto.</Text>
      {members.map((m) => (
        <View key={m.email} testID={`team-member-${m.email}`} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary }}>
          <View style={{ flex: 1 }}>
            <Text style={s.body} numberOfLines={1}>{m.email}</Text>
            {m.job ? <Text style={[s.muted, { fontSize: 12 }]} numberOfLines={1}>{m.job}</Text> : null}
          </View>
          {canManage ? (
            <Pressable testID={`team-role-${m.email}`} hitSlop={8} onPress={() => save.mutate(members.map((x) => (x.email === m.email ? { ...x, role: NEXT[x.role] ?? "viewer" } : x)))}>
              <Text style={[s.muted, { color: colors.brandPrimary }]}>{ROLE_LABELS[m.role]} ⇄</Text>
            </Pressable>
          ) : (
            <Text style={s.muted}>{ROLE_LABELS[m.role]}</Text>
          )}
          {canManage && (
            <Pressable testID={`team-remove-${m.email}`} hitSlop={8} onPress={() => save.mutate(members.filter((x) => x.email !== m.email))}>
              <Icon name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      ))}
      {canManage && (
        <>
          <Field testID="team-email-input" label="Invita per email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="collaboratore@email.com" />
          <Field testID="team-job-input" label="Ruolo sul set (facoltativo)" value={job} onChangeText={setJob} placeholder="es. DOP, attrice protagonista, cliente" />
          <Segmented testID="team-role" value={role} onChange={setRole} options={ROLES} />
          <Button testID="team-add-button" icon="account-plus-outline" label="Aggiungi al team" loading={save.isPending} onPress={add} />
        </>
      )}
    </Card>
  );
}
