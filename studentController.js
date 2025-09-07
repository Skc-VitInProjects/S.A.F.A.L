const Student = require('../models/Student');
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

module.exports = StudentController;