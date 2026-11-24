'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Camera, Clock, Download, Loader2, MapPin, RefreshCw, Search } from 'lucide-react';
import { APP_NAME, canvasToJpeg, drawStamp, type StampData } from './stamp';
import { flagUrlFor, placeFromCoords, reversePlace, searchPlaces, type PlaceHit } from './geo';

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

const INITIAL_VIEW_LAT = 22.9734;
const INITIAL_VIEW_LON = 78.6569;
const ROBOTO_LINK_ID = 'nyx-roboto-font';

export default function GpsMapCameraPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);

  const programmaticQuery = useRef<string | null>(null);
  const geoReq = useRef(0);
  const geoAbort = useRef<AbortController | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState<PlaceHit | null>(null);
  const [mapLat, setMapLat] = useState(INITIAL_VIEW_LAT);
  const [mapLon, setMapLon] = useState(INITIAL_VIEW_LON);
  const [dateValue, setDateValue] = useState('2026-01-01');
  const [timeValue, setTimeValue] = useState('12:00');
  const [gmtOffset, setGmtOffset] = useState('+05:30');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  const setQueryQuiet = (value: string) => {
    programmaticQuery.current = value;
    setQuery(value);
  };

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
    if (document.getElementById(ROBOTO_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = ROBOTO_LINK_ID;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const now = new Date();
    setDateValue(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setTimeValue(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await onMapPick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    drawStamp(canvas, photo, stampData, () => cancelled)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stampData, ready]);

  useEffect(() => {
    if (query === programmaticQuery.current) {
      setHits([]);
      setSearchError('');
      setSearching(false);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearchError('');
      setSearching(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const results = await searchPlaces(q, ctrl.signal);
        if (cancelled) return;
        setHits(results);
        if (results.length === 0) setSearchError('No location found.');
      } catch (e: any) {
        if (cancelled || e?.name === 'AbortError') return;
        setSearchError('Search failed, please try again.');
        setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const applyPlace = (hit: PlaceHit) => {
    geoReq.current++;
    geoAbort.current?.abort();
    setGeoBusy(false);

    setSelected(hit);
    setMapLat(hit.lat);
    setMapLon(hit.lon);
    setHits([]);
    setQueryQuiet(hit.locationName);
  };

  const onMapPick = async (lat: number, lon: number) => {
    const id = ++geoReq.current;
    geoAbort.current?.abort();
    const ctrl = new AbortController();
    geoAbort.current = ctrl;

    setMapLat(lat);
    setMapLon(lon);
    setHits([]);
    setGeoBusy(true);
    setSelected(placeFromCoords(lat, lon));
    try {
      const hit = await reversePlace(lat, lon, ctrl.signal);
      if (id !== geoReq.current) return;
      setSelected(hit);
      setQueryQuiet(hit.locationName);
    } catch {
      /* aborted */
    } finally {
      if (id === geoReq.current) setGeoBusy(false);
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
    if (!canvas || !selected || busy) return;
    const a = document.createElement('a');
    a.download = `IMG_${Date.now()}.jpg`;
    a.href = canvasToJpeg(canvas, 0.95);
    a.click();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#123024_0%,_#0b1220_45%,_#070b14_100%)] p-4 sm:p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            {APP_NAME}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">GPS Map Camera</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Search for a location or drag the pin on the map. Coordinates, address, and timestamp update automatically.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl sm:p-6">
            {!imageSrc ? (
              <label className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center transition hover:border-emerald-500 hover:bg-emerald-500/5">
                <div className="mb-4 rounded-2xl bg-emerald-500/15 p-4 text-emerald-400">
                  <Camera className="h-10 w-10" />
                </div>
                <div className="text-lg font-bold text-white">Upload Photo</div>
                <div className="mt-1 text-sm text-slate-400">JPG, PNG, WEBP</div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    onUpload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-black p-2">
                  <canvas ref={canvasRef} className="mx-auto block max-h-[70vh] w-full rounded-xl object-contain" />
                  {!selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center text-sm font-bold text-white">
                      Please search or select a location on the map
                    </div>
                  )}
                  {busy && selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
                      Rendering stamp...
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setImageSrc(null)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Another photo
                  </button>
                  <button
                    type="button"
                    onClick={onDownload}
                    disabled={!selected || busy}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    Download JPG
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl">
            <Field label="Search Location">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputClass} pl-9 pr-9`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hits[0]) applyPlace(hits[0]);
                  }}
                  placeholder="Search place or paste Google Map link"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />
                )}
              </div>
            </Field>

            {searchError && <p className="text-xs font-medium text-rose-400">{searchError}</p>}

            {hits.length > 0 && (
              <div className="z-50 max-h-40 overflow-auto rounded-xl border border-slate-800 bg-slate-900">
                {hits.map((hit, idx) => (
                  <button
                    key={`${hit.lat}-${hit.lon}-${idx}`}
                    type="button"
                    onClick={() => applyPlace(hit)}
                    className="block w-full cursor-pointer border-b border-slate-800 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-800/70"
                  >
                    <div className="text-sm font-bold text-white">{hit.locationName}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{hit.displayName}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-800">
              <MapPicker lat={mapLat} lon={mapLon} onPick={onMapPick} />
            </div>
            <p className="text-[11px] text-slate-500">
              Click on the map or drag the pin. Layers: Satellite / Hybrid / Map.
              {geoBusy ? ' Loading address...' : ''}
            </p>

            {selected && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-slate-300">
                <div className="font-bold text-white">{selected.locationName}</div>
                <div className="mt-1">{selected.address}</div>
                <div className="mt-1 font-mono text-emerald-300">
                  Lat {selected.latitude}° Long {selected.longitude}°
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input type="date" className={inputClass} value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
              </Field>
              <Field label="Time">
                <input type="time" className={inputClass} value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
              </Field>
            </div>

            <Field label="GMT Offset">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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