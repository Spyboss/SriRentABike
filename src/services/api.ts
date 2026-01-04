import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  setupAdmin: (email: string, password: string) =>
    api.post('/auth/setup-admin', { email, password }),
};

// Agreements API
export const agreementsAPI = {
  create: (data: unknown) =>
    api.post('/agreements', data),
  
  getAll: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get('/agreements', { params }),
  
  getById: (id: string) =>
    api.get(`/agreements/${id}`),
  
  update: (id: string, data: unknown) =>
    api.put(`/agreements/${id}`, data),
  
  getPublicStatus: (reference: string) =>
    api.get(`/agreements/public/${reference}`),
  
  delete: (id: string) =>
    api.delete(`/agreements/${id}`),
};

// Guest Links API
export const guestLinksAPI = {
  validate: (token: string) =>
    api.get(`/guest-links/validate/${token}`),
  
  getAgreement: (token: string) =>
    api.get(`/guest-links/agreement/${token}`),
  
  markAsUsed: (token: string) =>
    api.post(`/guest-links/use/${token}`),
};

// PDF API
export const pdfAPI = {
  generate: (agreementId: string) =>
    api.post(`/pdf/generate/${agreementId}`, {}, { responseType: 'blob' }),
  
  download: (agreementId: string) =>
    api.get(`/pdf/download/${agreementId}`, { responseType: 'blob' }),
  
  getUrl: (agreementId: string) =>
    api.get(`/pdf/url/${agreementId}`),
};

// Bikes API
export const bikesAPI = {
  list: () => api.get('/bikes'),
  available: () => api.get('/bikes/available'),
  create: (data: { model: string; frame_no: string; plate_no: string; availability_status?: 'available' | 'rented' | 'maintenance' }) =>
    api.post('/bikes', data),
  update: (id: string, data: Partial<{ model: string; frame_no: string; plate_no: string; availability_status: 'available' | 'rented' | 'maintenance' }>) =>
    api.put(`/bikes/${id}`, data),
  archive: (id: string) => api.post(`/bikes/${id}/archive`)
}
export const bikeMetaAPI = {
  get: (id: string) => api.get(`/bikes/${id}/meta`),
  put: (id: string, meta: { color?: string; specs?: string }) => api.put(`/bikes/${id}/meta`, meta),
  uploadDocs: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    return api.post(`/bikes/${id}/docs`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  listDocs: (id: string) => api.get(`/bikes/${id}/docs`),
  deleteBike: (id: string) => api.delete(`/bikes/${id}`)
}

// Daily rate & Pricing API
export const rateAPI = {
  get: () => api.get('/settings/daily-rate'),
  update: (daily_rate: number) => api.put('/settings/daily-rate', { daily_rate }),
  getPricing: () => api.get('/settings/pricing'),
  updatePricing: (data: unknown) => api.put('/settings/pricing', data)
}
