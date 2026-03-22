import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function BeginnerWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Beginner mode questions
  const [productName, setProductName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [adSpend, setAdSpend] = useState('');
  const [expectedOrders, setExpectedOrders] = useState('');
  const [payTax, setPayTax] = useState('no');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName || !sellingPrice || !productCost) {
      toast.error('Please fill out the essential product fields.');
      return;
    }
    setLoading(true);

    try {
      // 1. Create a minimal business profile via PATCH or POST
      await api.post('/profile', {
        business_name: `My ${productName} Business`,
        business_type: 'direct_sales',
        country: 'Pakistan',
        currency: 'PKR',
        monthly_sales_target: Number(expectedOrders) || 0,
        monthly_marketing_budget: Number(adSpend) || 0,
        sales_tax_rate: payTax === 'yes' ? 0.05 : 0 // simplify tax to 5% if yes
      });

      // 2. Mark beginner wizard completed
      await api.patch('/profile/beginner-wizard', {
        beginner_mode_completed: true
      });

      // 3. Create the first product
      await api.post('/products', {
        name: productName,
        selling_price: Number(sellingPrice),
        cogs: Number(productCost),
        shipping_cost_local: Number(deliveryCost) || 0,
        category: 'Beginner product'
      });

      toast.success('Your business plan is ready!');
      navigate('/dashboard'); // Take them back to dashboard to see results
    } catch (err) {
      console.error(err);
      toast.error('Oops! Make sure you completed the general onboarding first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', color: '#0056d2' }}>Let's Start Your Business!</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '1rem' }}>
        Skip the hard math. Tell us what you want to sell, and we'll calculate if it's profitable.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'block' }}>
            What do you want to sell?
          </label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g. Leather Wallets, Organic Shampoo..."
            value={productName}
            onChange={e => setProductName(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '1rem' }}
          />
        </div>

        <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>How much will you sell it for?</label>
            <input type="number" className="input" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" />
            <small style={{ color: '#888' }}>The price the customer pays.</small>
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>How much does it cost you to buy/make?</label>
            <input type="number" className="input" value={productCost} onChange={e => setProductCost(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>What is the delivery cost per order?</label>
            <input type="number" className="input" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>How much will you spend on ads monthly?</label>
            <input type="number" className="input-field" value={adSpend} onChange={e => setAdSpend(e.target.value)} placeholder="5000" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>How many orders do you expect per month?</label>
            <input type="number" className="input-field" value={expectedOrders} onChange={e => setExpectedOrders(e.target.value)} placeholder="100" />
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>Do you pay tax securely?</label>
            <select className="input-field" value={payTax} onChange={e => setPayTax(e.target.value)}>
              <option value="no">No, I do not pay tax right now</option>
              <option value="yes">Yes, I am a registered tax payer</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ width: '100%', fontSize: '1.2rem', padding: '1rem', background: '#0056d2' }}
        >
          {loading ? 'Building your plan...' : 'Calculate My Business Plan'}
        </button>
      </form>
    </div>
  );
}
