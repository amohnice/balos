'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getFirstBusinessId } from '@/lib/business';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import RequireRole from '@/components/RequireRole';
import {Spinner} from "@/components/ui/Spinner";

export default function TeamPage() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
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
      api.businesses.getMembers(businessId).then((res: any) => {
        setMembers(res.data || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      await api.businesses.addMember(businessId, formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'CASHIER' });
      api.businesses.getMembers(businessId).then((res: any) => setMembers(res.data || []));
    } catch (err: any) {
      alert(err.message || 'Failed to add team member');
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    if (!businessId) return;

    try {
      await api.businesses.updateMember(businessId, memberId, { role });
      api.businesses.getMembers(businessId).then((res: any) => setMembers(res.data || []));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
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
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Team</h1>
        <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
          <Button onClick={() => setShowModal(true)}>Add Member</Button>
        </RequireRole>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{member.user.name}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                  {member.user.phone && <p className="text-sm text-gray-500">{member.user.phone}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Joined: {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={member.isActive ? 'success' : 'danger'}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge>{member.role}</Badge>
                  {member.role !== 'OWNER' && (
                    <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
                      <Select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="text-sm"
                      >
                        <option value="MANAGER">Manager</option>
                        <option value="SORTER">Sorter</option>
                        <option value="CASHIER">Cashier</option>
                      </Select>
                    </RequireRole>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              label="Role"
            >
              <option value="MANAGER">Manager</option>
              <option value="SORTER">Sorter</option>
              <option value="CASHIER">Cashier</option>
            </Select>
          </div>
          <RequireRole businessId={businessId ?? undefined} businessRoles={["OWNER", "MANAGER"]}>
            <Button type="submit" className="w-full">Add Member</Button>
          </RequireRole>
        </form>
      </Modal>
    </div>
  );
}
