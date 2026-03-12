import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const transactionApi = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const goalApi = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getHeatmap: () => api.get('/analytics/monthly-heatmap'),
};

export const aiApi = {
  chat: (message) => api.post('/ai/chat', { message }),
  getInsights: () => api.get('/ai/insights'),
  getSavingTips: () => api.get('/ai/saving-tips'),
  getHealthScore: () => api.get('/ai/health-score'),
  categorize: (message) => api.post('/ai/categorize', { message }),
};

export const anomalyApi = {
  getAll: () => api.get('/anomalies'),
  getUnreadCount: () => api.get('/anomalies/unread-count'),
  markRead: (id) => api.patch(`/anomalies/${id}/read`),
};
