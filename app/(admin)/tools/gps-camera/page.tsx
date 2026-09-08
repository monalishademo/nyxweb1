'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Camera, Clock, Download, Loader2, MapPin, RefreshCw, Search } from 'lucide-react';
import { canvasToJpeg, drawStamp, type StampData } from './stamp';
import { flagUrlFor, reversePlace, searchPlaces, type PlaceHit } from './geo';

// SSR Error এড়ানোর জন্য MapPicker ডাইনামিক ইমপোর্ট করা হলো
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatStampDate(date: Date, gmtOffset: string) {
  const day = WEEKDAYS[date.getDay()];
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}, ${dd}/${mm}/${yyyy} ${pad(hours)}:${minutes} ${ampm} GMT ${gmtOffset}`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

const DEFAULT_LAT = 22.584861;
const DEFAULT_LON = 87.049663;

export default function AdminGpsCameraPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const searchTimer = useRef<number | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState<PlaceHit | null>(null);
  const [mapLat, setMapLat] = useState(DEFAULT_LAT);
  const [mapLon, setMapLon] = useState(DEFAULT_LON);
  const [dateValue, setDateValue] = useState('2026-07-15');
  const [timeValue, setTimeValue] = useState('14:49');
  const [gmtOffset, setGmtOffset] = useState('+05:30');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  const dateTime = useMemo(() => {
    const [y, m, d] = dateValue.split('-').map(Number);
    const [hh, mm] = timeValue.split(':').map(Number);
    const dt = new Date(y || 2026, (m || 1) - 1, d || 1, hh || 0, mm || 0);
    return formatStampDate(dt, gmtOffset);
  }, [dateValue, timeValue, gmtOffset]);

  const stampData: StampData | null = useMemo(() => {
    if (!selected) return null;
    return {
      locationName: selected.locationName,
      address: selected.address,
      latitude: selected.latitude,
      longitude: selected.longitude,
      dateTime,
      flagUrl: flagUrlFor(selected.countryCode),
    };
  }, [selected, dateTime]);

  useEffect(() => {
    reversePlace(DEFAULT_LAT, DEFAULT_LON).then((hit) => {
      setSelected(hit);
      setQuery(hit.locationName);
    });
  }, []);

  useEffect(() => {
    if (!imageSrc) {
      setReady(false);
      photoRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      photoRef.current = img;
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    if (!canvas || !photo || !ready || !stampData) return;
    let cancelled = false;
    setBusy(true);
    drawStamp(canvas, photo, stampData).then(() => {
      if (!cancelled) setBusy(false);
    });
    return () => {
      cancelled = true;
    };
  }, [stampData, ready]);

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError('');
      return;
    }
    searchTimer.current = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const results = await searchPlaces(q);
        setHits(results);
        if (results.length === 0) setSearchError('Kono jaiga paoa jayni');
      } catch {
        setSearchError('Search fail hoyeche, abar try koro');
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query]);

  const applyPlace = (hit: PlaceHit) => {
    setSelected(hit);
    setMapLat(hit.lat);
    setMapLon(hit.lon);
    setHits([]);
    setQuery(hit.locationName);
  };

  const onMapPick = async (lat: number, lon: number) => {
    setMapLat(lat);
    setMapLon(lon);
    setGeoBusy(true);
    try {
      const hit = await reversePlace(lat, lon);
      setSelected(hit);
      setQuery(hit.locationName);
    } finally {
      setGeoBusy(false);
    }
  };

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const a = document.createElement('a');
    a.download = `GPSMapCamera_${Date.now()}.jpg`;
    a.href = canvasToJpeg(canvas, 0.95);
    a.click();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#123024_0%,_#0b1220_45%,_#070b14_100%)] p-4 sm:p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            GPS Map Camera Stamp
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Custom GPS Photo Stamp
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Map e search koro ba pin drag koro. Lat/long auto asbe — tumi sudhu date/time dao.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl sm:p-6">
            {!imageSrc ? (
              <label className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center transition hover:border-emerald-500 hover:bg-emerald-500/5">
                <div className="mb-4 rounded-2xl bg-emerald-500/15 p-4 text-emerald-400">
                  <Camera className="h-10 w-10" />
                </div>
                <div className="text-lg font-bold text-white">Photo upload koro</div>
                <div className="mt-1 text-sm text-slate-400">JPG, PNG, WEBP</div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center p-2">
                  <canvas ref={canvasRef} className="mx-auto block max-h-[70vh] w-full object-contain rounded-xl" />
                  {!selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center text-sm font-bold text-white">
                      Map e jaiga select koro
                    </div>
                  )}
                  {busy && selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
                      Stamp render hocche...
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setImageSrc(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Another photo
                  </button>
                  <button
                    type="button"
                    onClick={onDownload}
                    disabled={!selected}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download JPG
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl">
            <Field label="Jaiga search">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputClass} pl-9 pr-9`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hits[0]) applyPlace(hits[0]);
                  }}
                  placeholder="Lalgarh, West Bengal"
                />
                {searching && (
                  <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />
                )}
              </div>
            </Field>

            {searchError && <p className="text-xs font-medium text-rose-400">{searchError}</p>}

            {hits.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-xl border border-slate-800 bg-slate-900 z-50">
                {hits.map((hit, idx) => (
                  <button
                    key={`${hit.lat}-${hit.lon}-${idx}`}
                    type="button"
                    onClick={() => applyPlace(hit)}
                    className="block w-full border-b border-slate-800 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-800/70 cursor-pointer"
                  >
                    <div className="text-sm font-bold text-white">{hit.locationName}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{hit.displayName}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-800 h-56">
              <MapPicker lat={mapLat} lon={mapLon} onPick={onMapPick} />
            </div>
            <p className="text-[11px] text-slate-500">
              Map e click koro ba pin drag koro. Layers: Satellite / Hybrid / Map.
              {geoBusy ? ' Address load hocche...' : ''}
            </p>

            {selected && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-xs text-slate-300">
                <div className="font-bold text-white">{selected.locationName}</div>
                <div className="mt-1">{selected.address}</div>
                <div className="mt-1 font-mono text-emerald-300">
                  Lat {selected.latitude}° Long {selected.longitude}°
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  className={inputClass}
                  value={dateValue}
                  onChange={(e) => setDateValue(e.target.value)}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  className={inputClass}
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                />
              </Field>
            </div>

            <Field label="GMT offset">
              <div className="relative">
                <Clock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputClass} pl-9`}
                  value={gmtOffset}
                  onChange={(e) => setGmtOffset(e.target.value)}
                  placeholder="+05:30"
                />
              </div>
            </Field>
          </aside>
        </div>
      </div>
    </div>
  );
}