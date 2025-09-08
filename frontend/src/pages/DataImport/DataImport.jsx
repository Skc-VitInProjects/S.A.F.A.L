import React, { useState, useCallback } from 'react';
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

export default DataImport;