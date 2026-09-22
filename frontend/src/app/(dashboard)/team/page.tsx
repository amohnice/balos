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
import { Select } from '@/components/ui/Select';
import RequireRole from '@/components/RequireRole';
import { Spinner } from '@/components/ui/Spinner';

export default function TeamPage() {
  const { activeBusinessId: businessId } = useActiveBusiness();
  const { toast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SORTER',
  });

  const fetchMembers = () => {
    if (businessId) {
      setLoading(true);
      api.businesses
        .getMembers(businessId)
        .then((res: any) => {
          setMembers(res.data || []);
          setLoading(false);
        })
        .catch((err) => {
          toast(err.message || 'Failed to fetch team members', 'error');
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    fetchMembers();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.businesses.addMember(businessId, formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'SORTER' });
      toast(`Added ${formData.name} as ${formData.role}`, 'success');
      fetchMembers();
    } catch (err: any) {
      toast(err.message || 'Failed to add team member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!businessId) return;

    try {
      await api.businesses.updateMember(businessId, memberId, { role });
      toast('Team member role updated', 'success');
      fetchMembers();
    } catch (err: any) {
      toast(err.message || 'Failed to update role', 'error');
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
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">Team & Staff</h1>
          <p className="text-sm text-gray-500">Manage business members and assign Sorter, Cashier, or Manager roles</p>
        </div>
        <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
          <Button onClick={() => setShowModal(true)}>+ Add Staff Member</Button>
        </RequireRole>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-gray-500">
              No staff members assigned to this shop yet.
            </CardContent>
          </Card>
        ) : (
          members.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{member.user?.name}</p>
                    <p className="text-xs text-gray-500">{member.user?.email}</p>
                    {member.user?.phone && <p className="text-xs text-gray-500">{member.user?.phone}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Joined: {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={member.isActive ? 'success' : 'danger'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="default" className="text-xs font-mono">{member.role}</Badge>
                  </div>
                </div>

                {member.role !== 'OWNER' && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">Change Role:</span>
                    <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
                      <Select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="text-xs py-1 px-2 font-medium"
                      >
                        <option value="MANAGER">Manager</option>
                        <option value="SORTER">Sorter</option>
                        <option value="CASHIER">Cashier</option>
                      </Select>
                    </RequireRole>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Staff Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Jane Wanjiru"
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="jane@example.com"
          />
          <Input
            label="Login Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
          />
          <Select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            label="Assigned Business Role"
          >
            <option value="SORTER">Sorter (Break bales & label categories)</option>
            <option value="CASHIER">Cashier (Process POS sales)</option>
            <option value="MANAGER">Manager (Full operational access)</option>
          </Select>
          <RequireRole businessId={businessId ?? undefined} businessRoles={['OWNER', 'MANAGER']}>
            <Button type="submit" className="w-full py-2.5" disabled={isSubmitting}>
              {isSubmitting ? 'Adding Member...' : 'Create Staff Member'}
            </Button>
          </RequireRole>
        </form>
      </Modal>
    </div>
  );
}
