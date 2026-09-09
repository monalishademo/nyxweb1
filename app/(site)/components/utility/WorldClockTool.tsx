'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, ArrowLeft, Clock } from 'lucide-react';

interface CityClock {
  id: string;
  cityName: string;
  country: string;
  timeZone: string;
}

const DEFAULT_CITIES: CityClock[] = [
  { id: '1', cityName: 'New Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
  { id: '2', cityName: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { id: '3', cityName: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { id: '4', cityName: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: '5', cityName: 'Dubai', country: 'United Arab Emirates', timeZone: 'Asia/Dubai' },
];

const AVAILABLE_TIMEZONES = [
  { cityName: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { cityName: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { cityName: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { cityName: 'Los Angeles', country: 'United States', timeZone: 'America/Los_Angeles' },
  { cityName: 'Toronto', country: 'Canada', timeZone: 'America/Toronto' },
  { cityName: 'Berlin', country: 'Germany', timeZone: 'Europe/Berlin' },
  { cityName: 'Bangkok', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { cityName: 'Dhaka', country: 'Bangladesh', timeZone: 'Asia/Dhaka' },
];

interface WorldClockProps {
  onBack?: () => void;
}

export default function WorldClockTool({ onBack }: WorldClockProps) {
  const [cities, setCities] = useState<CityClock[]>(DEFAULT_CITIES);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedCityZone, setSelectedCityZone] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(currentTime);
  };

  const formatDate = (timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  const handleAddCity = () => {
    if (!selectedCityZone) return;
    const cityToAdd = AVAILABLE_TIMEZONES.find((c) => c.timeZone === selectedCityZone);
    if (cityToAdd && !cities.some((c) => c.timeZone === selectedCityZone)) {
      setCities([...cities, { id: Date.now().toString(), ...cityToAdd }]);
      setSelectedCityZone('');
    }
  };

  const handleRemoveCity = (id: string) => {
    setCities(cities.filter((c) => c.id !== id));
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
                Live World Clock
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                UTILITY
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Track real-time digital clocks across different time zones worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Add City Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <select
            value={selectedCityZone}
            onChange={(e) => setSelectedCityZone(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">-- Select a City to Add --</option>
            {AVAILABLE_TIMEZONES.filter((atz) => !cities.some((c) => c.timeZone === atz.timeZone)).map((city) => (
              <option key={city.timeZone} value={city.timeZone}>
                {city.cityName}, {city.country}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddCity}
            disabled={!selectedCityZone}
            className={`py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              selectedCityZone
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Clock
          </button>
        </div>

        {/* World Clock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <div
              key={city.id}
              className="bg-slate-900 dark:bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-lg relative flex flex-col justify-between space-y-6 overflow-hidden"
            >
              <button
                onClick={() => handleRemoveCity(city.id)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Remove Clock"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-xl font-black text-sky-400 m-0">{city.cityName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{city.country}</p>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black tracking-wider font-mono text-slate-100">
                  {formatTime(city.timeZone)}
                </div>
                <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5" /> {formatDate(city.timeZone)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}