import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { storage } from '../services/api';

const CurrencyContext = createContext({ currency: 'USD', symbol: '$', fmt: (n) => `$${n}`, fmtDec: (n) => `$${n}` });

// Module-level constant — not recreated on every render
const SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹', AED: 'د.إ',
  SAR: '﷼', BDT: '৳', CAD: 'C$', AUD: 'A$', JPY: '¥', CNY: '¥',
  SGD: 'S$', MYR: 'RM', TRY: '₺', NGN: '₦', KES: 'KSh', ZAR: 'R',
};

export function CurrencyProvider({ children }) {
  const { user } = useAuth();           // only runs inside AuthProvider
  const [currency, setCurrency] = useState('USD');

  // Fetch profile only when the user is authenticated.
  // Avoids the 401 redirect loop on /login and /register pages.
  useEffect(() => {
    if (!user || !storage.get('token')) return;

    let cancelled = false;
    api.get('/profile')
      .then((res) => {
        if (cancelled) return;
        const cur = res.data?.profile?.currency;
        if (cur) setCurrency(cur);
      })
      .catch(() => {}) // non-fatal — fall back to USD
      ;
    return () => { cancelled = true; };
  }, [user?.id]); // re-fetch only when the logged-in user changes

  const symbol = SYMBOLS[currency] || `${currency} `;

  // Memoised formatters — avoid re-creating functions on every render
  const fmt = useMemo(
    () => (n, decimals = 0) => {
      const val = Number(n) || 0;
      return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    },
    [symbol]
  );

  const fmtDec = useMemo(() => (n) => fmt(n, 2), [fmt]);

  const value = useMemo(
    () => ({ currency, symbol, fmt, fmtDec }),
    [currency, symbol, fmt, fmtDec]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyCtx() {
  return useContext(CurrencyContext);
}
