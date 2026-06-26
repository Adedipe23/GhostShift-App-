import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit';

export const useAuditLogs = (params, options = {}) => {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => getAuditLogs(params),
    ...options,
  });
};
