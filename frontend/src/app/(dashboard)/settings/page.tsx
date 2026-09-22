'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveBusiness } from '@/contexts/ActiveBusinessContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import RequireRole from '@/components/RequireRole';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { activeBusinessId, activeBusiness, businesses, setActiveBusinessId } = useActiveBusiness();
  const { toast } = useToast();

  const [businessDetail, setBusinessDetail] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New business creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBizData, setNewBizData] = useState({ name: '', description: '', location: '' });

  useEffect(() => {
    if (!activeBusinessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.businesses
      .get(activeBusinessId)
      .then((res: any) => {
        const b = res.data;
        setBusinessDetail(b);
        setFormData({
          name: b?.name || '',
          description: b?.description || '',
          location: b?.location || '',
        });
      })
      .catch((err) => toast(err.message || 'Failed to load business details', 'error'))
      .finally(() => setLoading(false));
  }, [activeBusinessId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusinessId) return;

    setSaving(true);
    try {
      const res = await api.businesses.update(activeBusinessId, formData);
      setBusinessDetail(res.data);
      toast('Business settings updated successfully', 'success');

      if (user) {
        updateUser({
          ...user,
          businesses: user.businesses?.map((b) =>
            b.id === activeBusinessId ? { ...b, name: formData.name, location: formData.location } : b
          ),
        });
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to update business settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizData.name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res: any = await api.businesses.create({
        name: newBizData.name.trim(),
        description: newBizData.description.trim() || undefined,
        location: newBizData.location.trim() || undefined,
      });

      toast(`Business "${newBizData.name}" created!`, 'success');
      setShowCreateModal(false);
      setNewBizData({ name: '', description: '', location: '' });

      if (res.data?.id) {
        setActiveBusinessId(res.data.id);
        window.location.reload();
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to create new business', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Settings & Businesses</h1>
          <p className="text-sm text-gray-500">Manage profile, account details, and business settings</p>
        </div>
        <RequireRole businessId={activeBusinessId ?? undefined} businessRoles={['OWNER']}>
          <Button onClick={() => setShowCreateModal(true)}>+ Add Business / Shop</Button>
        </RequireRole>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-3">
          <h2 className="text-lg font-light text-gray-900 tracking-tight">User Profile</h2>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="font-semibold text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">System Role</p>
              <Badge variant="default" className="mt-0.5">{user?.systemRole}</Badge>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registered Businesses List */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-light text-gray-900 tracking-tight">My Businesses & Branches</h2>
            <p className="text-xs text-gray-500">All shops you own or are a member of</p>
          </div>
          <Badge variant="info">{businesses.length} Shop(s)</Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <div
                key={b.id}
                onClick={() => setActiveBusinessId(b.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  activeBusinessId === b.id
                    ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">{b.name}</p>
                    {activeBusinessId === b.id && <Badge variant="success">Active</Badge>}
                  </div>
                  {b.location && <p className="text-xs text-gray-500 mt-1">Location: {b.location}</p>}
                  {b.role && <p className="text-xs text-gray-400 mt-0.5">Role: {b.role}</p>}
                </div>
                <div className="pt-2 text-xs text-indigo-600 font-medium">
                  {activeBusinessId === b.id ? 'Currently Selected' : 'Click to Switch →'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Active Business Settings Form */}
      <RequireRole businessId={activeBusinessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
        <Card>
          <CardHeader className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-light text-gray-900 tracking-tight">
              Edit Selected Business ({activeBusiness?.name || 'Active Shop'})
            </h2>
          </CardHeader>
          <CardContent className="p-5">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner size="md" className="text-gray-900" />
              </div>
            ) : businessDetail ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Business Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Retail camera & grade A mitumba shop"
                />
                <Input
                  label="Location / Branch Address"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Gikomba Market, Stall 4B"
                />
                <div className="pt-4 border-t border-gray-100">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Business Settings'}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500">No active business selected to edit.</p>
            )}
          </CardContent>
        </Card>
      </RequireRole>

      {/* Modal: Create New Business */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Business / Branch">
        <form onSubmit={handleCreateBusiness} className="space-y-4">
          <Input
            label="Business / Shop Name"
            value={newBizData.name}
            onChange={(e) => setNewBizData({ ...newBizData, name: e.target.value })}
            required
            placeholder="e.g. Balos Eastleigh Outlet"
          />
          <Textarea
            label="Description (optional)"
            value={newBizData.description}
            onChange={(e) => setNewBizData({ ...newBizData, description: e.target.value })}
            rows={3}
            placeholder="Wholesale bale distribution & sorting"
          />
          <Input
            label="Location / City (optional)"
            value={newBizData.location}
            onChange={(e) => setNewBizData({ ...newBizData, location: e.target.value })}
            placeholder="Nairobi, Eastleigh 1st Street"
          />
          <Button type="submit" className="w-full py-2.5" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Business'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
