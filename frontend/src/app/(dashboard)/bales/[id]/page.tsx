'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function BaleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeBusinessId: businessId } = useActiveBusiness();
  const { toast } = useToast();
  const [bale, setBale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    gender: 'UNISEX',
    quantity: '',
    basePrice: '',
    pricingMode: 'FLEXIBLE',
  });

  const fetchBale = () => {
    if (businessId && id) {
      api.bales
        .get(businessId, id as string)
        .then((res: any) => {
          setBale(res.data);
          setLoading(false);
        })
        .catch((err) => {
          toast(err.message || 'Failed to fetch bale details', 'error');
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchBale();
  }, [businessId, id]);

  const handleStartSorting = async () => {
    if (!businessId || !id) return;

    try {
      await api.bales.update(businessId, id as string, { status: 'SORTING' });
      toast('Bale status updated to SORTING', 'info');
      fetchBale();
    } catch (err: any) {
      toast(err.message || 'Failed to start sorting', 'error');
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
      toast('Stock category submitted for approval', 'success');
      fetchBale();
    } catch (err: any) {
      toast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleApproveCategory = async (categoryId: string) => {
    try {
      await api.categories.approve(categoryId);
      toast('Category approved for sale', 'success');
      fetchBale();
    } catch (err: any) {
      toast(err.message || 'Failed to approve category', 'error');
    }
  };

  const handleOpenEditPrice = (category: any) => {
    setEditingCategory(category);
    setNewPrice(String(category.currentPrice));
    setPriceReason('');
    setShowEditPriceModal(true);
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || isUpdatingPrice) return;

    const numPrice = Number(newPrice);
    if (!numPrice || numPrice <= 0) {
      toast('Please enter a valid price greater than 0', 'warning');
      return;
    }

    setIsUpdatingPrice(true);
    try {
      await api.categories.updatePrice(editingCategory.id, {
        newPrice: numPrice,
        reason: priceReason || undefined,
      });
      toast(`Price updated for ${editingCategory.name}`, 'success');
      setShowEditPriceModal(false);
      fetchBale();
    } catch (err: any) {
      toast(err.message || 'Failed to update price', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center p-4">
        <Spinner size="md" className="text-gray-900" />
      </div>
    );

  if (!bale) return <div className="p-6 text-gray-500">Bale record not found.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">
          Bale Details ({bale.referenceNo || bale.baleNumber || 'N/A'})
        </h1>
        <Button variant="secondary" onClick={() => router.push('/bales')}>
          ← Back to Bales
        </Button>
      </div>

      {/* Bale Lifecycle Stepper */}
      <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
          <span>Bale Lifecycle Progress</span>
          <span className="uppercase text-indigo-600 tracking-wider">Status: {bale.status}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
          {['ARRIVED', 'SORTING', 'ACTIVE', 'CLEARED'].map((st, idx) => {
            const stepOrder = ['ARRIVED', 'SORTING', 'ACTIVE', 'CLEARED'];
            const currentIdx = stepOrder.indexOf(bale.status);
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div
                key={st}
                className={`py-2 px-1 rounded-lg border transition ${
                  isCurrent
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm font-bold'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {idx + 1}. {st.charAt(0) + st.slice(1).toLowerCase()}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Reference</p>
              <p className="font-semibold text-gray-900">{bale.referenceNo || bale.baleNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Purchase Price</p>
              <p className="font-semibold text-gray-900">KES {bale.purchasePrice?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Weight</p>
              <p className="font-semibold text-gray-900">{bale.weightKg ? `${bale.weightKg} kg` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Supplier</p>
              <p className="font-semibold text-gray-900">{bale.supplier?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Status:</span>
              <Badge variant={bale.status === 'ARRIVED' ? 'success' : bale.status === 'SORTING' ? 'warning' : 'default'}>
                {bale.status}
              </Badge>
            </div>
            {bale.status === 'ARRIVED' && (
              <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                <Button onClick={handleStartSorting}>Start Sorting</Button>
              </RequireRole>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-gray-900 tracking-tight">Categories & Items Breakdown</h2>
          <p className="text-xs text-gray-500">Sorted items submitted by sorters for manager approval</p>
        </div>
        {bale.status === 'SORTING' && (
          <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'SORTER', 'MANAGER']}>
            <Button onClick={() => setShowCategoryModal(true)}>+ Add Sorted Category</Button>
          </RequireRole>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bale.categories.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-gray-500">
              No categories added to this bale yet.
            </CardContent>
          </Card>
        ) : (
          bale.categories.map((category: any) => (
            <Card key={category.id} className="hover:shadow-md transition border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{category.name}</p>
                    {category.description && <p className="text-xs text-gray-500">{category.description}</p>}
                  </div>
                  <Badge variant={category.status === 'APPROVED' ? 'success' : category.status === 'CLEARANCE' ? 'danger' : 'warning'}>
                    {category.status}
                  </Badge>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p>Quantity: <span className="font-semibold">{category.quantity}</span></p>
                  <p>
                    Current Price: <span className="font-bold text-gray-900">KES {category.currentPrice?.toLocaleString()}</span>
                  </p>
                  <p>Pricing Mode: <span className="font-medium">{category.pricingMode}</span></p>
                  <p>Sold: <span className="font-medium">{category.soldCount || 0}</span></p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEditPrice(category)}>
                      Edit Price
                    </Button>

                    {category.status === 'PENDING' && (
                      <Button size="sm" onClick={() => handleApproveCategory(category.id)}>
                        Approve
                      </Button>
                    )}
                  </RequireRole>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add Sorted Category">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <Input
            label="Category Name (e.g. Camera Jeans)"
            value={categoryFormData.name}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
            required
            placeholder="Light Denim Jackets"
          />
          <Input
            label="Description / Notes"
            value={categoryFormData.description}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
            placeholder="Grade A heavy cotton"
          />
          <Select
            value={categoryFormData.gender}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, gender: e.target.value })}
            label="Gender / Target Audience"
          >
            <option value="UNISEX">Unisex</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="KIDS">Kids</option>
          </Select>
          <Input
            label="Quantity (Pieces)"
            type="number"
            value={categoryFormData.quantity}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, quantity: e.target.value })}
            required
            placeholder="30"
          />
          <Input
            label="Base / Minimum Selling Price (KES)"
            type="number"
            min="0"
            step="0.01"
            value={categoryFormData.basePrice}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, basePrice: e.target.value })}
            required
            placeholder="800"
          />
          <Select
            value={categoryFormData.pricingMode}
            onChange={(e) => setCategoryFormData({ ...categoryFormData, pricingMode: e.target.value })}
            label="Pricing Rules"
          >
            <option value="FLEXIBLE">Flexible (Cashier can sell higher than base price)</option>
            <option value="FIXED">Fixed (Strictly fixed price)</option>
          </Select>
          <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'SORTER', 'MANAGER']}>
            <Button type="submit" className="w-full py-2.5" disabled={isSubmittingCategory}>
              {isSubmittingCategory ? 'Submitting...' : 'Submit Category'}
            </Button>
          </RequireRole>
        </form>
      </Modal>

      {/* Edit Price Modal */}
      <Modal isOpen={showEditPriceModal} onClose={() => setShowEditPriceModal(false)} title={`Edit Price - ${editingCategory?.name}`}>
        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
            <p>Original Base Price: <span className="font-semibold text-gray-900">KES {editingCategory?.basePrice}</span></p>
            <p>Current Price: <span className="font-semibold text-gray-900">KES {editingCategory?.currentPrice}</span></p>
            <p className="text-gray-400">Setting a price below the base price automatically marks the item as CLEARANCE.</p>
          </div>

          <Input
            label="New Selling Price (KES)"
            type="number"
            min="1"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            required
          />

          <Input
            label="Reason for price change (optional)"
            value={priceReason}
            onChange={(e) => setPriceReason(e.target.value)}
            placeholder="e.g. End of season discount / Markdown"
          />

          <Button type="submit" className="w-full py-2.5" disabled={isUpdatingPrice}>
            {isUpdatingPrice ? 'Updating...' : 'Save New Price'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
