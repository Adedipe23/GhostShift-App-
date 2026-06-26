import { useQuery } from '@tanstack/react-query';
import { getDashboardAnalytics } from '../api/analytics';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardAnalytics,
    refetchInterval: 300000, // 5 minutes
  });
};
