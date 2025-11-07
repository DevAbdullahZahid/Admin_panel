// src/pages/PromoModules.tsx
import React, { useState, useEffect } from 'react';

interface Promo {
  code: string;
  type: 'flat' | 'percentage';
  value: string;
  usageLimit: string;
  perUserLimit: 'single' | 'multiple';
}

const PromoModules: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedPromos = localStorage.getItem('promos');
    if (savedPromos) {
      setPromos(JSON.parse(savedPromos));
    }
    setIsLoading(false);
  }, []);

  const deletePromo = (code: string) => {
    if (window.confirm(`Delete ${code}?`)) {
      const updated = promos.filter((p) => p.code !== code);
      setPromos(updated);
      localStorage.setItem('promos', JSON.stringify(updated));
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
              <tr key={promo.code} className="border-b">
                <td className="py-3 px-4">{promo.code}</td>
                <td className="py-3 px-4 capitalize">{promo.type}</td>
                <td className="py-3 px-4">{promo.type === 'flat' ? `₨${promo.value}` : `${promo.value}%`}</td>
                <td className="py-3 px-4">{promo.usageLimit || '∞'}</td>
                <td className="py-3 px-4 capitalize">{promo.perUserLimit}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={() => deletePromo(promo.code)} className="text-red-600 hover:text-red-800">Delete</button>
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