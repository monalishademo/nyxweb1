'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRightLeft, Ruler, Sparkles } from 'lucide-react';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';

const UNITS: Record<Category, Record<string, number>> = {
  length: { Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001, Mile: 1609.34, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254 },
  weight: { Kilogram: 1, Gram: 0.001, Milligram: 0.000001, Pound: 0.453592, Ounce: 0.0283495, Ton: 1000 },
  area: { 'Square Meter': 1, 'Square Kilometer': 1e6, 'Square Foot': 0.092903, 'Square Mile': 2.59e6, Acre: 4046.86, Hectare: 10000 },
  volume: { Liter: 1, Milliliter: 0.001, 'Cubic Meter': 1000, Gallon: 3.78541, Quart: 0.946353, Cup: 0.24 },
  speed: { 'Meter/sec': 1, 'Kilometer/hour': 0.277778, 'Mile/hour': 0.44704, Knot: 0.514444 },
  temperature: {},
};

const CATEGORY_LABELS: Record<Category, string> = {
  length: 'Length',
  weight: 'Weight',
  temperature: 'Temperature',
  area: 'Area',
  volume: 'Volume',
  speed: 'Speed',
};

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'Celsius') celsius = value;
  else if (from === 'Fahrenheit') celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (to === 'Celsius') return celsius;
  if (to === 'Fahrenheit') return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

interface UnitConverterProps {
  onBack?: () => void;
}

export default function UnitConverterTool({ onBack }: UnitConverterProps) {
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
    return parseFloat(converted.toFixed(6)).toString();
  }, [inputValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Unit Converter
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                CONVERTER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Convert between length, weight, temperature, area, volume, and speed units
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
        
        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Converter Panel */}
        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* From Unit */}
            <div className="md:col-span-5 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Ruler className="w-3.5 h-3.5 text-indigo-500" /> From
              </label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center py-2 md:py-0">
              <button
                onClick={swapUnits}
                title="Swap units"
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* To Unit */}
            <div className="md:col-span-5 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> To (Result)
              </label>
              <input
                type="text"
                value={result}
                readOnly
                className="w-full px-4 py-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
              />
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}