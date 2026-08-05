'use client';

import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '../BackButton';

// Currency code -> { country, name } for a human-friendly dropdown label
const CURRENCY_INFO: Record<string, { country: string; name: string }> = {
  USD: { country: 'United States', name: 'US Dollar' },
  INR: { country: 'India', name: 'Indian Rupee' },
  EUR: { country: 'Eurozone', name: 'Euro' },
  GBP: { country: 'United Kingdom', name: 'British Pound' },
  BDT: { country: 'Bangladesh', name: 'Taka' },
  JPY: { country: 'Japan', name: 'Yen' },
  AUD: { country: 'Australia', name: 'Australian Dollar' },
  CAD: { country: 'Canada', name: 'Canadian Dollar' },
  CNY: { country: 'China', name: 'Yuan' },
  AED: { country: 'UAE', name: 'Dirham' },
  SAR: { country: 'Saudi Arabia', name: 'Riyal' },
  SGD: { country: 'Singapore', name: 'Singapore Dollar' },
  NPR: { country: 'Nepal', name: 'Nepalese Rupee' },
  PKR: { country: 'Pakistan', name: 'Pakistani Rupee' },
  LKR: { country: 'Sri Lanka', name: 'Sri Lankan Rupee' },
  CHF: { country: 'Switzerland', name: 'Swiss Franc' },
  NZD: { country: 'New Zealand', name: 'NZ Dollar' },
  ZAR: { country: 'South Africa', name: 'Rand' },
  KRW: { country: 'South Korea', name: 'Won' },
  THB: { country: 'Thailand', name: 'Baht' },
  MYR: { country: 'Malaysia', name: 'Ringgit' },
  HKD: { country: 'Hong Kong', name: 'HK Dollar' },
  QAR: { country: 'Qatar', name: 'Riyal' },
  KWD: { country: 'Kuwait', name: 'Dinar' },
  OMR: { country: 'Oman', name: 'Rial' },
};

const POPULAR_CURRENCIES = Object.keys(CURRENCY_INFO);

function labelFor(code: string): string {
  const info = CURRENCY_INFO[code];
  return info ? `${info.country} — ${info.name} (${code})` : code;
}

export default function CurrencyConverterTool({ onBack }: { onBack: () => void }) {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('INR');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRates = async (base: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Free, no API key required: https://www.exchangerate-api.com/docs/free
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!res.ok) throw new Error(`Rate service returned status ${res.status}`);
      const data = await res.json();
      if (data.result !== 'success') throw new Error(data['error-type'] || 'Failed to fetch rates');
      setRates(data.rates);
      setLastUpdated(data.time_last_update_utc || '');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not load exchange rates. Check your connection.');
      setRates(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(fromCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency]);

  const convertedAmount = useMemo(() => {
    const num = parseFloat(amount);
    if (!rates || isNaN(num) || !rates[toCurrency]) return '';
    return (num * rates[toCurrency]).toFixed(2);
  }, [amount, rates, toCurrency]);

  const rateDisplay = rates && rates[toCurrency] ? rates[toCurrency].toFixed(4) : '';

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const currencyOptions = rates ? Array.from(new Set([...POPULAR_CURRENCIES, ...Object.keys(rates)])) : POPULAR_CURRENCIES;

  return (
    <div style={{ background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '600px', margin: '0 auto' }}>
      <BackButton onClick={onBack} />
      <h2 style={{ margin: '15px 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>💱</span> Currency Converter
      </h2>
      <p style={{ color: '#64748b', marginBottom: '25px' }}>
        Live exchange rates, updated automatically.
      </p>

      {errorMessage && (
        <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontWeight: '600' }}>
          ❌ {errorMessage}
        </div>
      )}

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '25px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '18px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>From</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '12px' }}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>{labelFor(c)}</option>
            ))}
          </select>

          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <button
              onClick={swapCurrencies}
              title="Swap currencies"
              style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              ⇅ Swap
            </button>
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>To</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>{labelFor(c)}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '10px', border: '2px solid #16a34a' }}>
          {isLoading ? (
            <p style={{ color: '#64748b', margin: 0 }}>Loading live rates...</p>
          ) : (
            <>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803d' }}>
                {convertedAmount ? `${convertedAmount} ${toCurrency}` : '—'}
              </div>
              {rateDisplay && (
                <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0 0 0' }}>
                  1 {fromCurrency} = {rateDisplay} {toCurrency}
                </p>
              )}
            </>
          )}
        </div>

        {lastUpdated && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', marginTop: '12px' }}>Rates updated: {lastUpdated}</p>
        )}
      </div>
    </div>
  );
}
