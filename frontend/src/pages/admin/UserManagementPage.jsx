import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Shield, Users } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';

const ROLES = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'];

const roleVariant = {
  EMPLOYEE: 'primary',
  MANAGER: 'warning',
  HR: 'success',
  ADMIN: 'error',
};

const defaultForm = {
  email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  role: 'EMPLOYEE',
  department: '',
};

const UserManagementPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState(null);

  const { data: usersData, isLoading } = useUsers();
  const { data: deptData } = useDepartments();
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateUser, isPending: updating } = useUpdateUser();
  const { mutate: deleteUser, isPending: deleting } = useDeleteUser();

  const users = usersData?.results || usersData || [];
  const departments = deptData?.results || deptData || [];

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setEditTarget(user);
    setForm({
      email: user.email,
      password: '',
      confirm_password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      department: user.department || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (editTarget) {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
        delete payload.confirm_password;
      } else {
        if (payload.password !== payload.confirm_password) {
          setError('Passwords do not match.');
          return;
        }
      }
      // confirm_password is not in UserSerializer (for updates), so remove it from payload
      delete payload.confirm_password;
      updateUser(
        { id: editTarget.id, data: payload },
        { 
          onSuccess: () => setIsModalOpen(false),
          onError: (err) => {
            const data = err.response?.data;
            if (data) {
              setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '));
            } else {
              setError('Failed to update user.');
            }
          }
        }
      );
    } else {
      if (form.password !== form.confirm_password) {
        setError('Passwords do not match.');
        return;
      }
      createUser(form, { 
        onSuccess: () => setIsModalOpen(false),
        onError: (err) => {
          const data = err.response?.data;
          if (data) {
            setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '));
          } else {
            setError('Failed to create user.');
          }
        }
      });
    }
  };

  const handleDelete = () => {
    deleteUser(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const columns = [
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.first_name?.[0] || row.email?.[0] || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white text-sm">
              {row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      render: (row) => <Badge variant={roleVariant[row.role] || 'neutral'}>{row.role}</Badge>,
    },
    {
      header: 'Department',
      render: (row) => row.department_name || '—',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit user">
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => setDeleteTarget(row)}
            title="Delete user"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Create, edit, and manage all system users and their roles.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.map((role) => (
          <StatCard
            key={role}
            title={role}
            value={users.filter((u) => u.role === role).length}
            icon={role === 'ADMIN' ? Shield : Users}
          />
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            All Users{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({filtered.length})</span>
          </h2>
        </div>
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? 'Edit User' : 'Create User'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="Doe"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="john@hospital.com"
            required
          />
          <Input
            label={editTarget ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            required={!editTarget}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
            placeholder="••••••••"
            required={!editTarget || !!form.password}
          />
          {error && (
            <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating || updating}>
              {editTarget ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User">
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900 dark:text-white">
            {deleteTarget?.first_name
              ? `${deleteTarget.first_name} ${deleteTarget.last_name}`
              : deleteTarget?.email}
          </strong>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
