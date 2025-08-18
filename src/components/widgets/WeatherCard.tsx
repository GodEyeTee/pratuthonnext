// src/components/widgets/WeatherCard.tsx
import { ChevronRight } from 'lucide-react';
import { refreshWeatherTag } from './weather.actions';

type WeatherCardProps = {
  title?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  days?: number;
  revalidateSeconds?: number;
};

type OpenMeteoResponse = {
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    weathercode?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weathercode?: number[];
    precipitation_sum?: number[];
  };
};

function codeToLabel(code?: number) {
  if (code == null) return '—';
  if (code === 0) return 'Clear';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return '—';
}
function codeToEmoji(code?: number) {
  if (code == null) return '·';
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '·';
}
function codeToGradient(code?: number) {
  if (code == null) return 'from-slate-600/60 via-slate-700/60 to-slate-900/70';
  if (code === 0) return 'from-amber-400/30 via-orange-500/30 to-pink-500/30';
  if ([1, 2].includes(code))
    return 'from-sky-400/30 via-indigo-500/30 to-violet-600/30';
  if (code === 3) return 'from-slate-500/30 via-slate-600/30 to-slate-800/40';
  if ([45, 48].includes(code))
    return 'from-zinc-500/30 via-zinc-700/30 to-slate-800/40';
  if ([51, 53, 55, 56, 57].includes(code))
    return 'from-sky-500/30 via-cyan-500/30 to-blue-600/30';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return 'from-blue-500/30 via-indigo-600/30 to-violet-700/30';
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return 'from-cyan-200/30 via-blue-300/30 to-indigo-400/30';
  if ([95, 96, 99].includes(code))
    return 'from-violet-500/30 via-fuchsia-500/30 to-rose-600/30';
  return 'from-slate-600/30 via-slate-700/30 to-slate-900/40';
}
function formatDay(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' });
}
function tiny(id: string) {
  return id.replace(/\./g, '_');
}

/** สีของแท่งตามช่วงอุณหภูมิ (°C) — ร้อนแดง, อุ่นส้ม, สบายเขียว, เย็นฟ้า, หนาวคราม */
function tempToBarGradient(t: number) {
  if (t >= 35) return 'from-rose-600 to-orange-500'; // Hot (แดงส้ม)
  if (t >= 28) return 'from-orange-500 to-amber-400'; // Warm (ส้ม)
  if (t >= 22) return 'from-emerald-500 to-lime-400'; // Pleasant (เขียว)
  if (t >= 16) return 'from-sky-500 to-cyan-400'; // Cool (ฟ้า)
  return 'from-indigo-500 to-blue-600'; // Cold (คราม/น้ำเงิน)
}

export default async function WeatherCard({
  title = 'Weather',
  locationName,
  latitude,
  longitude,
  timezone = 'Asia/Bangkok',
  days = 7,
  revalidateSeconds = 1800,
}: WeatherCardProps) {
  const cacheTag = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${timezone}`;
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    current_weather: 'true',
    hourly: ['temperature_2m', 'weathercode'].join(','),
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
    ].join(','),
    forecast_days: String(Math.min(Math.max(days, 1), 16)),
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: revalidateSeconds, tags: [cacheTag] },
  });
  if (!res.ok) {
    return (
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm text-muted-foreground">Weather unavailable</div>
      </div>
    );
  }
  const data = (await res.json()) as OpenMeteoResponse;

  const cw = data.current_weather;
  const nowT = cw?.temperature ?? null;
  const nowCode = cw?.weathercode;
  const nowWind = cw?.windspeed ?? null;
  const updated = cw?.time ? new Date(cw.time) : null;

  // 8 ชม.ถัดไป
  const hours: { t: string; v: number; c?: number }[] = [];
  if (data.hourly?.time && data.hourly.temperature_2m) {
    const list = data.hourly.time.map((t, i) => ({
      t,
      v: data.hourly!.temperature_2m![i] ?? 0,
      c: data.hourly!.weathercode?.[i],
    }));
    const idx = list.findIndex(x => new Date(x.t) >= new Date());
    const start = Math.max(0, idx);
    list
      .slice(start, start + 8)
      .forEach(h => hours.push({ t: h.t, v: h.v, c: h.c }));
  }
  const minH = Math.min(...(hours.length ? hours.map(h => h.v) : [0, 1]));
  const maxH = Math.max(...(hours.length ? hours.map(h => h.v) : [0, 1]));
  const spanH = Math.max(1, maxH - minH);

  const grad = codeToGradient(nowCode);
  const headerId = tiny(cacheTag);

  // server action เพื่อ refresh cache
  async function doRevalidate() {
    'use server';
    await refreshWeatherTag(cacheTag);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 dark:border-white/10 bg-gradient-to-br ${grad}
                  shadow-[0_10px_40px_-12px_rgba(0,0,0,.45)] backdrop-blur supports-[backdrop-filter]:backdrop-blur`}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-white/70">{title}</div>
          <div className="mt-0.5 text-2xl font-semibold text-white drop-shadow">
            {locationName ??
              `Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`}
          </div>
          <div className="text-[11px] text-white/70">
            {timezone}{' '}
            {updated
              ? `• updated ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </div>
        </div>
        <div className="shrink-0">
          <form action={doRevalidate}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-2 text-sm hover:bg-white/20 active:scale-95 transition-all"
              title="Refresh now"
              aria-label="Refresh weather"
              formAction={doRevalidate}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M21 12a9 9 0 1 1-3-6.708"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M21 4v6h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              Refresh
            </button>
          </form>
        </div>
      </div>

      {/* Current */}
      <div className="px-5 pb-1">
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-white drop-shadow">
            {nowT != null ? Math.round(nowT) : '—'}°C
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white/90">
              {codeToLabel(nowCode)}
            </div>
            <div className="text-xs text-white/70">
              {nowWind != null ? `Wind ${Math.round(nowWind)} km/h` : ' '}
            </div>
          </div>
          <div className="relative">
            <div className="text-5xl">{codeToEmoji(nowCode)}</div>
          </div>
        </div>
      </div>

      {/* Hourly bars (Next 8 hours) — สีตามช่วงอุณหภูมิ */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-[11px] text-white/70 mb-2">
          <span>Today</span>
          <span className="inline-flex items-center">
            Next 8 hours <ChevronRight className="h-3 w-3 ml-1" />
          </span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {hours.map((h, i) => {
            const pct = ((h.v - minH) / spanH) * 100;
            const gradBar = tempToBarGradient(h.v);
            return (
              <div
                key={`${headerId}-h-${i}`}
                className="rounded-2xl p-2 bg-white/10 text-white shadow-inner"
              >
                <div className="text-center text-[10px] mb-1">
                  {new Date(h.t).toLocaleTimeString([], { hour: '2-digit' })}
                </div>
                <div className="h-16 w-full rounded-md bg-white/10 overflow-hidden flex items-end">
                  <div
                    className={`w-full bg-gradient-to-t ${gradBar}`}
                    style={{ height: `${Math.max(10, pct)}%` }}
                    title={`${Math.round(h.v)}°C`}
                  />
                </div>
                <div className="mt-1 text-center text-xs">
                  {Math.round(h.v)}°
                </div>
              </div>
            );
          })}
        </div>

        {/* legend เล็กๆ */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/80">
          <LegendDot cls="from-rose-600 to-orange-500" label="Hot ≥ 35°" />
          <LegendDot cls="from-orange-500 to-amber-400" label="Warm 28–34°" />
          <LegendDot
            cls="from-emerald-500 to-lime-400"
            label="Pleasant 22–27°"
          />
          <LegendDot cls="from-sky-500 to-cyan-400" label="Cool 16–21°" />
          <LegendDot cls="from-indigo-500 to-blue-600" label="Cold ≤ 15°" />
        </div>
      </div>

      {/* 7-day outlook */}
      <div className="px-5 pb-5">
        <div className="text-[11px] text-white/70 mb-2">
          Next {Math.min(days, 7)} days
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {data.daily?.time?.slice(0, Math.min(days, 7)).map((d, i) => {
            const tmax = data.daily!.temperature_2m_max?.[i] ?? null;
            const tmin = data.daily!.temperature_2m_min?.[i] ?? null;
            const code = data.daily!.weathercode?.[i];
            const g = codeToGradient(code);
            return (
              <div
                key={`${headerId}-d-${i}`}
                className={`rounded-2xl p-3 text-white bg-gradient-to-br ${g} border border-white/10`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-white/80">
                    {formatDay(d)}
                  </div>
                  <div className="text-lg">{codeToEmoji(code)}</div>
                </div>
                <div className="mt-1 text-sm font-medium">
                  {tmin != null && tmax != null
                    ? `${Math.round(tmin)}° / ${Math.round(tmax)}°`
                    : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`h-3 w-3 rounded-full bg-gradient-to-br ${cls} ring-1 ring-white/40`}
      />
      <span>{label}</span>
    </span>
  );
}
