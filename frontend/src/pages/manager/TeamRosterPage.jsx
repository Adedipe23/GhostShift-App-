import { useState } from 'react';
import { Search, AlertTriangle, Users } from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { useBurnoutScores } from '../../hooks/useBurnout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';

const riskVariant = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

const roleVariant = {
  EMPLOYEE: 'primary',
  MANAGER: 'warning',
  HR: 'success',
  ADMIN: 'neutral',
};

const TeamRosterPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data: usersData, isLoading } = useUsers();
  const { data: deptData } = useDepartments();
  const { data: burnoutData } = useBurnoutScores();

  const users = usersData?.results || usersData || [];
  const departments = deptData?.results || deptData || [];
  const burnoutMap = burnoutData?.results || burnoutData || [];

  const getBurnoutRisk = (userId) => {
    const record = burnoutMap.find?.((b) => b.employee === userId);
    return record?.risk_level || null;
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchDept = !deptFilter || u.department === deptFilter;
    return matchSearch && matchRole && matchDept;
  });

  const highRiskCount = users.filter((u) => {
    const risk = getBurnoutRisk(u.id);
    return risk === 'HIGH' || risk === 'CRITICAL';
  }).length;

  const columns = [
    {
      header: 'Employee',
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
      header: 'Burnout Risk',
      render: (row) => {
        const risk = getBurnoutRisk(row.id);
        return risk ? (
          <div className="flex items-center gap-1.5">
            {(risk === 'HIGH' || risk === 'CRITICAL') && (
              <AlertTriangle size={13} className="text-red-500" />
            )}
            <Badge variant={riskVariant[risk] || 'neutral'}>{risk}</Badge>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Roster</h1>
        <p className="text-slate-500 dark:text-slate-400">View your team members and their workload status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Team Members" value={users.length} icon={Users} />
        <StatCard
          title="At Risk (High/Critical)"
          value={highRiskCount}
          icon={AlertTriangle}
          className={highRiskCount > 0 ? 'border border-red-200 dark:border-red-900/50' : ''}
        />
        <StatCard title="Departments" value={departments.length} icon={Users} />
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
            {['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Team Members{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filtered.length})
            </span>
          </h2>
        </div>
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default TeamRosterPage;
