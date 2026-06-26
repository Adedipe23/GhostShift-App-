import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard if they try to access an unauthorized route
    const defaultRoutes = {
      EMPLOYEE: '/dashboard/employee',
      MANAGER: '/dashboard/manager',
      HR: '/dashboard/hr',
      ADMIN: '/dashboard/admin',
    };
    return <Navigate to={defaultRoutes[user.role] || '/dashboard/employee'} replace />;
  }

  return children;
};

export default ProtectedRoute;
