import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailability, createAvailability, updateAvailability, deleteAvailability } from '../api/availability';

export const useAvailability = (params) => {
  return useQuery({
    queryKey: ['availability', params],
    queryFn: () => getAvailability(params),
  });
};

export const useCreateAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAvailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};

export const useDeleteAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};
