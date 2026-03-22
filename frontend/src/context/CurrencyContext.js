import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const CurrencyContext = createContext({ currency: 'USD', symbol: '$', fmt: (n) => `$${n}` });

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');
  const [symbol, setSymbol] = useState('$');

  const SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', PKR: '₨', INR: '₹', AED: 'د.إ',
    SAR: '﷼', BDT: '৳', CAD: 'C$', AUD: 'A$', JPY: '¥', CNY: '¥',
  };

  useEffect(() => {
    api.get('/profile').then(res => {
      const cur = res.data?.profile?.currency || 'USD';
      setCurrency(cur);
      setSymbol(SYMBOLS[cur] || cur + ' ');
    }).catch(() => {});
  }, []);

  const fmt = (n, decimals = 0) => {
    const val = Number(n || 0);
    const sym = symbol;
    const formatted = val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${sym}${formatted}`;
  };

  const fmtDec = (n) => fmt(n, 2);

  return (
    <CurrencyContext.Provider value={{ currency, symbol, fmt, fmtDec }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyCtx() {
  return useContext(CurrencyContext);
}
