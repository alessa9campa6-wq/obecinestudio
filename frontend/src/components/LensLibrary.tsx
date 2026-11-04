import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { LibItem, useLibrary } from "@/src/hooks";
import { ModuleHeader, ModuleScroll } from "@/src/hub";
import { Lens, lensLabel, LENS_PRESETS } from "@/src/lenses";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Empty, Field, Icon, Segmented, Sheet, toast, useStyles } from "@/src/ui";

const EMPTY: Lens = { brand: "", series: "", focal: "", tstop: "", mount: "", squeeze: "1", note: "" };

export default function LensLibrary({ def }: { def: ModuleDef }) {
  const { q, create, update, remove } = useLibrary("lens");
  const { colors } = useTheme();
  const s = useStyles();
  const [tab, setTab] = useState<"kit" | "presets">("kit");
  const [edit, setEdit] = useState<LibItem | "new" | null>(null);
  const [form, setForm] = useState<Lens>(EMPTY);
  const kit = q.data ?? [];

  const openNew = () => (setForm(EMPTY), setEdit("new"));
  const openEdit = (l: LibItem) => (setForm({ ...EMPTY, ...(l.data as Lens) }), setEdit(l));
  const save = () => {
    if (!form.focal) return toast("Inserisci la focale", "error");
    const body = { title: lensLabel(form), data: form };
    const done = { onSuccess: () => (setEdit(null), toast("Ottica salvata")) };
    if (edit === "new") create.mutate([body], done);
    else if (edit) update.mutate({ id: edit.id, ...body }, done);
  };
  const addSet = (p: (typeof LENS_PRESETS)[number], focals: (number | string)[]) =>
    create.mutate(
      focals.map((f) => {
        const l: Lens = { brand: p.brand, series: p.series, focal: String(f), tstop: p.tstop, mount: p.mount, squeeze: String(p.squeeze ?? 1), note: p.format };
        return { title: lensLabel(l), data: l };
      }),
      { onSuccess: () => toast(`${focals.length} ottiche aggiunte al kit`) },
    );

  const grouped: Record<string, LibItem[]> = {};
  kit.forEach((l) => (grouped[`${l.data.brand} ${l.data.series}`.trim() || "Personalizzate"] ??= []).push(l));
  const set = (k: keyof Lens) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader
        def={def}
        subtitle={`${kit.length} ottiche nel tuo kit · disponibili in shotlist, lens calculator e viewfinder`}
        right={
          <>
            <Button testID="lenses-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!kit.length} onPress={() => exportHtml("Kit ottiche", wrap("Kit ottiche", `<table><tr><th>Ottica</th><th>Marca</th><th>T-stop</th><th>Attacco</th><th>Squeeze</th><th>Note</th></tr>${kit.map((l) => `<tr><td>${l.data.focal}mm ${l.data.series}</td><td>${l.data.brand}</td><td>${l.data.tstop}</td><td>${l.data.mount}</td><td>${l.data.squeeze}x</td><td>${l.data.note ?? ""}</td></tr>`).join("")}</table>`))} />
            <Button testID="lens-add-custom" icon="plus" label="Ottica" onPress={openNew} />
          </>
        }
      />
      <ModuleScroll>
        <Segmented testID="lenses-tab" value={tab} onChange={setTab} options={[{ value: "kit", label: "Il mio kit" }, { value: "presets", label: "Catalogo ottiche" }]} />
        {tab === "kit" ? (
          q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : kit.length ? (
            Object.entries(grouped).map(([g, list]) => (
              <Card key={g} style={{ gap: spacing.sm }}>
                <Text style={s.h3}>{g}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {list.map((l) => (
                    <Pressable key={l.id} testID={`kit-lens-${l.id}`} onPress={() => openEdit(l)} style={({ pressed }) => ({ minWidth: 92, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary, opacity: pressed ? 0.7 : 1, gap: 2 })}>
                      <Text style={[s.h3, { fontSize: 16 }]}>{l.data.focal}mm</Text>
                      <Text style={s.muted}>{[l.data.tstop, l.data.mount, l.data.squeeze && l.data.squeeze !== "1" ? `${l.data.squeeze}x` : ""].filter(Boolean).join(" · ")}</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            ))
          ) : (
            <Empty icon="camera-iris" title="Il tuo kit è vuoto" subtitle="Aggiungi un set dal catalogo o inserisci manualmente le tue ottiche." action={<Button testID="lens-empty-presets" label="Apri catalogo" onPress={() => setTab("presets")} />} />
          )
        ) : (
          LENS_PRESETS.map((p) => (
            <Card key={p.brand + p.series} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.h3}>{p.brand} {p.series}</Text>
                  <Text style={s.muted}>{p.tstop} · {p.mount} · {p.format}{p.squeeze ? ` · anamorfico ${p.squeeze}x` : ""}</Text>
                </View>
                <Button testID={`preset-add-${p.series}`} icon="plus" label="Tutto il set" small onPress={() => addSet(p, p.focals)} loading={create.isPending} />
              </View>
              <ChipRow>
                {p.focals.map((f) => (
                  <Chip key={String(f)} testID={`preset-${p.series}-${f}`} icon="plus" label={`${f}mm`} onPress={() => addSet(p, [f])} />
                ))}
              </ChipRow>
            </Card>
          ))
        )}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Icon name="information-outline" size={16} color={colors.muted} />
          <Text style={[s.muted, { flex: 1 }]}>Il kit è personale e condiviso tra tutti i tuoi progetti.</Text>
        </View>
      </ModuleScroll>
      <Sheet
        testID="lens-editor-sheet"
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Nuova ottica" : "Modifica ottica"}
        footer={
          <>
            {edit && edit !== "new" ? <Button testID="lens-delete-button" icon="trash-can-outline" variant="ghost" onPress={() => remove.mutate(edit.id, { onSuccess: () => setEdit(null) })} /> : null}
            <Button testID="lens-save-button" icon="check" label="Salva" onPress={save} loading={create.isPending || update.isPending} />
          </>
        }
      >
        <Field testID="lens-brand-input" label="Marca" value={form.brand} onChangeText={set("brand")} placeholder="es. Cooke" />
        <Field testID="lens-series-input" label="Serie / Modello" value={form.series} onChangeText={set("series")} placeholder="es. S4/i, vintage Helios..." />
        <Field testID="lens-focal-field" label="Focale (mm) — per zoom es. 24-70" value={form.focal} onChangeText={set("focal")} />
        <Field testID="lens-tstop-field" label="Apertura massima" value={form.tstop} onChangeText={set("tstop")} placeholder="T2 / f1.8" />
        <Field testID="lens-mount-field" label="Attacco" value={form.mount} onChangeText={set("mount")} placeholder="PL, EF, E, RF, L, LPL..." />
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>Squeeze anamorfico</Text>
          <ChipRow>
            {["1", "1.33", "1.5", "1.6", "1.8", "2"].map((x) => (
              <Chip key={x} testID={`lens-squeeze-${x}`} label={x === "1" ? "Sferica" : `${x}x`} selected={form.squeeze === x} onPress={() => set("squeeze")(x)} />
            ))}
          </ChipRow>
        </View>
        <Field testID="lens-note-field" label="Note" value={form.note ?? ""} onChangeText={set("note")} multiline minHeight={80} />
      </Sheet>
    </View>
  );
}
