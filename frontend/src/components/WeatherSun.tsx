import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { useItems } from "@/src/hooks";
import { useHub, ModuleHeader, ModuleScroll } from "@/src/hub";
import { ModuleDef } from "@/src/modules";
import { exportHtml, wrap } from "@/src/pdf";
import { compass, hhmm, sunPosition, sunTimes } from "@/src/sun";
import { fonts, radius, spacing, useTheme } from "@/src/theme";
import { Button, Card, Chip, ChipRow, Field, Icon, IconName, toast, useStyles } from "@/src/ui";
import { storage } from "@/src/utils/storage";

type Loc = { name: string; lat: number; lng: number; country?: string };
const WMO: Record<number, [string, IconName]> = {
  0: ["Sereno", "weather-sunny"], 1: ["Poco nuvoloso", "weather-partly-cloudy"], 2: ["Parz. nuvoloso", "weather-partly-cloudy"], 3: ["Coperto", "weather-cloudy"],
  45: ["Nebbia", "weather-fog"], 48: ["Nebbia", "weather-fog"], 51: ["Pioviggine", "weather-rainy"], 53: ["Pioviggine", "weather-rainy"], 55: ["Pioviggine", "weather-rainy"],
  61: ["Pioggia", "weather-pouring"], 63: ["Pioggia", "weather-pouring"], 65: ["Pioggia forte", "weather-pouring"], 71: ["Neve", "weather-snowy"], 73: ["Neve", "weather-snowy"], 75: ["Neve", "weather-snowy-heavy"],
  80: ["Rovesci", "weather-rainy"], 81: ["Rovesci", "weather-rainy"], 82: ["Rovesci forti", "weather-pouring"], 95: ["Temporale", "weather-lightning"], 96: ["Temporale", "weather-lightning-rainy"], 99: ["Temporale", "weather-lightning-rainy"],
};
const wmo = (c: number) => WMO[c] ?? ["—", "weather-cloudy"];

function SunChart({ loc, date, off }: { loc: Loc; date: Date; off: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const H = 180;
  const mid = 120;
  const ld = new Date(date.getTime() + off * 1000);
  const base = new Date(Date.UTC(ld.getUTCFullYear(), ld.getUTCMonth(), ld.getUTCDate()) - off * 1000);
  const pts: string[] = [];
  for (let m = 0; m <= 24 * 60; m += 15) {
    const alt = sunPosition(new Date(base.getTime() + m * 60000), loc.lat, loc.lng).altitude;
    pts.push(`${m ? "L" : "M"}${((m / 1440) * w).toFixed(1)} ${(mid - alt * 1.2).toFixed(1)}`);
  }
  const now = new Date();
  const ln = new Date(now.getTime() + off * 1000);
  const isToday = ln.toISOString().slice(0, 10) === ld.toISOString().slice(0, 10);
  const cur = sunPosition(now, loc.lat, loc.lng);
  const nx = ((ln.getUTCHours() * 60 + ln.getUTCMinutes()) / 1440) * w;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} testID="sun-chart">
      {w > 0 && (
        <Svg width={w} height={H}>
          <Rect x={0} y={mid - 6 * 1.2} width={w} height={(6 + 4) * 1.2} fill={colors.brandTertiary} />
          <Line x1={0} y1={mid} x2={w} y2={mid} stroke={colors.borderStrong} strokeWidth={1} />
          {[6, 12, 18].map((h) => (
            <SvgText key={h} x={(h / 24) * w} y={H - 4} fill={colors.muted} fontSize={10} textAnchor="middle">{`${h}:00`}</SvgText>
          ))}
          <Path d={pts.join(" ")} stroke={colors.brandPrimary} strokeWidth={2.5} fill="none" />
          {isToday && <Circle cx={nx} cy={mid - cur.altitude * 1.2} r={6} fill={colors.warning} />}
        </Svg>
      )}
    </View>
  );
}

function Compass({ loc, date }: { loc: Loc; date: Date }) {
  const { colors } = useTheme();
  const t = sunTimes(date, loc.lat, loc.lng);
  const R = 70;
  const c = 85;
  const pt = (az: number, r = R) => ({ x: c + r * Math.sin((az * Math.PI) / 180), y: c - r * Math.cos((az * Math.PI) / 180) });
  const rise = t.sunrise ? sunPosition(t.sunrise, loc.lat, loc.lng).azimuth : null;
  const set = t.sunset ? sunPosition(t.sunset, loc.lat, loc.lng).azimuth : null;
  const noon = sunPosition(t.solarNoon, loc.lat, loc.lng);
  const now = sunPosition(new Date(), loc.lat, loc.lng);
  return (
    <Svg width={170} height={170} testID="sun-compass">
      <Circle cx={c} cy={c} r={R} stroke={colors.borderStrong} strokeWidth={1} fill="none" />
      {["N", "E", "S", "O"].map((l, i) => {
        const p = pt(i * 90, R + 10);
        return <SvgText key={l} x={p.x} y={p.y + 4} fill={colors.muted} fontSize={11} textAnchor="middle">{l}</SvgText>;
      })}
      {rise !== null && <Line x1={c} y1={c} x2={pt(rise).x} y2={pt(rise).y} stroke={colors.warning} strokeWidth={2} />}
      {set !== null && <Line x1={c} y1={c} x2={pt(set).x} y2={pt(set).y} stroke={colors.error} strokeWidth={2} />}
      <Line x1={c} y1={c} x2={pt(noon.azimuth, R * 0.6).x} y2={pt(noon.azimuth, R * 0.6).y} stroke={colors.brandPrimary} strokeWidth={2} />
      {now.altitude > 0 && <Circle cx={pt(now.azimuth).x} cy={pt(now.azimuth).y} r={6} fill={colors.brandPrimary} />}
    </Svg>
  );
}

export default function WeatherSun({ def }: { def: ModuleDef }) {
  const { project } = useHub();
  const { colors } = useTheme();
  const s = useStyles();
  const key = `meteo_loc_${project.id}`;
  const locations = useItems(project.id, "location");
  const [loc, setLoc] = useState<Loc | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Loc[]>([]);
  const [searching, setSearching] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);

  useEffect(() => {
    storage.getItem(key, null).then((v) => {
      if (typeof v === "string") setLoc(JSON.parse(v));
    });
  }, [key]);

  const forecast = useQuery({
    queryKey: ["weather", loc?.lat, loc?.lng],
    enabled: !!loc,
    queryFn: async () => {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc!.lat}&longitude=${loc!.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,cloud_cover_mean&timezone=auto&forecast_days=14`);
      if (!r.ok) throw new Error("Meteo non disponibile");
      return (await r.json()) as { daily: Record<string, any[]>; utc_offset_seconds: number };
    },
  });

  const search = async (text?: string) => {
    const term = (text ?? query).trim();
    if (!term) return;
    setSearching(true);
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=6&language=it`);
      const j = await r.json();
      setResults((j.results ?? []).map((x: any) => ({ name: `${x.name}${x.admin1 ? ", " + x.admin1 : ""}`, lat: x.latitude, lng: x.longitude, country: x.country })));
      if (!j.results?.length) toast("Nessun luogo trovato", "error");
    } catch {
      toast("Ricerca non riuscita", "error");
    } finally {
      setSearching(false);
    }
  };
  const choose = (l: Loc) => {
    setLoc(l);
    setResults([]);
    setQuery("");
    setDayIdx(0);
    storage.setItem(key, JSON.stringify(l));
  };

  const date = new Date();
  date.setDate(date.getDate() + dayIdx);
  date.setHours(12, 0, 0, 0);
  const t = loc ? sunTimes(date, loc.lat, loc.lng) : null;
  const noonAlt = loc && t ? sunPosition(t.solarNoon, loc.lat, loc.lng).altitude : 0;
  const d = forecast.data?.daily;
  const off = forecast.data?.utc_offset_seconds;
  const hm = (x: Date | null) => hhmm(x, off);

  const exportPdf = () => {
    if (!loc || !t) return;
    const rows = [
      ["Alba", hm(t.sunrise)], ["Tramonto", hm(t.sunset)], ["Mezzogiorno solare", `${hm(t.solarNoon)} (${noonAlt.toFixed(0)}°)`],
      ["Golden hour mattina", `${hm(t.sunrise)} – ${hm(t.goldenEndMorning)}`], ["Golden hour sera", `${hm(t.goldenStartEvening)} – ${hm(t.sunset)}`],
      ["Blue hour mattina", `${hm(t.blueStartMorning)} – ${hm(t.sunrise)}`], ["Blue hour sera", `${hm(t.sunset)} – ${hm(t.blueEndEvening)}`],
    ];
    const w = d ? `<h2>Previsioni</h2><table><tr><th>Data</th><th>Meteo</th><th>Min/Max</th><th>Pioggia</th><th>Vento</th></tr>${d.time.map((x: string, i: number) => `<tr><td>${x}</td><td>${wmo(d.weather_code[i])[0]}</td><td>${d.temperature_2m_min[i]}° / ${d.temperature_2m_max[i]}°</td><td>${d.precipitation_probability_max[i] ?? "—"}%</td><td>${d.wind_speed_10m_max[i]} km/h</td></tr>`).join("")}</table>` : "";
    exportHtml("Meteo & sole", wrap(`Meteo & sole · ${loc.name}`, `<h2>${date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</h2><table>${rows.map((r) => `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join("")}</table>${w}`, project.title));
  };

  return (
    <View style={{ flex: 1 }}>
      <ModuleHeader def={def} subtitle={loc ? `${loc.name}${loc.country ? " · " + loc.country : ""}` : "Previsioni, golden hour e percorso del sole"} right={<Button testID="weather-export-pdf" icon="file-pdf-box" variant="secondary" disabled={!loc} onPress={exportPdf} />} />
      <ModuleScroll>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field testID="weather-search-input" label="Cerca location" value={query} onChangeText={setQuery} placeholder="es. Matera" />
          </View>
          <Button testID="weather-search-button" icon="magnify" onPress={() => search()} loading={searching} />
        </View>
        {(locations.data ?? []).length > 0 && (
          <ChipRow>
            {(locations.data ?? []).map((l) => (
              <Chip
                key={l.id}
                testID={`weather-project-location-${l.id}`}
                icon="map-marker-outline"
                label={l.title}
                onPress={() => {
                  const t = String(l.data.indirizzo || l.title).split(",").slice(-1)[0].trim();
                  setQuery(t);
                  search(t);
                }}
              />
            ))}
          </ChipRow>
        )}
        {results.map((r, i) => (
          <Pressable key={i} testID={`weather-result-${i}`} onPress={() => choose(r)} style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <Icon name="map-marker" color={colors.brandPrimary} />
            <Text style={s.body}>{r.name} · {r.country}</Text>
          </Pressable>
        ))}
        {!loc ? (
          <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl }}>
            <Icon name="weather-sunset" size={40} color={colors.brandPrimary} />
            <Text style={s.h3}>Scegli una location</Text>
            <Text style={[s.muted, { textAlign: "center" }]}>Vedrai meteo fino a 14 giorni, alba, tramonto, golden e blue hour e la traiettoria del sole.</Text>
          </Card>
        ) : (
          <>
            {forecast.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : d ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {d.time.map((x: string, i: number) => {
                  const [label, icon] = wmo(d.weather_code[i]);
                  const sel = i === dayIdx;
                  return (
                    <Pressable key={x} testID={`weather-day-${i}`} onPress={() => setDayIdx(i)} style={{ width: 104, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: sel ? colors.brandPrimary : colors.border, backgroundColor: sel ? colors.brandTertiary : colors.surfaceSecondary, alignItems: "center", gap: 2 }}>
                      <Text style={[s.muted, { color: sel ? colors.onBrandTertiary : colors.muted }]}>{new Date(x).toLocaleDateString("it-IT", { weekday: "short", day: "numeric" })}</Text>
                      <Icon name={icon} size={28} color={sel ? colors.onBrandTertiary : colors.brandPrimary} />
                      <Text style={[s.h3, { fontSize: 14, color: sel ? colors.onBrandTertiary : colors.onSurface }]}>{Math.round(d.temperature_2m_min[i])}° / {Math.round(d.temperature_2m_max[i])}°</Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: fonts.text, color: sel ? colors.onBrandTertiary : colors.muted }}>{label}</Text>
                      <Text style={{ fontSize: 11, fontFamily: fonts.text, color: sel ? colors.onBrandTertiary : colors.muted }}>☂ {d.precipitation_probability_max[i] ?? 0}% · {Math.round(d.wind_speed_10m_max[i])} km/h</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Button label="Riprova meteo" onPress={() => forecast.refetch()} />
            )}
            {t && (
              <Card style={{ gap: spacing.md }}>
                <Text style={s.h3}>Sole · {date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
                  {[
                    ["Alba", hm(t.sunrise), "weather-sunset-up"],
                    ["Tramonto", hm(t.sunset), "weather-sunset-down"],
                    ["Mezzogiorno", `${hm(t.solarNoon)} · ${noonAlt.toFixed(0)}°`, "white-balance-sunny"],
                    ["Golden mattina", `${hm(t.sunrise)}–${hm(t.goldenEndMorning)}`, "weather-sunny-alert"],
                    ["Golden sera", `${hm(t.goldenStartEvening)}–${hm(t.sunset)}`, "weather-sunny-alert"],
                    ["Blue hour sera", `${hm(t.sunset)}–${hm(t.blueEndEvening)}`, "weather-night"],
                  ].map(([l, v, ic]) => (
                    <View key={l} style={{ minWidth: 150, gap: 2 }}>
                      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                        <Icon name={ic as IconName} size={16} color={colors.brandPrimary} />
                        <Text style={s.label}>{l}</Text>
                      </View>
                      <Text testID={`sun-${l}`} style={[s.h3, { fontSize: 16 }]}>{v}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.label}>Altezza del sole nel giorno</Text>
                <SunChart loc={loc} date={date} off={off ?? -new Date().getTimezoneOffset() * 60} />
                <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center", flexWrap: "wrap" }}>
                  <Compass loc={loc} date={date} />
                  <View style={{ gap: spacing.xs, flex: 1, minWidth: 180 }}>
                    <Text style={s.body}>Direzione alba: {t.sunrise ? `${sunPosition(t.sunrise, loc.lat, loc.lng).azimuth.toFixed(0)}° ${compass(sunPosition(t.sunrise, loc.lat, loc.lng).azimuth)}` : "—"}</Text>
                    <Text style={s.body}>Direzione tramonto: {t.sunset ? `${sunPosition(t.sunset, loc.lat, loc.lng).azimuth.toFixed(0)}° ${compass(sunPosition(t.sunset, loc.lat, loc.lng).azimuth)}` : "—"}</Text>
                    <Text style={s.muted}>Linea arancio = alba, rossa = tramonto, oro = sole a mezzogiorno. Punto = posizione attuale.</Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}
      </ModuleScroll>
    </View>
  );
}
