'use client';

import React, { useState, useRef, useEffect } from 'react';
import BackButton from '../BackButton';

type Mode = 'timer' | 'stopwatch';

function formatTime(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((totalMs % 1000) / 10); // centiseconds
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export default function CountdownStopwatchTool({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('timer');

  // Stopwatch state
  const [swElapsed, setSwElapsed] = useState<number>(0);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swStartRef = useRef<number>(0);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer state
  const [timerInputMin, setTimerInputMin] = useState<number>(5);
  const [timerInputSec, setTimerInputSec] = useState<number>(0);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const timerEndRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // --- Stopwatch handlers ---
  const startStopwatch = () => {
    swStartRef.current = Date.now() - swElapsed;
    swIntervalRef.current = setInterval(() => {
      setSwElapsed(Date.now() - swStartRef.current);
    }, 10);
    setSwRunning(true);
  };

  const pauseStopwatch = () => {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    setSwRunning(false);
  };

  const resetStopwatch = () => {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    setSwRunning(false);
    setSwElapsed(0);
    setLaps([]);
  };

  const addLap = () => setLaps((prev) => [...prev, swElapsed]);

  // --- Timer handlers ---
  const startTimer = () => {
    const totalMs = timerRemaining > 0 ? timerRemaining : (timerInputMin * 60 + timerInputSec) * 1000;
    if (totalMs <= 0) return;
    timerEndRef.current = Date.now() + totalMs;
    setTimerFinished(false);
    setTimerRunning(true);
    timerIntervalRef.current = setInterval(() => {
      const remaining = timerEndRef.current - Date.now();
      if (remaining <= 0) {
        setTimerRemaining(0);
        setTimerRunning(false);
        setTimerFinished(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      } else {
        setTimerRemaining(remaining);
      }
    }, 100);
  };

  const pauseTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerFinished(false);
    setTimerRemaining(0);
  };

  const displayMs = timerRunning || timerRemaining > 0 ? timerRemaining : (timerInputMin * 60 + timerInputSec) * 1000;

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '600px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>⏱️</span> Timer & Stopwatch
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Countdown timer and stopwatch, in one place.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        <button
          onClick={() => setMode('timer')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: mode === 'timer' ? '2px solid #7c3aed' : '1px solid #cbd5e1', background: mode === 'timer' ? '#f3e8ff' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ⏳ Countdown Timer
        </button>
        <button
          onClick={() => setMode('stopwatch')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: mode === 'stopwatch' ? '2px solid #7c3aed' : '1px solid #cbd5e1', background: mode === 'stopwatch' ? '#f3e8ff' : 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ⏱️ Stopwatch
        </button>
      </div>

      {mode === 'timer' ? (
        <div style={{ textAlign: 'center' }}>
          {!timerRunning && timerRemaining === 0 && !timerFinished && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Minutes</label>
                <input
                  type="number"
                  min={0}
                  value={timerInputMin}
                  onChange={(e) => setTimerInputMin(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '80px', padding: '10px', textAlign: 'center', fontSize: '18px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Seconds</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timerInputSec}
                  onChange={(e) => setTimerInputSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  style={{ width: '80px', padding: '10px', textAlign: 'center', fontSize: '18px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          )}

          <div style={{ fontSize: '56px', fontWeight: 'bold', color: timerFinished ? '#dc2626' : '#0f172a', margin: '20px 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(displayMs)}
          </div>

          {timerFinished && (
            <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '15px' }}>⏰ Time's up!</p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {!timerRunning ? (
              <button onClick={startTimer} style={btnStyle('#16a34a')}>▶ Start</button>
            ) : (
              <button onClick={pauseTimer} style={btnStyle('#f59e0b')}>⏸ Pause</button>
            )}
            <button onClick={resetTimer} style={btnStyle('#64748b')}>↺ Reset</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#0f172a', margin: '20px 0', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(swElapsed)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {!swRunning ? (
              <button onClick={startStopwatch} style={btnStyle('#16a34a')}>▶ Start</button>
            ) : (
              <button onClick={pauseStopwatch} style={btnStyle('#f59e0b')}>⏸ Pause</button>
            )}
            <button onClick={addLap} disabled={!swRunning} style={{ ...btnStyle('#2563eb'), opacity: swRunning ? 1 : 0.5 }}>🚩 Lap</button>
            <button onClick={resetStopwatch} style={btnStyle('#64748b')}>↺ Reset</button>
          </div>

          {laps.length > 0 && (
            <div style={{ textAlign: 'left', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              {laps.map((lap, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: i < laps.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '14px' }}>
                  <span style={{ color: '#64748b' }}>Lap {i + 1}</span>
                  <span style={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: color,
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
  };
}
