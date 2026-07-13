'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getFirstBusinessId } from '@/lib/business';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.businesses.list().then((res: any) => {
        const id = getFirstBusinessId(res.data);
        if (id) {
          setBusinessId(id);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (businessId) {
      api.sales.list(businessId).then((res: any) => {
        setSales(res.data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId]);

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );
  if (!businessId) return <div className="p-4">No business found</div>;

  return (
    <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER", "CASHIER"]} fallback={<div className="p-4">Insufficient permissions to view sales history.</div>}>
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Sales History</h1>

      <div className="space-y-4">
        {sales.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">No sales recorded yet</CardContent>
          </Card>
        ) : (
          sales.map((sale) => (
            <Card key={sale.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">KES {sale.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleDateString()} at{' '}
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-500">Cashier: {sale.cashier.name}</p>
                  </div>
                  <Badge variant={sale.paymentMethod === 'CASH' ? 'success' : sale.paymentMethod === 'MPESA' ? 'info' : 'default'}>
                    {sale.paymentMethod}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {sale.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span>{item.category.name} × {item.quantity}</span>
                      <span>KES {item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </RequireRole>
  );
}
