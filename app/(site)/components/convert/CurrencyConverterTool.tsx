'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRightLeft, Coins, Loader2, AlertCircle, Sparkles } from 'lucide-react';

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

interface CurrencyConverterProps {
  onBack?: () => void;
}

export default function CurrencyConverterTool({ onBack }: CurrencyConverterProps) {
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
                Currency Converter
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">
                CONVERTER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Live exchange rates, updated automatically in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-xl mx-auto">
        
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Coins className="w-3.5 h-3.5 text-indigo-500" /> Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-bold text-slate-800 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">From Currency</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{labelFor(c)}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center py-1">
              <button
                onClick={swapCurrencies}
                title="Swap currencies"
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Swap Currencies
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">To Currency</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>{labelFor(c)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center p-6 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-2 shadow-inner mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading live rates...
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {convertedAmount ? `${convertedAmount} ${toCurrency}` : '—'}
                </div>
                {rateDisplay && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    1 {fromCurrency} = {rateDisplay} {toCurrency}
                  </p>
                )}
              </>
            )}
          </div>

          {lastUpdated && (
            <p className="text-center text-slate-400 text-[11px] font-medium pt-1">
              Rates updated: {lastUpdated}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}