import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notifications';
import { useNotificationStore } from '../store/notificationStore';

export const useNotifications = () => {
  const { setNotifications } = useNotificationStore();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await getNotifications();
      setNotifications(data.results || data);
      return data;
    },
  });
};

export const useUnreadCount = () => {
  const { setUnreadCount } = useNotificationStore();
  
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const data = await getUnreadCount();
      setUnreadCount(data.unread_count);
      return data;
    },
    refetchInterval: 60000, // Check every minute
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { markAsRead: storeMarkAsRead } = useNotificationStore();
  
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (_, id) => {
      storeMarkAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { markAllAsRead: storeMarkAllAsRead } = useNotificationStore();
  
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      storeMarkAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
