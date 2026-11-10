import { dataIso, dataLeggibile } from "@/src/dates";

// Quello che serve per leggere e ordinare una giornata di lavorazione.
export function datiGiornata(item: { data: Record<string, any> }) {
  const data = dataIso(item.data?.data);
  return {
    data,
    etichetta: data ? dataLeggibile(data) : "",
  };
}
