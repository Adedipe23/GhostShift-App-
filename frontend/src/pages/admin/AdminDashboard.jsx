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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState('');

  // AI Status check state
  const [aiStatus, setAiStatus] = useState('checking'); // 'checking' | 'healthy' | 'unreachable'
  const [aiPingTime, setAiPingTime] = useState(null);
  const [aiDiagnosticRunning, setAiDiagnosticRunning] = useState(false);

  const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';
  const [aiResponse, setAiResponse] = useState(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);

  const checkAIHealth = async (isManual = false) => {
    setAiStatus('checking');
    if (isManual) {
      setAiResponse(null);
      setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pinging ${AI_SERVICE_URL}/health...`]);
    }
    const start = performance.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3 sec timeout
      
      const response = await fetch(`${AI_SERVICE_URL}/health`, { signal: controller.signal });
      clearTimeout(id);
      
      const duration = Math.round(performance.now() - start);
      setAiPingTime(duration);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setAiStatus('healthy');
          setAiResponse(data);
          if (isManual) {
            setDiagnosticLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] HTTP ${response.status} OK (${duration}ms)`,
              `[${new Date().toLocaleTimeString()}] Response Payload: ${JSON.stringify(data)}`,
              `[${new Date().toLocaleTimeString()}] Status: AI Service is fully operational.`
            ]);
          }
          return;
        }
      }
      setAiStatus('unreachable');
      if (isManual) {
        setDiagnosticLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Connection failed: Server returned HTTP ${response.status || 'Error'}`
        ]);
      }
    } catch (err) {
      setAiStatus('unreachable');
      if (isManual) {
        setDiagnosticLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Connection failed: ${err.message || 'Network Error'}`
        ]);
      }
    }
  };

  useEffect(() => {
    checkAIHealth(false);
  }, []);

  const runDiagnostic = async () => {
    setAiDiagnosticRunning(true);
    setDiagnosticLogs([`[${new Date().toLocaleTimeString()}] Starting AI microservice diagnostic tests...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkAIHealth(true);
    setAiDiagnosticRunning(false);
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

        {/* AI Service Status Tile */}
        <Card 
          onClick={() => setIsAIModalOpen(true)}
          className="flex items-center gap-4 hover:border-brand-500 cursor-pointer transition-colors hover:shadow-glow group"
        >
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg group-hover:scale-110 transition-transform">
            <Server className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">AI Service Status</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                aiStatus === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                aiStatus === 'checking' ? 'bg-amber-400 animate-pulse' :
                'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              }`} />
              <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {aiStatus === 'healthy' ? 'Connected & healthy' :
                 aiStatus === 'checking' ? 'Checking connection...' :
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

      {/* AI Service Status Modal */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="AI Service Diagnostics"
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border dark:border-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Microservice Endpoint</span>
              <span className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-dark-surface border dark:border-dark-border px-2 py-1 rounded">
                {AI_SERVICE_URL}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                {aiStatus === 'healthy' && (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Online & Healthy</span>
                  </>
                )}
                {aiStatus === 'checking' && (
                  <>
                    <RefreshCw size={16} className="text-amber-500 animate-spin" />
                    <span className="text-amber-600 dark:text-amber-400">Connecting...</span>
                  </>
                )}
                {aiStatus === 'unreachable' && (
                  <>
                    <AlertCircle size={16} className="text-rose-500" />
                    <span className="text-rose-600 dark:text-rose-400">Unreachable / Offline</span>
                  </>
                )}
              </span>
            </div>

            {aiStatus === 'healthy' && aiPingTime !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Response Latency</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {aiPingTime} ms
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Active AI Capabilities</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-dark-surface/50 border dark:border-dark-border text-slate-700 dark:text-slate-350">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span><strong>Burnout Risk Calculator</strong> - evaluates weekly hours, consecutive days, night shifts, and rest gaps</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-dark-surface/50 border dark:border-dark-border text-slate-700 dark:text-slate-350">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span><strong>Replacement Recommendation engine</strong> - screens eligible candidates using AI heuristics</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Console Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Diagnostic Output</h4>
              {diagnosticLogs.length > 0 && (
                <button 
                  onClick={() => { setDiagnosticLogs([]); setAiResponse(null); }}
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

          {aiStatus === 'unreachable' && (
            <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg">
              <strong>Troubleshooting:</strong> Make sure the FastAPI microservice is running. Start the service by navigating to the <code>ai-service</code> folder and executing: 
              <pre className="mt-1 bg-red-100 dark:bg-red-950/50 p-1.5 rounded font-mono select-all text-[11px]">
                uvicorn main:app --reload --port 8001
              </pre>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t dark:border-dark-border">
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostic}
              disabled={aiDiagnosticRunning}
              className="flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={aiDiagnosticRunning ? 'animate-spin' : ''} />
              Run Diagnostics
            </Button>
            <Button onClick={() => setIsAIModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
