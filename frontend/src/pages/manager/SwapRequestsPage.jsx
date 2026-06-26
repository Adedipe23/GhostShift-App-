import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useSwaps, useApproveSwap, useRejectSwap } from '../../hooks/useSwaps';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';

const statusVariant = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const SwapRequestsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [commentModal, setCommentModal] = useState(null); // { id, action: 'approve'|'reject' }
  const [comment, setComment] = useState('');

  const { data: swapsData, isLoading } = useSwaps(statusFilter ? { status: statusFilter } : undefined);
  const { mutate: approveSwap, isPending: approving } = useApproveSwap();
  const { mutate: rejectSwap, isPending: rejecting } = useRejectSwap();

  const swaps = swapsData?.results || swapsData || [];
  const pending = swaps.filter((s) => s.status === 'PENDING').length;
  const approved = swaps.filter((s) => s.status === 'APPROVED').length;
  const rejected = swaps.filter((s) => s.status === 'REJECTED').length;

  const openCommentModal = (id, action) => {
    setCommentModal({ id, action });
    setComment('');
  };

  const handleAction = () => {
    const { id, action } = commentModal;
    const payload = { id, data: { manager_comment: comment || (action === 'approve' ? 'Approved.' : 'Rejected.') } };
    if (action === 'approve') {
      approveSwap(payload, { onSuccess: () => setCommentModal(null) });
    } else {
      rejectSwap(payload, { onSuccess: () => setCommentModal(null) });
    }
  };

  const columns = [
    {
      header: 'Requester',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">
            {row.requester_detail?.first_name || row.requester_detail?.email || row.requester}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {row.requester_detail?.email || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Shift',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-800 dark:text-slate-200">{row.shift_detail?.title || '—'}</p>
          {row.shift_detail?.start_time && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {format(new Date(row.shift_detail.start_time), 'MMM d, h:mm a')}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Replacement',
      render: (row) =>
        row.replacement_detail?.email || row.replacement_employee || '—',
    },
    {
      header: 'Requested',
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy'),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={statusVariant[row.status] || 'neutral'}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      render: (row) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1.5"
              onClick={() => openCommentModal(row.id, 'approve')}
            >
              <CheckCircle2 size={13} /> Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5"
              onClick={() => openCommentModal(row.id, 'reject')}
            >
              <XCircle size={13} /> Reject
            </Button>
          </div>
        ) : (
          row.manager_comment ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic max-w-[140px] block truncate" title={row.manager_comment}>
              "{row.manager_comment}"
            </span>
          ) : null
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Swap Requests</h1>
        <p className="text-slate-500 dark:text-slate-400">Review and action shift swap requests from your team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Pending" value={pending} icon={Clock} className="border border-amber-200 dark:border-amber-900/50" />
        <StatCard title="Approved" value={approved} icon={CheckCircle2} />
        <StatCard title="Rejected" value={rejected} icon={XCircle} />
      </div>

      {/* Filter */}
      <Card>
        <div className="flex gap-3 flex-wrap items-center">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by status:</span>
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-dark-surface text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Swap Requests{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({swaps.length})</span>
          </h2>
        </div>
        <DataTable columns={columns} data={swaps} isLoading={isLoading} />
      </Card>

      {/* Comment Modal */}
      <Modal
        isOpen={!!commentModal}
        onClose={() => setCommentModal(null)}
        title={commentModal?.action === 'approve' ? 'Approve Swap Request' : 'Reject Swap Request'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {commentModal?.action === 'approve'
              ? 'You are about to approve this swap request.'
              : 'You are about to reject this swap request.'}
            {' '}Leave an optional comment for the employee.
          </p>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <MessageSquare size={14} /> Manager Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Add a note..."
              className="w-full rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCommentModal(null)}>Cancel</Button>
            <Button
              variant={commentModal?.action === 'approve' ? 'primary' : 'danger'}
              isLoading={approving || rejecting}
              onClick={handleAction}
            >
              {commentModal?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SwapRequestsPage;
