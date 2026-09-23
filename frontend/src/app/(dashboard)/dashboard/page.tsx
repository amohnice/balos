'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardPage() {
  const { activeBusinessId: businessId, activeBusiness } = useActiveBusiness();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchDashboardData = (bizId: string) => {
    setLoading(true);
    Promise.all([
      api.dashboard.get(bizId),
      api.activityLogs.list(bizId).catch(() => ({ data: [] })),
    ])
      .then(([dashRes, logsRes]: [any, any]) => {
        setData(dashRes.data);
        setActivityLogs(logsRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        toast(err.message || 'Failed to fetch dashboard data', 'error');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (businessId) {
      fetchDashboardData(businessId);
    } else {
      setLoading(false);
    }
  }, [businessId]);

  const handleApprove = async (categoryId: string) => {
    setApprovingId(categoryId);
    try {
      await api.categories.approve(categoryId);
      toast('Category approved for sale', 'success');
      if (businessId) fetchDashboardData(businessId);
    } catch (err: any) {
      toast(err.message || 'Failed to approve category', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SALE')) return 'success';
    if (action.includes('APPROVED')) return 'info';
    if (action.includes('BALE')) return 'default';
    if (action.includes('MEMBER')) return 'warning';
    return 'default';
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );

  if (!businessId) return <div className="p-6 text-gray-500">No active business selected.</div>;
  if (!data) return <div className="p-6 text-gray-500">No data available</div>;

  const { metrics, recentSales, pendingCategories } = data;

  return (
    <RequireRole
      businessId={businessId ?? undefined}
      businessRoles={['OWNER', 'MANAGER', 'CASHIER', 'SORTER']}
      fallback={<div className="p-4 text-gray-500">Insufficient permissions to view dashboard.</div>}
    >
      <div className="p-4 md:p-6 space-y-6">
        <DashboardHeader title="Dashboard Overview" businessName={activeBusiness?.name} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:border-gray-300 transition">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Bales</p>
              <p className="text-2xl font-light text-gray-900 tracking-tight mt-1">{metrics.totalBales}</p>
            </CardContent>
          </Card>
          <Card className="hover:border-gray-300 transition">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active Bales</p>
              <p className="text-2xl font-light text-gray-900 tracking-tight mt-1">{metrics.activeBales}</p>
            </CardContent>
          </Card>
          <Card className="hover:border-gray-300 transition">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Sales</p>
              <p className="text-2xl font-light text-gray-900 tracking-tight mt-1">{metrics.totalSales}</p>
            </CardContent>
          </Card>
          <Card className="hover:border-gray-300 transition">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Today&apos;s Revenue</p>
              <p className="text-2xl font-semibold text-gray-900 tracking-tight mt-1">
                KES {metrics.todayRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Section */}
        {pendingCategories && pendingCategories.length > 0 && (
          <Card className="border-amber-200/80 bg-amber-50/20">
            <CardHeader className="border-b border-gray-100 flex justify-between items-center pb-3">
              <div>
                <h2 className="text-lg font-medium text-gray-900 tracking-tight">Pending Category Approvals</h2>
                <p className="text-xs text-gray-500">Stock items sorted by employees awaiting manager approval</p>
              </div>
              <Badge variant="warning">{pendingCategories.length} Pending</Badge>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {pendingCategories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-gray-200/80 rounded-xl gap-3 shadow-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Bale Ref:{' '}
                        {cat.bale?.id ? (
                          <Link
                            href={`/bales/${cat.bale.id}`}
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            {cat.bale.referenceNo || cat.bale.baleNumber || 'View Bale'}
                          </Link>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {cat.bale?.id && (
                        <Link href={`/bales/${cat.bale.id}`}>
                          <Button size="sm" variant="secondary">
                            View Bale
                          </Button>
                        </Link>
                      )}
                      <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(cat.id)}
                          disabled={approvingId === cat.id}
                        >
                          {approvingId === cat.id ? 'Approving...' : 'Approve Now'}
                        </Button>
                      </RequireRole>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-light text-gray-900 tracking-tight">Recent Sales</h2>
            </CardHeader>
            <CardContent className="p-4">
              {recentSales.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No sales recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-gray-900">KES {sale.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Cashier: {sale.cashier?.name || 'Staff'}</p>
                      </div>
                      <Badge variant="success">{sale.paymentMethod}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Audit Feed */}
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-light text-gray-900 tracking-tight">Store Activity Log</h2>
                <p className="text-xs text-gray-500">Live audit feed of staff & store events</p>
              </div>
              <Badge variant="info">{activityLogs.length} Events</Badge>
            </CardHeader>
            <CardContent className="p-4">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No activity recorded yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{log.user?.name || 'Staff'}</span>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px] uppercase">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{log.details}</p>
                      <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireRole>
  );
}
