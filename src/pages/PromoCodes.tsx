// src/pages/PromoCodes.tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiService';

interface PromoData {
  id?: number; // optional for existing promos
  user_id: number;
  promo_type: 'flat' | 'percentage' | 'string';
  discount: number;
  valid_for_hours: number;
  start_at_time: string;
  promo_code: string;
  max_uses: number;
}

const PromoCodes: React.FC = () => {
  const [promoData, setPromoData] = useState<PromoData>({
    user_id: 1,
    promo_type: 'flat',
    discount: 0,
    valid_for_hours: 24,
    start_at_time: new Date().toISOString(),
    promo_code: '',
    max_uses: 0,
  });

  const [promos, setPromos] = useState<PromoData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all promos from API
  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/promocode', { method: 'GET' });
      // Adjust based on your API response
      setPromos(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching promos:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPromoData({ ...promoData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...promoData };

      await apiFetch('/promocode', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Promo created successfully!');
      setPromoData({
        user_id: 1,
        promo_type: 'flat',
        discount: 0,
        valid_for_hours: 24,
        start_at_time: new Date().toISOString(),
        promo_code: '',
        max_uses: 0,
      });

      fetchPromos(); // Refresh the list
    } catch (err) {
      console.error('Error creating promo:', err);
      alert('Failed to create promo!');
    }
  };

  const deletePromo = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Delete this promo?')) return;

    try {
      await apiFetch(`/promocode/${id}`, { method: 'DELETE' });
      fetchPromos();
    } catch (err) {
      console.error('Error deleting promo:', err);
      alert('Failed to delete promo!');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">🎁 Create New Promo Code</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg max-w-lg space-y-5 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-600">Promo Code</label>
          <input type="text" name="promo_code" value={promoData.promo_code} onChange={handleChange} placeholder="e.g. IELTS50OFF" className="w-full mt-2 p-2 border rounded-lg" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Promo Type</label>
          <select name="promo_type" value={promoData.promo_type} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg">
            <option value="flat">Flat Amount</option>
            <option value="percentage">Percentage</option>
            <option value="string">String</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Discount</label>
          <input type="number" name="discount" value={promoData.discount} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" required min={1} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Valid For Hours</label>
          <input type="number" name="valid_for_hours" value={promoData.valid_for_hours} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" required min={1} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Start Time</label>
          <input type="datetime-local" name="start_at_time" value={promoData.start_at_time.slice(0,16)} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Max Uses</label>
          <input type="number" name="max_uses" value={promoData.max_uses} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" min={0} />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Create Promo</button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Promo Modules</h2>
      {promos.length === 0 ? (
        <p className="text-gray-500">No promos yet.</p>
      ) : (
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Code</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Discount</th>
              <th className="py-3 px-4 text-left">Valid Hours</th>
              <th className="py-3 px-4 text-left">Max Uses</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.id}>
                <td className="py-3 px-4">{promo.promo_code}</td>
                <td className="py-3 px-4 capitalize">{promo.promo_type}</td>
                <td className="py-3 px-4">{promo.discount}{promo.promo_type === 'percentage' ? '%' : ''}</td>
                <td className="py-3 px-4">{promo.valid_for_hours}</td>
                <td className="py-3 px-4">{promo.max_uses}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => deletePromo(promo.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PromoCodes;
