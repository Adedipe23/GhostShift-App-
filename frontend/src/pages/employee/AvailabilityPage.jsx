import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';
import {
  useAvailability,
  useCreateAvailability,
  useUpdateAvailability,
  useDeleteAvailability,
} from '../../hooks/useAvailability';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { DataTable } from '../../components/ui/DataTable';

const defaultForm = {
  date: format(new Date(), 'yyyy-MM-dd'),
  available: true,
  note: '',
};

const AvailabilityPage = () => {
  const { user } = useAuthStore();
  const { data: availabilityData, isLoading } = useAvailability();
  const { mutate: createAvailability, isPending: creating } = useCreateAvailability();
  const { mutate: updateAvailability, isPending: updating } = useUpdateAvailability();
  const { mutate: deleteAvailability, isPending: deleting } = useDeleteAvailability();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState(null);

  const availability = availabilityData?.results || availabilityData || [];
  const isSaving = creating || updating;

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      date: item.date,
      available: item.available,
      note: item.note || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, employee: user.id };
    if (editTarget) {
      updateAvailability(
        { id: editTarget.id, data: payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createAvailability(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = () => {
    deleteAvailability(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-slate-400" />
          <span className="font-medium text-slate-900 dark:text-white">
            {format(parseISO(row.date), 'MMM d, yyyy (EEEE)')}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.available ? 'success' : 'neutral'} className="flex items-center gap-1 w-fit">
          {row.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {row.available ? 'Available' : 'Unavailable'}
        </Badge>
      ),
    },
    {
      header: 'Note',
      render: (row) => (
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs block">
          {row.note || '—'}
        </span>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Availability</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Log the dates you are available or unavailable to work.
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus size={16} />
          Log Availability
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        {availability.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No availability logged"
            description="You haven't logged any availability dates yet."
            action={
              <Button onClick={openCreate} className="flex items-center gap-2 mt-4">
                <Plus size={16} /> Log Availability
              </Button>
            }
          />
        ) : (
          <DataTable columns={columns} data={availability} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? 'Edit Availability' : 'Log Availability'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="available"
                  checked={form.available === true}
                  onChange={() => setForm((f) => ({ ...f, available: true }))}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="available"
                  checked={form.available === false}
                  onChange={() => setForm((f) => ({ ...f, available: false }))}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Unavailable</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              placeholder="e.g. Doctor's appointment in the morning..."
              className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editTarget ? 'Save Changes' : 'Log Availability'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Availability"
      >
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Are you sure you want to delete this availability record?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            isLoading={deleting}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AvailabilityPage;
