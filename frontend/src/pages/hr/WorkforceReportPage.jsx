import { useState } from 'react';
import { format } from 'date-fns';
import { BarChart3, TrendingUp, AlertTriangle, Users, Download } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useBurnoutScores } from '../../hooks/useBurnout';
import { useShifts } from '../../hooks/useShifts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';

const riskVariant = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

const WorkforceReportPage = () => {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: burnoutData, isLoading: burnoutLoading } = useBurnoutScores();
  const { data: shiftsData } = useShifts();

  const users = usersData?.results || usersData || [];
  const burnout = burnoutData?.results || burnoutData || [];
  const shifts = shiftsData?.results || shiftsData || [];

  const totalEmployees = users.filter((u) => u.role === 'EMPLOYEE').length;
  const highRisk = burnout.filter((b) => b.risk_level === 'HIGH' || b.risk_level === 'CRITICAL').length;
  const scheduledShifts = shifts.filter((s) => s.status === 'SCHEDULED').length;
  const avgBurnout =
    burnout.length > 0
      ? (burnout.reduce((sum, b) => sum + (b.burnout_score || 0), 0) / burnout.length).toFixed(1)
      : 0;

  // Build a combined user + burnout table
  const tableData = users.map((u) => {
    const bRecord = burnout.find((b) => b.employee === u.id);
    return { ...u, burnout_score: bRecord?.burnout_score ?? '—', risk_level: bRecord?.risk_level ?? '—' };
  });

  const columns = [
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white text-sm">
            {row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.email}</p>
        </div>
      ),
    },
    { header: 'Role', render: (row) => row.role },
    { header: 'Department', render: (row) => row.department_name || '—' },
    {
      header: 'Burnout Score',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {typeof row.burnout_score === 'number' ? row.burnout_score.toFixed(1) : row.burnout_score}
        </span>
      ),
    },
    {
      header: 'Risk Level',
      render: (row) =>
        row.risk_level !== '—' ? (
          <Badge variant={riskVariant[row.risk_level] || 'neutral'}>{row.risk_level}</Badge>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
        ),
    },
  ];

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Burnout Score', 'Risk Level'];
    const rows = tableData.map((u) => [
      `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      u.email,
      u.role,
      u.department_name || '',
      u.burnout_score,
      u.risk_level,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workforce_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workforce Report</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Overview of employee workload, burnout risk, and scheduling health.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} />
        <StatCard title="Avg Burnout Score" value={avgBurnout} icon={TrendingUp} />
        <StatCard
          title="High Risk Employees"
          value={highRisk}
          icon={AlertTriangle}
          className={highRisk > 0 ? 'border border-red-200 dark:border-red-900/50' : ''}
        />
        <StatCard title="Scheduled Shifts" value={scheduledShifts} icon={BarChart3} />
      </div>

      {/* Burnout Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => {
          const count = burnout.filter((b) => b.risk_level === level).length;
          const colors = {
            LOW: 'from-emerald-500 to-emerald-600',
            MEDIUM: 'from-amber-500 to-amber-600',
            HIGH: 'from-orange-500 to-orange-600',
            CRITICAL: 'from-red-500 to-red-600',
          };
          return (
            <Card key={level} className="text-center">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[level]} mx-auto mb-3 flex items-center justify-center`}>
                <AlertTriangle size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{level} Risk</p>
            </Card>
          );
        })}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Employee Details</h2>
        </div>
        <DataTable columns={columns} data={tableData} isLoading={usersLoading || burnoutLoading} />
      </Card>
    </div>
  );
};

export default WorkforceReportPage;
