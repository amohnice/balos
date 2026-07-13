'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardPage() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentBusinessName = user?.businesses?.[0]?.name;

  useEffect(() => {
    // Get first business ID from user's memberships
    if (user) {
      api.businesses.list().then((res: any) => {
        if (res.data && res.data.length > 0) {
          setBusinessId(res.data[0].id);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (businessId) {
      api.dashboard.get(businessId).then((res: any) => {
        setData(res.data);
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

  if (!data) return <div className="p-4">No data available</div>;

  const { metrics, recentSales, pendingCategories, topCategories } = data;

  return (
    <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER", "CASHIER"]} fallback={<div className="p-4">Insufficient permissions to view dashboard.</div>}>
      <div className="p-4 md:p-6 space-y-6">
        <DashboardHeader
          title="Dashboard"
          businessName={currentBusinessName}
        />

        {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Bales</p>
            <p className="text-2xl font-light text-gray-900 tracking-tight">{metrics.totalBales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Bales</p>
            <p className="text-2xl font-light text-gray-900 tracking-tight">{metrics.activeBales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-light text-gray-900 tracking-tight">{metrics.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-light text-gray-900 tracking-tight">KES {metrics.todayRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Categories */}
      {pendingCategories && pendingCategories.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-light text-gray-900 tracking-tight">Pending Approvals</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingCategories.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-sm text-gray-500">{cat.bale.referenceNo}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-light text-gray-900 tracking-tight">Recent Sales</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">KES {sale.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{sale.cashier.name}</p>
                </div>
                <Badge variant="success">{sale.paymentMethod}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </RequireRole>
  );
}
