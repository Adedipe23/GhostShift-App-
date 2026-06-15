import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, CalendarRange, Users } from 'lucide-react';
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift } from '../../hooks/useShifts';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';

const statusVariant = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  OPEN: 'warning',
};

const defaultForm = {
  title: '',
  start_time: '',
  end_time: '',
  location: '',
  assigned_employee: '',
  department: '',
  status: 'SCHEDULED',
};

const ShiftSchedulerPage = () => {
  const { data: shiftsData, isLoading } = useShifts();
  const { data: usersData } = useUsers();
  const { data: deptData } = useDepartments();
  const { mutate: createShift, isPending: creating } = useCreateShift();
  const { mutate: updateShift, isPending: updating } = useUpdateShift();
  const { mutate: deleteShift, isPending: deleting } = useDeleteShift();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const shifts = shiftsData?.results || shiftsData || [];
  const users = usersData?.results || usersData || [];
  const departments = deptData?.results || deptData || [];

  const scheduledCount = shifts.filter((s) => s.status === 'SCHEDULED').length;
  const completedCount = shifts.filter((s) => s.status === 'COMPLETED').length;
  const uniqueEmployees = new Set(shifts.map((s) => s.assigned_employee)).size;

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEdit = (shift) => {
    setEditTarget(shift);
    setForm({
      title: shift.title,
      start_time: shift.start_time ? format(new Date(shift.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      end_time: shift.end_time ? format(new Date(shift.end_time), "yyyy-MM-dd'T'HH:mm") : '',
      location: shift.location || '',
      assigned_employee: shift.assigned_employee || '',
      department: shift.department || '',
      status: shift.status,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const payload = {
      ...form,
      start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      assigned_employee: form.assigned_employee || null,
      department: form.department || null,
    };

    const onError = (err) => {
      const data = err.response?.data;
      if (data && Array.isArray(data)) {
        setErrorMessage(data[0]);
      } else if (data && typeof data === 'object') {
        const firstVal = Object.values(data)[0];
        setErrorMessage(Array.isArray(firstVal) ? firstVal[0] : firstVal);
      } else {
        setErrorMessage(err.message || 'An error occurred.');
      }
    };

    if (editTarget) {
      updateShift({ id: editTarget.id, data: payload }, { onSuccess: () => setIsModalOpen(false), onError });
    } else {
      createShift(payload, { onSuccess: () => setIsModalOpen(false), onError });
    }
  };

  const handleDelete = (id) => {
    deleteShift(id, { onSuccess: () => setDeleteId(null) });
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    {
      header: 'Start',
      render: (row) => format(new Date(row.start_time), 'MMM d, h:mm a'),
    },
    {
      header: 'End',
      render: (row) => format(new Date(row.end_time), 'h:mm a'),
    },
    {
      header: 'Assigned To',
      render: (row) => row.assigned_employee_detail?.email || row.assigned_employee || '—',
    },
    { header: 'Location', render: (row) => row.location || '—' },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] || 'neutral'}>{row.status}</Badge>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Edit2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => setDeleteId(row.id)}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Shift Scheduler</h1>
          <p className="text-slate-500 dark:text-slate-400">Create and manage team shifts.</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} /> New Shift
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Scheduled Shifts" value={scheduledCount} icon={CalendarRange} />
        <StatCard title="Completed Shifts" value={completedCount} icon={CalendarRange} />
        <StatCard title="Assigned Employees" value={uniqueEmployees} icon={Users} />
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All Shifts</h2>
        </div>
        <DataTable columns={columns} data={shifts} isLoading={isLoading} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? 'Edit Shift' : 'Create Shift'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-900/50">
              {errorMessage}
            </div>
          )}
          <Input
            label="Shift Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Morning Ward Duty"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Location (optional)"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Ward 3B"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Assign To
              </label>
              <select
                value={form.assigned_employee}
                onChange={(e) => setForm((f) => ({ ...f, assigned_employee: e.target.value }))}
                className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">— Unassigned —</option>
                {users
                  .filter(u => u.role === 'EMPLOYEE')
                  .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">— None —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editTarget && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {['SCHEDULED', 'OPEN', 'COMPLETED', 'CANCELLED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creating || updating}>
              {editTarget ? 'Save Changes' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Shift"
      >
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Are you sure you want to delete this shift? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            isLoading={deleting}
            onClick={() => handleDelete(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ShiftSchedulerPage;
