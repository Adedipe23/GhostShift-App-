import api from './axios';

export const getBurnoutScores = async (params) => {
  const response = await api.get('/burnout/', { params });
  return response.data;
};

export const calculateBurnout = async (data) => {
  const response = await api.post('/burnout/calculate/', data || {});
  return response.data;
};
