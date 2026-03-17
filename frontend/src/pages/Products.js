import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, TrendingUp, Package } from 'lucide-react';

const CATEGORIES = ['Clothing', 'Electronics', 'Beauty', 'Home & Garden', 'Sports', 'Food & Beverage', 'Books', 'Toys', 'Jewelry', 'Other'];

function ProductModal({ onClose, onSaved, product }) {
  const [form, setForm] = useState(product || {
    name: '', description: '', category: 'Other',
    selling_price: '', cogs: '',
    shipping_cost_local: '', shipping_cost_international: '',
    platform_fee_pct: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        selling_price: parseFloat(form.selling_price),
        cogs: parseFloat(form.cogs),
        shipping_cost_local: parseFloat(form.shipping_cost_local) || 0,
        shipping_cost_international: parseFloat(form.shipping_cost_international) || 0,
        platform_fee_pct: parseFloat(form.platform_fee_pct) || 0
      };
      if (product?.id) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3 className="modal-title">{product ? 'Edit Product' : 'Add Product'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label className="label">Product Name *</label>
              <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">Selling Price ($) *</label>
              <input className="input" type="number" step="0.01" min="0" required value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">COGS ($) *</label>
              <input className="input" type="number" step="0.01" min="0" required value={form.cogs} onChange={e => set('cogs', e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">Local Shipping ($)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.shipping_cost_local} onChange={e => set('shipping_cost_local', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Intl. Shipping ($)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.shipping_cost_international} onChange={e => set('shipping_cost_international', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Platform Fee % (e.g. 0.05 for 5%)</label>
            <input className="input" type="number" step="0.001" min="0" max="1" value={form.platform_fee_pct} onChange={e => set('platform_fee_pct', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [planner, setPlanner] = useState({
    planned_products_count: 0,
    planned_asp: 0,
    planned_cogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [savingPlanner, setSavingPlanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/products'), api.get('/profile')])
      .then(([productsRes, profileRes]) => {
        setProducts(productsRes.data.products);
        const profile = profileRes.data.profile || {};
        setPlanner({
          planned_products_count: Number(profile.planned_products_count || 0),
          planned_asp: Number(profile.planned_asp || 0),
          planned_cogs: Number(profile.planned_cogs || 0)
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const marginPct = (p) => {
    const price = parseFloat(p.selling_price);
    const cogs = parseFloat(p.cogs);
    return price > 0 ? (((price - cogs) / price) * 100).toFixed(1) : '0';
  };

  const plannerRevenue = planner.planned_products_count * planner.planned_asp;
  const plannerCost = planner.planned_products_count * planner.planned_cogs;
  const plannerGrossProfit = plannerRevenue - plannerCost;
  const plannerGrossMargin = plannerRevenue > 0 ? ((plannerGrossProfit / plannerRevenue) * 100) : 0;

  const avgAsp = products.length
    ? products.reduce((sum, p) => sum + Number(p.selling_price || 0), 0) / products.length
    : 0;
  const avgCogs = products.length
    ? products.reduce((sum, p) => sum + Number(p.cogs || 0), 0) / products.length
    : 0;

  const savePlanner = async () => {
    setSavingPlanner(true);
    try {
      await api.patch('/profile/planner', {
        planned_products_count: Math.max(0, parseInt(planner.planned_products_count, 10) || 0),
        planned_asp: Math.max(0, parseFloat(planner.planned_asp) || 0),
        planned_cogs: Math.max(0, parseFloat(planner.planned_cogs) || 0)
      });
      toast.success('Product planning values saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save planner values');
    } finally {
      setSavingPlanner(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog, pricing, and margins</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Section 2: Product Information Planner</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
          Enter your initial product count, ASP, and COGS to estimate launch-level product economics.
        </p>
        <div className="grid-2">
          <div className="field">
            <label className="label">Number of Products (Initial)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={planner.planned_products_count}
              onChange={(e) => setPlanner(prev => ({ ...prev, planned_products_count: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Average Selling Price (ASP)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={planner.planned_asp}
              onChange={(e) => setPlanner(prev => ({ ...prev, planned_asp: e.target.value }))}
            />
          </div>
        </div>
        <div className="field">
          <label className="label">Average COGS per Product</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={planner.planned_cogs}
            onChange={(e) => setPlanner(prev => ({ ...prev, planned_cogs: e.target.value }))}
          />
        </div>
        <div className="grid-4" style={{ marginTop: '0.75rem', marginBottom: '0.9rem' }}>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Planned Catalog Revenue</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${plannerRevenue.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Planned Catalog COGS</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${plannerCost.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Planned Gross Profit</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>${plannerGrossProfit.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Planned Gross Margin</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{plannerGrossMargin.toFixed(2)}%</p>
          </div>
        </div>
        <button className="btn-primary" onClick={savePlanner} disabled={savingPlanner}>
          {savingPlanner ? 'Saving...' : 'Save Section 2 Plan'}
        </button>
      </div>

      {!loading && (
        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Products in Catalog</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{products.length}</p>
              </div>
              <Package size={18} color="#6366f1" />
            </div>
          </div>
          <div className="kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Catalog ASP</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>${avgAsp.toFixed(2)}</p>
              </div>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Catalog Avg COGS</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>${avgCogs.toFixed(2)}</p>
          </div>
          <div className="kpi-card">
            <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Categories Used</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {new Set(products.map((p) => p.category || 'Other')).size}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading products...</p>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Package size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>No products yet. Add your first product to get started.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>COGS</th>
                <th>Gross Margin</th>
                <th>Local Ship</th>
                <th>Platform Fee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.description}</div>
                  </td>
                  <td><span className="badge badge-blue">{p.category}</span></td>
                  <td style={{ fontWeight: 600 }}>${parseFloat(p.selling_price).toFixed(2)}</td>
                  <td>${parseFloat(p.cogs).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${parseFloat(marginPct(p)) > 30 ? 'badge-green' : parseFloat(marginPct(p)) > 15 ? 'badge-yellow' : 'badge-red'}`}>
                      {marginPct(p)}%
                    </span>
                  </td>
                  <td>${parseFloat(p.shipping_cost_local).toFixed(2)}</td>
                  <td>{(parseFloat(p.platform_fee_pct) * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }}
                        onClick={() => { setEditProduct(p); setShowModal(true); }}>
                        Edit
                      </button>
                      <button className="btn-danger" style={{ padding: '0.3rem 0.6rem' }}
                        onClick={() => deleteProduct(p.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
