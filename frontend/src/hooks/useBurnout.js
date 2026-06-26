import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBurnoutScores, calculateBurnout } from '../api/burnout';

export const useBurnoutScores = (params) => {
  return useQuery({
    queryKey: ['burnout', params],
    queryFn: () => getBurnoutScores(params),
  });
};

export const useCalculateBurnout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: calculateBurnout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['burnout'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
