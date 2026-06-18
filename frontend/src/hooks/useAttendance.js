import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTimeEntries,
  clockIn,
  clockOut,
  requestEmergencyCheckout,
  approveEarlyCheckout,
  rejectEarlyCheckout
} from '../api/attendance';

export const useTimeEntries = () => {
  return useQuery({
    queryKey: ['timeEntries'],
    queryFn: getTimeEntries,
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useEmergencyCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestEmergencyCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useApproveEarlyCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveEarlyCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useRejectEarlyCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectEarlyCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
