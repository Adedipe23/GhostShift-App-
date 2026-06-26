import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSwaps, createSwap, approveSwap, rejectSwap } from '../api/swaps';

export const useSwaps = (params) => {
  return useQuery({
    queryKey: ['swaps', params],
    queryFn: () => getSwaps(params),
  });
};

export const useCreateSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSwap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useApproveSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => approveSwap(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useRejectSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => rejectSwap(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
