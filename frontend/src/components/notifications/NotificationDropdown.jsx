import { useNotifications, useMarkAsRead } from '../../hooks/useNotifications';
import { Check, BellRing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ onClose }) => {
  const { data: notificationsData, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkAsRead();

  const notifications = notificationsData?.results || [];

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-xl glass-card shadow-card z-50 overflow-hidden border">
      <div className="px-4 py-3 border-b dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-surface/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center text-slate-500">
            <BellRing className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-dark-border">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => { if (!notif.read) markRead(notif.id); }}
                className={`p-4 transition-colors cursor-pointer ${!notif.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-slate-50 dark:hover:bg-dark-surface'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{notif.title}</h4>
                  {!notif.read && (
                    <button 
                      onClick={() => markRead(notif.id)}
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-800 p-1 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{notif.message}</p>
                <span className="text-[10px] text-slate-400 font-medium">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
