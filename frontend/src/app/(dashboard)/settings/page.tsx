'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const businessId = user?.businesses?.[0]?.id;
  const [business, setBusiness] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    api.businesses.get(businessId)
      .then((res: any) => {
        const businessData = res.data;
        setBusiness(businessData);
        setFormData({
          name: businessData.name || '',
          description: businessData.description || '',
          location: businessData.location || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    setSaving(true);
    setStatus(null);

    try {
      const res = await api.businesses.update(businessId, formData);
      setBusiness(res.data);
      setStatus('Business settings updated successfully.');

      if (user) {
        updateUser({
          ...user,
          businesses: user.businesses?.map((b) =>
            b.id === businessId ? { ...b, name: formData.name, location: formData.location } : b
          ),
        });
      }
    } catch (err: any) {
      setStatus(err?.message || 'Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-light text-gray-900 tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-light text-gray-900 tracking-tight">Account</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">System Role</p>
            <p className="font-medium text-gray-900">{user?.systemRole}</p>
          </div>
          <div className="pt-4 border-t">
            <Button variant="danger" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-light text-gray-900 tracking-tight">Business Settings</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading business details...</p>
          ) : business ? (
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
                rows={4}
              />
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {status && <p className="text-sm text-gray-600">{status}</p>}
              <div className="pt-4 border-t">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Business Settings'}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-500">No active business available to edit.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
