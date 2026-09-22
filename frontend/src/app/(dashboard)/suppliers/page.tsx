'use client';

import { useEffect, useState } from 'react';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/ui/Spinner';

interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export default function SuppliersPage() {
  const { activeBusinessId: businessId } = useActiveBusiness();
  const { toast, confirm } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.suppliers
      .list(businessId)
      .then((res) => {
        setSuppliers((res.data || []) as Supplier[]);
        setLoading(false);
      })
      .catch((err) => {
        toast(err.message || 'Failed to load suppliers', 'error');
        setLoading(false);
      });
  }, [businessId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await api.suppliers.update(businessId, editingSupplier.id, formData);
        toast('Supplier updated successfully', 'success');
      } else {
        await api.suppliers.create(businessId, formData);
        toast('Supplier created successfully', 'success');
      }
      handleCloseModal();
      const res = await api.suppliers.list(businessId);
      setSuppliers((res.data || []) as Supplier[]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      location: supplier.location || '',
      notes: supplier.notes || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', email: '', location: '', notes: '' });
  };

  const handleDelete = async (supplierId: string) => {
    if (!businessId) return;

    const approved = await confirm({
      title: 'Deactivate Supplier',
      message: 'Are you sure you want to deactivate this supplier? This action can be undone later.',
      confirmText: 'Deactivate',
      variant: 'danger',
    });

    if (!approved) return;

    try {
      await api.suppliers.delete(businessId, supplierId);
      toast('Supplier deactivated', 'info');
      const res = await api.suppliers.list(businessId);
      setSuppliers((res.data || []) as Supplier[]);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete supplier', 'error');
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
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-gray-500">Manage suppliers providing bales to your business</p>
        </div>
        <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
          <Button onClick={() => setShowModal(true)}>Add Supplier</Button>
        </RequireRole>
      </div>

      <div className="grid gap-4">
        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No suppliers registered yet.
            </CardContent>
          </Card>
        ) : (
          suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:border-gray-300 transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{supplier.name}</p>
                    {supplier.phone && <p className="text-sm text-gray-500">Phone: {supplier.phone}</p>}
                    {supplier.email && <p className="text-sm text-gray-500">Email: {supplier.email}</p>}
                    {supplier.location && <p className="text-sm text-gray-500">Location: {supplier.location}</p>}
                    {supplier.notes && <p className="text-sm text-gray-500 mt-2 italic">{supplier.notes}</p>}
                  </div>
                  <Badge variant={supplier.isActive ? 'success' : 'danger'}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                    <Button size="sm" variant="secondary" onClick={() => handleEditClick(supplier)}>
                      Edit
                    </Button>
                    {supplier.isActive && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(supplier.id)}>
                        Deactivate
                      </Button>
                    )}
                  </RequireRole>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingSupplier ? 'Save Supplier' : 'Create Supplier'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
