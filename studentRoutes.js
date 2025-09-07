const express = require('express');
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

module.exports = router;