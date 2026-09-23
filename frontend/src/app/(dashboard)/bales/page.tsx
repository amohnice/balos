'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function BalesPage() {
  const router = useRouter();
  const { activeBusinessId: businessId } = useActiveBusiness();
  const { toast } = useToast();
  const [bales, setBales] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    supplierId: '',
    referenceNo: '',
    purchasePrice: '',
    weightKg: '',
    notes: '',
  });

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.bales
      .list(businessId)
      .then((balesRes: any) => {
        setBales(balesRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        toast(err.message || 'Failed to fetch bales data', 'error');
        setLoading(false);
      });
  }, [businessId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.bales.create(businessId, {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
      });
      setShowModal(false);
      setFormData({
        supplierId: '',
        referenceNo: '',
        purchasePrice: '',
        weightKg: '',
        notes: '',
      });
      toast('Bale created successfully', 'success');
      const res = await api.bales.list(businessId);
      setBales(res.data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to create bale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    if (businessId) {
      api.suppliers.list(businessId).then((res: any) => setSuppliers(res.data || []));
    }
    setShowModal(true);
  };

  const handleOpenSupplierModal = () => {
    setShowModal(false);
    setShowSupplierModal(true);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || isSubmittingSupplier) return;

    setIsSubmittingSupplier(true);
    try {
      await api.suppliers.create(businessId, supplierFormData);
      setShowSupplierModal(false);
      setSupplierFormData({ name: '', phone: '', email: '', location: '', notes: '' });
      toast('Supplier created successfully', 'success');
      const res = await api.suppliers.list(businessId);
      setSuppliers(res.data || []);
      setShowModal(true);
    } catch (err: any) {
      toast(err.message || 'Failed to create supplier', 'error');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleStartSorting = async (baleId: string) => {
    if (!businessId) return;
    try {
      await api.bales.update(businessId, baleId, { status: 'SORTING' });
      toast('Sorting started for bale', 'info');
      router.push(`/bales/${baleId}`);
    } catch (err: any) {
      toast(err.message || 'Failed to start sorting', 'error');
    }
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );

  if (!businessId) return <div className="p-6 text-gray-500">No active business selected.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Bales Inventory</h1>
          <p className="text-sm text-gray-500">Track bale arrivals, sorting stages, and category breakdowns</p>
        </div>
        <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER', 'SORTER']}>
          <Button onClick={handleOpenModal}>+ Add Bale</Button>
        </RequireRole>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bales.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-gray-500">
              No bales recorded for this business yet.
            </CardContent>
          </Card>
        ) : (
          bales.map((bale) => {
            const totalItems = bale.categories?.reduce((s: number, c: any) => s + (c.quantity || 0), 0) || 0;
            const totalSold = bale.categories?.reduce((s: number, c: any) => s + (c.soldCount || 0), 0) || 0;
            const percentSold = totalItems > 0 ? Math.min(100, Math.round((totalSold / totalItems) * 100)) : 0;

            const badgeVariant =
              bale.status === 'ACTIVE'
                ? 'success'
                : bale.status === 'SORTING'
                ? 'warning'
                : bale.status === 'CLEARED'
                ? 'info'
                : 'default';

            return (
              <Card key={bale.id} className="hover:shadow-md transition border-gray-200 flex flex-col justify-between">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {bale.referenceNo || bale.baleNumber || 'Ref N/A'}
                      </p>
                      <p className="text-xs text-gray-500">Supplier: {bale.supplier?.name || 'Unknown'}</p>
                      {bale.weightKg && <p className="text-xs text-gray-500">Weight: {bale.weightKg} kg</p>}
                    </div>
                    <Badge variant={badgeVariant}>{bale.status}</Badge>
                  </div>

                  {/* Stock Sales Progress */}
                  {totalItems > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                        <span>Stock Sold ({totalSold}/{totalItems})</span>
                        <span>{percentSold}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            bale.status === 'CLEARED'
                              ? 'bg-emerald-500'
                              : percentSold > 50
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">KES {bale.purchasePrice?.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/bales/${bale.id}`)}>
                        View Details
                      </Button>
                      {bale.status === 'ARRIVED' && (
                        <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                          <Button size="sm" onClick={() => handleStartSorting(bale.id)}>
                            Sort
                          </Button>
                        </RequireRole>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Bale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select
              value={formData.supplierId}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  handleOpenSupplierModal();
                } else {
                  setFormData({ ...formData, supplierId: e.target.value });
                }
              }}
              required
              label="Supplier"
            >
              <option value="">Select a supplier</option>
              {suppliers.filter((s) => s.isActive !== false).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              <option value="__new__">+ Add new supplier...</option>
            </Select>
          </div>
          <Input
            label="Reference / Serial Number"
            value={formData.referenceNo}
            onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
            placeholder="e.g. BAL-2026-001"
          />
          <Input
            label="Purchase Price (KES)"
            type="number"
            min="0"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            required
            placeholder="45000"
          />
          <Input
            label="Weight (kg)"
            type="number"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
            placeholder="45"
          />
          <Input
            label="Notes / Description"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="First camera grade jackets"
          />
          <Button type="submit" className="w-full py-2.5" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Bale'}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="Add New Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Name"
            value={supplierFormData.name}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={supplierFormData.phone}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={supplierFormData.email}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
          />
          <Input
            label="Location"
            value={supplierFormData.location}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, location: e.target.value })}
          />
          <Input
            label="Notes"
            value={supplierFormData.notes}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={isSubmittingSupplier}>
            {isSubmittingSupplier ? 'Creating...' : 'Create Supplier'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
