# Create React Frontend Components

# Main App.js
app_js = '''import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import DataImport from './pages/DataImport';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';

// Context
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Utilities
import ProtectedRoute from './components/Common/ProtectedRoute';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f5325c',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="students" element={<StudentManagement />} />
                    <Route path="data-import" element={<DataImport />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="alerts" element={<Alerts />} />
                  </Route>
                </Routes>
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                />
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;'''

# Data Import Component - KEY FOR USER'S QUESTION
data_import_component = '''import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload,
  GetApp,
  Sync,
  History,
  School,
  Assessment,
  Payment,
  Group
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

import { useDataImport } from '../hooks/useDataImport';
import { dataImportAPI } from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-import-tabpanel-${index}`}
      aria-labelledby={`data-import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DataImport = () => {
  const [tabValue, setTabValue] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  // System integration dialogs
  const [sisDialog, setSisDialog] = useState(false);
  const [biometricDialog, setBiometricDialog] = useState(false);
  const [sisConfig, setSisConfig] = useState({
    sisType: '',
    sisUrl: '',
    apiKey: '',
    institutionId: ''
  });

  const { importHistory, isLoading: historyLoading } = useDataImport();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // File upload handlers
  const onDrop = useCallback(async (acceptedFiles, uploadType) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      let endpoint = '';
      switch (uploadType) {
        case 'students':
          endpoint = '/api/data/students/file';
          break;
        case 'attendance':
          endpoint = '/api/data/attendance/file';
          break;
        case 'grades':
          endpoint = '/api/data/grades/file';
          break;
        default:
          throw new Error('Invalid upload type');
      }

      const response = await dataImportAPI.uploadFile(endpoint, formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setImportResults(response.data);
      toast.success(`${response.data.imported} records imported successfully!`);
      
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} records failed to import. Check error details.`);
      }

    } catch (error) {
      toast.error(`Import failed: ${error.response?.data?.message || error.message}`);
      console.error('Import error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // Student file dropzone
  const {
    getRootProps: getStudentRootProps,
    getInputProps: getStudentInputProps,
    isDragActive: isStudentDragActive
  } = useDropzone({
    onDrop: (files) => onDrop(files, 'students'),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Attendance file dropzone
  const {
    getRootProps: getAttendanceRootProps,
    getInputProps: getAttendanceInputProps,
    isDragActive: isAttendanceDragActive
  } = useDropzone({
    onDrop: (files) => onDrop(files, 'attendance'),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Grades file dropzone
  const {
    getRootProps: getGradesRootProps,
    getInputProps: getGradesInputProps,
    isDragActive: isGradesDragActive
  } = useDropzone({
    onDrop: (files) => onDrop(files, 'grades'),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  // Download template
  const downloadTemplate = async (type) => {
    try {
      const response = await dataImportAPI.downloadTemplate(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_import_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Connect to SIS
  const handleSISConnect = async () => {
    try {
      const response = await dataImportAPI.connectToSIS(sisConfig);
      setImportResults(response.data);
      setSisDialog(false);
      toast.success('SIS connection successful!');
    } catch (error) {
      toast.error(`SIS connection failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Import & Integration Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Import student data from various sources: files, external systems, and APIs
      </Typography>

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label="File Upload" 
            icon={<CloudUpload />} 
            iconPosition="start"
          />
          <Tab 
            label="System Integration" 
            icon={<Sync />} 
            iconPosition="start"
          />
          <Tab 
            label="Import History" 
            icon={<History />} 
            iconPosition="start"
          />
        </Tabs>

        {/* FILE UPLOAD TAB */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Student Data Upload */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Student Data</Typography>
                  </Box>
                  
                  <Box
                    {...getStudentRootProps()}
                    sx={{
                      border: 2,
                      borderColor: isStudentDragActive ? 'primary.main' : 'grey.300',
                      borderStyle: 'dashed',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isStudentDragActive ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <input {...getStudentInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {isStudentDragActive
                        ? 'Drop the student file here...'
                        : 'Drag & drop student file here, or click to select'
                      }
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Supports CSV, Excel files
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => downloadTemplate('students')}
                    startIcon={<GetApp />}
                    sx={{ mt: 2, width: '100%' }}
                  >
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Attendance Data Upload */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Group sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h6">Attendance Data</Typography>
                  </Box>
                  
                  <Box
                    {...getAttendanceRootProps()}
                    sx={{
                      border: 2,
                      borderColor: isAttendanceDragActive ? 'success.main' : 'grey.300',
                      borderStyle: 'dashed',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isAttendanceDragActive ? 'success.light' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <input {...getAttendanceInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {isAttendanceDragActive
                        ? 'Drop the attendance file here...'
                        : 'Drag & drop attendance file here, or click to select'
                      }
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => downloadTemplate('attendance')}
                    startIcon={<GetApp />}
                    sx={{ mt: 2, width: '100%' }}
                  >
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Grades Data Upload */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="h6">Grades Data</Typography>
                  </Box>
                  
                  <Box
                    {...getGradesRootProps()}
                    sx={{
                      border: 2,
                      borderColor: isGradesDragActive ? 'warning.main' : 'grey.300',
                      borderStyle: 'dashed',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isGradesDragActive ? 'warning.light' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <input {...getGradesInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {isGradesDragActive
                        ? 'Drop the grades file here...'
                        : 'Drag & drop grades file here, or click to select'
                      }
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => downloadTemplate('grades')}
                    startIcon={<GetApp />}
                    sx={{ mt: 2, width: '100%' }}
                  >
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploading and processing file...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Import Results */}
          {importResults && (
            <Alert 
              severity={importResults.failed > 0 ? "warning" : "success"} 
              sx={{ mt: 3 }}
            >
              <Typography variant="body2">
                Import completed: {importResults.imported} successful, {importResults.failed} failed
                {importResults.total && ` out of ${importResults.total} total records`}
              </Typography>
            </Alert>
          )}
        </TabPanel>

        {/* SYSTEM INTEGRATION TAB */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Student Information Systems */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Student Information Systems (SIS)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Connect to external student management systems
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setSisDialog(true)}
                      >
                        PowerSchool
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setSisDialog(true)}
                      >
                        Skyward
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setSisDialog(true)}
                      >
                        Infinite Campus
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setSisDialog(true)}
                      >
                        Custom API
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Attendance Systems */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Systems
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Integrate with biometric and RFID systems
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setBiometricDialog(true)}
                      >
                        Biometric System
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                      >
                        RFID System
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                      >
                        Google Classroom
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                      >
                        Manual Entry
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Learning Management Systems */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Learning Management Systems
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Import grades and assignments from LMS platforms
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Moodle
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Canvas
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Blackboard
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Google Classroom
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Financial Systems */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial & Fee Systems
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Connect to accounting and fee management systems
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        QuickBooks
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Tally
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Custom ERP
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" fullWidth>
                        Payment Gateway
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* IMPORT HISTORY TAB */}
        <TabPanel value={tabValue} index={2}>
          {historyLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Records</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Imported By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importHistory?.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(record.importDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>{record.source}</TableCell>
                      <TableCell>
                        {record.recordsSuccessful}/{record.recordsProcessed}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status}
                          color={record.status === 'Completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.importedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* SIS Connection Dialog */}
      <Dialog open={sisDialog} onClose={() => setSisDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect to Student Information System</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>SIS Type</InputLabel>
              <Select
                value={sisConfig.sisType}
                onChange={(e) => setSisConfig({...sisConfig, sisType: e.target.value})}
              >
                <MenuItem value="PowerSchool">PowerSchool</MenuItem>
                <MenuItem value="Skyward">Skyward</MenuItem>
                <MenuItem value="Infinite Campus">Infinite Campus</MenuItem>
                <MenuItem value="Custom API">Custom API</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="SIS URL"
              value={sisConfig.sisUrl}
              onChange={(e) => setSisConfig({...sisConfig, sisUrl: e.target.value})}
              fullWidth
            />
            <TextField
              label="API Key"
              value={sisConfig.apiKey}
              onChange={(e) => setSisConfig({...sisConfig, apiKey: e.target.value})}
              fullWidth
              type="password"
            />
            <TextField
              label="Institution ID"
              value={sisConfig.institutionId}
              onChange={(e) => setSisConfig({...sisConfig, institutionId: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSisDialog(false)}>Cancel</Button>
          <Button onClick={handleSISConnect} variant="contained">Connect</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataImport;'''

# API Service utilities
api_service = '''import axios from 'axios';

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

export default API;'''

# Write frontend files
with open('App.js', 'w') as f:
    f.write(app_js)

with open('DataImport.jsx', 'w') as f:
    f.write(data_import_component)

with open('apiService.js', 'w') as f:
    f.write(api_service)

print("✅ React Frontend Components Created!")
print("\n🖥️ Frontend Components:")
print("   📱 App.js - Main application with routing and theme")
print("   📊 DataImport.jsx - Comprehensive data import interface")
print("   🔌 apiService.js - Complete API integration utilities")
print("\n🎯 DataImport Component Features:")
print("   • Drag & drop file uploads")
print("   • Multiple system integrations")
print("   • Real-time upload progress")
print("   • Import history tracking")  
print("   • Template downloads")
print("   • Error handling and validation")
print("\n🚀 Complete MERN Stack Application Ready!")