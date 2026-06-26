import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useThemeStore } from './store/themeStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Shared
import ProfilePage from './pages/ProfilePage';

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MySchedulePage from './pages/employee/MySchedulePage';
import AvailabilityPage from './pages/employee/AvailabilityPage';

// Manager
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ShiftSchedulerPage from './pages/manager/ShiftSchedulerPage';
import TeamRosterPage from './pages/manager/TeamRosterPage';
import SwapRequestsPage from './pages/manager/SwapRequestsPage';

// HR
import HRDashboard from './pages/hr/HRDashboard';
import WorkforceReportPage from './pages/hr/WorkforceReportPage';
import DepartmentAnalyticsPage from './pages/hr/DepartmentAnalyticsPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="employee" replace />} />
            
            {/* Shared */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Employee Routes */}
            <Route path="employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="employee/schedule" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><MySchedulePage /></ProtectedRoute>} />
            <Route path="employee/availability" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><AvailabilityPage /></ProtectedRoute>} />

            {/* Manager Routes */}
            <Route path="manager" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerDashboard /></ProtectedRoute>} />
            <Route path="manager/scheduler" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><ShiftSchedulerPage /></ProtectedRoute>} />
            <Route path="manager/team" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><TeamRosterPage /></ProtectedRoute>} />
            <Route path="manager/swaps" element={<ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><SwapRequestsPage /></ProtectedRoute>} />

            {/* HR Routes */}
            <Route path="hr" element={<ProtectedRoute allowedRoles={['HR', 'ADMIN']}><HRDashboard /></ProtectedRoute>} />
            <Route path="hr/workforce" element={<ProtectedRoute allowedRoles={['HR', 'ADMIN']}><WorkforceReportPage /></ProtectedRoute>} />
            <Route path="hr/departments" element={<ProtectedRoute allowedRoles={['HR', 'ADMIN']}><DepartmentAnalyticsPage /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="admin/departments" element={<ProtectedRoute allowedRoles={['ADMIN']}><DepartmentManagementPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
