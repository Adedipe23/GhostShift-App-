import api from './axios';

export const getSwaps = async (params) => {
  const response = await api.get('/swaps/', { params });
  return response.data;
};

export const createSwap = async (data) => {
  const response = await api.post('/swaps/', data);
  return response.data;
};

export const approveSwap = async (id, data) => {
  const response = await api.put(`/swaps/${id}/approve/`, data);
  return response.data;
};

export const rejectSwap = async (id, data) => {
  const response = await api.put(`/swaps/${id}/reject/`, data);
  return response.data;
};
