import api from './axios';

export const getAvailability = async (params) => {
  const response = await api.get('/availability/', { params });
  return response.data;
};

export const createAvailability = async (data) => {
  const response = await api.post('/availability/', data);
  return response.data;
};

export const updateAvailability = async (id, data) => {
  const response = await api.patch(`/availability/${id}/`, data);
  return response.data;
};

export const deleteAvailability = async (id) => {
  const response = await api.delete(`/availability/${id}/`);
  return response.data;
};
