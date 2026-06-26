import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, Activity, 
  Settings, UserCircle, CalendarClock, Building2, Repeat
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

const ROLE_LINKS = {
  EMPLOYEE: [
    { to: '/dashboard/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/employee/schedule', icon: Calendar, label: 'My Schedule' },
    { to: '/dashboard/employee/availability', icon: CalendarClock, label: 'Availability' },
    { to: '/dashboard/profile', icon: UserCircle, label: 'Profile Settings' },
  ],
  MANAGER: [
    { to: '/dashboard/manager', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/manager/scheduler', icon: Calendar, label: 'Shift Scheduler' },
    { to: '/dashboard/manager/team', icon: Users, label: 'Team Roster' },
    { to: '/dashboard/manager/swaps', icon: Repeat, label: 'Swap Requests' },
    { to: '/dashboard/profile', icon: UserCircle, label: 'Profile Settings' },
  ],
  HR: [
    { to: '/dashboard/hr', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/hr/workforce', icon: Users, label: 'Workforce Report' },
    { to: '/dashboard/hr/departments', icon: Activity, label: 'Dept Analytics' },
    { to: '/dashboard/profile', icon: UserCircle, label: 'Profile Settings' },
  ],
  ADMIN: [
    { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/dashboard/admin/users', icon: Users, label: 'User Management' },
    { to: '/dashboard/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/dashboard/profile', icon: UserCircle, label: 'Profile Settings' },
  ],
};

const Sidebar = ({ isOpen, setOpen }) => {
  const { user } = useAuthStore();
  
  if (!user) return null;
  const links = ROLE_LINKS[user.role] || [];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 glass border-r transition-all duration-300 flex flex-col",
        "md:sticky md:translate-x-0",
        isOpen 
          ? "translate-x-0 w-64" 
          : "-translate-x-full md:translate-x-0 md:w-20"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-center border-b dark:border-dark-border px-4">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <Activity className="h-6 w-6 shrink-0" />
            {isOpen && <span className="text-xl font-bold tracking-tight animate-fade-in">GhostShift</span>}
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={() => {
                if (window.innerWidth < 768) {
                  setOpen(false);
                }
              }}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isOpen ? "gap-3 justify-start" : "justify-center gap-0",
                isActive 
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400" 
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-surface dark:hover:text-slate-200"
              )}
              title={!isOpen ? link.label : undefined}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {isOpen && <span className="animate-fade-in">{link.label}</span>}
            </NavLink>
          ))}
        </div>
        
        <div className="p-4 border-t dark:border-dark-border shrink-0">
          <div className={cn(
            "flex items-center text-sm text-slate-500 dark:text-slate-400",
            isOpen ? "gap-3 px-3 py-2 justify-start" : "justify-center"
          )}>
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"></div>
            {isOpen && <span className="animate-fade-in">System Online</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
