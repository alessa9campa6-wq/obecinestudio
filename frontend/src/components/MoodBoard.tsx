import { useRef, useState } from "react";
import { PanResponder, Pressable, Text, useWindowDimensions, View } from "react-native";

import { Item } from "@/src/api";
import { RemoteImage } from "@/src/components/Images";
import { BOARD_FONDI, BOARD_RATIO, BoardBox, boardAuto, boardBoxes, boardSave, limitato, testoSu } from "@/src/board";
import { useItemMutations } from "@/src/hooks";
import { useHub } from "@/src/hub";
import { isVideo, ModuleDef } from "@/src/modules";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Chip, ChipRow, Icon, toast } from "@/src/ui";

type Gruppo = [string, Item[]];

// La tavola: ogni scheda ha una posizione, una misura, una rotazione e un
// livello, salvati sulla scheda stessa. Si trascina col dito, si sistema con la
// barra in basso, e il PDF stampa esattamente questa disposizione.
export function MoodBoard({
  def,
  gruppi,
  onOpen,
  canEdit,
}: {
  def: ModuleDef;
  gruppi: Gruppo[];
  onOpen: (item: Item) => void;
  canEdit: boolean;
}) {
  const { project } = useHub();
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const m = useItemMutations(project.id, def.key);
  const [indice, setIndice] = useState(0);
  const [scelto, setScelto] = useState<string | null>(null);
  const [misura, setMisura] = useState({ w: 0, h: 0 });

  const gruppo = gruppi[Math.min(indice, gruppi.length - 1)] ?? ["Moodboard", [] as Item[]];
  const items = gruppo[1];
  const boxes = boardBoxes(items);
  const elemento = items.find((it) => it.id === scelto) ?? null;
  const box = elemento ? boxes[items.indexOf(elemento)] : null;

  // La tavola è il rettangolo 3:2 più grande che entra nello spazio disponibile.
  const larghezza = Math.max(200, misura.w || 320);
  const altezza = Math.max(200, misura.h || Math.max(240, height * 0.45));
  const bw = Math.max(200, Math.min(larghezza, altezza * BOARD_RATIO, 1100));
  const bh = bw / BOARD_RATIO;

  const salva = (item: Item, patch: Record<string, any>) => {
    if (!canEdit) return;
    m.update.mutate({ id: item.id, data: { ...item.data, ...patch } });
  };

  const sposta = (item: Item, patch: { x: number; y: number }) => {
    const i = items.indexOf(item);
    salva(item, boardSave({ ...boxes[i], ...patch }));
  };

  const ridimensiona = (fattore: number) => {
    if (!elemento || !box) return;
    const w = limitato(box.w * fattore, 0.06, 0.96);
    const h = limitato(box.h * fattore, 0.05, 0.96);
    salva(elemento, boardSave({
      ...box,
      w,
      h,
      x: limitato(box.x, 0, Math.max(0, 1 - w)),
      y: limitato(box.y, 0, Math.max(0, 1 - h)),
    }));
  };

  const ruota = (gradi: number) => {
    if (!elemento || !box) return;
    salva(elemento, boardSave({ ...box, rot: limitato(Math.round(box.rot + gradi), -45, 45) }));
  };

  // Avanti/indietro: un livello sopra (o sotto) a tutti gli altri della tavola.
  const livello = (direzione: number) => {
    if (!elemento) return;
    const z = boxes.map((b) => b.z);
    const valore = direzione > 0 ? Math.max(...z, 0) + 1 : Math.min(...z, 0) - 1;
    salva(elemento, { tavola_z: valore });
  };

  // Rimescola le posizioni in griglia: utile per riordinare una tavola
  // diventata caotica, o per sistemare le moodboard vecchie.
  const disponi = () => {
    const auto = boardAuto(items.length);
    items.forEach((it, i) => salva(it, boardSave(auto[i])));
    toast("Tavola riordinata");
  };

  const elimina = (item: Item) => {
    setScelto(null);
    m.remove.mutate(item.id, { onSuccess: () => toast("Eliminato") });
  };

  if (!gruppi.length) return null;

  return (
    <View style={{ flex: 1 }}>
      {gruppi.length > 1 ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <ChipRow>
            {gruppi.map(([label, list], i) => (
              <Chip
                key={label}
                testID={`board-group-${label}`}
                label={`${label} · ${list.length}`}
                selected={i === Math.min(indice, gruppi.length - 1)}
                onPress={() => {
                  setIndice(i);
                  setScelto(null);
                }}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <View
        onLayout={(e) => setMisura({ w: e.nativeEvent.layout.width - spacing.xl * 2, h: e.nativeEvent.layout.height - spacing.md })}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}
      >
        <View
          testID="moodboard-board"
          style={{
            width: bw,
            height: bh,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {items.length ? null : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl }}>
              <Icon name="image-multiple-outline" size={32} color={colors.muted} />
              <Text style={{ color: colors.muted, fontFamily: fonts.text, textAlign: "center" }}>
                La tavola è vuota. Aggiungi immagini, testi e colori: poi trascinali dove vuoi.
              </Text>
            </View>
          )}

          {items.map((item, i) => (
            <Elemento
              key={item.id}
              item={item}
              box={boxes[i]}
              bw={bw}
              bh={bh}
              scelto={scelto === item.id}
              canEdit={canEdit}
              colors={colors}
              onSelect={setScelto}
              onOpen={onOpen}
              onMove={sposta}
            />
          ))}
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider }}>
        {elemento && box ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ flex: 1, color: colors.onSurface, fontFamily: fonts.text, fontWeight: "700" }} numberOfLines={1}>
                {elemento.title || "Elemento"}
              </Text>
              <Pressable testID="board-deselect" hitSlop={10} onPress={() => setScelto(null)}>
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>

            <ChipRow>
              <Chip testID="board-smaller" icon="minus" label="Più piccolo" onPress={() => ridimensiona(0.85)} />
              <Chip testID="board-bigger" icon="plus" label="Più grande" onPress={() => ridimensiona(1.18)} />
              <Chip testID="board-rotate-left" icon="rotate-left" label="−5°" onPress={() => ruota(-5)} />
              <Chip testID="board-rotate-right" icon="rotate-right" label="+5°" onPress={() => ruota(5)} />
              <Chip testID="board-front" icon="arrange-bring-forward" label="Davanti" onPress={() => livello(1)} />
              <Chip testID="board-back" icon="arrange-send-backward" label="Dietro" onPress={() => livello(-1)} />
              <Chip testID="board-edit" icon="pencil" label="Modifica" onPress={() => onOpen(elemento)} />
              <Chip testID="board-delete" icon="delete-outline" label="Elimina" onPress={() => elimina(elemento)} />
            </ChipRow>

            {elemento.data.immagine ? null : (
              <View style={{ gap: spacing.xs }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>Sfondo della scheda</Text>
                <ChipRow>
                  {BOARD_FONDI.map((fondo) => (
                    <Chip
                      key={fondo.nome}
                      testID={`board-fondo-${fondo.nome}`}
                      label={fondo.nome}
                      selected={(elemento.data.tavola_fondo ?? "") === fondo.hex}
                      onPress={() => salva(elemento, { tavola_fondo: elemento.data.tavola_fondo === fondo.hex ? "" : fondo.hex })}
                    />
                  ))}
                </ChipRow>
              </View>
            )}
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Text style={{ flex: 1, color: colors.muted, fontSize: 12 }}>
              Tocca un elemento per spostarlo, ridimensionarlo o ruotarlo. Trascinalo con il dito.
            </Text>
            {canEdit && items.length > 1 ? (
              <Button testID="board-rearrange" icon="grid" variant="secondary" label="Riordina" onPress={disponi} />
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

// Un elemento sulla tavola. Il gesto è il dito: si trascina; un tocco senza
// spostamento apre la scheda per modificarla.
function Elemento({
  item,
  box,
  bw,
  bh,
  scelto,
  canEdit,
  colors,
  onSelect,
  onOpen,
  onMove,
}: {
  item: Item;
  box: BoardBox;
  bw: number;
  bh: number;
  scelto: boolean;
  canEdit: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onSelect: (id: string) => void;
  onOpen: (item: Item) => void;
  onMove: (item: Item, patch: { x: number; y: number }) => void;
}) {
  const [trascinato, setTrascinato] = useState<{ dx: number; dy: number } | null>(null);

  // Il PanResponder nasce una volta sola: legge i valori aggiornati da qui,
  // altrimenti ogni tocco userebbe posizioni vecchie.
  const ultimo = useRef({ item, box, bw, bh, canEdit, onSelect, onOpen, onMove });
  ultimo.current = { item, box, bw, bh, canEdit, onSelect, onOpen, onMove };

  const gesto = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!ultimo.current.canEdit,
      onMoveShouldSetPanResponder: () => !!ultimo.current.canEdit,
      onPanResponderGrant: () => {
        ultimo.current.onSelect(ultimo.current.item.id);
      },
      onPanResponderMove: (_, g) => setTrascinato({ dx: g.dx, dy: g.dy }),
      onPanResponderRelease: (_, g) => {
        const { item: corrente, box: b, bw: larghezza, bh: altezza, onOpen: apri, onMove: sposta } = ultimo.current;
        setTrascinato(null);

        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          apri(corrente);
          return;
        }

        sposta(corrente, {
          x: limitato(b.x + g.dx / larghezza, 0, Math.max(0, 1 - b.w)),
          y: limitato(b.y + g.dy / altezza, 0, Math.max(0, 1 - b.h)),
        });
      },
      onPanResponderTerminate: () => setTrascinato(null),
    }),
  ).current;

  const immagine = item.data.immagine ? String(item.data.immagine) : "";
  const fondo = String(item.data.tavola_fondo ?? "") || colors.surfaceTertiary;
  const testo = String(item.data.note ?? "");
  const dx = trascinato?.dx ?? 0;
  const dy = trascinato?.dy ?? 0;

  return (
    <View
      testID={`board-item-${item.id}`}
      {...gesto.panHandlers}
      style={{
        position: "absolute",
        left: box.x * bw + dx,
        top: box.y * bh + dy,
        width: box.w * bw,
        height: box.h * bh,
        zIndex: box.z + 1,
        transform: [{ rotate: `${box.rot}deg` }],
        borderRadius: radius.sm,
        overflow: "hidden",
        backgroundColor: immagine ? colors.surfaceTertiary : fondo,
        borderWidth: scelto ? 2 : immagine ? 0 : 1,
        borderColor: scelto ? colors.brandPrimary : colors.border,
        opacity: trascinato ? 0.9 : 1,
      }}
    >
      {immagine ? (
        isVideo(immagine) ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceInverse }}>
            <Icon name="play-circle" size={28} color={colors.brandPrimary} />
          </View>
        ) : (
          <RemoteImage path={immagine} style={{ width: "100%", height: "100%" }} />
        )
      ) : (
        <View style={{ flex: 1, padding: spacing.sm, gap: 2 }}>
          <Text style={{ color: testoSu(fondo), fontWeight: "700", fontSize: 13 }} numberOfLines={3}>
            {item.title || "Senza titolo"}
          </Text>
          {testo ? (
            <Text style={{ color: testoSu(fondo), fontSize: 11, opacity: 0.85 }} numberOfLines={5}>
              {testo}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
