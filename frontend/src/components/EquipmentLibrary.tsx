import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";

import { BRANDS, Camera, CAMERAS, cameraId, cameraSpecs } from "@/src/cameras";
import { useItemMutations, useItems, useLibrary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll, useHub } from "@/src/hub";
import { Lens, lensLabel, LENS_PRESETS } from "@/src/lenses";
import { ModuleDef } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Field, Icon, Segmented, Sheet, toast, useStyles } from "@/src/ui";

// La mia attrezzatura: quello che possiedo (kit personale, condiviso tra i
// progetti) più i cataloghi di camere e ottiche per riempirlo in un tocco.
export const TIPI = ["Camera", "Ottiche", "Luci", "Grip", "Audio", "Monitor", "Media", "Altro"];
const VUOTO = { tipo: "Camera", marca: "", modello: "", attacco: "", quantita: "", note: "" };
type Gear = typeof VUOTO;

type Tab = "kit" | "camere" | "ottiche";

export default function EquipmentLibrary({ def }: { def: ModuleDef }) {
  const { project, canEdit } = useHub();
  const gear = useLibrary("gear");
  const lenti = useLibrary("lens");
  const progetto = useItemMutations(project.id, "attrezzatura");
  const nelProgetto = useItems(project.id, "attrezzatura");
  const { colors } = useTheme();
  const s = useStyles();
  const { width } = useWindowDimensions();
  const colle = width >= 820;

  const [tab, setTab] = useState<Tab>("kit");
  const [brand, setBrand] = useState("Sony");
  const [modifica, setModifica] = useState<{ id: string } | "nuovo" | null>(null);
  const [form, setForm] = useState<Gear>(VUOTO);

  const kit = gear.q.data ?? [];
  const perTipo = useMemo(() => {
    const m = new Map<string, typeof kit>();
    kit.forEach((g) => {
      const tipo = String(g.data.tipo ?? "Altro");
      m.set(tipo, [...(m.get(tipo) ?? []), g]);
    });
    return [...m.entries()].sort((a, b) => TIPI.indexOf(a[0]) - TIPI.indexOf(b[0]));
  }, [kit]);

  const apri = (g?: (typeof kit)[number]) => {
    if (g) {
      setForm({ ...VUOTO, ...(g.data as Gear) });
      setModifica({ id: g.id });
    } else {
      setForm(VUOTO);
      setModifica("nuovo");
    }
  };

  const salva = () => {
    if (!form.marca && !form.modello) return toast("Scrivi almeno marca o modello", "error");
    const title = [form.marca, form.modello].filter(Boolean).join(" ");
    const body = { title, data: { ...form } };
    const fine = { onSuccess: () => (setModifica(null), toast("Attrezzatura salvata")) };
    if (modifica === "nuovo") gear.create.mutate([body], fine);
    else if (modifica) gear.update.mutate({ id: modifica.id, ...body }, fine);
  };

  const aggiungiAlKit = (c: Camera) => {
    const body = {
      title: `${c.brand} ${c.name}`,
      data: {
        tipo: "Camera",
        marca: c.brand,
        modello: c.name,
        attacco: c.mount ?? "",
        note: [c.format, c.res, c.raw && c.raw !== "—" ? c.raw : ""].filter(Boolean).join(" · "),
      },
    };
    gear.create.mutate([body], { onSuccess: () => toast(`${c.name} nel tuo kit`) });
  };

  const aggiungiAlProgetto = (titolo: string, categoria: string, note: string) => {
    progetto.create.mutate(
      { title: titolo, data: { categoria, note: [note, "Dalla mia attrezzatura"].filter(Boolean).join(" · ") } },
      { onSuccess: () => toast(`${titolo} aggiunto all'attrezzatura del progetto`) },
    );
  };

  const setOttiche = (p: (typeof LENS_PRESETS)[number], focali: (number | string)[]) =>
    lenti.create.mutate(
      focali.map((f) => {
        const l: Lens = { brand: p.brand, series: p.series, focal: String(f), tstop: p.tstop, mount: p.mount, squeeze: String(p.squeeze ?? 1), note: p.format };
        return { title: lensLabel(l), data: l };
      }),
      { onSuccess: () => toast(`${focali.length} ottiche aggiunte al kit`) },
    );

  const kitOttiche = lenti.q.data ?? [];
  const perSet = useMemo(() => {
    const m = new Map<string, typeof kitOttiche>();
    kitOttiche.forEach((l) => {
      const k = `${l.data.brand ?? ""} ${l.data.series ?? ""}`.trim() || "Personalizzate";
      m.set(k, [...(m.get(k) ?? []), l]);
    });
    return [...m.entries()];
  }, [kitOttiche]);

  const gruppiCamere = CAMERAS.filter((c) => (brand === "Formato" ? c.brand === "Formato" : c.brand === brand));
  const statoTotale = kit.length + kitOttiche.length;

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${statoTotale} elementi nel tuo kit · ${nelProgetto.data?.length ?? 0} nel progetto`}
        right={<Button testID="gear-add-button" icon="plus" label={width > 500 ? "Aggiungi" : undefined} onPress={() => apri()} />}
      />
      <ModuleScroll>
        <Segmented
          testID="gear-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: "kit", label: "Il mio kit" },
            { value: "camere", label: "Catalogo camere" },
            { value: "ottiche", label: "Catalogo ottiche" },
          ]}
        />

        {tab === "kit" ? (
          gear.q.isLoading || lenti.q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : perTipo.length || kitOttiche.length ? (
            <>
              {perTipo.map(([tipo, lista]) => (
                <Card key={tipo} style={{ gap: spacing.sm }}>
                  <Text style={s.h3}>{tipo}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                    {lista.map((g) => (
                      <Pressable
                        key={g.id}
                        testID={`gear-item-${g.id}`}
                        onPress={() => apri(g)}
                        style={({ pressed }) => ({
                          minWidth: colle ? 200 : "100%",
                          padding: spacing.md,
                          borderRadius: radius.md,
                          backgroundColor: colors.surfaceTertiary,
                          borderWidth: 1,
                          borderColor: colors.border,
                          opacity: pressed ? 0.75 : 1,
                          gap: 4,
                        })}
                      >
                        <Text style={[s.h3, { fontSize: 16 }]} numberOfLines={1}>{g.title}</Text>
                        <Text style={s.muted} numberOfLines={1}>
                          {[g.data.attacco, g.data.quantita ? `${g.data.quantita} pz` : "", g.data.note].filter(Boolean).join(" · ") || "Nessun dettaglio"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Card>
              ))}

              {kitOttiche.length ? (
                <Card style={{ gap: spacing.sm }}>
                  <Text style={s.h3}>Ottiche</Text>
                  {perSet.map(([set, lista]) => (
                    <View key={set} style={{ gap: 2 }}>
                      <Text style={s.muted}>{set}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                        {lista.map((l) => (
                          <View key={l.id} style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
                            <Text style={[s.body, { fontSize: 13 }]}>{l.data.focal}mm</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                  <Text style={s.muted}>Le ottiche si modificano dal catalogo ottiche.</Text>
                </Card>
              ) : null}
            </>
          ) : (
            <Empty
              icon="camera-outline"
              title="Il tuo kit è vuoto"
              subtitle="Aggiungi una camera o un set di ottiche dal catalogo, oppure inserisci a mano quello che hai."
              action={<Button testID="gear-empty-catalog" label="Apri catalogo camere" onPress={() => setTab("camere")} />}
            />
          )
        ) : null}

        {tab === "camere" ? (
          <>
            <ChipRow>
              {BRANDS.map((b) => (
                <Chip key={b} testID={`gear-brand-${b}`} label={b} selected={brand === b} onPress={() => setBrand(b)} />
              ))}
            </ChipRow>
            <View style={colle ? { flexDirection: "row", flexWrap: "wrap", gap: spacing.md } : { gap: spacing.md }}>
              {gruppiCamere.map((c) => (
                <Card key={cameraId(c)} testID={`gear-camera-${c.name}`} style={{ gap: spacing.sm, ...(colle ? { width: (width - spacing.xl * 4) / 2 } : null) }}>
                  <View style={{ gap: 2 }}>
                    <Text style={s.h3}>{c.name}</Text>
                    <Text style={s.muted}>{c.brand}</Text>
                  </View>
                  <View style={{ gap: 3 }}>
                    {cameraSpecs(c).map((x) => (
                      <View key={x.label} style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                        <Text style={[s.muted, { flex: 1 }]}>{x.label}</Text>
                        <Text style={[s.body, { fontSize: 13, flex: 1, textAlign: "right" }]} numberOfLines={1}>{x.value}</Text>
                      </View>
                    ))}
                  </View>
                  {c.note ? <Text style={s.muted}>{c.note}</Text> : null}
                  <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                    <Button testID={`gear-addkit-${c.name}`} icon="plus" label="Al mio kit" variant="secondary" small onPress={() => aggiungiAlKit(c)} />
                    {canEdit ? (
                      <Button
                        testID={`gear-addproject-${c.name}`}
                        icon="folder-plus-outline"
                        label="Al progetto"
                        variant="secondary"
                        small
                        onPress={() => aggiungiAlProgetto(`${c.brand} ${c.name}`, "Camera", cameraSpecs(c).map((x) => `${x.label}: ${x.value}`).join(" · "))}
                      />
                    ) : null}
                  </View>
                </Card>
              ))}
            </View>
            {!gruppiCamere.length ? <Empty icon="camera-outline" title="Nessuna camera per questa marca" /> : null}
          </>
        ) : null}

        {tab === "ottiche" ? (
          <>
            {kitOttiche.length ? (
              <Card style={{ gap: spacing.sm }}>
                <Text style={s.h3}>Nel mio kit</Text>
                {perSet.map(([set, lista]) => (
                  <View key={set} style={{ gap: 2 }}>
                    <Text style={s.muted}>{set}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                      {lista.map((l) => (
                        <View key={l.id} style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary }}>
                          <Text style={[s.body, { fontSize: 13 }]}>{l.data.focal}mm</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </Card>
            ) : null}
            {LENS_PRESETS.map((p) => (
              <Card key={p.brand + p.series} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.h3}>{p.brand} {p.series}</Text>
                    <Text style={s.muted}>
                      {p.tstop} · {p.mount} · {p.format}
                      {p.squeeze ? ` · anamorfico ${p.squeeze}x` : ""}
                    </Text>
                  </View>
                  <Button testID={`gear-set-${p.series}`} icon="plus" label="Set" small onPress={() => setOttiche(p, p.focals)} loading={lenti.create.isPending} />
                </View>
                <ChipRow>
                  {p.focals.map((f) => (
                    <Chip key={String(f)} testID={`gear-focal-${p.series}-${f}`} icon="plus" label={`${f}mm`} onPress={() => setOttiche(p, [f])} />
                  ))}
                </ChipRow>
                {canEdit ? (
                  <Button
                    testID={`gear-oftic-project-${p.series}`}
                    icon="folder-plus-outline"
                    label="Al progetto"
                    variant="secondary"
                    small
                    onPress={() => aggiungiAlProgetto(`${p.brand} ${p.series}`, "Ottiche", `${p.tstop} · ${p.mount} · focali ${p.focals.join(", ")}`)}
                  />
                ) : null}
              </Card>
            ))}
          </>
        ) : null}

        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Icon name="information-outline" size={16} color={colors.muted} />
          <Text style={[s.muted, { flex: 1 }]}>Il kit è personale e condiviso tra tutti i tuoi progetti. I cataloghi sono indicativi: puoi correggere tutto a mano.</Text>
        </View>
      </ModuleScroll>

      <Sheet
        testID="gear-editor-sheet"
        visible={!!modifica}
        onClose={() => setModifica(null)}
        title={modifica === "nuovo" ? "Nuovo elemento" : "Modifica elemento"}
        footer={
          <>
            {modifica && modifica !== "nuovo" ? (
              <Button testID="gear-delete-button" icon="trash-can-outline" variant="ghost" onPress={() => gear.remove.mutate(modifica.id, { onSuccess: () => setModifica(null) })} />
            ) : null}
            {canEdit ? (
              <Button
                testID="gear-editor-project"
                icon="folder-plus-outline"
                label="Al progetto"
                variant="secondary"
                onPress={() =>
                  aggiungiAlProgetto(
                    [form.marca, form.modello].filter(Boolean).join(" ") || "Attrezzatura",
                    form.tipo === "Ottiche" ? "Ottiche" : form.tipo,
                    [form.attacco, form.note].filter(Boolean).join(" · "),
                  )
                }
              />
            ) : null}
            <Button testID="gear-save-button" icon="check" label="Salva" onPress={salva} loading={gear.create.isPending || gear.update.isPending} />
          </>
        }
      >
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Tipo</Text>
          <ChipRow>
            {TIPI.map((t) => (
              <Chip key={t} testID={`gear-tipo-${t}`} label={t} selected={form.tipo === t} onPress={() => setForm((f) => ({ ...f, tipo: t }))} />
            ))}
          </ChipRow>
        </View>
        <Field testID="gear-marca-field" label="Marca" value={form.marca} onChangeText={(t) => setForm((f) => ({ ...f, marca: t }))} placeholder="es. Sony" />
        <Field testID="gear-modello-field" label="Modello" value={form.modello} onChangeText={(t) => setForm((f) => ({ ...f, modello: t }))} placeholder="es. FX6" />
        <Field testID="gear-attacco-field" label="Attacco / compatibilità" value={form.attacco} onChangeText={(t) => setForm((f) => ({ ...f, attacco: t }))} placeholder="es. E, PL, EF" />
        <Field testID="gear-quantita-field" label="Quantità" value={form.quantita} onChangeText={(t) => setForm((f) => ({ ...f, quantita: t }))} placeholder="1" keyboardType="number-pad" />
        <Field testID="gear-note-field" label="Note (seriale, stato, accessori...)" value={form.note} onChangeText={(t) => setForm((f) => ({ ...f, note: t }))} multiline minHeight={80} />
      </Sheet>
    </View>
  );
}
