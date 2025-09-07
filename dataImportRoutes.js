const express = require('express');
const router = express.Router();
const multer = require('multer');
const DataImportController = require('../controllers/dataImportController');
const { auth, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept CSV, Excel, and JSON files
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/json') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV, Excel, and JSON files are allowed'));
        }
    }
});

// =============================================================================
// STUDENT DATA IMPORT ROUTES
// =============================================================================

// Import students from CSV/Excel file
router.post('/students/file', 
    auth, 
    authorize(['admin']), 
    upload.single('file'), 
    DataImportController.importStudentsFromFile
);

// Import students from JSON
router.post('/students/json', 
    auth, 
    authorize(['admin']), 
    DataImportController.importStudentsFromJSON
);

// Connect to existing Student Information System (SIS)
router.post('/students/sis-connect', 
    auth, 
    authorize(['admin']), 
    DataImportController.connectToSIS
);

// Import from Google Classroom
router.post('/students/google-classroom', 
    auth, 
    authorize(['admin']), 
    DataImportController.importFromGoogleClassroom
);

// =============================================================================
// ATTENDANCE DATA IMPORT ROUTES
// =============================================================================

// Import attendance from CSV/Excel
router.post('/attendance/file', 
    auth, 
    authorize(['admin', 'teacher']), 
    upload.single('file'), 
    DataImportController.importAttendanceFromFile
);

// Connect to biometric attendance system
router.post('/attendance/biometric-connect', 
    auth, 
    authorize(['admin']), 
    DataImportController.connectToBiometricSystem
);

// Import from RFID attendance system  
router.post('/attendance/rfid-connect', 
    auth, 
    authorize(['admin']), 
    DataImportController.connectToRFIDSystem
);

// =============================================================================
// GRADES DATA IMPORT ROUTES
// =============================================================================

// Import grades from CSV/Excel
router.post('/grades/file', 
    auth, 
    authorize(['admin', 'teacher']), 
    upload.single('file'), 
    DataImportController.importGradesFromFile
);

// Connect to Learning Management System (LMS)
router.post('/grades/lms-connect', 
    auth, 
    authorize(['admin']), 
    DataImportController.connectToLMS
);

// Import from Google Classroom grades
router.post('/grades/google-classroom', 
    auth, 
    authorize(['admin', 'teacher']), 
    DataImportController.importGradesFromGoogleClassroom
);

// =============================================================================
// FINANCIAL DATA IMPORT ROUTES
// =============================================================================

// Import fee data from accounting system
router.post('/fees/accounting-connect', 
    auth, 
    authorize(['admin']), 
    DataImportController.connectToAccountingSystem
);

// Import fee data from CSV/Excel
router.post('/fees/file', 
    auth, 
    authorize(['admin']), 
    upload.single('file'), 
    DataImportController.importFeesFromFile
);

// =============================================================================
// BULK DATA OPERATIONS
// =============================================================================

// Get import history
router.get('/history', 
    auth, 
    authorize(['admin']), 
    DataImportController.getImportHistory
);

// Get import status
router.get('/status/:importId', 
    auth, 
    authorize(['admin']), 
    DataImportController.getImportStatus
);

// Validate data before import
router.post('/validate', 
    auth, 
    authorize(['admin']), 
    upload.single('file'), 
    DataImportController.validateImportData
);

// Download sample templates
router.get('/templates/:type', 
    auth, 
    authorize(['admin']), 
    DataImportController.downloadTemplate
);

// =============================================================================
// REAL-TIME DATA SYNC
// =============================================================================

// Set up automatic sync with external systems
router.post('/sync/setup', 
    auth, 
    authorize(['admin']), 
    DataImportController.setupAutoSync
);

// Manual sync trigger
router.post('/sync/manual', 
    auth, 
    authorize(['admin']), 
    DataImportController.triggerManualSync
);

// Get sync status
router.get('/sync/status', 
    auth, 
    authorize(['admin']), 
    DataImportController.getSyncStatus
);

module.exports = router;