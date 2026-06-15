import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

const defaultForm = { name: '', description: '' };

const DepartmentManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const { data: deptData, isLoading } = useDepartments();
  const { data: usersData } = useUsers();
  const { mutate: createDepartment, isPending: creating } = useCreateDepartment();
  const { mutate: updateDepartment, isPending: updating } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: deleting } = useDeleteDepartment();

  const departments = deptData?.results || deptData || [];
  const users = usersData?.results || usersData || [];

  const getHeadcount = (deptId) => users.filter((u) => u.department === deptId).length;

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditTarget(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editTarget) {
      updateDepartment({ id: editTarget.id, data: form }, { onSuccess: () => setIsModalOpen(false) });
    } else {
      createDepartment(form, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = () => {
    deleteDepartment(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage hospital departments and their team compositions.
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Departments" value={departments.length} icon={Building2} />
        <StatCard title="Total Staff" value={users.length} icon={Users} />
      </div>

      {departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Departments Yet"
          description="Start by adding your first department to organise your staff."
          action={
            <Button onClick={openCreate} className="flex items-center gap-2 mt-4">
              <Plus size={16} /> Add Department
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const headcount = getHeadcount(dept.id);
            return (
              <Card key={dept.id} className="group relative overflow-hidden">
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-500 to-brand-700 rounded-l-2xl" />

                <div className="pl-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
                        <Building2 size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users size={11} /> {headcount} members
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons (visible on hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
                        title="Edit department"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(dept)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {dept.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {dept.description}
                    </p>
                  )}

                  {/* Headcount bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Staff</span>
                      <span>{headcount} / {Math.max(headcount, 10)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-dark-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((headcount / Math.max(headcount, 10)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Emergency Medicine"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of this department's responsibilities..."
              className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={creating || updating}>
              {editTarget ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Department">
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900 dark:text-white">{deleteTarget?.name}</strong>?
          {getHeadcount(deleteTarget?.id) > 0 && (
            <span className="block mt-2 text-amber-600 dark:text-amber-400 text-sm">
              ⚠️ This department has {getHeadcount(deleteTarget?.id)} members who will be unassigned.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DepartmentManagementPage;
