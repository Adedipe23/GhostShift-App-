import api from './axios';

export const getUsers = async (params) => {
  const response = await api.get('/auth/users/', { params });
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.patch(`/auth/users/${id}/`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}/`);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.patch('/auth/me/', data);
  return response.data;
};
