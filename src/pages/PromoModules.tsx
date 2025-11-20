// src/pages/PromoModules.tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiService';

interface Promo {
  id: number;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  usageLimit?: number;
  perUserLimit: 'single' | 'multiple';
}

const PromoModules: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch all promos from API ---
  const fetchPromos = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/promocode', { method: 'GET' });
      const promoArray = data?.data?.promocodes ?? [];
      setPromos(promoArray);
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

  // --- Update promo (optional, can extend for edit modal) ---
  const updatePromo = async (id: number, updatedData: Partial<Promo>) => {
    try {
      await apiFetch(`/promocode/${id}`, { method: 'PUT', body: JSON.stringify(updatedData) });
      fetchPromos(); // refresh list
    } catch (err) {
      console.error('Error updating promo:', err);
      alert('Failed to update promo.');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Promo Modules</h1>
      {promos.length === 0 ? (
        <p className="text-gray-500">No promos yet.</p>
      ) : (
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Code</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-left">Value</th>
              <th className="py-3 px-4 text-left">Usage Limit</th>
              <th className="py-3 px-4 text-left">Per User</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr key={promo.id} className="border-b">
                <td className="py-3 px-4">{promo.code}</td>
                <td className="py-3 px-4 capitalize">{promo.type}</td>
                <td className="py-3 px-4">{promo.type === 'flat' ? `₨${promo.value}` : `${promo.value}%`}</td>
                <td className="py-3 px-4">{promo.usageLimit ?? '∞'}</td>
                <td className="py-3 px-4 capitalize">{promo.perUserLimit}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => deletePromo(promo.id, promo.code)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                  {/* Optional: Add edit button and open modal for updatePromo */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PromoModules;
