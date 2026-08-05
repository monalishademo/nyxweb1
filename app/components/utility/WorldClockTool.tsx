'use client';

import React, { useState, useEffect } from 'react';
import BackButton from '../BackButton';

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

export default function WorldClockTool({ onBack }: { onBack: () => void }) {
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
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '950px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🌐</span> Live World Clock
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Track real-time digital clocks across different time zones worldwide.
      </p>

      {/* Add City Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <select
          value={selectedCityZone}
          onChange={(e) => setSelectedCityZone(e.target.value)}
          style={{ flexGrow: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', color: '#0f172a', outline: 'none' }}
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
          style={{ backgroundColor: selectedCityZone ? '#0284c7' : '#94a3b8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: selectedCityZone ? 'pointer' : 'not-allowed' }}
        >
          + Add Clock
        </button>
      </div>

      {/* World Clock Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {cities.map((city) => (
          <div
            key={city.id}
            style={{
              backgroundColor: '#0f172a',
              color: 'white',
              padding: '24px',
              borderRadius: '16px',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <button
              onClick={() => handleRemoveCity(city.id)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Remove Clock"
            >
              ✕
            </button>

            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#38bdf8' }}>{city.cityName}</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#94a3b8' }}>{city.country}</p>
            </div>

            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'monospace', color: '#f8fafc' }}>
                {formatTime(city.timeZone)}
              </div>
              <div style={{ fontSize: '13px', color: '#38bdf8', marginTop: '6px' }}>
                📅 {formatDate(city.timeZone)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}