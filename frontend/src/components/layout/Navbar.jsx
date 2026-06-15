import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useState, useEffect, useRef } from 'react';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const { data: unreadData } = useUnreadCount();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <button
          onClick={onMenuClick}
          className="mr-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-surface"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
            >
              <Bell size={20} />
              {unreadData?.unread_count > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-error"></span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          <div className="flex items-center space-x-3 border-l pl-4 dark:border-dark-border">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {user?.role}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <button 
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-error transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
