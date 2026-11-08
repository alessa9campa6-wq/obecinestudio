// One QueryClient for the whole app; the provider in app/_layout.tsx uses
// this instance. Import it for cache calls outside components, for example
// queryClient.invalidateQueries or setQueryData in websocket or push
// handlers; inside components useQueryClient() returns this same instance.
import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

// I progetti, i moduli e gli elementi vivono sul server (Mongo): la cache è
// soltanto una copia. Al ritorno in primo piano la rivalidiamo, così quello che
// è stato modificato da un altro dispositivo compare senza riavviare l'app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// React Native non emette focus/visibilitychange: colleghiamo il focus manager
// di React Query allo stato dell'app. Senza questo, su iOS/Android la cache non
// viene mai rivalidata quando l'app torna attiva.
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => sub.remove();
  });
}
