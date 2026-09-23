'use client';

import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function SalesHistoryPage() {
  const { activeBusinessId: businessId } = useActiveBusiness();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.sales
      .list(businessId)
      .then((res: any) => {
        setSales(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );

  if (!businessId) return <div className="p-4 text-gray-500">No active business selected.</div>;

  return (
    <RequireRole
      businessId={businessId ?? undefined}
      businessRoles={['OWNER', 'MANAGER', 'CASHIER']}
      fallback={<div className="p-4 text-gray-500">Insufficient permissions to view sales history.</div>}
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Sales History & Price Audit</h1>
          <Badge variant="default">{sales.length} Total Sales</Badge>
        </div>

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
                      <p className="font-bold text-lg text-gray-900">KES {sale.totalAmount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()} at{' '}
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Cashier: <span className="font-semibold text-gray-800">{sale.cashier?.name || 'Staff'}</span>
                      </p>
                    </div>
                    <Badge
                      variant={
                        sale.paymentMethod === 'CASH'
                          ? 'success'
                          : sale.paymentMethod === 'MPESA'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {sale.paymentMethod}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {sale.items.map((item: any) => {
                      const expected = item.expectedPrice || 0;
                      const diff = item.unitPrice - expected;
                      const hasOverride = expected > 0 && diff !== 0;

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 gap-1"
                        >
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-semibold text-gray-900">
                              {item.category?.name || 'Stock Item'}
                            </span>
                            <span className="text-gray-500">× {item.quantity}</span>
                            {hasOverride && (
                              <Badge
                                variant={diff > 0 ? 'success' : 'warning'}
                                className="text-[10px] py-0 px-1.5"
                              >
                                {diff > 0
                                  ? `+ KES ${(diff * item.quantity).toLocaleString()} (Above Min)`
                                  : `- KES ${(Math.abs(diff) * item.quantity).toLocaleString()} (Discount)`}
                              </Badge>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-gray-900">
                              KES {item.totalPrice.toLocaleString()}
                            </span>
                            {hasOverride && (
                              <p className="text-[10px] text-gray-400">
                                Sold @ KES {item.unitPrice.toLocaleString()} (Min: KES {expected.toLocaleString()})
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
