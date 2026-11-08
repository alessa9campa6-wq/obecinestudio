import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/ui";
import {
  PencilKitView,
  PencilKitViewRef,
} from "rn-pencil-kit";

export default function PencilTest() {
  const canvasRef = useRef<PencilKitViewRef>(null);
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      canvasRef.current
        ?.setupToolPicker({
          type: "pencil",
          width: 8,
          color: "#111111",
          fallbackTool: "pen",
        })
        .then(() => setReady(true))
        .catch(() => setReady(true));
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.toolbar}>
        <Button
          label="Matita"
          small
          variant="secondary"
          onPress={() =>
            canvasRef.current?.setupToolPicker({
              type: "pencil",
              width: 8,
              color: "#111111",
            })
          }
        />

        <Button
          label="Penna"
          small
          variant="secondary"
          onPress={() =>
            canvasRef.current?.setupToolPicker({
              type: "pen",
              width: 6,
              color: "#111111",
            })
          }
        />

        <Button
          label="Marker"
          small
          variant="secondary"
          onPress={() =>
            canvasRef.current?.setupToolPicker({
              type: "marker",
              width: 24,
              color: "#1E4FA3",
            })
          }
        />

        <Button
          label="Acquerello"
          small
          variant="secondary"
          onPress={() =>
            canvasRef.current?.setupToolPicker({
              type: "watercolor",
              width: 30,
              color: "#1F6F4A",
              fallbackTool: "pen",
            })
          }
        />

        <Button
          label="Gomma"
          small
          variant="secondary"
          onPress={() =>
            canvasRef.current?.setupToolPicker({
              type: "eraser",
              eraserType: "vector",
            })
          }
        />

        <Button
          label="Annulla"
          small
          variant="secondary"
          onPress={() => canvasRef.current?.undo()}
        />

        <Button
          label="Ripeti"
          small
          variant="secondary"
          onPress={() => canvasRef.current?.redo()}
        />

        <Button
          label="Pulisci"
          small
          variant="danger"
          onPress={() => canvasRef.current?.clearDrawing()}
        />
      </View>

      <PencilKitView
        ref={canvasRef}
        style={styles.canvas}
        pageTransformEnabled={false}
      />

      <View style={styles.footer}>
        <Button
          label={ready ? "Strumenti Apple attivi" : "Caricamento…"}
          small
          variant={ready ? "primary" : "secondary"}
          onPress={() => canvasRef.current?.showColorPicker()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  canvas: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  footer: {
    padding: 12,
  },
});
