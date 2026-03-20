import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState({ excel: false, csv: false, pdf: false });

  const download = async (type) => {
    setLoading(l => ({ ...l, [type]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/reports/${type}?year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to generate report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecommerce-report-${year}.${type === 'excel' ? 'xlsx' : type}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setLoading(l => ({ ...l, [type]: false }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Export your business data in Excel, PDF, or CSV format</p>
        </div>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <FileSpreadsheet size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Excel Report</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Detailed spreadsheet with multiple sheets for trends, products, and cash flow.
          </p>
          <button className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}
            onClick={() => download('excel')} disabled={loading.excel}>
            <Download size={15} />
            {loading.excel ? 'Generating...' : 'Download Excel (XLSX)'}
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <FileText size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>PDF Report</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Formatted PDF summary including KPIs, monthly trends, and product performance.
          </p>
          <button className="btn-primary" style={{ justifyContent: 'center', width: '100%', background: '#ef4444' }}
            onClick={() => download('pdf')} disabled={loading.pdf}>
            <Download size={15} />
            {loading.pdf ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <FileText size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>CSV Report</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
            Raw data export in CSV format for use in Excel, Google Sheets, or data tools.
          </p>
          <button className="btn-primary" style={{ justifyContent: 'center', width: '100%', background: '#f59e0b' }}
            onClick={() => download('csv')} disabled={loading.csv}>
            <Download size={15} />
            {loading.csv ? 'Generating...' : 'Download CSV'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>What's included in reports?</h3>
        <div className="grid-2">
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Business summary KPIs (revenue, net profit, margins)</li>
            <li>Monthly revenue vs. expense trends</li>
            <li>Product performance breakdown</li>
            <li>Sales forecasts by product and month</li>
          </ul>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Cash flow statement (inflows, outflows, funding)</li>
            <li>Partner equity and profit distribution data</li>
            <li>Cost breakdown by category</li>
            <li>Year-over-year comparison (multi-year)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
