'use client';

import React, { useState, useMemo } from 'react';
import BackButton from '../BackButton';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';

// Base unit conversion factors (relative to a base unit per category)
const UNITS: Record<Category, Record<string, number>> = {
  length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001, Mile: 1609.34, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  weight: { Kilogram: 1, Gram: 0.001, Milligram: 0.000001, Pound: 0.453592, Ounce: 0.0283495, Ton: 1000 },
  area: { 'Square Meter': 1, 'Square Kilometer': 1e6, 'Square Foot': 0.092903, 'Square Mile': 2.59e6, Acre: 4046.86, Hectare: 10000 },
  volume: { Liter: 1, Milliliter: 0.001, 'Cubic Meter': 1000, Gallon: 3.78541, Quart: 0.946353, Cup: 0.24 },
  speed: { 'Meter/sec': 1, 'Kilometer/hour': 0.277778, 'Mile/hour': 0.44704, Knot: 0.514444 },
  temperature: {}, // handled specially below
};

const CATEGORY_LABELS: Record<Category, string> = {
  length: '📏 Length',
  weight: '⚖️ Weight',
  temperature: '🌡️ Temperature',
  area: '⬛ Area',
  volume: '🧪 Volume',
  speed: '🚀 Speed',
};

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'Celsius') celsius = value;
  else if (from === 'Fahrenheit') celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15; // Kelvin

  if (to === 'Celsius') return celsius;
  if (to === 'Fahrenheit') return (celsius * 9) / 5 + 32;
  return celsius + 273.15; // Kelvin
}

export default function UnitConverterTool({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState<string>('Meter');
  const [toUnit, setToUnit] = useState<string>('Kilometer');
  const [inputValue, setInputValue] = useState<string>('1');

  const unitOptions = useMemo(() => {
    if (category === 'temperature') return ['Celsius', 'Fahrenheit', 'Kelvin'];
    return Object.keys(UNITS[category]);
  }, [category]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    const opts = cat === 'temperature' ? ['Celsius', 'Fahrenheit', 'Kelvin'] : Object.keys(UNITS[cat]);
    setFromUnit(opts[0]);
    setToUnit(opts[1] || opts[0]);
  };

  const result = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return '';

    if (category === 'temperature') {
      return convertTemperature(num, fromUnit, toUnit).toFixed(4).replace(/\.?0+$/, '');
    }

    const factors = UNITS[category];
    const baseValue = num * factors[fromUnit];
    const converted = baseValue / factors[toUnit];
    // Show reasonable precision without trailing zeros
    return parseFloat(converted.toFixed(6)).toString();
  }, [inputValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '700px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>📐</span> Unit Converter
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Convert between length, weight, temperature, area, volume, and speed units.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: category === cat ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: category === cat ? '#dbeafe' : 'white',
              color: '#0f172a',
              fontWeight: category === cat ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>From</label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <button
            onClick={swapUnits}
            title="Swap units"
            style={{ padding: '10px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '18px', marginBottom: '2px' }}
          >
            ⇄
          </button>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>To (Result)</label>
            <input
              type="text"
              value={result}
              readOnly
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #2563eb', fontSize: '16px', marginBottom: '8px', boxSizing: 'border-box', background: '#eff6ff', fontWeight: 'bold', color: '#1e3a8a' }}
            />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
