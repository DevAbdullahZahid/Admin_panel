// src/pages/PromoCodes.tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiService';
import { useAuth } from '../hooks/useAuth';

// Request body interface
interface PromoData {
  user_id: number;
  promo_type: string; // API accepts: 'referral', 'percentage', 'flat', etc.
  discount: number;
  valid_for_hours: number;
  start_at_time: string;
  promo_code: string;
  max_uses: number;
}

// Response interface - API returns different field names
interface PromoResponse {
  id: number;
  user_id: number;
  promo_code: string;
  discount: number;
  type: string; // API returns 'type' not 'promo_type'
  start_at_time: string;
  valid_till_time: string | null;
  valid_for_hours: number | null;
  max_uses: number | null;
  is_active: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

const PromoCodes: React.FC = () => {
  const { currentUser } = useAuth(); // Get current user
  const [promoData, setPromoData] = useState<PromoData>({
    user_id: 0, // Will be updated with currentUser.id
    promo_type: 'referral',
    discount: 0,
    valid_for_hours: 24,
    start_at_time: new Date().toISOString(),
    promo_code: '',
    max_uses: 1,
  });

  // Update user_id when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setPromoData(prev => ({ ...prev, user_id: Number(currentUser.id) }));
    }
  }, [currentUser]);

  const [promos, setPromos] = useState<PromoResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all promos from API
  const fetchPromos = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/promocode/', { method: 'GET' });
      // API returns: { code: 200, status: "success", message: "...", data: { promo_codes: [...] } }
      const list = response.data?.promo_codes || [];
      setPromos(Array.isArray(list) ? list : []);
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

      await apiFetch('/promocode/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Promo created successfully!');
      setPromoData({
        user_id: Number(currentUser?.id) || 1,
        promo_type: 'referral',
        discount: 0,
        valid_for_hours: 24,
        start_at_time: new Date().toISOString(),
        promo_code: '',
        max_uses: 1,
      });

      fetchPromos(); // Refresh the list
    } catch (err: any) {
      console.error('Error creating promo:', err);
      alert(`Failed to create promo: ${err.message || 'Unknown error'}`);
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
            <option value="referral">Referral</option>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat Amount</option>
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
          <input type="datetime-local" name="start_at_time" value={promoData.start_at_time.slice(0, 16)} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600">Max Uses</label>
          <input type="number" name="max_uses" value={promoData.max_uses} onChange={handleChange} className="w-full mt-2 p-2 border rounded-lg" min={0} />
        </div>

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Create Promo</button>
      </form>




    </div >
  );
};

export default PromoCodes;
