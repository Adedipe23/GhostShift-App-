import { useMutation, useQuery } from '@tanstack/react-query';
import { login, register, getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.login);
  
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, { access: data.access, refresh: data.refresh });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
  });
};

export const useUser = () => {
  const { isAuthenticated, updateUser } = useAuthStore();
  
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const data = await getMe();
      updateUser(data);
      return data;
    },
    enabled: isAuthenticated,
  });
};
