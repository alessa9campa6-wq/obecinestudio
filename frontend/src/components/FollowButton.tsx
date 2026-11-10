import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/api";
import { Button, toast } from "@/src/ui";

type Props = { userId: string; following: boolean; label?: boolean };

// Segui / smetti di seguire, con l'elenco aggiornato subito.
export default function FollowButton({ userId, following, label }: Props) {
  const qc = useQueryClient();
  const segui = useMutation({
    mutationFn: () => api(`/users/${userId}/follow`, { method: following ? "DELETE" : "POST" }),
    onSuccess: () => {
      for (const chiave of ["suggested", "profile", "feed"]) void qc.invalidateQueries({ queryKey: [chiave] });
    },
    onError: (e: Error) => toast(e.message, "error"),
  });
  return (
    <Button
      testID={`follow-${userId}`}
      label={label ? (following ? "Segui già" : "Segui") : undefined}
      icon={following ? "account-check-outline" : "account-plus-outline"}
      variant={following ? "secondary" : "primary"}
      loading={segui.isPending}
      onPress={() => segui.mutate()}
    />
  );
}
