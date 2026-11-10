import { useState } from "react";

import { Camera, findCamera } from "@/src/cameras";
import ViewfinderScreen from "@/src/components/viewfinder/ViewfinderScreen";

// Il mirino del regista senza progetto: si apre dagli strumenti e le foto
// vanno nel rullino del telefono, perché non c'è un progetto che le raccolga.
export default function ViewfinderFree({ onExit }: { onExit?: () => void }) {
  const [camera, setCamera] = useState<Camera>(findCamera(null));

  return (
    <ViewfinderScreen
      camera={camera}
      setCameraId={(id) => setCamera(findCamera(id))}
      onSave={async () => {}}
      onExit={onExit}
      rullinoDefault
      rullinoObbligatorio
      sottoTitolo="Senza progetto: foto e video vanno nel rullino"
      notaSalvataggio="Senza un progetto, scatti e video finiscono nel rullino del telefono."
    />
  );
}
