import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { api } from "@/src/api";
import { ImageField, RemoteImage } from "@/src/components/Images";
import TeamCard from "@/src/components/TeamCard";
import { useSummary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub, useVisibility } from "@/src/hub";
import { COUNT_KEY, ModuleDef, MODULES, PHASES, PROJECT_TYPES } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, Glass, Icon, IconName, Sheet, toast, useStyles } from "@/src/ui";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const dataBreve = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
};
const plurale = (n: number, uno: string, molti: string) => (n === 1 ? uno : molti);

// Numero grande con etichetta: il colpo d'occhio in cima alla panoramica.
function Stat({ icon, value, label, acceso }: { icon: IconName; value: string; label: string; acceso?: boolean }) {
  const { colors } = useTheme();
  return (
    <Glass
      style={{ flex: 1, minWidth: 104, borderRadius: 20, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: acceso ? "rgba(212,175,55,0.45)" : colors.divider }}
      tint={acceso ? colors.brandTertiary : undefined}
    >
      <Icon name={icon} size={16} color={acceso ? colors.brandPrimary : colors.muted} />
      <Text style={{ fontFamily: fonts.display, fontSize: 23, lineHeight: 27, color: acceso ? colors.brandPrimary : colors.onSurface }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{ fontFamily: fonts.text, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700", color: colors.muted }} numberOfLines={1}>
        {label}
      </Text>
    </Glass>
  );
}

function Barra({ valore, alta }: { valore: number; alta?: boolean }) {
  const { colors } = useTheme();
  const h = alta ? 7 : 5;
  return (
    <View style={{ height: h, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" }}>
      <LinearGradient
        colors={[colors.brandSecondary, colors.brandPrimary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: h, width: `${Math.max(3, Math.min(100, valore * 100))}%`, borderRadius: radius.pill }}
      />
    </View>
  );
}

export default function Overview() {
  const { project, go, canEdit } = useHub();
  const vis = useVisibility();
  const summary = useSummary(project.id);
  const qc = useQueryClient();
  const router = useRouter();
  const s = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const dueColonne = width >= 1000;

  const [form, setForm] = useState(project);
  const [copertina, setCopertina] = useState(false);
  const [conferma, setConferma] = useState(false);
  useEffect(() => setForm(project), [project]);

  const salva = useMutation({
    mutationFn: (body: typeof form) => api(`/projects/${project.id}`, { method: "PUT", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast("Progetto aggiornato");
    },
    onError: (e: Error) => toast(e.message, "error"),
  });
  const elimina = useMutation({
    mutationFn: () => api(`/projects/${project.id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    },
  });

  const modifica = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const copertura = project.cover_path ?? form.cover_path ?? null;
  const fase = PHASES.find((p) => p.key === form.status)?.label ?? "Sviluppo";
  const modificato = (["title", "type", "logline", "genre", "director", "client", "status"] as const).some((k) => (form as any)[k] !== (project as any)[k]);

  // Come sta andando il progetto, fase per fase.
  const fasi = useMemo(
    () =>
      PHASES.filter((p) => p.key !== "tools").map((ph) => {
        const mods = MODULES.filter((m) => m.phase === ph.key && m.kind !== "overview" && vis.module(m));
        const pieni = mods.filter((m) => (summary.data?.[COUNT_KEY(m.key)] ?? 0) > 0).length;
        return { ...ph, mods, pieni };
      }),
    [summary.data, vis],
  );
  const totaleModuli = fasi.reduce((n, f) => n + f.mods.length, 0);
  const moduliPieni = fasi.reduce((n, f) => n + f.pieni, 0);
  const percento = totaleModuli ? Math.round((moduliPieni / totaleModuli) * 100) : 0;
  const voci = Object.values(summary.data ?? {}).reduce((n, v) => n + (typeof v === "number" ? v : 0), 0);

  // Le prime sezioni ancora vuote: meglio proporle che lasciare un elenco muto.
  const daFare = fasi
    .flatMap((f) => f.mods)
    .filter((m) => (summary.data?.[COUNT_KEY(m.key)] ?? 0) === 0)
    .slice(0, 4);

  const salvaCopertina = (p: string | null) => {
    const next = { ...form, cover_path: p };
    setForm(next);
    salva.mutate(next);
    setCopertina(false);
  };

  const pillola = (testo: string, tinta: string, colore: string) => (
    <View style={{ backgroundColor: tinta, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
      <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: colore }} numberOfLines={1}>
        {testo}
      </Text>
    </View>
  );

  const testoCopertina = copertura ? "#FFFFFF" : colors.onSurface;
  const testoTenue = copertura ? "rgba(255,255,255,0.8)" : colors.muted;

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        title="Panoramica"
        subtitle={project.logline || "Il progetto in un colpo d'occhio"}
        right={
          canEdit ? (
            <Button
              testID="save-project-button"
              icon="check"
              label="Salva"
              loading={salva.isPending}
              disabled={!modificato}
              onPress={() => salva.mutate(form)}
            />
          ) : undefined
        }
      />
      <ModuleScroll>
        {/* Copertina: il poster del progetto, con quello che serve per cambiarlo. */}
        <View style={{ borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}>
          <View style={{ height: 208 }}>
            {copertura ? (
              <RemoteImage path={copertura} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
            ) : (
              <>
                <LinearGradient colors={[colors.brandTertiary, colors.surfaceSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
                <View style={{ position: "absolute", right: -16, bottom: -22, opacity: 0.12 }} pointerEvents="none">
                  <Icon name="movie-open-outline" size={170} color={colors.brandPrimary} />
                </View>
              </>
            )}
            {copertura ? <LinearGradient colors={["rgba(8,8,9,0.05)", "rgba(8,8,9,0.55)", "rgba(8,8,9,0.9)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" /> : null}
            <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", textTransform: "uppercase", color: testoTenue }}>Copertina</Text>
                {canEdit ? (
                  <Pressable testID="overview-cover-button" accessibilityLabel="Cambia copertina" onPress={() => setCopertina(true)}>
                    <Glass
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        height: 34,
                        paddingHorizontal: spacing.md,
                        borderRadius: 17,
                        borderWidth: 1,
                        borderColor: copertura ? "rgba(255,255,255,0.32)" : colors.divider,
                      }}
                    >
                      <Icon name={copertura ? "image-edit-outline" : "image-plus"} size={16} color={testoCopertina} />
                      <Text style={{ fontFamily: fonts.text, fontSize: 12, fontWeight: "700", color: testoCopertina }}>{copertura ? "Cambia" : "Aggiungi"}</Text>
                    </Glass>
                  </Pressable>
                ) : null}
              </View>
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                  {pillola(form.type, colors.brandPrimary, colors.onBrandPrimary)}
                  {pillola(fase, copertura ? "rgba(255,255,255,0.22)" : colors.surfaceTertiary, copertura ? "#FFFFFF" : colors.onSurfaceSecondary)}
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 27, lineHeight: 32, fontWeight: "600", color: testoCopertina }} numberOfLines={2}>
                  {form.title || "Senza titolo"}
                </Text>
                <Text style={{ fontFamily: fonts.text, fontSize: 12.5, color: testoTenue }} numberOfLines={1}>
                  {[form.genre, form.director ? `Regia ${form.director}` : "", form.client].filter(Boolean).join(" · ") || `Aggiornato il ${dataBreve(project.updated_at)}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Stat icon="progress-check" value={`${percento}%`} label="Completato" acceso />
          <Stat icon="format-list-checks" value={String(voci)} label={plurale(voci, "voce", "voci")} />
          <Stat icon="account-multiple-outline" value={String(project.members?.length ?? 0)} label="Persone" />
          <Stat icon="calendar-clock-outline" value={dataBreve(project.created_at).replace(/ \d{4}$/, "")} label="Creato" />
        </View>

        <View style={{ flexDirection: dueColonne ? "row" : "column", gap: spacing.lg, alignItems: "flex-start" }}>
          {/* La scheda: i dati che si leggono e si cambiano. */}
          <Card style={{ flex: 1, alignSelf: "stretch", gap: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Icon name="card-text-outline" size={18} color={colors.brandPrimary} />
              <Text style={[s.h3, { flex: 1 }]}>La scheda</Text>
              {modificato ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary }} />
                  <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: colors.brandPrimary, fontWeight: "600" }}>Non salvato</Text>
                </View>
              ) : null}
            </View>

            <Field testID="overview-title-input" label="Titolo" value={form.title} onChangeText={(t) => modifica({ title: t })} />

            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Tipo di progetto</Text>
              <ChipRow>
                {PROJECT_TYPES.map((t) => (
                  <Chip key={t} testID={`overview-type-${t}`} label={t} selected={form.type === t} onPress={() => modifica({ type: t })} />
                ))}
              </ChipRow>
            </View>

            <Field testID="overview-logline-input" label="Logline" value={form.logline} onChangeText={(t) => modifica({ logline: t })} multiline minHeight={84} placeholder="Di cosa parla, in due righe" />

            <View style={{ flexDirection: dueColonne ? "row" : "column", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field testID="overview-genre-input" label="Genere" value={form.genre} onChangeText={(t) => modifica({ genre: t })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field testID="overview-director-input" label="Regia" value={form.director} onChangeText={(t) => modifica({ director: t })} />
              </View>
            </View>

            <Field testID="overview-client-input" label="Cliente / Committente" value={form.client ?? ""} onChangeText={(t) => modifica({ client: t })} />

            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Fase attuale</Text>
              <ChipRow>
                {PHASES.filter((p) => p.key !== "tools").map((p) => (
                  <Chip key={p.key} testID={`overview-status-${p.key}`} label={p.label} selected={form.status === p.key} onPress={() => modifica({ status: p.key })} />
                ))}
              </ChipRow>
            </View>

            {canEdit ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Button testID="save-project-button-bottom" icon="content-save-outline" label="Salva la scheda" loading={salva.isPending} disabled={!modificato} onPress={() => salva.mutate(form)} />
                <Text style={[s.muted, { flex: 1, fontSize: 12 }]}>{modificato ? "Le modifiche non sono ancora salvate." : `Ultimo aggiornamento: ${dataBreve(project.updated_at)}`}</Text>
              </View>
            ) : (
              <Text style={s.muted}>Hai accesso in sola visione: puoi leggere la scheda ma non modificarla.</Text>
            )}
          </Card>

          <View style={{ flex: 1, alignSelf: "stretch", gap: spacing.lg }}>
            {/* Avanzamento: dove siamo, con un tocco per entrare nella sezione. */}
            <Card style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Icon name="chart-donut" size={18} color={colors.brandPrimary} />
                <Text style={[s.h3, { flex: 1 }]}>Avanzamento</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.brandPrimary }}>{percento}%</Text>
              </View>
              <Barra valore={percento / 100} alta />
              <Text style={[s.muted, { fontSize: 12 }]}>
                {moduliPieni} di {totaleModuli} sezioni hanno già qualcosa dentro.
              </Text>

              <View style={{ gap: spacing.md, paddingTop: spacing.xs }}>
                {fasi.map((f) => (
                  <View key={f.key} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <Text style={{ flex: 1, fontFamily: fonts.text, fontSize: 12.5, fontWeight: "700", color: colors.onSurface }}>{f.label}</Text>
                      <Text style={{ fontFamily: fonts.text, fontSize: 11.5, color: f.pieni === f.mods.length && f.mods.length ? colors.brandPrimary : colors.muted }}>
                        {f.pieni}/{f.mods.length}
                      </Text>
                    </View>
                    <Barra valore={f.mods.length ? f.pieni / f.mods.length : 0} />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                      {f.mods.map((m: ModuleDef) => {
                        const n = summary.data?.[COUNT_KEY(m.key)] ?? 0;
                        return (
                          <Pressable
                            key={m.key}
                            testID={`overview-go-${m.key}`}
                            onPress={() => go(m.key)}
                            style={({ pressed }) => ({
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              height: 30,
                              paddingHorizontal: 10,
                              borderRadius: 15,
                              borderWidth: 1,
                              borderColor: n > 0 ? "rgba(212,175,55,0.45)" : colors.divider,
                              backgroundColor: n > 0 ? "rgba(212,175,55,0.12)" : "transparent",
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Icon name={m.icon} size={13} color={n > 0 ? colors.brandPrimary : colors.muted} />
                            <Text style={{ fontFamily: fonts.text, fontSize: 11.5, fontWeight: "600", color: n > 0 ? colors.brandPrimary : colors.onSurfaceSecondary }}>{m.label}</Text>
                            {n > 0 ? <Text style={{ fontFamily: fonts.text, fontSize: 10.5, fontWeight: "800", color: colors.brandPrimary }}>{n}</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Da completare: non un elenco di tutto, solo i prossimi buchi. */}
            <Card style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Icon name="lightbulb-on-outline" size={18} color={colors.brandPrimary} />
                <Text style={s.h3}>{daFare.length ? "Da completare" : "Tutto al suo posto"}</Text>
              </View>
              {daFare.length ? (
                <>
                  <Text style={[s.muted, { fontSize: 12 }]}>Le prime sezioni ancora vuote: un tocco e sei dentro.</Text>
                  {daFare.map((m) => (
                    <Pressable
                      key={m.key}
                      testID={`overview-suggest-${m.key}`}
                      onPress={() => go(m.key)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                        paddingVertical: spacing.sm,
                        borderTopWidth: 1,
                        borderTopColor: colors.divider,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: colors.divider, alignItems: "center", justifyContent: "center" }}>
                        <Icon name={m.icon} size={17} color={colors.onSurfaceTertiary} />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={{ fontFamily: fonts.text, fontSize: 13.5, fontWeight: "600", color: colors.onSurface }} numberOfLines={1}>{m.label}</Text>
                        {m.description ? <Text style={[s.muted, { fontSize: 11.5 }]} numberOfLines={1}>{m.description}</Text> : null}
                      </View>
                      <Icon name="plus-circle-outline" size={19} color={colors.brandPrimary} />
                    </Pressable>
                  ))}
                </>
              ) : (
                <Text style={s.muted}>Ogni sezione ha almeno una voce: il progetto è completo. Buon set.</Text>
              )}
            </Card>
          </View>
        </View>

        <TeamCard />

        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Icon name="alert-outline" size={18} color={colors.error} />
            <Text style={[s.h3, { flex: 1, color: colors.error }]}>Eliminare il progetto</Text>
          </View>
          <Text style={s.muted}>Spariscono la scheda, tutte le sezioni e le persone collegate. Non si torna indietro.</Text>
          {conferma ? (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button testID="delete-project-cancel" label="Lascialo stare" variant="secondary" onPress={() => setConferma(false)} />
              <Button testID="delete-project-confirm" label="Elimina definitivamente" variant="danger" loading={elimina.isPending} onPress={() => elimina.mutate()} />
            </View>
          ) : (
            <Button testID="delete-project-button" label="Elimina progetto" variant="ghost" icon="trash-can-outline" onPress={() => setConferma(true)} />
          )}
        </Card>
      </ModuleScroll>

      <Sheet testID="overview-cover-sheet" visible={copertina} onClose={() => setCopertina(false)} title="Copertina del progetto" footer={<Button label="Fatto" onPress={() => setCopertina(false)} />}>
        <ImageField testID="cover-image-field" value={copertura ?? undefined} onChange={salvaCopertina} />
        <Text style={s.muted}>Questa foto diventa il poster del progetto: la vedi qui, nella home e nel PDF.</Text>
      </Sheet>
    </View>
  );
}
