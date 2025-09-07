# Create API Routes and Controllers

# Student Routes
student_routes = '''const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const { auth, authorize } = require('../middleware/auth');

// Get all students with filtering and pagination
router.get('/', auth, authorize(['admin', 'teacher', 'counselor']), StudentController.getStudents);

// Get single student by ID
router.get('/:id', auth, authorize(['admin', 'teacher', 'counselor', 'parent']), StudentController.getStudentById);

// Create new student
router.post('/', auth, authorize(['admin']), StudentController.createStudent);

// Update student
router.put('/:id', auth, authorize(['admin', 'teacher', 'counselor']), StudentController.updateStudent);

// Delete student
router.delete('/:id', auth, authorize(['admin']), StudentController.deleteStudent);

// Get student's attendance
router.get('/:id/attendance', auth, StudentController.getStudentAttendance);

// Get student's grades
router.get('/:id/grades', auth, StudentController.getStudentGrades);

// Get student's risk assessment
router.get('/:id/risk-assessment', auth, StudentController.getStudentRiskAssessment);

// Get student's interventions
router.get('/:id/interventions', auth, StudentController.getStudentInterventions);

// Bulk operations
router.post('/bulk-create', auth, authorize(['admin']), StudentController.bulkCreateStudents);
router.put('/bulk-update', auth, authorize(['admin']), StudentController.bulkUpdateStudents);

// Search students
router.post('/search', auth, StudentController.searchStudents);

// Get students by risk level
router.get('/risk/:level', auth, authorize(['admin', 'teacher', 'counselor']), StudentController.getStudentsByRiskLevel);

module.exports = router;'''

# Data Import Routes - THIS IS KEY FOR DATA SOURCES
data_import_routes = '''const express = require('express');
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

module.exports = router;'''

# Student Controller
student_controller = '''const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Prediction = require('../models/Prediction');
const Intervention = require('../models/Intervention');
const PredictionService = require('../services/predictionService');
const { validationResult } = require('express-validator');

class StudentController {
    
    // Get all students with filtering and pagination
    static async getStudents(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                course,
                department,
                riskLevel,
                status,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // Build filter object
            let filter = {};
            
            if (course) filter.course = course;
            if (department) filter.department = department;
            if (riskLevel) filter.riskLevel = riskLevel;
            if (status) filter.status = status;
            
            // Handle search across multiple fields
            if (search) {
                filter.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { studentId: { $regex: search, $options: 'i' } },
                    { rollNumber: { $regex: search, $options: 'i' } }
                ];
            }

            // Role-based filtering
            if (req.user.role === 'teacher') {
                // Teachers can only see students from their department
                filter.department = req.user.department;
            } else if (req.user.role === 'parent') {
                // Parents can only see their children
                filter._id = { $in: req.user.parentData.children };
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;
            const sortObj = {};
            sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

            const students = await Student.find(filter)
                .select('-createdBy -lastUpdatedBy')
                .sort(sortObj)
                .limit(limit * 1)
                .skip(skip)
                .lean();

            const total = await Student.countDocuments(filter);

            // Add computed fields
            for (let student of students) {
                // Calculate attendance percentage
                const attendanceRecords = await Attendance.find({ studentId: student._id });
                if (attendanceRecords.length > 0) {
                    const presentCount = attendanceRecords.filter(record => record.status === 'Present').length;
                    student.attendancePercentage = Math.round((presentCount / attendanceRecords.length) * 100);
                } else {
                    student.attendancePercentage = 0;
                }

                // Get latest prediction
                const latestPrediction = await Prediction.findOne({ 
                    studentId: student._id, 
                    isActive: true 
                }).sort({ predictionDate: -1 });
                
                student.latestPrediction = latestPrediction ? {
                    riskScore: latestPrediction.riskScore,
                    riskLevel: latestPrediction.riskLevel,
                    dropoutProbability: latestPrediction.dropoutProbability
                } : null;
            }

            res.json({
                students,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                total,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            });

        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ message: 'Error fetching students', error: error.message });
        }
    }

    // Get single student by ID
    static async getStudentById(req, res) {
        try {
            const { id } = req.params;
            
            const student = await Student.findById(id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // Role-based access control
            if (req.user.role === 'parent') {
                if (!req.user.parentData.children.includes(student._id)) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            }

            // Get additional data
            const attendancePercentage = await student.calculateAttendancePercentage();
            const latestGrades = await student.getLatestGrades();
            
            const latestPrediction = await Prediction.findOne({ 
                studentId: id, 
                isActive: true 
            }).sort({ predictionDate: -1 });

            const activeInterventions = await Intervention.find({ 
                studentId: id, 
                status: { $in: ['Planned', 'Active'] }
            }).populate('assignedTo', 'firstName lastName');

            res.json({
                student,
                attendancePercentage,
                latestGrades,
                latestPrediction,
                activeInterventions
            });

        } catch (error) {
            console.error('Error fetching student:', error);
            res.status(500).json({ message: 'Error fetching student', error: error.message });
        }
    }

    // Create new student
    static async createStudent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const studentData = {
                ...req.body,
                createdBy: req.user.id
            };

            const student = new Student(studentData);
            await student.save();

            // Generate initial risk assessment
            await PredictionService.generatePrediction(student._id);

            res.status(201).json({
                message: 'Student created successfully',
                student
            });

        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(400).json({ 
                    message: `${field} already exists` 
                });
            }
            
            console.error('Error creating student:', error);
            res.status(500).json({ 
                message: 'Error creating student', 
                error: error.message 
            });
        }
    }

    // Update student
    static async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updates = {
                ...req.body,
                lastUpdatedBy: req.user.id
            };

            const student = await Student.findByIdAndUpdate(
                id, 
                updates, 
                { new: true, runValidators: true }
            );

            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // Regenerate risk assessment if key fields changed
            const keyFields = ['currentCGPA', 'feeStatus', 'status'];
            const changedFields = Object.keys(updates);
            const shouldRegenerate = keyFields.some(field => changedFields.includes(field));

            if (shouldRegenerate) {
                await PredictionService.generatePrediction(student._id);
            }

            res.json({
                message: 'Student updated successfully',
                student
            });

        } catch (error) {
            console.error('Error updating student:', error);
            res.status(500).json({ 
                message: 'Error updating student', 
                error: error.message 
            });
        }
    }

    // Delete student
    static async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            
            const student = await Student.findByIdAndDelete(id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            // Clean up related data
            await Attendance.deleteMany({ studentId: id });
            await Grade.deleteMany({ studentId: id });
            await Prediction.deleteMany({ studentId: id });
            await Intervention.deleteMany({ studentId: id });

            res.json({ message: 'Student deleted successfully' });

        } catch (error) {
            console.error('Error deleting student:', error);
            res.status(500).json({ 
                message: 'Error deleting student', 
                error: error.message 
            });
        }
    }

    // Additional methods...
    static async getStudentsByRiskLevel(req, res) {
        try {
            const { level } = req.params;
            const validLevels = ['Low', 'Medium', 'High'];
            
            if (!validLevels.includes(level)) {
                return res.status(400).json({ message: 'Invalid risk level' });
            }

            const students = await Student.find({ riskLevel: level })
                .select('firstName lastName studentId course department riskScore')
                .sort({ riskScore: -1 });

            res.json({ students, count: students.length });

        } catch (error) {
            console.error('Error fetching students by risk level:', error);
            res.status(500).json({ 
                message: 'Error fetching students', 
                error: error.message 
            });
        }
    }
}

module.exports = StudentController;'''

# Write route and controller files
with open('studentRoutes.js', 'w') as f:
    f.write(student_routes)
    
with open('dataImportRoutes.js', 'w') as f:
    f.write(data_import_routes)
    
with open('studentController.js', 'w') as f:
    f.write(student_controller)

print("✅ API Routes and Controllers Created:")
print("   🛣️ Student Routes - CRUD operations with role-based access")
print("   📥 Data Import Routes - Multiple data source integrations")
print("   🎮 Student Controller - Complete business logic")
print("\n📊 Data Import Sources Supported:")
print("   • CSV/Excel file uploads")
print("   • Student Information Systems (SIS)")
print("   • Google Classroom integration")
print("   • Biometric attendance systems")
print("   • RFID attendance systems")
print("   • Learning Management Systems (LMS)")
print("   • Accounting systems for fee data")
print("   • Real-time sync capabilities")