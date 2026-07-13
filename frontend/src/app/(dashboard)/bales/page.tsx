'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getFirstBusinessId } from '@/lib/business';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function BalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
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
    baleNumber: '',
    purchasePrice: '',
    weightKg: '',
    description: '',
  });

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
      Promise.all([
        api.bales.list(businessId),
        api.suppliers.list(businessId),
      ]).then(([balesRes, suppliersRes]: any[]) => {
        setBales(balesRes.data || []);
        setSuppliers(suppliersRes.data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId]);

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
        baleNumber: '',
        purchasePrice: '',
        weightKg: '',
        description: '',
      });
      // Refresh bales
      api.bales.list(businessId).then((res: any) => setBales(res.data || []));
    } catch (err: any) {
      alert(err.message || 'Failed to create bale');
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
      // Refresh suppliers and reopen bale modal
      api.suppliers.list(businessId).then((res: any) => {
        setSuppliers(res.data || []);
        setShowModal(true);
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleStartSorting = async (baleId: string) => {
    if (!businessId) return;
    try {
      await api.bales.update(businessId, baleId, { status: 'SORTING' });
      router.push(`/bales/${baleId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start sorting');
    }
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );
  if (!businessId) return <div className="p-4">No business found</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Bales</h1>
        <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER", "SORTER"]}>
          <Button onClick={handleOpenModal}>Add Bale</Button>
        </RequireRole>
      </div>

      <div className="grid gap-4">
        {bales.map((bale) => (
          <Card key={bale.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{bale.baleNumber || 'No Bale Number'}</p>
                  <p className="text-sm text-gray-500">Supplier: {bale.supplier?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">Price: KES {bale.purchasePrice.toLocaleString()}</p>
                </div>
                <Badge variant={bale.status === 'ARRIVED' ? 'success' : bale.status === 'SORTING' ? 'warning' : 'default'}>
                  {bale.status}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/bales/${bale.id}`)}>
                  View Details
                </Button>
                {bale.status === 'ARRIVED' && (
                  <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
                    <Button size="sm" onClick={() => handleStartSorting(bale.id)}>
                      Start Sorting
                    </Button>
                  </RequireRole>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
            label="Bale Number"
            value={formData.baleNumber}
            onChange={(e) => setFormData({ ...formData, baleNumber: e.target.value })}
          />
          <Input
            label="Purchase Price (KES)"
            type="number"
            min="0"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            required
          />
          <Input
            label="Weight (kg)"
            type="number"
            value={formData.weightKg}
            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
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
