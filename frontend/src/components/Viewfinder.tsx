import { uploadImage } from "@/src/api";
import { useItemMutations } from "@/src/hooks";
import { useHub, useProjectCamera } from "@/src/hub";
import ViewfinderScreen from "@/src/components/viewfinder/ViewfinderScreen";

// Il Director’s viewfinder dentro un progetto: stessa esperienza dello
// strumento libero, ma ogni scatto diventa una Reference del progetto.
export default function Viewfinder() {
  const { project, go } = useHub();
  const [camera, setCamera] = useProjectCamera(project.id);
  const refs = useItemMutations(project.id, "reference");

  const salva = async (uri: string, video: boolean, info: string) => {
    const path = await uploadImage({
      uri,
      fileName: `viewfinder-${Date.now()}.${video ? "mp4" : "jpg"}`,
      mimeType: video ? "video/mp4" : "image/jpeg",
    });
    await refs.create.mutateAsync({
      title: `Viewfinder ${info.split(" · ")[0]}${video ? " (video)" : ""}`,
      data: { immagine: path, tipo: "Viewfinder", note: info },
    });
  };

  return (
    <ViewfinderScreen
      camera={camera}
      setCameraId={setCamera}
      onSave={salva}
      onExit={() => go("overview")}
      sottoTitolo={`${project.title} · ogni scatto va nelle Reference`}
      notaSalvataggio="Ogni scatto finisce nelle Reference del progetto."
    />
  );
}
