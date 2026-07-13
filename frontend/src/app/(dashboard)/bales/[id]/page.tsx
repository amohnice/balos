'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function BaleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bale, setBale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    gender: 'UNISEX',
    quantity: '',
    basePrice: '',
    pricingMode: 'FLEXIBLE',
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
    if (businessId && id) {
      api.bales.get(businessId, id as string).then((res: any) => {
        setBale(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId, id]);

  const handleStartSorting = async () => {
    if (!businessId || !id) return;

    try {
      await api.bales.update(businessId, id as string, { status: 'SORTING' });
      api.bales.get(businessId, id as string).then((res: any) => setBale(res.data));
    } catch (err: any) {
      alert(err.message || 'Failed to start sorting');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSubmittingCategory) return;

    setIsSubmittingCategory(true);
    try {
      await api.categories.create(id as string, {
        ...categoryFormData,
        quantity: Number(categoryFormData.quantity),
        basePrice: Number(categoryFormData.basePrice),
      });
      setShowCategoryModal(false);
      setCategoryFormData({
        name: '',
        description: '',
        gender: 'UNISEX',
        quantity: '',
        basePrice: '',
        pricingMode: 'FLEXIBLE',
      });
      if (businessId) {
        api.bales.get(businessId, id as string).then((res: any) => setBale(res.data));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleApproveCategory = async (categoryId: string) => {
    try {
      await api.categories.approve(categoryId);
      if (businessId) {
        api.bales.get(businessId, id as string).then((res: any) => setBale(res.data));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve category');
    }
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );
  if (!bale) return <div className="p-4">Bale not found</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => router.back()}>
          ← Back
        </Button>
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Bale Details</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bale Number</p>
              <p className="font-semibold text-gray-900">{bale.baleNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Price</p>
              <p className="font-semibold text-gray-900">KES {bale.purchasePrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-semibold text-gray-900">{bale.weightKg ? `${bale.weightKg} kg` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Supplier</p>
              <p className="font-semibold text-gray-900">{bale.supplier?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={bale.status === 'ARRIVED' ? 'success' : bale.status === 'SORTING' ? 'warning' : 'default'}>
                {bale.status}
              </Badge>
            </div>
          </div>
          {bale.status === 'ARRIVED' && (
            <div className="mt-4">
              <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
                <Button onClick={handleStartSorting}>Start Sorting</Button>
              </RequireRole>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-light text-gray-900 tracking-tight">Categories</h2>
        {bale.status === 'SORTING' && (
          <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "SORTER"]}>
            <Button onClick={() => setShowCategoryModal(true)}>Add Category</Button>
          </RequireRole>
        )}
      </div>

      <div className="grid gap-4">
        {bale.categories.map((category: any) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{category.name}</p>
                  {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500">Qty: {category.quantity}</span>
                    <span className="text-sm text-gray-500">Base: KES {category.basePrice.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Current: KES {category.currentPrice.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Sold: {category.soldCount}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant={category.status === 'APPROVED' ? 'success' : category.status === 'CLEARANCE' ? 'danger' : 'warning'}>
                      {category.status}
                    </Badge>
                    <Badge className="ml-2">{category.pricingMode}</Badge>
                  </div>
                </div>
                {category.status === 'PENDING' && (
                  <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
                    <Button size="sm" onClick={() => handleApproveCategory(category.id)}>
                      Approve
                    </Button>
                  </RequireRole>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add Category">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <Input
            label="Name"
            value={categoryFormData.name}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={categoryFormData.description}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
          />
          <div>
            <Select
              value={categoryFormData.gender}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, gender: e.target.value })}
              label="Gender"
            >
              <option value="UNISEX">Unisex</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="KIDS">Kids</option>
            </Select>
          </div>
          <Input
            label="Quantity"
            type="number"
            value={categoryFormData.quantity}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, quantity: e.target.value })}
            required
          />
          <Input
            label="Base Price (KES)"
            type="number"
            min="0"
            step="0.01"
            value={categoryFormData.basePrice}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, basePrice: e.target.value })}
            required
          />
          <div>
            <Select
              value={categoryFormData.pricingMode}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, pricingMode: e.target.value })}
              label="Pricing Mode"
            >
              <option value="FLEXIBLE">Flexible (can adjust price)</option>
              <option value="FIXED">Fixed (price cannot change)</option>
            </Select>
          </div>
          <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "SORTER"]}>
            <Button type="submit" className="w-full" disabled={isSubmittingCategory}>
              {isSubmittingCategory ? 'Adding...' : 'Add Category'}
            </Button>
          </RequireRole>
        </form>
      </Modal>
    </div>
  );
}
