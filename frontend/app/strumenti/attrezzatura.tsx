import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LibItem, useLibrary } from "@/src/hooks";
import { TIPI } from "@/src/components/EquipmentLibrary";
import { Lens, lensLabel } from "@/src/lenses";
import { fonts, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Empty, Field, Icon, Segmented, Sheet, toast, useStyles } from "@/src/ui";

type Gear = { tipo: string; marca: string; modello: string; attacco: string; quantita: string; note: string };
const GEAR_VUOTO: Gear = { tipo: "Camera", marca: "", modello: "", attacco: "", quantita: "", note: "" };
const LENS_VUOTA: Lens = { brand: "", series: "", focal: "", tstop: "", mount: "", note: "" };

// La mia attrezzatura, fuori dai progetti: il kit personale e le ottiche che possiedi.
export default function Attrezzatura() {
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const gear = useLibrary("gear");
  const lenti = useLibrary("lens");
  const [tab, setTab] = useState<"kit" | "ottiche">("kit");
  const [modifica, setModifica] = useState<LibItem | "nuovo" | null>(null);
  const [form, setForm] = useState<Gear>(GEAR_VUOTO);
  const [lens, setLens] = useState<Lens>(LENS_VUOTA);

  const kit = gear.q.data ?? [];
  const ottiche = lenti.q.data ?? [];

  const perTipo = useMemo(() => {
    const m = new Map<string, LibItem[]>();
    kit.forEach((g) => {
      const tipo = String((g.data as Gear).tipo || "Altro");
      m.set(tipo, [...(m.get(tipo) ?? []), g]);
    });
    return [...m.entries()].sort((a, b) => TIPI.indexOf(a[0]) - TIPI.indexOf(b[0]));
  }, [kit]);

  const apri = (g?: LibItem) => {
    if (g) {
      setForm({ ...GEAR_VUOTO, ...(g.data as Gear) });
      setModifica(g);
    } else {
      setForm(GEAR_VUOTO);
      setModifica("nuovo");
    }
  };

  const salvaGear = () => {
    if (!form.marca.trim() && !form.modello.trim()) return toast("Scrivi almeno marca o modello", "error");
    const title = [form.marca, form.modello].filter(Boolean).join(" ");
    const body = { title, data: { ...form } };
    const fine = { onSuccess: () => (setModifica(null), toast("Attrezzatura salvata")) };
    if (modifica === "nuovo") gear.create.mutate([body], fine);
    else if (modifica) gear.update.mutate({ id: modifica.id, ...body }, fine);
  };

  const salvaLens = () => {
    if (!lens.focal.trim() || !lens.series.trim()) return toast("Scrivi focale e serie", "error");
    const body = { title: lensLabel(lens), data: { ...lens } };
    const fine = { onSuccess: () => (setModifica(null), toast("Ottica salvata")) };
    if (modifica === "nuovo") lenti.create.mutate([body], fine);
    else if (modifica) lenti.update.mutate({ id: modifica.id, ...body }, fine);
  };

  const apriLens = (l?: LibItem) => {
    if (l) {
      setLens({ ...LENS_VUOTA, ...(l.data as Lens) });
      setModifica(l);
    } else {
      setLens(LENS_VUOTA);
      setModifica("nuovo");
    }
  };

  const campo = (k: keyof Gear) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const campoLens = (k: keyof Lens) => (v: string) => setLens((l) => ({ ...l, [k]: v }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable testID="gear-back" onPress={() => router.back()} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700", fontSize: 16, flex: 1 }}>La mia attrezzatura</Text>
        <Button testID="gear-new" icon="plus" onPress={() => (tab === "kit" ? apri() : apriLens())} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Segmented
          testID="gear-tab"
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { value: "kit", label: `Kit (${kit.length})` },
            { value: "ottiche", label: `Ottiche (${ottiche.length})` },
          ]}
        />

        {tab === "kit" ? (
          gear.q.isLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : kit.length === 0 ? (
            <Empty icon="camera-outline" title="Il kit è vuoto" subtitle="Salva corpi, luci, audio e grip che possiedi: li ritrovi in ogni progetto." action={<Button label="Aggiungi attrezzatura" icon="plus" onPress={() => apri()} />} />
          ) : (
            perTipo.map(([tipo, voci]) => (
              <View key={tipo} style={{ gap: spacing.xs }}>
                <Text style={s.label}>{tipo}</Text>
                {voci.map((g) => {
                  const d = g.data as Gear;
                  return (
                    <Pressable key={g.id} testID={`gear-item-${g.id}`} onPress={() => apri(g)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm }}>
                      <Icon name="camera-outline" size={18} color={colors.brandPrimary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.onSurface, fontWeight: "600" }} numberOfLines={1}>{g.title}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                          {[d.attacco, d.quantita ? `x${d.quantita}` : "", d.note].filter(Boolean).join(" · ") || "Nessun dettaglio"}
                        </Text>
                      </View>
                      <Icon name="pencil-outline" size={16} color={colors.muted} />
                    </Pressable>
                  );
                })}
              </View>
            ))
          )
        ) : lenti.q.isLoading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : ottiche.length === 0 ? (
          <Empty icon="camera-iris" title="Nessuna ottica" subtitle="Aggiungi le ottiche che possiedi o che noleggi spesso." action={<Button label="Aggiungi ottica" icon="plus" onPress={() => apriLens()} />} />
        ) : (
          ottiche.map((l) => {
            const d = l.data as Lens;
            return (
              <Pressable key={l.id} testID={`lens-item-${l.id}`} onPress={() => apriLens(l)} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm }}>
                <Icon name="camera-iris" size={18} color={colors.brandPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: "600" }} numberOfLines={1}>{lensLabel(d)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{[d.brand, d.tstop, d.mount].filter(Boolean).join(" · ")}</Text>
                </View>
                <Icon name="pencil-outline" size={16} color={colors.muted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet
        testID="gear-sheet"
        visible={modifica !== null}
        onClose={() => setModifica(null)}
        title={tab === "kit" ? (modifica === "nuovo" ? "Aggiungi attrezzatura" : "Modifica attrezzatura") : modifica === "nuovo" ? "Aggiungi ottica" : "Modifica ottica"}
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button testID="gear-save" label="Salva" loading={gear.create.isPending || gear.update.isPending || lenti.create.isPending || lenti.update.isPending} onPress={() => (tab === "kit" ? salvaGear() : salvaLens())} />
            {modifica && modifica !== "nuovo" ? (
              <Button
                label="Elimina"
                variant="secondary"
                icon="trash-can-outline"
                onPress={() =>
                  tab === "kit"
                    ? gear.remove.mutate(modifica.id, { onSuccess: () => (setModifica(null), toast("Tolto dal kit")) })
                    : lenti.remove.mutate(modifica.id, { onSuccess: () => (setModifica(null), toast("Ottica tolta")) })
                }
              />
            ) : null}
          </View>
        }
      >
        {tab === "kit" ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text style={s.label}>Tipo</Text>
              <ChipRow>
                {TIPI.map((t) => (
                  <Chip key={t} label={t} selected={form.tipo === t} onPress={() => campo("tipo")(t)} />
                ))}
              </ChipRow>
            </View>
            <Field label="Marca" value={form.marca} onChangeText={campo("marca")} placeholder="Sony" />
            <Field label="Modello" value={form.modello} onChangeText={campo("modello")} placeholder="FX6" />
            <Field label="Attacco" value={form.attacco} onChangeText={campo("attacco")} placeholder="E, PL, EF…" />
            <Field label="Quantità" value={form.quantita} onChangeText={campo("quantita")} keyboardType="number-pad" />
            <Field label="Note" value={form.note} onChangeText={campo("note")} multiline minHeight={70} placeholder="Seriale, stato, accessori…" />
          </>
        ) : (
          <>
            <Field label="Marca" value={lens.brand} onChangeText={campoLens("brand")} placeholder="Cooke" />
            <Field label="Serie" value={lens.series} onChangeText={campoLens("series")} placeholder="S4/i" />
            <Field label="Focale (mm)" value={lens.focal} onChangeText={campoLens("focal")} placeholder="35" keyboardType="decimal-pad" />
            <Field label="T-stop" value={lens.tstop} onChangeText={campoLens("tstop")} placeholder="T2" />
            <Field label="Attacco" value={lens.mount} onChangeText={campoLens("mount")} placeholder="PL" />
            <Field label="Note" value={lens.note ?? ""} onChangeText={campoLens("note")} multiline minHeight={70} />
          </>
        )}
      </Sheet>
    </View>
  );
}
