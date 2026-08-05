'use client';

import React, { useState, useEffect } from 'react';
import BackButton from '../BackButton';

export default function AgeCalculatorTool({ onBack }: { onBack: () => void }) {
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');
  const [now, setNow] = useState<Date>(new Date());

  // Real-time ticking clock for exact seconds calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dob = new Date(birthDate);
  const isValidDate = !isNaN(dob.getTime());

  // Calculations
  const diffMs = isValidDate ? Math.max(0, now.getTime() - dob.getTime()) : 0;
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Exact Years, Months, Days breakdown
  let years = 0;
  let months = 0;
  let days = 0;

  if (isValidDate) {
    let temp = new Date(dob);
    years = now.getFullYear() - temp.getFullYear();
    months = now.getMonth() - temp.getMonth();
    days = now.getDate() - temp.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  // Speed of Light Travel Distance (c = 299,792,458 m/s)
  const lightDistanceKm = (totalSeconds * 299792.458).toLocaleString('en-US', { maximumFractionDigits: 0 });

  // Sundays Counted
  const countSundays = () => {
    if (!isValidDate) return 0;
    let count = 0;
    let cur = new Date(dob);
    while (cur <= now) {
      if (cur.getDay() === 0) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '950px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />

      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🎂</span> Super Age & Life Stats Calculator
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Discover your exact age down to the second, Sundays enjoyed, and cosmic distance traveled at light speed!
      </p>

      {/* Date Picker Input */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          📅 Select Your Date of Birth:
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', cursor: 'pointer' }}
        />
      </div>

      {isValidDate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          {/* Main Age Card */}
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '25px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '16px' }}>Exact Age Breakdown</h3>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {years} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>Years</span> {months} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>Months</span> {days} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>Days</span>
            </div>
            <p style={{ marginTop: '15px', fontSize: '13px', opacity: 0.85 }}>Live ticking continuously with current time.</p>
          </div>

          {/* Time Units Stats */}
          <div style={{ background: '#f1f5f9', padding: '25px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px' }}>⏱️ Total Time Elapsed</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2', color: '#334155', fontWeight: 'bold' }}>
              <li>⌛ Total Hours: <span style={{ color: '#2563eb' }}>{totalHours.toLocaleString()}</span></li>
              <li>⏳ Total Minutes: <span style={{ color: '#2563eb' }}>{totalMinutes.toLocaleString()}</span></li>
              <li>⚡ Total Seconds: <span style={{ color: '#2563eb' }}>{totalSeconds.toLocaleString()}</span></li>
            </ul>
          </div>

          {/* Cosmic Light Travel Distance */}
          <div style={{ background: '#0f172a', color: 'white', padding: '25px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#38bdf8', fontSize: '16px' }}>🚀 Speed of Light Travel</h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8' }}>Distance light traveled during your lifespan:</p>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', wordBreak: 'break-all' }}>
              {lightDistanceKm} <span style={{ fontSize: '14px', color: '#38bdf8' }}>KM</span>
            </div>
          </div>

          {/* Sundays Enjoyed */}
          <div style={{ background: '#fef3c7', padding: '25px', borderRadius: '16px', border: '1px solid #fde68a' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#b45309', fontSize: '16px' }}>🎉 Sundays Enjoyed</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>
              {countSundays().toLocaleString()} <span style={{ fontSize: '16px' }}>Sundays</span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#b45309' }}>Total relaxing weekend Sundays lived so far!</p>
          </div>

        </div>
      )}
    </div>
  );
}