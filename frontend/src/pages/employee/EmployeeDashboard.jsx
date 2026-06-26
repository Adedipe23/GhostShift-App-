import { useState, useEffect } from 'react';
import { format, differenceInSeconds, isWithinInterval, addMinutes, subMinutes } from 'date-fns';
import { Calendar, Clock, RefreshCw, AlertTriangle, Play, Square, Activity } from 'lucide-react';

import { useShifts } from '../../hooks/useShifts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useCreateSwap } from '../../hooks/useSwaps';
import { useTimeEntries, useClockIn, useClockOut, useEmergencyCheckout } from '../../hooks/useAttendance';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const EmployeeDashboard = () => {
  const { data: shiftsData, isLoading: shiftsLoading } = useShifts();
  const { data: analyticsData } = useAnalytics();
  const { mutate: requestSwap, isPending: swapPending } = useCreateSwap();
  const { data: timeEntries } = useTimeEntries();
  const { mutate: clockIn, isPending: clockInPending } = useClockIn();
  const { mutate: clockOut, isPending: clockOutPending } = useClockOut();
  const { mutate: emergencyCheckout, isPending: emergencyPending } = useEmergencyCheckout();
  const { data: usersData } = useUsers();
  const { user } = useAuthStore();

  const [activeTimer, setActiveTimer] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [incidentType, setIncidentType] = useState('ILLNESS');
  const [description, setDescription] = useState('');

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapShiftId, setSwapShiftId] = useState(null);
  const [replacementId, setReplacementId] = useState('');
  const [swapError, setSwapError] = useState('');

  const shifts = shiftsData?.results || shiftsData || [];
  const entriesList = timeEntries?.results || timeEntries || [];
  
  // Find immediate next shift or currently clocked in shift
  const activeShift = shifts.find(s => s.status === 'CLOCKED_IN' || s.status === 'UPCOMING' || s.status === 'SCHEDULED');
  const activeTimeEntry = entriesList.find(t => t.status === 'CLOCKED_IN' && activeShift && t.shift === activeShift.id);

  useEffect(() => {
    let interval;
    if (activeTimeEntry?.clock_in_time) {
      interval = setInterval(() => {
        const diff = differenceInSeconds(new Date(), new Date(activeTimeEntry.clock_in_time));
        setActiveTimer(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimeEntry]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWithinClockInWindow = (shift) => {
    if (!shift) return false;
    const now = new Date();
    const start = new Date(shift.start_time);
    return isWithinInterval(now, {
      start: subMinutes(start, 30),
      end: addMinutes(start, 30)
    });
  };

  const canClockIn = activeShift && isWithinClockInWindow(activeShift);

  const handleSwapRequest = (shiftId) => {
    setSwapShiftId(shiftId);
    setReplacementId('');
    setSwapError('');
    setShowSwapModal(true);
  };

  const submitSwapRequest = () => {
    if (swapShiftId && replacementId) {
      setSwapError('');
      requestSwap({ shift: swapShiftId, replacement_employee: replacementId }, {
        onSuccess: () => {
          setShowSwapModal(false);
        },
        onError: (err) => {
          const data = err.response?.data;
          if (data && Array.isArray(data)) {
            setSwapError(data[0]);
          } else if (data && typeof data === 'object') {
            const firstVal = Object.values(data)[0];
            setSwapError(Array.isArray(firstVal) ? firstVal[0] : firstVal);
          } else {
            setSwapError(err.message || 'Failed to request swap.');
          }
        }
      });
    }
  };

  const handleEmergencySubmit = () => {
    if (activeShift) {
      emergencyCheckout({ shift_id: activeShift.id, incident_type: incidentType, description }, {
        onSuccess: () => {
          setShowEmergencyModal(false);
          setDescription('');
        }
      });
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Start', render: (row) => format(new Date(row.start_time), 'MMM d, yyyy h:mm a') },
    { header: 'End', render: (row) => format(new Date(row.end_time), 'h:mm a') },
    { 
      header: 'Status', 
      render: (row) => (
        <Badge variant={row.status === 'SCHEDULED' ? 'primary' : row.status === 'COMPLETED' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => row.status === 'SCHEDULED' && (
        <Button variant="outline" size="sm" onClick={() => handleSwapRequest(row.id)}>
          Request Swap
        </Button>
      )
    }
  ];

  const burnoutRiskColor = {
    LOW: 'text-emerald-500',
    MEDIUM: 'text-amber-500',
    HIGH: 'text-orange-500',
    CRITICAL: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Workspace</h1>
        <p className="text-slate-500 dark:text-slate-400">Here's your schedule and workload overview.</p>
      </div>

      {activeShift && (
        <Card className="bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-slate-900 border-brand-200 dark:border-brand-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-900 dark:text-brand-100">
                {activeShift.title}
              </h2>
              <p className="text-sm text-brand-700 dark:text-brand-300">
                {format(new Date(activeShift.start_time), 'h:mm a')} - {format(new Date(activeShift.end_time), 'h:mm a')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {activeTimeEntry ? (
                <>
                  <div className="text-2xl font-mono font-bold text-brand-600 dark:text-brand-400">
                    {formatTimer(activeTimer)}
                  </div>
                  <Button 
                    variant="danger" 
                    onClick={() => clockOut(activeShift.id)}
                    disabled={clockOutPending}
                  >
                    <Square size={16} className="mr-2" /> Clock Out
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    onClick={() => setShowEmergencyModal(true)}
                  >
                    <Activity size={16} className="mr-2" /> Emergency Checkout
                  </Button>
                </>
              ) : canClockIn ? (
                <Button 
                  variant="primary" 
                  onClick={() => clockIn(activeShift.id)}
                  disabled={clockInPending}
                >
                  <Play size={16} className="mr-2" /> Clock In
                </Button>
              ) : (
                <div className="text-sm text-slate-500 flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
                  <Clock size={14} className="mr-1" />
                  Starts at {format(new Date(activeShift.start_time), 'h:mm a')}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Report Emergency</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Incident Type</label>
                <select 
                  className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                >
                  <option value="ILLNESS">Illness</option>
                  <option value="INJURY">Injury</option>
                  <option value="FAMILY_EMERGENCY">Family Emergency</option>
                  <option value="PERSONAL_EMERGENCY">Personal Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the situation..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEmergencyModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleEmergencySubmit} disabled={emergencyPending}>Submit</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request Shift Swap</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitSwapRequest(); }} className="space-y-4">
              {swapError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-900/50">
                  {swapError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Select Replacement Colleague</label>
                <select 
                  className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700"
                  value={replacementId}
                  onChange={(e) => setReplacementId(e.target.value)}
                >
                  <option value="">-- Choose a colleague --</option>
                  {(usersData?.results || usersData || [])
                    .filter(u => u.id !== user?.id && u.role === 'EMPLOYEE')
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                    ))
                  }
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSwapModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={!replacementId || swapPending}>Request Swap</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Shifts This Week" value={analyticsData?.my_shifts_this_week || 0} icon={Calendar} />
        <StatCard title="Hours Logged" value={`${analyticsData?.my_hours_this_week || 0}h`} icon={Clock} />
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Burnout Risk</h3>
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {analyticsData?.my_burnout_score || 0}
            </span>
            <span className={`text-sm font-medium ${burnoutRiskColor[analyticsData?.my_burnout_risk] || 'text-slate-500'}`}>
              {analyticsData?.my_burnout_risk || 'N/A'}
            </span>
          </div>
        </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Shifts</h2>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>
        <DataTable columns={columns} data={shifts} isLoading={shiftsLoading} />
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
