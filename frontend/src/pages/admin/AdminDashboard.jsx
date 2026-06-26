import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Server, Database, Users, Clock, AlertTriangle, RefreshCw, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuditLogs } from '../../hooks/useAudit';
import api from '../../api/axios';

const CATEGORIES = [
  'AUTH',
  'USERS',
  'SHIFTS',
  'SWAPS',
  'ATTENDANCE',
  'DEPARTMENTS',
  'AVAILABILITY',
  'NOTIFICATIONS',
  'SYSTEM'
];

const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch (e) {
    return isoString;
  }
};


const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: analyticsData } = useAnalytics();

  // Modals state
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState('');

  // Diagnostics check state
  const [engineStatus, setEngineStatus] = useState('checking'); // 'checking' | 'healthy' | 'unreachable'
  const [enginePingTime, setEnginePingTime] = useState(null);
  const [engineDiagnosticRunning, setEngineDiagnosticRunning] = useState(false);
  const [engineResponse, setEngineResponse] = useState(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  const checkEngineHealth = async (isManual = false) => {
    setEngineStatus('checking');
    if (isManual) {
      setEngineResponse(null);
      setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pinging backend health endpoint...`]);
    }
    const start = performance.now();
    try {
      const response = await api.get('/health/');
      const duration = Math.round(performance.now() - start);
      setEnginePingTime(duration);
      
      const data = response.data;
      if (data.status === 'ok') {
        setEngineStatus('healthy');
        setEngineResponse(data);
        if (isManual) {
          setDiagnosticLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] HTTP ${response.status} OK (${duration}ms)`,
            `[${new Date().toLocaleTimeString()}] Response Payload: ${JSON.stringify(data)}`,
            `[${new Date().toLocaleTimeString()}] Status: Workload & Recommendation Engine is fully operational.`
          ]);
        }
        return;
      }
      setEngineStatus('unreachable');
      if (isManual) {
        setDiagnosticLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Connection failed: Server returned HTTP ${response.status || 'Error'}`
        ]);
      }
    } catch (err) {
      setEngineStatus('unreachable');
      if (isManual) {
        const errorMsg = err.response?.data?.detail || err.message || 'Network Error';
        setDiagnosticLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Connection failed: ${errorMsg}`
        ]);
      }
    }
  };

  useEffect(() => {
    checkEngineHealth(false);
  }, []);

  const runDiagnostic = async () => {
    setEngineDiagnosticRunning(true);
    setDiagnosticLogs([`[${new Date().toLocaleTimeString()}] Starting diagnostic tests...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkEngineHealth(true);
    setEngineDiagnosticRunning(false);
  };

  const [activeTab, setActiveTab] = useState('diagnostics'); // 'diagnostics' | 'burnout' | 'recommender'

  // Burnout test state
  const [burnoutInput, setBurnoutInput] = useState({
    weekly_hours: 45,
    consecutive_shifts: 4,
    night_shifts: 2,
    rest_hours: 8,
  });
  const [burnoutResult, setBurnoutResult] = useState(null);
  const [burnoutLoading, setBurnoutLoading] = useState(false);

  // Recommender test state
  const [recommenderInput, setRecommenderInput] = useState({
    candidateA: {
      user_id: 'healthy_emp',
      is_available: true,
      department_match: true,
      burnout_score: 15,
      weekly_hours: 30,
      fairness_shift_count: 2,
    },
    candidateB: {
      user_id: 'overworked_emp',
      is_available: true,
      department_match: true,
      burnout_score: 80,
      weekly_hours: 52,
      fairness_shift_count: 6,
    }
  });
  const [recommenderResult, setRecommenderResult] = useState(null);
  const [recommenderLoading, setRecommenderLoading] = useState(false);

  const handleTestBurnout = async () => {
    setBurnoutLoading(true);
    setBurnoutResult(null);
    try {
      const response = await api.post('/burnout/test-calculate/', {
        weekly_hours: Number(burnoutInput.weekly_hours),
        consecutive_shifts: Number(burnoutInput.consecutive_shifts),
        night_shifts: Number(burnoutInput.night_shifts),
        rest_hours: Number(burnoutInput.rest_hours),
      });
      setBurnoutResult(response.data);
    } catch (e) {
      const errText = e.response?.data?.detail || e.message || 'Network error';
      setBurnoutResult({ error: errText });
    } finally {
      setBurnoutLoading(false);
    }
  };

  const handleTestRecommender = async () => {
    setRecommenderLoading(true);
    setRecommenderResult(null);
    try {
      const response = await api.post('/shifts/recommend-replacements/', {
        shift_id: 'test_shift',
        department_id: 'test_dept',
        candidates: [
          {
            user_id: recommenderInput.candidateA.user_id,
            is_available: recommenderInput.candidateA.is_available,
            department_match: recommenderInput.candidateA.department_match,
            burnout_score: Number(recommenderInput.candidateA.burnout_score),
            weekly_hours: Number(recommenderInput.candidateA.weekly_hours),
            fairness_shift_count: Number(recommenderInput.candidateA.fairness_shift_count),
          },
          {
            user_id: recommenderInput.candidateB.user_id,
            is_available: recommenderInput.candidateB.is_available,
            department_match: recommenderInput.candidateB.department_match,
            burnout_score: Number(recommenderInput.candidateB.burnout_score),
            weekly_hours: Number(recommenderInput.candidateB.weekly_hours),
            fairness_shift_count: Number(recommenderInput.candidateB.fairness_shift_count),
          }
        ]
      });
      setRecommenderResult(response.data);
    } catch (e) {
      const errText = e.response?.data?.detail || e.message || 'Network error';
      setRecommenderResult({ error: errText });
    } finally {
      setRecommenderLoading(false);
    }
  };

  const [logPage, setLogPage] = useState(1);

  // Reset page to 1 when search or filter category changes
  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logFilterCategory]);

  const { data: logsData, isLoading: logsLoading, isError: logsError } = useAuditLogs(
    {
      search: logSearch,
      category: logFilterCategory,
      page: logPage,
    },
    {
      enabled: isLogsModalOpen,
      placeholderData: (previousData) => previousData,
    }
  );

  const filteredLogs = logsData?.results || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Administration</h1>
        <p className="text-slate-500 dark:text-slate-400">System settings and platform overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={analyticsData?.total_employees || 0} icon={Users} />
        <StatCard title="Avg Worked Hours" value={`${analyticsData?.avg_worked_hours || 0}h`} icon={Clock} />
        <StatCard title="System No-Shows" value={analyticsData?.no_shows || 0} icon={AlertTriangle} className="text-red-500" />
        <StatCard title="Early Checkouts" value={analyticsData?.early_checkouts || 0} icon={Clock} className="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Management Tile */}
        <Card 
          onClick={() => navigate('/dashboard/admin/users')}
          className="flex items-center gap-4 hover:border-brand-500 cursor-pointer transition-colors hover:shadow-glow group"
        >
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">User Management</h3>
            <p className="text-sm text-slate-500">Manage accounts and roles</p>
          </div>
        </Card>
        
        {/* System Logs Tile */}
        <Card 
          onClick={() => setIsLogsModalOpen(true)}
          className="flex items-center gap-4 hover:border-brand-500 cursor-pointer transition-colors hover:shadow-glow group"
        >
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">System Logs</h3>
            <p className="text-sm text-slate-500">View security & audit logs</p>
          </div>
        </Card>

        {/* Engine Diagnostics & Testing Tile */}
        <Card 
          onClick={() => setIsDiagnosticsModalOpen(true)}
          className="flex items-center gap-4 hover:border-brand-500 cursor-pointer transition-colors hover:shadow-glow group"
        >
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg group-hover:scale-110 transition-transform">
            <Server className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">Diagnostics & Testing</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                engineStatus === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                engineStatus === 'checking' ? 'bg-amber-400 animate-pulse' :
                'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              }`} />
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {engineStatus === 'healthy' ? 'Connected & healthy' :
                 engineStatus === 'checking' ? 'Checking connection...' :
                 'Disconnected / Offline'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* System Logs Modal */}
      <Modal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        title="System Audit Logs"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs by action or user..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
              />
            </div>
            <select
              value={logFilterCategory}
              onChange={(e) => setLogFilterCategory(e.target.value)}
              className="rounded-lg bg-white dark:bg-dark-surface border border-slate-300 dark:border-dark-border px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-surface">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-surface/50 border-b border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-dark-border text-sm">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCw className="animate-spin w-4 h-4 text-brand-500" />
                          <span>Loading audit logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logsError ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-rose-500 dark:text-rose-400">
                        Failed to load audit logs. Please ensure you are an admin.
                      </td>
                    </tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-dark-surface/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {log.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-200 font-medium max-w-xs truncate" title={log.action}>
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 truncate" title={log.actor_email || ''}>
                          {log.actor_display}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                            log.status === 'WARNING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                            log.status === 'ERROR' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                            'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        No logs match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {logsData && logsData.count > 0 && (
            <div className="flex items-center justify-between py-2 border-t dark:border-dark-border text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing {(logPage - 1) * 20 + 1} to {Math.min(logPage * 20, logsData.count)} of {logsData.count} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                  disabled={logPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogPage(prev => (logsData.next ? prev + 1 : prev))}
                  disabled={!logsData.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-2 border-t dark:border-dark-border">
            <Button onClick={() => setIsLogsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Diagnostics & Testing Modal */}
      <Modal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
        title="Diagnostics & Testing"
        className="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Tab Navigation */}
          <div className="flex border-b dark:border-dark-border">
            <button
              className={`pb-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'diagnostics' 
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
              onClick={() => setActiveTab('diagnostics')}
            >
              Status & Diagnostics
            </button>
            <button
              className={`pb-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'burnout' 
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
              onClick={() => setActiveTab('burnout')}
            >
              Workload Risk Calculator
            </button>
            <button
              className={`pb-2 px-4 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'recommender' 
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
              onClick={() => setActiveTab('recommender')}
            >
              Replacement Recommendations
            </button>
          </div>

          {/* TAB 1: DIAGNOSTICS & HEALTH */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Backend Health Endpoint</span>
                  <span className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-dark-surface border dark:border-dark-border px-2 py-1 rounded">
                    /api/health/
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    {engineStatus === 'healthy' && (
                      <>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Online & Healthy</span>
                      </>
                    )}
                    {engineStatus === 'checking' && (
                      <>
                        <RefreshCw size={16} className="text-amber-500 animate-spin" />
                        <span className="text-amber-600 dark:text-amber-400">Connecting...</span>
                      </>
                    )}
                    {engineStatus === 'unreachable' && (
                      <>
                        <AlertCircle size={16} className="text-rose-500" />
                        <span className="text-rose-600 dark:text-rose-400">Unreachable / Offline</span>
                      </>
                    )}
                  </span>
                </div>

                {engineStatus === 'healthy' && enginePingTime !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Response Latency</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {enginePingTime} ms
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Active System Capabilities</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-dark-surface/50 border dark:border-dark-border text-slate-700 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span><strong>Workload Risk Calculator</strong> - evaluates weekly hours, consecutive days, night shifts, and rest gaps</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-dark-surface/50 border dark:border-dark-border text-slate-700 dark:text-slate-350">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span><strong>Replacement Recommendation engine</strong> - screens eligible candidates using smart heuristics</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Console Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Diagnostic Output</h4>
                  {diagnosticLogs.length > 0 && (
                    <button 
                      onClick={() => { setDiagnosticLogs([]); setEngineResponse(null); }}
                      className="text-xs text-slate-500 hover:text-brand-500 transition-colors"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 dark:border-dark-border font-mono text-xs text-slate-300 space-y-1.5 max-h-40 overflow-y-auto select-text">
                  {diagnosticLogs.length > 0 ? (
                    diagnosticLogs.map((log, i) => (
                      <div key={i} className={
                        log.includes('Connection failed') || log.includes('HTTP 5') || log.includes('HTTP 4') ? 'text-red-400' :
                        log.includes('HTTP 200') || log.includes('fully operational') ? 'text-emerald-400' :
                        log.includes('Response Payload') ? 'text-cyan-400' :
                        'text-slate-400'
                      }>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No diagnostic data. Click "Run Diagnostics" to check API response.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKLOAD RISK CALCULATOR */}
          {activeTab === 'burnout' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Test Workload Risk Calculator</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Weekly Hours</label>
                    <input
                      type="number"
                      value={burnoutInput.weekly_hours}
                      onChange={(e) => setBurnoutInput({ ...burnoutInput, weekly_hours: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-slate-950 border dark:border-slate-800 text-sm text-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Consecutive Shifts</label>
                    <input
                      type="number"
                      value={burnoutInput.consecutive_shifts}
                      onChange={(e) => setBurnoutInput({ ...burnoutInput, consecutive_shifts: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-slate-950 border dark:border-slate-800 text-sm text-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Night Shifts</label>
                    <input
                      type="number"
                      value={burnoutInput.night_shifts}
                      onChange={(e) => setBurnoutInput({ ...burnoutInput, night_shifts: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-slate-950 border dark:border-slate-800 text-sm text-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Rest Hours Between Shifts</label>
                    <input
                      type="number"
                      value={burnoutInput.rest_hours}
                      onChange={(e) => setBurnoutInput({ ...burnoutInput, rest_hours: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-white dark:bg-slate-950 border dark:border-slate-800 text-sm text-slate-950 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleTestBurnout} disabled={burnoutLoading}>
                    {burnoutLoading ? 'Calculating...' : 'Run Score Calculation'}
                  </Button>
                </div>
              </div>

              {burnoutResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-sans text-sm text-slate-350 space-y-3">
                  {burnoutResult.error ? (
                    <div className="text-red-400 font-mono text-xs">{burnoutResult.error}</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-semibold text-slate-300">Result Score:</span>
                        <span className="text-lg font-bold text-white">{burnoutResult.score} / 100</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-semibold text-slate-300">Risk Level:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          burnoutResult.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-900' :
                          burnoutResult.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-900' :
                          burnoutResult.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        }`}>
                          {burnoutResult.risk_level}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">Risk Factors:</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400">
                          {Object.entries(burnoutResult.factors || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span>{key.replace('_', ' ')}:</span>
                              <span className={val > 0 ? 'text-orange-400 font-bold' : 'text-slate-500'}>+{val} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-300 block">System Recommendations:</span>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
                          {(burnoutResult.recommendations || []).map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPLACEMENT RECOMMENDATIONS */}
          {activeTab === 'recommender' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Test Replacement Recommendations</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Candidate A */}
                  <div className="p-3 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg space-y-3">
                    <h5 className="text-xs font-bold text-brand-500">Candidate A (healthy_emp)</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="availA"
                          checked={recommenderInput.candidateA.is_available}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateA: { ...recommenderInput.candidateA, is_available: e.target.checked }
                          })}
                        />
                        <label htmlFor="availA" className="text-xs font-medium text-slate-600 dark:text-slate-400">Is Available</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="deptA"
                          checked={recommenderInput.candidateA.department_match}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateA: { ...recommenderInput.candidateA, department_match: e.target.checked }
                          })}
                        />
                        <label htmlFor="deptA" className="text-xs font-medium text-slate-600 dark:text-slate-400">Department Match</label>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Burnout Score</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateA.burnout_score}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateA: { ...recommenderInput.candidateA, burnout_score: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Weekly Hours</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateA.weekly_hours}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateA: { ...recommenderInput.candidateA, weekly_hours: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Fairness Shift Count</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateA.fairness_shift_count}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateA: { ...recommenderInput.candidateA, fairness_shift_count: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Candidate B */}
                  <div className="p-3 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg space-y-3">
                    <h5 className="text-xs font-bold text-rose-500">Candidate B (overworked_emp)</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="availB"
                          checked={recommenderInput.candidateB.is_available}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateB: { ...recommenderInput.candidateB, is_available: e.target.checked }
                          })}
                        />
                        <label htmlFor="availB" className="text-xs font-medium text-slate-600 dark:text-slate-400">Is Available</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="deptB"
                          checked={recommenderInput.candidateB.department_match}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateB: { ...recommenderInput.candidateB, department_match: e.target.checked }
                          })}
                        />
                        <label htmlFor="deptB" className="text-xs font-medium text-slate-600 dark:text-slate-400">Department Match</label>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Burnout Score</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateB.burnout_score}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateB: { ...recommenderInput.candidateB, burnout_score: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Weekly Hours</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateB.weekly_hours}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateB: { ...recommenderInput.candidateB, weekly_hours: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Fairness Shift Count</label>
                        <input
                          type="number"
                          value={recommenderInput.candidateB.fairness_shift_count}
                          onChange={(e) => setRecommenderInput({
                            ...recommenderInput,
                            candidateB: { ...recommenderInput.candidateB, fairness_shift_count: e.target.value }
                          })}
                          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 text-xs text-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleTestRecommender} disabled={recommenderLoading}>
                    {recommenderLoading ? 'Ranking...' : 'Rank Candidates'}
                  </Button>
                </div>
              </div>

              {recommenderResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-sans text-sm text-slate-350 space-y-3">
                  {recommenderResult.error ? (
                    <div className="text-red-400 font-mono text-xs">{recommenderResult.error}</div>
                  ) : (
                    <div className="space-y-3">
                      <span className="font-semibold text-slate-300 block border-b border-slate-800 pb-2">Smart Recommendations:</span>
                      <div className="space-y-2">
                        {(recommenderResult.ranked_candidates || []).map((candidate, i) => (
                          <div key={i} className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                            <div>
                              <span className="font-semibold text-white block text-sm">{candidate.user_id}</span>
                              <span className="text-xs text-slate-400 italic">{candidate.match_reason}</span>
                            </div>
                            <div className="text-right">
                              <Badge variant={candidate.score >= 100 ? 'success' : candidate.score >= 50 ? 'warning' : 'danger'}>
                                {candidate.score} pts
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {(!recommenderResult.ranked_candidates || recommenderResult.ranked_candidates.length === 0) && (
                          <div className="text-xs text-slate-500 italic">No candidates match available requirements.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex justify-between items-center pt-2 border-t dark:border-dark-border">
            {activeTab === 'diagnostics' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostic}
                disabled={engineDiagnosticRunning}
                className="flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={engineDiagnosticRunning ? 'animate-spin' : ''} />
                Run Diagnostics
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={() => setIsDiagnosticsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
