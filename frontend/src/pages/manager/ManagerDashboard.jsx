import { useState } from 'react';
import { format } from 'date-fns';
import { Users, AlertTriangle, CalendarRange, CheckCircle, Clock } from 'lucide-react';

import { useShifts } from '../../hooks/useShifts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useSwaps, useApproveSwap, useRejectSwap } from '../../hooks/useSwaps';
import { useTimeEntries, useApproveEarlyCheckout, useRejectEarlyCheckout } from '../../hooks/useAttendance';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const ManagerDashboard = () => {
  const { data: analyticsData } = useAnalytics();
  const { data: swapsData, isLoading: swapsLoading } = useSwaps({ status: 'PENDING' });
  const { data: timeEntries, isLoading: entriesLoading } = useTimeEntries();
  
  const { mutate: approveSwap, isPending: approvePending } = useApproveSwap();
  const { mutate: rejectSwap, isPending: rejectPending } = useRejectSwap();
  
  const { mutate: approveCheckout, isPending: approveCheckoutPending } = useApproveEarlyCheckout();
  const { mutate: rejectCheckout, isPending: rejectCheckoutPending } = useRejectEarlyCheckout();

  const pendingSwaps = swapsData?.results || swapsData || [];
  
  // Active employees
  const allEntries = timeEntries?.results || timeEntries || [];
  const clockedInEntries = allEntries.filter(t => t.status === 'CLOCKED_IN');
  const emergencyCheckouts = allEntries.filter(t => t.status === 'EARLY_CHECKOUT_PENDING');
  const noShows = allEntries.filter(t => t.status === 'NO_SHOW');

  const handleApproveSwapAction = (id) => approveSwap({ id, data: { manager_comment: 'Approved.' } });
  const handleRejectSwapAction = (id) => rejectSwap({ id, data: { manager_comment: 'Rejected due to coverage.' } });

  const swapColumns = [
    { header: 'Requester', render: (row) => row.requester_detail?.email || row.requester },
    { header: 'Shift', render: (row) => row.shift_detail?.title || 'Shift' },
    { header: 'Replacement', render: (row) => row.replacement_detail?.email || row.replacement_employee },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-600" onClick={() => handleApproveSwapAction(row.id)} disabled={approvePending || rejectPending}>Approve</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-600" onClick={() => handleRejectSwapAction(row.id)} disabled={approvePending || rejectPending}>Reject</Button>
        </div>
      )
    }
  ];

  const emergencyColumns = [
    { header: 'Employee', render: (row) => row.employee_email || row.employee_name || row.employee },
    { header: 'Shift', render: (row) => row.shift_title || row.shift },
    { header: 'Clock In', render: (row) => format(new Date(row.clock_in_time), 'h:mm a') },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-600" onClick={() => approveCheckout(row.id)} disabled={approveCheckoutPending || rejectCheckoutPending}>Approve Checkout</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-600" onClick={() => rejectCheckout(row.id)} disabled={approveCheckoutPending || rejectCheckoutPending}>Reject</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manager Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Team overview and pending approvals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Shifts" value={analyticsData?.open_shifts || 0} icon={Users} />
        <StatCard title="Clocked In Now" value={clockedInEntries.length} icon={Clock} className="border-brand-200" />
        <StatCard title="No-Shows Today" value={noShows.length} icon={AlertTriangle} className="border-red-200 text-red-600" />
        <StatCard title="Pending Swaps" value={analyticsData?.pending_swaps || 0} icon={CheckCircle} />
      </div>

      {emergencyCheckouts.length > 0 && (
        <Card className="!p-0 overflow-hidden border-orange-200 dark:border-orange-900/50">
          <div className="p-4 md:p-6 border-b dark:border-dark-border bg-orange-50 dark:bg-orange-900/10">
            <h2 className="text-lg font-semibold text-orange-700 dark:text-orange-400">Emergency Checkouts Pending</h2>
          </div>
          <DataTable columns={emergencyColumns} data={emergencyCheckouts} isLoading={entriesLoading} />
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pending Swap Requests</h2>
        </div>
        <DataTable columns={swapColumns} data={pendingSwaps} isLoading={swapsLoading} />
      </Card>
    </div>
  );
};

export default ManagerDashboard;
