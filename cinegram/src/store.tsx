import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { LAVORI } from "@/data";
import type { ScreenName } from "@/ui";

export type Impostazioni = {
  portfolio: boolean;
  chiVede: "tutti" | "follower" | "soloIo";
  notificheMessaggi: boolean;
  notificheCommenti: boolean;
  notificheScadenze: boolean;
};

export type Lavoro = { id: string; titolo: string; tipo: string; anno: string; img: string };
export type Evento = { id: string; data: string; ora: string; titolo: string; tipo: string };

const iso = (giorni: number) => {
  const d = new Date();
  d.setDate(d.getDate() + giorni);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Ctx = {
  screen: ScreenName;
  go: (s: ScreenName) => void;
  imp: Impostazioni;
  setImp: (patch: Partial<Impostazioni>) => void;
  lavori: Lavoro[];
  pubblica: (l: Omit<Lavoro, "id">) => void;
  eventi: Evento[];
};

const Contesto = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenName>("oggi");
  const [imp, setStato] = useState<Impostazioni>({
    portfolio: true,
    chiVede: "tutti",
    notificheMessaggi: true,
    notificheCommenti: true,
    notificheScadenze: true,
  });
  const [lavori, setLavori] = useState<Lavoro[]>(LAVORI);

  const eventi = useMemo<Evento[]>(
    () => [
      { id: "e1", data: iso(0), ora: "06:30", titolo: "Giorno 4 · riprese", tipo: "Ripresa" },
      { id: "e2", data: iso(0), ora: "18:00", titolo: "Sopralluogo location notte", tipo: "Altro" },
      { id: "e3", data: iso(1), ora: "09:30", titolo: "Prove con il cast", tipo: "Altro" },
      { id: "e4", data: iso(3), ora: "07:00", titolo: "Giorno 5 · riprese", tipo: "Ripresa" },
      { id: "e5", data: iso(5), ora: "10:00", titolo: "Consegna rough cut", tipo: "Scadenza" },
      { id: "e6", data: iso(-2), ora: "08:00", titolo: "Giorno 3 · riprese", tipo: "Ripresa" },
    ],
    []
  );

  const valore: Ctx = {
    screen,
    go: setScreen,
    imp,
    setImp: (patch) => setStato((s) => ({ ...s, ...patch })),
    lavori,
    pubblica: (l) => setLavori((a) => [{ ...l, id: `l${Date.now()}` }, ...a]),
    eventi,
  };

  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function useApp() {
  const ctx = useContext(Contesto);
  if (!ctx) throw new Error("useApp fuori dal provider");
  return ctx;
}
