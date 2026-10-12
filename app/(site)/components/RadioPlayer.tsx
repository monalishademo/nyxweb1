'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Volume2, VolumeX, ChevronDown, Loader2, SkipForward } from 'lucide-react';

type Station = {
  id: string;
  name: string;
  urls: string[]; // ekta na challe porerta try korbe
};

// Station list. Notun station add korte ekta line jog koro.
// http:// stream gulo shudhu localhost e chole; https site e deploy korle block hoy.
const STATIONS: Station[] = [
  // Hindi
  { id: 'mirchi-hindi', name: 'Radio Mirchi Hindi', urls: ['https://eu8.fastcast4u.com/proxy/clyedupq/stream/;', 'https://eu8.fastcast4u.com/proxy/clyedupq/stream'] },
  { id: 'bollywood-purane', name: 'Bollywood Gaane Purane', urls: ['https://stream.zeno.fm/6n6ewddtad0uv'] },
  { id: 'mirchi-top20', name: 'Mirchi Top 20', urls: ['https://drive.uber.radio/uber/bollywoodnow/icecast.audio'] },
  { id: 'hindi-gold', name: 'Hindi Gold Radio', urls: ['https://azuracast.vibesounds.in:8010/radio.mp3'] },
  { id: 'rafi-hits', name: 'Rafi Hit Songs', urls: ['https://stream-143.zeno.fm/0zkr7x8ztm0uv'] },
  { id: 'fever', name: 'Fever 104 FM', urls: ['https://radio.canstream.co.uk:8115/live.mp3'] },
  { id: 'red-hindi', name: 'Red FM Hindi', urls: ['https://funasia.streamguys1.com/live9'] },
  { id: 'nonstop-hindi', name: 'Non Stop Hindi Radio', urls: ['http://198.178.123.14:8216/'] },
  { id: 'garam-masala', name: 'Radio Garam Masala', urls: ['http://69.175.94.98:8146/'] },

  // Radio City (http)
  { id: 'city', name: 'Radio City Hindi', urls: ['http://prclive1.listenon.in:9960/', 'http://208.115.222.203:9960/'] },
  { id: 'city-fusion', name: 'Radio City Fusion', urls: ['http://prclive1.listenon.in:8992'] },
  { id: 'city-ghazal', name: 'Radio City Ghazal', urls: ['http://prclive1.listenon.in:8860'] },
  { id: 'city-ishq', name: 'Radio City Ishq', urls: ['http://prclive1.listenon.in:8808'] },
  { id: 'city-kishore', name: 'Radio City Kishore Kumar', urls: ['http://prclive1.listenon.in:8834/'] },
  { id: 'city-lata', name: 'Radio City Lata Mangeshkar', urls: ['http://prclive1.listenon.in:8832'] },
  { id: 'city-rdb', name: 'Radio City RD Burman', urls: ['http://prclive1.listenon.in:8828'] },
  { id: 'city-smaran', name: 'Radio City Smaran', urls: ['http://prclive1.listenon.in:9950'] },
  { id: 'city-wellness', name: 'Radio City Wellness', urls: ['http://prclive1.listenon.in:8810/'] },
  { id: 'city-asha', name: 'Radio City Asha Bhosle', urls: ['http://prclive1.listenon.in:8812/'] },
  { id: 'city-rafi', name: 'Mohammed Rafi Radio', urls: ['http://prclive1.listenon.in:8814/'] },
  { id: 'city-mukesh', name: 'Mukesh Radio', urls: ['http://prclive1.listenon.in:9308/'] },

  // Singers (http)
  { id: 'arijit', name: 'Arijit Singh Radio', urls: ['http://southradios.net:9090/arijitsinghradio'] },
  { id: 'udit', name: 'Udit Narayan Radio', urls: ['http://192.227.116.104:4182/autodj'] },

  // Radio Hungama (http)
  { id: 'hungama-90s', name: 'Hungama 90s Once Again', urls: ['http://103.16.47.70:7444/'] },
  { id: 'hungama-dilse', name: 'Hungama Bollywood Dil Se', urls: ['http://103.16.47.70:7333/'] },
  { id: 'hungama-evergreen', name: 'Hungama Evergreen Bollywood', urls: ['http://103.16.47.70:7666/'] },
  { id: 'hungama-hot', name: 'Hungama Hot Now Bollywood', urls: ['http://103.16.47.70:7222/'] },
  { id: 'hungama-ghazals', name: 'Hungama Best of Ghazals', urls: ['http://103.16.47.70:9666/'] },
  { id: 'hungama-dance', name: 'Hungama Dance Masti', urls: ['http://103.16.47.70:9222/'] },

  // Bengali - India
  { id: 'mellow-bangla', name: 'Mellow Bangla', urls: ['https://radio.mellowbangla.com/stream'] },

  // Bengali - Bangladesh
  { id: 'foorti', name: 'Radio Foorti', urls: ['https://radiofoorti.fm/api/stream'] },
  { id: 'rajshahi', name: 'Rajshahi FM', urls: ['https://stream.zeno.fm/nxfshdayjrdvv'] },
  { id: 'jkkniu', name: 'Radio JKKNIU', urls: ['https://stream.zeno.fm/risgdzpf1cxtv'] },
  { id: 'vivid-voice', name: 'Radio Vivid Voice', urls: ['https://stream.zeno.fm/xuin6ocdc2juv'] },
  { id: 'a2z', name: 'A2Z Radio', urls: ['https://listen.radioking.com/radio/1743/stream/125'] },
  { id: 'goongoon', name: 'Radio GoonGoon', urls: ['https://audio.streamcast.xyz/listen/radiogoongoon/radio.mp3'] },

  // Purono (agey offline dekhiyechilo)
  { id: 'mirchi', name: 'Radio Mirchi 98.3 / Kolkata', urls: ['http://peridot.streamguys.com:7150/Mirchi'] },
  { id: 'big', name: 'Big FM 92.7', urls: ['http://sc-bb.1.fm:8017/'] },
  { id: 'fmgold', name: 'AIR FM Gold', urls: ['http://51.15.208.163:8081/radio/fmgold/icecast.audio'] },
];

// ---------------------------------------------------------------------------
// Equalizer
// idle  : pause/stop, bar gulo alada alada uchchotay thamano
// sim   : stream er audio porte parchi na (CORS), tai ekta chalu animation
// live  : asol gaan er frequency onujayi bar nache
// ---------------------------------------------------------------------------
type EqMode = 'idle' | 'sim' | 'live';

const IDLE_H = [5, 9, 6, 11, 7]; // px
const BANDS: [number, number, number][] = [
  // [startBin, endBin, gain]  (fftSize 256 => 128 bin, ~187Hz each)
  [1, 3, 1.2],
  [3, 7, 1.4],
  [7, 16, 1.9],
  [16, 36, 2.6],
  [36, 70, 3.4],
];

function Equalizer({
  mode,
  analyserRef,
}: {
  mode: EqMode;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
}) {
  const bars = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const reset = () =>
      bars.current.forEach((b, i) => {
        if (b) b.style.height = `${IDLE_H[i]}px`;
      });

    if (mode !== 'live') {
      reset();
      return;
    }
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const prev = [...IDLE_H];
    const peak = BANDS.map(() => 0.2); // prottek band er shorbochcho level (dhire kome)
    const avg = BANDS.map(() => 0); // prottek band er gorpor level
    let raf = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      BANDS.forEach(([a, b], i) => {
        let sum = 0;
        for (let k = a; k < b; k++) sum += data[k];
        const v = sum / (b - a) / 255;

        // Auto-gain: radio er gaan onek jor (compressed), tai sidha value dile
        // shob bar full hoye thake. Tai gorpor theke koto beshi seta dekhi.
        peak[i] = Math.max(v, peak[i] * 0.992);
        avg[i] = avg[i] * 0.985 + v * 0.015;
        const low = avg[i] * 0.75;
        let level = (v - low) / Math.max(peak[i] - low, 0.06);
        level = Math.min(1, Math.max(0, level));
        level = Math.pow(level, 1.4); // contrast

        const target = 3 + level * 11;
        // druto uthbe, dhire nambe
        const rate = target > prev[i] ? 0.65 : 0.22;
        prev[i] = prev[i] + (target - prev[i]) * rate;

        const el = bars.current[i];
        if (el) el.style.height = `${prev[i].toFixed(1)}px`;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      reset();
    };
  }, [mode, analyserRef]);

  return (
    <span className="nyx-eq" data-mode={mode} aria-hidden="true">
      {IDLE_H.map((h, i) => (
        <i
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          style={{ height: h }}
        />
      ))}
    </span>
  );
}

const EQ_CSS = `
.nyx-eq{display:inline-flex;align-items:flex-end;gap:2px;height:14px;flex-shrink:0}
.nyx-eq i{display:block;width:3px;border-radius:2px;background:currentColor}
.nyx-eq[data-mode="idle"] i{transition:height .25s ease}
.nyx-eq[data-mode="sim"] i{animation:nyx-eq 900ms ease-in-out infinite}
.nyx-eq[data-mode="sim"] i:nth-child(1){animation-duration:720ms}
.nyx-eq[data-mode="sim"] i:nth-child(2){animation-duration:980ms;animation-delay:-300ms}
.nyx-eq[data-mode="sim"] i:nth-child(3){animation-duration:820ms;animation-delay:-120ms}
.nyx-eq[data-mode="sim"] i:nth-child(4){animation-duration:1100ms;animation-delay:-520ms}
.nyx-eq[data-mode="sim"] i:nth-child(5){animation-duration:860ms;animation-delay:-420ms}
@keyframes nyx-eq{0%,100%{height:3px}50%{height:14px}}
@media (prefers-reduced-motion:reduce){.nyx-eq[data-mode="sim"] i{animation:none}}
`;

export default function RadioPlayer() {
  // Duto <audio>:
  //  vizRef   -> crossOrigin="anonymous", Web Audio er sathe joRa (gaan er sathe bar nache)
  //  plainRef -> normal, jeishob stream CORS allow kore na segulor jonno (bar chalu animation e nache)
  const vizRef = useRef<HTMLAudioElement | null>(null);
  const plainRef = useRef<HTMLAudioElement | null>(null);
  const curElRef = useRef<HTMLAudioElement | null>(null); // je element e ekhon chesta/chalche
  const activeRef = useRef<HTMLAudioElement | null>(null);
  const attemptingRef = useRef(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const graphReadyRef = useRef(false);
  const volumeRef = useRef(0.7);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const volRef = useRef<HTMLDivElement | null>(null);

  const tokenRef = useRef(0);
  const failedRef = useRef<Set<string>>(new Set());

  const [current, setCurrent] = useState<Station | null>(STATIONS[0] ?? null);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [vizMode, setVizMode] = useState<'sim' | 'live'>('sim');
  const [volume, setVolume] = useState(0.7);
  const [open, setOpen] = useState(false);
  const [showVol, setShowVol] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });

  const measure = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: r.left, right: window.innerWidth - r.right });
  };

  const markFailed = (id: string, bad: boolean) => {
    if (bad) failedRef.current.add(id);
    else failedRef.current.delete(id);
    setFailed(new Set(failedRef.current));
  };

  // Saved station / volume restore
  useEffect(() => {
    const savedId = localStorage.getItem('radio:station');
    const saved = STATIONS.find((s) => s.id === savedId);
    if (saved) setCurrent(saved);
    const v = parseFloat(localStorage.getItem('radio:volume') || '');
    if (!Number.isNaN(v)) setVolume(v);
  }, []);

  // Volume: viz element e GainNode, plain element e nijer volume
  useEffect(() => {
    volumeRef.current = volume;
    if (plainRef.current) plainRef.current.volume = volume;
    if (vizRef.current) vizRef.current.volume = 1;
    if (gainRef.current) gainRef.current.gain.value = volume;
    localStorage.setItem('radio:volume', String(volume));
  }, [volume]);

  // Bairer click / resize / page scroll e dropdown bondho
  useEffect(() => {
    const closeAll = () => {
      setOpen(false);
      setShowVol(false);
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t) || volRef.current?.contains(t)) return;
      closeAll();
    };
    const onScroll = (e: Event) => {
      const t = e.target as Node;
      if (listRef.current && t instanceof Node && listRef.current.contains(t)) return;
      closeAll();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', closeAll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', closeAll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  // Web Audio graph: source -> analyser -> gain -> speakers (ekbarই toiri hoy)
  const ensureGraph = (): boolean => {
    if (graphReadyRef.current) return true;
    try {
      const viz = vizRef.current;
      if (!viz) return false;
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return false;
      const ctx = new AC();
      const source = ctx.createMediaElementSource(viz);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -20;
      const gain = ctx.createGain();
      gain.gain.value = volumeRef.current;
      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      gainRef.current = gain;
      graphReadyRef.current = true;
      return true;
    } catch (e) {
      console.warn('[Radio] Web Audio setup failed:', e);
      return false;
    }
  };

  const pickNext = (fromId: string | undefined, skip: Set<string>): Station | null => {
    const idx = STATIONS.findIndex((s) => s.id === fromId);
    for (let i = 1; i <= STATIONS.length; i++) {
      const cand = STATIONS[(idx + i + STATIONS.length) % STATIONS.length];
      if (cand.id !== fromId && !skip.has(cand.id)) return cand;
    }
    return null;
  };

  const play = useCallback(async (station: Station, hops = 0): Promise<void> => {
    const viz = vizRef.current;
    const plain = plainRef.current;
    if (!viz || !plain) return;
    const token = ++tokenRef.current;

    setCurrent(station);
    setError(false);
    setBuffering(true);
    attemptingRef.current = true;
    localStorage.setItem('radio:station', station.id);

    const reset = (el: HTMLAudioElement) => {
      el.pause();
      el.removeAttribute('src');
      el.load();
    };

    for (const url of station.urls) {
      const targets: HTMLAudioElement[] = [viz, plain];
      for (const el of targets) {
        const isViz = el === viz;
        try {
          reset(isViz ? plain : viz);
          curElRef.current = el;

          if (isViz) {
            if (!ensureGraph()) continue;
            await ctxRef.current?.resume().catch(() => {});
          }

          el.src = url;
          el.load();
          await Promise.race([
            el.play(),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
          ]);
          if (token !== tokenRef.current) return;

          activeRef.current = el;
          attemptingRef.current = false;
          setVizMode(isViz ? 'live' : 'sim');
          markFailed(station.id, false);
          setError(false);
          setPlaying(true);
          setBuffering(false);
          return;
        } catch (e: any) {
          if (token !== tokenRef.current) return;
          console.warn('[Radio] failed:', station.name, isViz ? '(viz)' : '(plain)', url, e);
          reset(el);
          // timeout hole station dead, plain diye ar try kore lav nei
          if (e?.message === 'timeout') break;
        }
      }
    }

    // Shob URL fail
    attemptingRef.current = false;
    activeRef.current = null;
    markFailed(station.id, true);
    setPlaying(false);
    setBuffering(false);

    // Auto-skip: porer chalu station
    if (hops < Math.min(4, STATIONS.length - 1)) {
      const nxt = pickNext(station.id, failedRef.current);
      if (nxt) {
        play(nxt, hops + 1);
        return;
      }
    }
    setError(true);
  }, []);

  const toggle = () => {
    if (!current) return;
    if (playing) {
      tokenRef.current++;
      attemptingRef.current = false;
      activeRef.current?.pause();
      setPlaying(false);
      setBuffering(false);
    } else {
      play(current);
    }
  };

  const next = () => {
    const n = pickNext(current?.id, failedRef.current) ?? pickNext(current?.id, new Set());
    if (n) play(n);
  };

  const pick = (s: Station) => {
    setOpen(false);
    play(s);
  };

  // <audio> events (shudhu je element ta ekhon current, tar)
  const isCur = (e: React.SyntheticEvent<HTMLAudioElement>) => e.currentTarget === curElRef.current;
  const audioProps = {
    preload: 'none' as const,
    onPlaying: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (!isCur(e)) return;
      setPlaying(true);
      setBuffering(false);
    },
    onPause: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (!isCur(e)) return;
      setPlaying(false);
    },
    onWaiting: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (!isCur(e)) return;
      setBuffering(true);
    },
    onError: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (!isCur(e) || attemptingRef.current) return;
      if (!e.currentTarget.getAttribute('src')) return;
      setPlaying(false);
      setBuffering(false);
      setError(true);
    },
  };

  const eqMode: EqMode = playing && !buffering ? vizMode : 'idle';
  const label = error ? 'Stream unavailable' : current?.name ?? 'Radio';

  const btn =
    'p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs"
    >
      <style>{EQ_CSS}</style>

      <audio ref={vizRef} crossOrigin="anonymous" {...audioProps} />
      <audio ref={plainRef} {...audioProps} />

      {/* Station picker + equalizer */}
      <button
        onClick={() => {
          measure();
          setShowVol(false);
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 max-w-[150px] sm:max-w-[180px] cursor-pointer"
        aria-label="Choose radio station"
      >
        <span className={playing ? 'text-emerald-500' : error ? 'text-rose-400' : 'text-indigo-400'}>
          <Equalizer mode={eqMode} analyserRef={analyserRef} />
        </span>
        <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        {playing && !buffering && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-rose-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            LIVE
          </span>
        )}
        <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

      {/* Play / Pause */}
      <button
        onClick={toggle}
        disabled={!current}
        aria-label={playing ? 'Pause radio' : 'Play radio'}
        className={btn}
      >
        {buffering ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Next */}
      <button onClick={next} disabled={STATIONS.length < 2} aria-label="Next station" className={btn}>
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Volume */}
      <button
        onClick={() => {
          measure();
          setOpen(false);
          setShowVol((v) => !v);
        }}
        aria-label="Volume"
        className={btn}
      >
        {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>

      {showVol &&
        createPortal(
          <div
            ref={volRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg"
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-28 accent-emerald-500 cursor-pointer"
              aria-label="Volume slider"
            />
          </div>,
          document.body
        )}

      {open &&
        createPortal(
          <ul
            ref={listRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            className="w-60 max-h-96 overflow-y-auto py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            {STATIONS.map((s) => {
              const isBad = failed.has(s.id);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => pick(s)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      current?.id === s.id
                        ? 'text-emerald-500 font-semibold'
                        : isBad
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {isBad && <span className="text-[10px] text-rose-400 shrink-0">offline</span>}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}