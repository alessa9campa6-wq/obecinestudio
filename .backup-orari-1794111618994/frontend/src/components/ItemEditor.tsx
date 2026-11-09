import * as DocumentPicker from "expo-document-picker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, Switch, Text, View } from "react-native";

import { fileUrl, Item, uploadImage } from "@/src/api";
import { ImageField } from "@/src/components/Images";
import { useAllItems, useItemMutations, useItems, useLibrary } from "@/src/hooks";
import { useHub, useVisibility } from "@/src/hub";
import { Lens, lensLabel } from "@/src/lenses";
import { backlinks, FieldDef, ModuleDef, moduleByKey } from "@/src/modules";
import { radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Field, Icon, Sheet, toast, useStyles } from "@/src/ui";

export function Swatches({ value }: { value?: string }) {
  const { colors } = useTheme();
  const list = String(value ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => /^#?[0-9a-fA-F]{3,8}$/.test(c));
  if (!list.length) return null;
  return (
    <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
      {list.map((c, i) => (
        <View key={i} style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: c.startsWith("#") ? c : `#${c}`, borderWidth: 1, borderColor: colors.border }} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- date
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function _giornoValido(anno: number, mese: number, giorno: number): string {
  const d = new Date(anno, mese - 1, giorno);
  const giusto = d.getFullYear() === anno && d.getMonth() === mese - 1 && d.getDate() === giorno;
  return giusto ? dayjs(d).format("YYYY-MM-DD") : "";
}

// Legge le date già salvate (ISO) e anche quelle scritte a mano in passato.
function _dataIso(testo: string): string {
  const t = String(testo ?? "").trim().toLowerCase();
  if (!t) return "";

  const iso = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return _giornoValido(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const italiano = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
  if (italiano) {
    const anno = italiano[3] ? (italiano[3].length === 2 ? 2000 + Number(italiano[3]) : Number(italiano[3])) : dayjs().year();
    return _giornoValido(anno, Number(italiano[2]), Number(italiano[1]));
  }

  return "";
}

const _dataLeggibile = (valore: string) => {
  const iso = _dataIso(valore);
  if (!iso) return "";
  const d = dayjs(iso);
  return `${d.date()} ${MESI_BREVI[d.month()]} ${d.year()}`;
};

// Selettore a calendario: si toccano i giorni, non si scrive niente.
function SelettoreData({
  visible,
  da,
  a,
  intervallo,
  onClose,
  onScegli,
}: {
  visible: boolean;
  da?: string;
  a?: string;
  intervallo?: boolean;
  onClose: () => void;
  onScegli: (inizio: string, fine: string) => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [mese, setMese] = useState(() => dayjs(_dataIso(da ?? "") || undefined).startOf("month"));
  const [inizio, setInizio] = useState("");
  const [fine, setFine] = useState("");

  useEffect(() => {
    if (!visible) return;
    setMese(dayjs(_dataIso(da ?? "") || undefined).startOf("month"));
    setInizio(_dataIso(da ?? ""));
    setFine(intervallo ? _dataIso(a ?? "") : "");
  }, [visible, da, a, intervallo]);

  const primo = mese.startOf("month");
  const vuote = (primo.day() + 6) % 7;
  const giorni = mese.endOf("month").date();
  const celle: (dayjs.Dayjs | null)[] = [
    ...Array.from({ length: vuote }, () => null),
    ...Array.from({ length: giorni }, (_, i) => primo.add(i, "day")),
  ];
  while (celle.length % 7 !== 0) celle.push(null);

  const oggi = dayjs().format("YYYY-MM-DD");

  const tocca = (giorno: dayjs.Dayjs) => {
    const scelto = giorno.format("YYYY-MM-DD");
    if (!intervallo) {
      onScegli(scelto, "");
      onClose();
      return;
    }
    if (!inizio || fine) {
      setInizio(scelto);
      setFine("");
      return;
    }
    if (scelto < inizio) {
      setInizio(scelto);
      return;
    }
    onScegli(inizio, scelto);
    onClose();
  };

  const tra = (iso: string) => !!(inizio && fine && iso > inizio && iso < fine);
  const scelto = (iso: string) => iso === inizio || iso === fine || (!intervallo && iso === _dataIso(da ?? ""));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Pressable accessibilityLabel="Chiudi il calendario" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <View style={{ width: "100%", maxWidth: 420, gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Button testID="date-mese-prima" icon="chevron-left" variant="secondary" small onPress={() => setMese(mese.subtract(1, "month"))} />
            <Text style={{ fontFamily: "Fraunces", fontSize: 18, color: colors.onSurface }}>
              {MESI[mese.month()]} {mese.year()}
            </Text>
            <Button testID="date-mese-dopo" icon="chevron-right" variant="secondary" small onPress={() => setMese(mese.add(1, "month"))} />
          </View>

          <View style={{ flexDirection: "row" }}>
            {["L", "M", "M", "G", "V", "S", "D"].map((g, i) => (
              <Text key={i} style={{ flex: 1, textAlign: "center", color: colors.muted, fontFamily: "Geist", fontSize: 12 }}>{g}</Text>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {celle.map((giorno, i) => {
              if (!giorno) return <View key={`vuota-${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
              const iso = giorno.format("YYYY-MM-DD");
              const isScelto = scelto(iso);
              const isTra = tra(iso);
              const isOggi = iso === oggi;
              return (
                <Pressable
                  key={iso}
                  testID={`date-giorno-${iso}`}
                  onPress={() => tocca(giorno)}
                  style={{ width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center" }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isScelto ? colors.brandPrimary : isTra ? colors.brandTertiary : "transparent",
                      borderWidth: isOggi && !isScelto ? 1 : 0,
                      borderColor: colors.brandPrimary,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Geist",
                        fontSize: 15,
                        color: isScelto ? colors.onBrandPrimary : isTra ? colors.onBrandTertiary : colors.onSurface,
                        fontWeight: isOggi && !isScelto ? "700" : "400",
                      }}
                    >
                      {giorno.date()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={s.muted}>
            {intervallo
              ? inizio && !fine
                ? "Ora tocca l'ultimo giorno"
                : "Tocca il primo giorno, poi l'ultimo"
              : "Tocca un giorno"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function DataAperta({ testo, onPress, testID }: { testo: string; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceTertiary : colors.surfaceSecondary,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      })}
    >
      <Icon name="calendar-month-outline" size={18} color={colors.brandPrimary} />
      <Text numberOfLines={1} style={{ flex: 1, color: testo.startsWith("Tocca") ? colors.muted : colors.onSurface, fontFamily: "Geist", fontSize: 15 }}>{testo}</Text>
      <Icon name="chevron-down" size={18} color={colors.muted} />
    </Pressable>
  );
}

function DateField({ label, value, onChange, testID }: { label?: string; value?: string; onChange: (v: string) => void; testID?: string }) {
  const s = useStyles();
  const [aperto, setAperto] = useState(false);
  const oggi = dayjs();
  const iso = _dataIso(String(value ?? ""));
  const scrittaAMano = value && !iso ? String(value) : "";
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <ChipRow>
        <Chip testID={`${testID}-oggi`} label="Oggi" selected={iso === oggi.format("YYYY-MM-DD")} onPress={() => onChange(oggi.format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-domani`} label="Domani" selected={iso === oggi.add(1, "day").format("YYYY-MM-DD")} onPress={() => onChange(oggi.add(1, "day").format("YYYY-MM-DD"))} />
        {value ? <Chip testID={`${testID}-svuota`} icon="close" label="Svuota" onPress={() => onChange("")} /> : null}
      </ChipRow>
      <DataAperta testID={testID} testo={iso ? _dataLeggibile(iso) : "Tocca per scegliere la data"} onPress={() => setAperto(true)} />
      {scrittaAMano ? <Text style={s.muted}>Data scritta a mano: {scrittaAMano}</Text> : null}
      <SelettoreData visible={aperto} da={iso} onClose={() => setAperto(false)} onScegli={(scelto) => onChange(scelto)} />
    </View>
  );
}

export function RefInput({ f, value, onChange, onGo }: { f: FieldDef; value: any; onChange: (v: any) => void; onGo: (m: string) => void }) {
  const { project } = useHub();
  const s = useStyles();
  const q = useItems(project.id, f.ref!);
  const target = moduleByKey(f.ref!);
  const ids: string[] = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (id: string) => {
    if (f.multi) onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    else onChange(ids[0] === id ? "" : id);
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Icon name="link-variant" size={14} />
        <Text style={s.label}>{f.label}</Text>
      </View>
      {q.data?.length ? (
        <ChipRow>
          {q.data.map((it) => (
            <Chip key={it.id} testID={`ref-${f.key}-${it.id}`} label={it.title} selected={ids.includes(it.id)} onPress={() => toggle(it.id)} />
          ))}
        </ChipRow>
      ) : (
        <Pressable testID={`ref-${f.key}-go`} onPress={() => onGo(f.ref!)} style={{ minHeight: 36, justifyContent: "center" }}>
          <Text style={s.muted}>Nessun elemento in {target?.label}. Tocca per aggiungerne →</Text>
        </Pressable>
      )}
    </View>
  );
}

export function LensInput({ label, value, onChange, testID }: { label: string; value: string; onChange: (v: string) => void; testID?: string }) {
  const { q } = useLibrary("lens");
  const s = useStyles();
  const lenses = (q.data ?? []).map((l) => lensLabel(l.data as Lens));
  return (
    <View style={{ gap: spacing.xs }}>
      <Field testID={testID} label={label} value={value ?? ""} onChangeText={onChange} placeholder="es. 35mm Supreme Prime" />
      {lenses.length ? (
        <ChipRow>
          {lenses.map((l, i) => (
            <Chip key={i} testID={`${testID}-kit-${i}`} label={l} selected={value === l} onPress={() => onChange(l)} />
          ))}
        </ChipRow>
      ) : (
        <Text style={s.muted}>Aggiungi ottiche in Strumenti → Le mie ottiche per sceglierle qui.</Text>
      )}
    </View>
  );
}

// External documents: picked with the system file picker and stored in object storage.
function FileInput({ label, value, onChange }: { label: string; value?: { path: string; name: string }; onChange: (v: any) => void }) {
  const s = useStyles();
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    setBusy(true);
    try {
      const path = await uploadImage({ uri: a.uri, fileName: a.name, mimeType: a.mimeType ?? "application/octet-stream" });
      onChange({ path, name: a.name });
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={s.label}>{label}</Text>
      {value?.path ? (
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Icon name="file-document-outline" />
          <Text style={[s.body, { flex: 1 }]} numberOfLines={1}>{value.name}</Text>
          <Button testID="file-open-button" icon="open-in-new" small variant="secondary" label="Apri" onPress={() => Linking.openURL(fileUrl(value.path))} />
        </View>
      ) : null}
      <Button testID="file-pick-button" icon="file-upload-outline" label={value?.path ? "Sostituisci file" : "Importa file"} variant="secondary" loading={busy} onPress={pick} />
    </View>
  );
}

function DateRangeField({ label, value, onChange, testID }: { label?: string; value?: string; onChange: (v: string) => void; testID?: string }) {
  const s = useStyles();
  const oggi = dayjs();
  const [aperto, setAperto] = useState(false);
  const testo = String(value ?? "");
  const pezzi = testo.includes("|") ? testo.split("|") : [_dataIso(testo) ? testo : "", ""];
  const da = _dataIso(pezzi[0] ?? "");
  const a = _dataIso(pezzi[1] ?? "");
  const scrittaAMano = testo && !testo.includes("|") && !da ? testo : "";

  const etichetta = da && a
    ? `${_dataLeggibile(da)} → ${_dataLeggibile(a)}`
    : da
      ? `${_dataLeggibile(da)} (un giorno)`
      : "Tocca per scegliere le date";

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <ChipRow>
        <Chip testID={`${testID}-oggi`} label="Solo oggi" onPress={() => onChange(oggi.format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-domani`} label="Domani" onPress={() => onChange(oggi.add(1, "day").format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-tre`} label="3 giorni" onPress={() => onChange(oggi.format("YYYY-MM-DD") + "|" + oggi.add(2, "day").format("YYYY-MM-DD"))} />
        <Chip testID={`${testID}-settimana`} label="1 settimana" onPress={() => onChange(oggi.format("YYYY-MM-DD") + "|" + oggi.add(6, "day").format("YYYY-MM-DD"))} />
        {value ? <Chip testID={`${testID}-svuota`} icon="close" label="Svuota" onPress={() => onChange("")} /> : null}
      </ChipRow>
      <DataAperta testID={testID} testo={etichetta} onPress={() => setAperto(true)} />
      {scrittaAMano ? <Text style={s.muted}>Date scritte a mano: {scrittaAMano}</Text> : null}
      <SelettoreData
        visible={aperto}
        da={da}
        a={a}
        intervallo
        onClose={() => setAperto(false)}
        onScegli={(inizio, fine) => onChange(fine ? inizio + "|" + fine : inizio)}
      />
    </View>
  );
}

function FieldInput({ f, value, onChange, onGo }: { f: FieldDef; value: any; onChange: (v: any) => void; onGo: (m: string) => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const id = `field-${f.key}`;
  switch (f.type) {
    case "ref":
      return <RefInput f={f} value={value} onChange={onChange} onGo={onGo} />;
    case "lens":
      return <LensInput testID={id} label={f.label} value={value} onChange={onChange} />;
    case "daterange":
      return <DateRangeField testID={id} label={f.label} value={value} onChange={onChange} />;
    case "date":
      return <DateField testID={id} label={f.label} value={value} onChange={onChange} />;
    case "select":
      return (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>{f.label}</Text>
          <ChipRow>
            {f.options!.map((o) => (
              <Chip key={o} testID={`${id}-option-${o}`} label={o} selected={value === o} onPress={() => onChange(value === o ? "" : o)} />
            ))}
          </ChipRow>
        </View>
      );
    case "check":
      return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
          <Text style={s.h3}>{f.label}</Text>
          <Switch testID={id} value={!!value} onValueChange={onChange} trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }} />
        </View>
      );
    case "file":
      return <FileInput label={f.label} value={value} onChange={onChange} />;
    case "image":
    case "media":
      return (
        <View style={{ gap: spacing.xs }}>
          <Text style={s.label}>{f.label}</Text>
          <ImageField testID={id} value={value} onChange={onChange} allowVideo={f.type === "media"} />
        </View>
      );
    case "colors":
      return (
        <View style={{ gap: spacing.sm }}>
          <Field testID={id} label={f.label} value={value ?? ""} onChangeText={onChange} placeholder={f.placeholder} autoCapitalize="none" />
          <Swatches value={value} />
        </View>
      );
    case "url":
      return (
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field testID={id} label={f.label} value={value ?? ""} onChangeText={onChange} placeholder="https://" autoCapitalize="none" keyboardType="url" />
          </View>
          {value ? <Button icon="open-in-new" variant="secondary" onPress={() => Linking.openURL(value)} /> : null}
        </View>
      );
    default:
      return (
        <Field
          testID={id}
          label={f.label}
          value={value ?? ""}
          onChangeText={onChange}
          placeholder={f.placeholder}
          multiline={f.type === "multiline"}
          minHeight={f.type === "multiline" ? 140 : undefined}
          keyboardType={f.type === "number" ? "decimal-pad" : "default"}
        />
      );
  }
}

function Backlinks({ item, onGo }: { item: Item; onGo: (m: string, id: string) => void }) {
  const { project } = useHub();
  const all = useAllItems(project.id);
  const s = useStyles();
  const links = backlinks(item.id, all.data ?? []);
  if (!links.length) return null;
  const groups: Record<string, Item[]> = {};
  links.forEach((l) => (groups[l.module] ??= []).push(l));
  return (
    <View testID="item-backlinks" style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Icon name="vector-link" size={16} />
        <Text style={s.label}>Collegato a</Text>
      </View>
      {Object.entries(groups).map(([m, list]) => (
        <View key={m} style={{ gap: 4 }}>
          <Text style={s.muted}>{moduleByKey(m)?.label}</Text>
          <ChipRow>
            {list.map((l) => (
              <Chip key={l.id} testID={`backlink-${l.id}`} icon={moduleByKey(m)?.icon} label={l.title} onPress={() => onGo(m, l.id)} />
            ))}
          </ChipRow>
        </View>
      ))}
    </View>
  );
}

const autoTitle = (def: ModuleDef, data: Record<string, any>) => {
  const f = (def.fields ?? []).find((x) => (x.type === "multiline" || x.type === "text") && data[x.key]);
  return f ? String(data[f.key]).split("\n")[0].slice(0, 48) : `${def.label} ${new Date().toLocaleDateString("it-IT")}`;
};

export default function ItemEditor({
  def,
  item,
  visible,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  def: ModuleDef;
  item: Item | null;
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, data: Record<string, any>) => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  const { project, go } = useHub();
  const vis = useVisibility();
  const budget = useItemMutations(project.id, "budget");
  const lights = useItemMutations(project.id, "luci");
  // Location -> lighting: start a lighting diagram already linked to this location.
  const addLighting = () =>
    item &&
    lights.create.mutate(
      { title: `Luci · ${title || item.title}`, data: { elements: [], location: item.id } },
      { onSuccess: (d) => (toast("Diagramma luce creato"), jump("luci", d.id)), onError: (e: Error) => toast(e.message, "error") },
    );
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [confirm, setConfirm] = useState(false);
  const { colors } = useTheme();
  useEffect(() => {
    if (visible) {
      setTitle(item?.title ?? "");
      setData(item?.data ?? {});
      setConfirm(false);
    }
  }, [visible, item]);

  const jump = (m: string, id?: string) => {
    onClose();
    go(m, id);
  };
  const addToBudget = () =>
    budget.create.mutate(
      {
        title: `${def.label}: ${title || "Senza nome"}`,
        data: { categoria: def.budgetCategory, importo: data.tariffa ?? "", unita: data.unita || (def.key === "crew" || def.key === "cast" ? "Per giorno" : "Forfait"), quantita: data.quantita ?? "1", durata: data.durata ?? "1", date: data.date ?? "", link: data.link ?? "", fornitore: data.noleggio ?? "", stato: "Preventivo" },
      },
      { onSuccess: () => toast("Aggiunto al budget") },
    );

  return (
    <Sheet
      testID="item-editor-sheet"
      visible={visible}
      onClose={onClose}
      title={item ? `Modifica · ${def.label}` : `Nuovo · ${def.label}`}
      footer={
        <>
          {item && onDelete ? (
            confirm ? (
              <Button testID="item-delete-confirm" label="Conferma elimina" variant="danger" onPress={onDelete} />
            ) : (
              <Pressable testID="item-delete-button" onPress={() => setConfirm(true)} style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", marginRight: "auto" }}>
                <Icon name="trash-can-outline" color={colors.error} />
              </Pressable>
            )
          ) : null}
          {def.budgetCategory ? <Button testID="item-add-budget" icon="cash-plus" label="Al budget" variant="secondary" loading={budget.create.isPending} onPress={addToBudget} /> : null}
          {def.key === "location" && item ? <Button testID="item-add-lighting" icon="lightbulb-on-outline" label="Diagramma luce" variant="secondary" loading={lights.create.isPending} onPress={addLighting} /> : null}
          <Button testID="item-save-button" label="Salva" icon="check" loading={saving} onPress={() => onSave(title.trim() || (def.titleOptional ? autoTitle(def, data) : "Senza titolo"), data)} />
        </>
      }
    >
      <Field testID="item-title-input" label={def.titleOptional ? `${def.titleLabel ?? "Titolo"} (facoltativo)` : (def.titleLabel ?? "Titolo")} value={title} onChangeText={setTitle} />
      {(def.fields ?? []).filter(vis.field).map((f) => (
        <FieldInput key={f.key} f={f} value={data[f.key]} onChange={(v) => setData((d) => ({ ...d, [f.key]: v }))} onGo={(m) => jump(m)} />
      ))}
      {item ? <Backlinks item={item} onGo={jump} /> : null}
    </Sheet>
  );
}
