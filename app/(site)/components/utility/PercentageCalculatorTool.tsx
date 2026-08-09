'use client';

import React, { useState, useMemo } from 'react';
import BackButton from '../BackButton';

type Mode = 'basic' | 'whatPercent' | 'change';

export default function PercentageCalculatorTool({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('basic');

  // Mode 1: X% of Y
  const [basicPercent, setBasicPercent] = useState<string>('20');
  const [basicValue, setBasicValue] = useState<string>('150');

  // Mode 2: X is what % of Y
  const [partValue, setPartValue] = useState<string>('30');
  const [wholeValue, setWholeValue] = useState<string>('150');

  // Mode 3: percentage change from X to Y
  const [oldValue, setOldValue] = useState<string>('100');
  const [newValue, setNewValue] = useState<string>('120');

  const basicResult = useMemo(() => {
    const p = parseFloat(basicPercent);
    const v = parseFloat(basicValue);
    if (isNaN(p) || isNaN(v)) return '';
    return ((p / 100) * v).toFixed(2);
  }, [basicPercent, basicValue]);

  const whatPercentResult = useMemo(() => {
    const part = parseFloat(partValue);
    const whole = parseFloat(wholeValue);
    if (isNaN(part) || isNaN(whole) || whole === 0) return '';
    return ((part / whole) * 100).toFixed(2);
  }, [partValue, wholeValue]);

  const changeResult = useMemo(() => {
    const o = parseFloat(oldValue);
    const n = parseFloat(newValue);
    if (isNaN(o) || isNaN(n) || o === 0) return null;
    const pct = ((n - o) / Math.abs(o)) * 100;
    return { pct: pct.toFixed(2), isIncrease: pct >= 0 };
  }, [oldValue, newValue]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '16px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '6px',
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '600px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>💯</span> Percentage Calculator
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>Three common percentage calculations, all in one tool.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
        {([
          ['basic', 'What is X% of Y?'],
          ['whatPercent', 'X is what % of Y?'],
          ['change', '% Change from X to Y'],
        ] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: mode === m ? '2px solid #0d9488' : '1px solid #cbd5e1',
              background: mode === m ? '#f0fdfa' : 'white',
              color: '#0f172a',
              fontWeight: mode === m ? 'bold' : 'normal',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '15px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px' }}>
        {mode === 'basic' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Percentage (%)</label>
                <input type="number" value={basicPercent} onChange={(e) => setBasicPercent(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Of Value</label>
                <input type="number" value={basicValue} onChange={(e) => setBasicValue(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f0fdfa', borderRadius: '8px', border: '2px solid #0d9488' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>{basicPercent}% of {basicValue} is</span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f766e' }}>{basicResult || '—'}</div>
            </div>
          </>
        )}

        {mode === 'whatPercent' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Part (X)</label>
                <input type="number" value={partValue} onChange={(e) => setPartValue(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Whole (Y)</label>
                <input type="number" value={wholeValue} onChange={(e) => setWholeValue(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f0fdfa', borderRadius: '8px', border: '2px solid #0d9488' }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>{partValue} is</span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f766e' }}>{whatPercentResult ? `${whatPercentResult}%` : '—'}</div>
              <span style={{ color: '#64748b', fontSize: '14px' }}>of {wholeValue}</span>
            </div>
          </>
        )}

        {mode === 'change' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Old Value (X)</label>
                <input type="number" value={oldValue} onChange={(e) => setOldValue(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>New Value (Y)</label>
                <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: changeResult?.isIncrease ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `2px solid ${changeResult?.isIncrease ? '#16a34a' : '#dc2626'}` }}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>{changeResult?.isIncrease ? 'Increase' : 'Decrease'} of</span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: changeResult?.isIncrease ? '#15803d' : '#b91c1c' }}>
                {changeResult ? `${changeResult.isIncrease ? '+' : ''}${changeResult.pct}%` : '—'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
