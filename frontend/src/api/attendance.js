import api from './axios';

export const getTimeEntries = async () => {
  const { data } = await api.get('/attendance/time-entries/');
  return data;
};

export const clockIn = async (shift_id) => {
  const { data } = await api.post('/attendance/time-entries/clock_in/', { shift_id });
  return data;
};

export const clockOut = async (shift_id) => {
  const { data } = await api.post('/attendance/time-entries/clock_out/', { shift_id });
  return data;
};

export const requestEmergencyCheckout = async (payload) => {
  const { data } = await api.post('/attendance/time-entries/emergency_checkout/', payload);
  return data;
};

export const approveEarlyCheckout = async (id) => {
  const { data } = await api.post(`/attendance/time-entries/${id}/approve_early_checkout/`);
  return data;
};

export const rejectEarlyCheckout = async (id) => {
  const { data } = await api.post(`/attendance/time-entries/${id}/reject_early_checkout/`);
  return data;
};
