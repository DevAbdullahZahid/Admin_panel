// src/pages/PromoModules.tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiService';

// Match actual API response structure
interface Promo {
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

const PromoModules: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch all promos from API ---
  const fetchPromos = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/promocode/', { method: 'GET' });
      // API returns: { code: 200, status: "success", message: "...", data: { promo_codes: [...] } }
      const promoArray = response?.data?.promo_codes || [];
      setPromos(Array.isArray(promoArray) ? promoArray : []);
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // --- Delete promo by ID ---
  const deletePromo = async (id: number, code: string) => {
    if (!window.confirm(`Delete promo ${code}?`)) return;
    try {
      await apiFetch(`/promocode/${id}`, { method: 'DELETE' });
      setPromos(promos.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting promo:', err);
      alert('Failed to delete promo.');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Promo Modules</h1>
      {promos.length === 0 ? (
        <p className="text-gray-500">No promos yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Code</th>
                <th className="py-3 px-4 text-left">Type</th>
                <th className="py-3 px-4 text-left">Discount</th>
                <th className="py-3 px-4 text-left">Max Uses</th>
                <th className="py-3 px-4 text-left">Valid Hours</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{promo.promo_code}</td>
                  <td className="py-3 px-4 capitalize">{promo.type}</td>
                  <td className="py-3 px-4">
                    {promo.type === 'flat' ? `₨${promo.discount}` :
                      promo.type === 'percentage' ? `${promo.discount}%` :
                        promo.discount}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-500">{promo.max_uses ?? '∞'}</span>
                  </td>
                  <td className="py-3 px-4">{promo.valid_for_hours ?? 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${promo.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {promo.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deletePromo(promo.id, promo.promo_code)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PromoModules;
