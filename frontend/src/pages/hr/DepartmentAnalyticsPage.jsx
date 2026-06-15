import { useState } from 'react';
import { Building2, Users, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { useShifts } from '../../hooks/useShifts';
import { useBurnoutScores } from '../../hooks/useBurnout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const riskVariant = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'error',
  CRITICAL: 'error',
};

const riskColors = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

const DepartmentAnalyticsPage = () => {
  const { data: deptData, isLoading: deptLoading } = useDepartments();
  const { data: usersData } = useUsers();
  const { data: shiftsData } = useShifts();
  const { data: burnoutData } = useBurnoutScores();

  const departments = deptData?.results || deptData || [];
  const users = usersData?.results || usersData || [];
  const shifts = shiftsData?.results || shiftsData || [];
  const burnout = burnoutData?.results || burnoutData || [];

  const getDeptStats = (deptId) => {
    const deptUsers = users.filter((u) => u.department === deptId);
    const deptShifts = shifts.filter((s) => s.department === deptId);
    const deptBurnout = burnout.filter((b) =>
      deptUsers.some((u) => u.id === b.employee)
    );
    const highRisk = deptBurnout.filter((b) => b.risk_level === 'HIGH' || b.risk_level === 'CRITICAL').length;
    const riskDistribution = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
      level,
      count: deptBurnout.filter((b) => b.risk_level === level).length,
    }));

    return {
      headcount: deptUsers.length,
      scheduledShifts: deptShifts.filter((s) => s.status === 'SCHEDULED').length,
      highRisk,
      riskDistribution,
    };
  };

  if (deptLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Headcount, shift coverage, and burnout risk broken down by department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Departments" value={departments.length} icon={Building2} />
        <StatCard title="Total Employees" value={users.filter((u) => u.role === 'EMPLOYEE').length} icon={Users} />
        <StatCard title="Scheduled Shifts" value={shifts.filter((s) => s.status === 'SCHEDULED').length} icon={BarChart3} />
      </div>

      {departments.length === 0 ? (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No departments found. Ask an admin to add departments.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const stats = getDeptStats(dept.id);
            const totalRisk = stats.riskDistribution.reduce((a, b) => a + b.count, 0);

            return (
              <Card key={dept.id} className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dept.description}</p>
                      )}
                    </div>
                  </div>
                  {stats.highRisk > 0 && (
                    <Badge variant="error" className="flex items-center gap-1">
                      <AlertTriangle size={11} /> {stats.highRisk} at risk
                    </Badge>
                  )}
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Headcount', value: stats.headcount, icon: Users },
                    { label: 'Shifts', value: stats.scheduledShifts, icon: BarChart3 },
                    { label: 'High Risk', value: stats.highRisk, icon: AlertTriangle },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="text-center p-3 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border"
                    >
                      <Icon size={16} className="text-brand-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Risk bar */}
                {totalRisk > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                      Burnout Risk Distribution
                    </p>
                    <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                      {stats.riskDistribution
                        .filter((r) => r.count > 0)
                        .map((r) => (
                          <div
                            key={r.level}
                            className={`${riskColors[r.level]} transition-all`}
                            style={{ width: `${(r.count / totalRisk) * 100}%` }}
                            title={`${r.level}: ${r.count}`}
                          />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {stats.riskDistribution.map((r) => (
                        <div key={r.level} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${riskColors[r.level]}`} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {r.level} ({r.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentAnalyticsPage;
