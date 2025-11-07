// src/pages/PromoCodes.tsx
import React, { useState } from 'react';

interface PromoData {
  code: string;
  type: 'flat' | 'percentage';
  value: string;
  usageLimit: string;
  perUserLimit: 'single' | 'multiple';
}

const PromoCodes: React.FC = () => {
  const [promoData, setPromoData] = useState<PromoData>({
    code: '',
    type: 'flat',
    value: '',
    usageLimit: '',
    perUserLimit: 'single',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPromoData({ ...promoData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingPromos = JSON.parse(localStorage.getItem('promos') || '[]');
    const codeExists = existingPromos.some((p: PromoData) => p.code.toLowerCase() === promoData.code.toLowerCase());
    if (codeExists) {
      alert('Promo code already exists!');
      return;
    }
    existingPromos.push(promoData);
    localStorage.setItem('promos', JSON.stringify(existingPromos));
    alert('Promo created successfully!');
    setPromoData({ code: '', type: 'flat', value: '', usageLimit: '', perUserLimit: 'single' });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🎁 Create New Promo Code</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-600">Promo Code</label>
          <input type="text" name="code" value={promoData.code} onChange={handleChange} placeholder="e.g. IELTS50OFF" className="w-full mt-2 p-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600">Promo Type</label>
          <select name="type" value={promoData.type} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg">
            <option value="flat">Flat Amount Discount</option>
            <option value="percentage">Percentage Discount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600">Discount Value ({promoData.type === 'flat' ? 'PKR' : '%'})</label>
          <input type="number" name="value" value={promoData.value} onChange={handleChange} placeholder={promoData.type === 'flat' ? '500' : '10'} className="w-full mt-2 p-2 border rounded-lg" required min="1" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600">Usage Limit (optional)</label>
          <input type="number" name="usageLimit" value={promoData.usageLimit} onChange={handleChange} placeholder="e.g. 50" className="w-full mt-2 p-2 border rounded-lg" min="1" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600">Per User Limit</label>
          <select name="perUserLimit" value={promoData.perUserLimit} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg">
            <option value="single">Single use per customer</option>
            <option value="multiple">Multiple uses per customer</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Create Promo</button>
      </form>
    </div>
  );
};

export default PromoCodes;