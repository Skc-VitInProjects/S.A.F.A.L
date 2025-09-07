import axios from 'axios';

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Add auth token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.post('/auth/logout'),
  getProfile: () => API.get('/auth/profile'),
};

export const studentAPI = {
  getAll: (params) => API.get('/students', { params }),
  getById: (id) => API.get(`/students/${id}`),
  create: (data) => API.post('/students', data),
  update: (id, data) => API.put(`/students/${id}`, data),
  delete: (id) => API.delete(`/students/${id}`),
  getByRiskLevel: (level) => API.get(`/students/risk/${level}`),
  search: (query) => API.post('/students/search', query),
  bulkCreate: (data) => API.post('/students/bulk-create', data),
  bulkUpdate: (data) => API.put('/students/bulk-update', data),
};

export const dataImportAPI = {
  // File uploads
  uploadFile: (endpoint, formData, config) => API.post(endpoint, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Students import
  importStudentsFromFile: (formData, config) => 
    API.post('/data/students/file', formData, config),
  importStudentsFromJSON: (data) => 
    API.post('/data/students/json', data),
  connectToSIS: (config) => 
    API.post('/data/students/sis-connect', config),
  importFromGoogleClassroom: (config) => 
    API.post('/data/students/google-classroom', config),

  // Attendance import
  importAttendanceFromFile: (formData, config) => 
    API.post('/data/attendance/file', formData, config),
  connectToBiometricSystem: (config) => 
    API.post('/data/attendance/biometric-connect', config),
  connectToRFIDSystem: (config) => 
    API.post('/data/attendance/rfid-connect', config),

  // Grades import
  importGradesFromFile: (formData, config) => 
    API.post('/data/grades/file', formData, config),
  connectToLMS: (config) => 
    API.post('/data/grades/lms-connect', config),
  importGradesFromGoogleClassroom: (config) => 
    API.post('/data/grades/google-classroom', config),

  // Financial data import
  connectToAccountingSystem: (config) => 
    API.post('/data/fees/accounting-connect', config),
  importFeesFromFile: (formData, config) => 
    API.post('/data/fees/file', formData, config),

  // Utilities
  getImportHistory: () => API.get('/data/history'),
  getImportStatus: (importId) => API.get(`/data/status/${importId}`),
  validateImportData: (formData) => API.post('/data/validate', formData),
  downloadTemplate: (type) => API.get(`/data/templates/${type}`, {
    responseType: 'blob'
  }),

  // Real-time sync
  setupAutoSync: (config) => API.post('/data/sync/setup', config),
  triggerManualSync: () => API.post('/data/sync/manual'),
  getSyncStatus: () => API.get('/data/sync/status'),
};

export const analyticsAPI = {
  getDashboardStats: () => API.get('/analytics/dashboard'),
  getRiskDistribution: () => API.get('/analytics/risk-distribution'),
  getAttendanceTrends: () => API.get('/analytics/attendance-trends'),
  getPerformanceMetrics: () => API.get('/analytics/performance'),
  getPredictionAccuracy: () => API.get('/analytics/prediction-accuracy'),
};

export const alertAPI = {
  getAll: (params) => API.get('/alerts', { params }),
  getById: (id) => API.get(`/alerts/${id}`),
  create: (data) => API.post('/alerts', data),
  update: (id, data) => API.put(`/alerts/${id}`, data),
  acknowledge: (id, data) => API.put(`/alerts/${id}/acknowledge`, data),
  resolve: (id, data) => API.put(`/alerts/${id}/resolve`, data),
  dismiss: (id) => API.put(`/alerts/${id}/dismiss`),
};

export const predictionAPI = {
  getStudentPrediction: (studentId) => API.get(`/predictions/student/${studentId}`),
  generatePrediction: (studentId) => API.post(`/predictions/generate/${studentId}`),
  getBatchPredictions: (params) => API.get('/predictions/batch', { params }),
  getModelPerformance: () => API.get('/predictions/model-performance'),
};

export default API;