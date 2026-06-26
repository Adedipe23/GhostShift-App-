import { Users, AlertCircle, BarChart } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const HRDashboard = () => {
  const { data: analyticsData } = useAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HR Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Workforce health and burnout monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Employees" 
          value={analyticsData?.total_employees || 0} 
          icon={Users} 
        />
        <StatCard 
          title="Avg Burnout Score" 
          value={analyticsData?.avg_burnout_score || 0} 
          icon={BarChart} 
        />
        <StatCard 
          title="Critical Risk Count" 
          value={analyticsData?.high_risk_employees || 0} 
          icon={AlertCircle} 
        />
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Department Workload</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            {analyticsData?.department_workload?.length > 0 ? (
              analyticsData.department_workload.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-surface rounded-lg border dark:border-dark-border">
                  <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{dept.department__name || '—'}</span>
                  <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">{dept.shift_count} shifts</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No department data available.</p>
            )}
          </div>
          
          {analyticsData?.department_workload?.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.department_workload.map(d => ({
                      name: d.department__name || 'Unknown',
                      value: d.shift_count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analyticsData.department_workload.map((entry, index) => {
                      const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default HRDashboard;
