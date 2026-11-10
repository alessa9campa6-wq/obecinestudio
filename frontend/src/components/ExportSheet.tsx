import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { api, Item, Project } from "@/src/api";
import { moduleByKey } from "@/src/modules";
import { exportProject, exportModule } from "@/src/pdf";
import { exportPortfolio, exportRentalSheet } from "@/src/portfolioPdf";
import { Post } from "@/src/social";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, Sheet, toast, useStyles } from "@/src/ui";

// Un solo posto per esportare: prima si sceglie cosa (portfolio, noleggio,
// progetto o una sua sezione), poi cosa ci deve entrare dentro.
export type ExportProfile = {
  nome: string;
  username?: string;
  categoria?: string;
  bio?: string;
  link?: string;
  foto?: string | null;
  email?: string;
  telefono?: string;
};

export type ExportRental = {
  nome?: string;
  citta?: string;
  telefono?: string;
  email?: string;
  sito?: string;
  attrezzatura?: string;
  cover?: string | null;
  copertina?: string | null;
};

type Tipo = "portfolio" | "rental" | "project";

function Riga({
  attivo,
  titolo,
  sotto,
  onPress,
  testID,
}: {
  attivo: boolean;
  titolo: string;
  sotto?: string;
  onPress: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.surfaceTertiary : "transparent",
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
      })}
    >
      <Icon name={attivo ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} size={20} color={attivo ? colors.brandPrimary : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.onSurface, fontSize: 13.5, fontWeight: "600" }} numberOfLines={1}>{titolo}</Text>
        {sotto ? <Text style={{ color: colors.muted, fontSize: 11.5 }} numberOfLines={1}>{sotto}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function ExportSheet({
  visible,
  onClose,
  foto,
  video,
  noleggi,
  rental,
  profilo,
  copertina,
}: {
  visible: boolean;
  onClose: () => void;
  foto: Post[];
  video: Post[];
  noleggi: Post[];
  rental: ExportRental;
  profilo: ExportProfile;
  copertina?: string | null;
}) {
  const { colors } = useTheme();
  const s = useStyles();
  const [tipo, setTipo] = useState<Tipo>("portfolio");
  const [scelteFoto, setScelteFoto] = useState<string[]>([]);
  const [sceltiNoleggi, setSceltiNoleggi] = useState<string[]>([]);
  const [contatti, setContatti] = useState(true);
  const [progettoId, setProgettoId] = useState<string | null>(null);
  const [sezione, setSezione] = useState("__all");
  const [busy, setBusy] = useState(false);

  const progetti = useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects"), enabled: visible });
  const items = useQuery({
    queryKey: ["items", progettoId, "__all"],
    queryFn: () => api<Item[]>(`/projects/${progettoId}/items`),
    enabled: visible && !!progettoId,
  });

  const sceltiProgetto = progetti.data?.find((p) => p.id === progettoId) ?? null;
  const sezioni = useMemo(() => {
    const mappa = new Map<string, number>();
    for (const it of items.data ?? []) mappa.set(it.module, (mappa.get(it.module) ?? 0) + 1);
    return [...mappa.entries()].map(([chiave, n]) => ({ chiave, n, label: moduleByKey(chiave)?.label ?? chiave }));
  }, [items.data]);

  const tutteLeFoto = scelteFoto.length === 0 ? foto.map((f) => f.id) : scelteFoto;
  const tuttiINoleggi = sceltiNoleggi.length === 0 ? noleggi.map((n) => n.id) : sceltiNoleggi;

  const esporta = async () => {
    setBusy(true);
    try {
      if (tipo === "portfolio") {
        await exportPortfolio({ ...profilo, post: foto, scelti: tutteLeFoto, includiContatti: contatti });
      } else if (tipo === "rental") {
        await exportRentalSheet({
          ...rental,
          nome: rental.nome || `Noleggio di ${profilo.nome}`,
          foto: copertina ?? profilo.foto ?? null,
          noleggi,
          scelti: tuttiINoleggi,
          includiContatti: contatti,
          proprietario: [profilo.nome, profilo.username ? `@${profilo.username}` : ""].filter(Boolean).join(" · "),
        });
      } else {
        if (!sceltiProgetto || !items.data) return toast("Scegli un progetto da esportare", "error");
        const lookup = new Map(items.data.map((i) => [i.id, i]));
        if (sezione === "__all") {
          await exportProject(sceltiProgetto, items.data);
        } else {
          const def = moduleByKey(sezione);
          if (!def) return toast("Sezione non disponibile", "error");
          await exportModule(
            sceltiProgetto,
            def,
            items.data.filter((i) => i.module === sezione),
            lookup,
          );
        }
      }
      onClose();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      testID="export-sheet"
      visible={visible}
      onClose={onClose}
      title="Esporta in PDF"
      footer={<Button testID="export-confirm" label="Esporta PDF" icon="file-pdf-box" loading={busy} onPress={() => void esporta()} />}
    >
      <View style={{ gap: spacing.xs }}>
        <Text style={s.label}>Cosa esportare</Text>
        <ChipRow>
          <Chip testID="export-type-portfolio" label={`Portfolio (${foto.length})`} icon="image-multiple-outline" selected={tipo === "portfolio"} onPress={() => setTipo("portfolio")} />
          <Chip testID="export-type-rental" label="Noleggio" icon="video-vintage" selected={tipo === "rental"} onPress={() => setTipo("rental")} />
          <Chip testID="export-type-project" label="Un progetto" icon="movie-open" selected={tipo === "project"} onPress={() => setTipo("project")} />
        </ChipRow>
      </View>

      {tipo === "portfolio" ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={s.muted}>
            Nel portfolio entrano solo le foto. {video.length ? `I ${video.length} video restano nell'app.` : ""}
          </Text>
          {foto.length === 0 ? (
            <Text style={s.muted}>Non hai ancora foto pubblicate: pubblica un lavoro e riprova.</Text>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={[s.label, { flex: 1 }]}>Lavori ({tutteLeFoto.length})</Text>
                <Pressable testID="export-select-all" onPress={() => setScelteFoto([])} hitSlop={6}>
                  <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: "700" }}>Seleziona tutti</Text>
                </Pressable>
                <Pressable testID="export-select-none" onPress={() => setScelteFoto(["-"])} hitSlop={6}>
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>Nessuno</Text>
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 260 }}>
                {foto.map((f) => (
                  <Riga
                    key={f.id}
                    testID={`export-foto-${f.id}`}
                    attivo={tutteLeFoto.includes(f.id)}
                    titolo={f.text.split("\n")[0].slice(0, 60) || "Lavoro"}
                    sotto={`${f.media.length} ${f.media.length === 1 ? "foto" : "foto"}`}
                    onPress={() => setScelteFoto((attuali) => {
                      const base = attuali.length === 0 ? foto.map((x) => x.id) : attuali;
                      return base.includes(f.id) ? base.filter((x) => x !== f.id) : [...base, f.id];
                    })}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      ) : null}

      {tipo === "rental" ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={s.muted}>La vetrina con copertina, prezzo, contatti e i noleggi scelti.</Text>
          {noleggi.length === 0 ? (
            <Text style={s.muted}>Non hai noleggi pubblicati: pubblicane uno e riprova.</Text>
          ) : (
            <>
              <Text style={s.label}>Noleggi ({tuttiINoleggi.length})</Text>
              {noleggi.map((n) => (
                <Riga
                  key={n.id}
                  testID={`export-noleggio-${n.id}`}
                  attivo={tuttiINoleggi.includes(n.id)}
                  titolo={n.text.split("\n")[0].slice(0, 60) || "Noleggio"}
                  sotto={[n.price, n.place].filter(Boolean).join(" · ")}
                  onPress={() => setSceltiNoleggi((attuali) => {
                    const base = attuali.length === 0 ? noleggi.map((x) => x.id) : attuali;
                    return base.includes(n.id) ? base.filter((x) => x !== n.id) : [...base, n.id];
                  })}
                />
              ))}
            </>
          )}
        </View>
      ) : null}

      {tipo === "project" ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={s.label}>Progetto</Text>
          {progetti.isLoading ? (
            <Text style={s.muted}>Carico i progetti…</Text>
          ) : (progetti.data ?? []).length === 0 ? (
            <Text style={s.muted}>Non hai ancora progetti.</Text>
          ) : (
            <ChipRow>
              {(progetti.data ?? []).map((p) => (
                <Chip key={p.id} testID={`export-project-${p.id}`} label={p.title} selected={progettoId === p.id} onPress={() => { setProgettoId(p.id); setSezione("__all"); }} />
              ))}
            </ChipRow>
          )}

          {progettoId ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Sezione</Text>
              {items.isLoading ? (
                <Text style={s.muted}>Carico le sezioni…</Text>
              ) : (
                <ChipRow>
                  <Chip testID="export-section-all" label={`Tutto (${items.data?.length ?? 0})`} selected={sezione === "__all"} onPress={() => setSezione("__all")} />
                  {sezioni.map((x) => (
                    <Chip key={x.chiave} testID={`export-section-${x.chiave}`} label={`${x.label} (${x.n})`} selected={sezione === x.chiave} onPress={() => setSezione(x.chiave)} />
                  ))}
                </ChipRow>
              )}
              <Text style={s.muted}>Con “Tutto” il PDF contiene il progetto completo, con le sue sezioni in ordine.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {tipo !== "project" ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Dettagli</Text>
          <Chip testID="export-contatti" label="Includi contatti e link" icon={contatti ? "check" : "close"} selected={contatti} onPress={() => setContatti((c) => !c)} />
          <Text style={s.muted}>Senza contatti il PDF resta pulito, per far vedere solo il lavoro.</Text>
        </View>
      ) : null}
    </Sheet>
  );
}
