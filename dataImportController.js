const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const axios = require('axios');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const { validationResult } = require('express-validator');

class DataImportController {

    // =============================================================================
    // STUDENT DATA IMPORT METHODS
    // =============================================================================

    // Import students from CSV/Excel file upload
    static async importStudentsFromFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const filePath = req.file.path;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

            let studentsData = [];

            if (fileExtension === 'csv') {
                // Process CSV file
                studentsData = await DataImportController.processCSVFile(filePath);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Process Excel file
                studentsData = await DataImportController.processExcelFile(filePath);
            } else {
                return res.status(400).json({ message: 'Unsupported file format' });
            }

            // Validate and transform data
            const validatedData = await DataImportController.validateStudentData(studentsData);

            // Import to database
            const results = await DataImportController.importStudentsToDatabase(validatedData, req.user.id);

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.json({
                message: 'File processed successfully',
                imported: results.successful,
                failed: results.failed,
                total: studentsData.length,
                errors: results.errors
            });

        } catch (error) {
            console.error('Error importing students from file:', error);
            res.status(500).json({ 
                message: 'Error processing file', 
                error: error.message 
            });
        }
    }

    // Connect to existing Student Information System (SIS)
    static async connectToSIS(req, res) {
        try {
            const { sisUrl, apiKey, institutionId, syncOptions } = req.body;

            // Example integration with common SIS systems
            let studentsData = [];

            switch (syncOptions.sisType) {
                case 'PowerSchool':
                    studentsData = await DataImportController.fetchFromPowerSchool(sisUrl, apiKey, institutionId);
                    break;
                case 'Skyward':
                    studentsData = await DataImportController.fetchFromSkyward(sisUrl, apiKey, institutionId);
                    break;
                case 'Infinite Campus':
                    studentsData = await DataImportController.fetchFromInfiniteCampus(sisUrl, apiKey, institutionId);
                    break;
                case 'Custom API':
                    studentsData = await DataImportController.fetchFromCustomAPI(sisUrl, apiKey, syncOptions);
                    break;
                default:
                    return res.status(400).json({ message: 'Unsupported SIS type' });
            }

            const validatedData = await DataImportController.validateStudentData(studentsData);
            const results = await DataImportController.importStudentsToDatabase(validatedData, req.user.id);

            res.json({
                message: 'SIS synchronization completed',
                imported: results.successful,
                failed: results.failed,
                sisType: syncOptions.sisType
            });

        } catch (error) {
            console.error('Error connecting to SIS:', error);
            res.status(500).json({ 
                message: 'Error connecting to SIS', 
                error: error.message 
            });
        }
    }

    // Import from Google Classroom
    static async importFromGoogleClassroom(req, res) {
        try {
            const { accessToken, courseIds } = req.body;

            const studentsData = [];

            for (const courseId of courseIds) {
                // Fetch students from Google Classroom API
                const response = await axios.get(
                    `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const classroomStudents = response.data.students || [];

                // Transform Google Classroom data to our format
                for (const student of classroomStudents) {
                    studentsData.push({
                        firstName: student.profile.name.givenName,
                        lastName: student.profile.name.familyName,
                        email: student.profile.emailAddress,
                        googleClassroomId: student.userId,
                        course: courseId, // This should be mapped to your course structure
                        admissionDate: new Date(),
                        status: 'Active'
                    });
                }
            }

            const validatedData = await DataImportController.validateStudentData(studentsData);
            const results = await DataImportController.importStudentsToDatabase(validatedData, req.user.id);

            res.json({
                message: 'Google Classroom import completed',
                imported: results.successful,
                failed: results.failed,
                coursesProcessed: courseIds.length
            });

        } catch (error) {
            console.error('Error importing from Google Classroom:', error);
            res.status(500).json({ 
                message: 'Error importing from Google Classroom', 
                error: error.message 
            });
        }
    }

    // =============================================================================
    // ATTENDANCE DATA IMPORT METHODS
    // =============================================================================

    // Import attendance from file
    static async importAttendanceFromFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const filePath = req.file.path;
            const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

            let attendanceData = [];

            if (fileExtension === 'csv') {
                attendanceData = await DataImportController.processAttendanceCSV(filePath);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                attendanceData = await DataImportController.processAttendanceExcel(filePath);
            }

            const results = await DataImportController.importAttendanceToDatabase(attendanceData, req.user.id);

            // Clean up file
            fs.unlinkSync(filePath);

            res.json({
                message: 'Attendance data imported successfully',
                imported: results.successful,
                failed: results.failed,
                total: attendanceData.length
            });

        } catch (error) {
            console.error('Error importing attendance:', error);
            res.status(500).json({ 
                message: 'Error importing attendance', 
                error: error.message 
            });
        }
    }

    // Connect to biometric attendance system
    static async connectToBiometricSystem(req, res) {
        try {
            const { systemUrl, apiKey, deviceIds } = req.body;

            const attendanceData = [];

            // Fetch attendance data from biometric devices
            for (const deviceId of deviceIds) {
                const response = await axios.get(
                    `${systemUrl}/api/attendance/${deviceId}/today`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const deviceAttendance = response.data;
                attendanceData.push(...deviceAttendance);
            }

            const results = await DataImportController.processBiometricData(attendanceData, req.user.id);

            res.json({
                message: 'Biometric attendance synchronized',
                imported: results.successful,
                failed: results.failed,
                devicesProcessed: deviceIds.length
            });

        } catch (error) {
            console.error('Error connecting to biometric system:', error);
            res.status(500).json({ 
                message: 'Error connecting to biometric system', 
                error: error.message 
            });
        }
    }

    // Connect to RFID attendance system
    static async connectToRFIDSystem(req, res) {
        try {
            const { systemUrl, credentials, locationIds } = req.body;

            const attendanceData = [];

            // Fetch from RFID system API
            for (const locationId of locationIds) {
                const response = await axios.post(
                    `${systemUrl}/api/rfid/attendance-report`,
                    {
                        location: locationId,
                        date: new Date().toISOString().split('T')[0],
                        ...credentials
                    }
                );

                attendanceData.push(...response.data.attendance);
            }

            const results = await DataImportController.processRFIDData(attendanceData, req.user.id);

            res.json({
                message: 'RFID attendance synchronized',
                imported: results.successful,
                failed: results.failed
            });

        } catch (error) {
            console.error('Error connecting to RFID system:', error);
            res.status(500).json({ 
                message: 'Error connecting to RFID system', 
                error: error.message 
            });
        }
    }

    // =============================================================================
    // UTILITY METHODS FOR PROCESSING DATA
    // =============================================================================

    static async processCSVFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    static async processExcelFile(filePath) {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    }

    static async validateStudentData(studentsData) {
        const validatedStudents = [];
        const errors = [];

        for (let i = 0; i < studentsData.length; i++) {
            const student = studentsData[i];
            const rowNumber = i + 1;

            try {
                // Required field validation
                if (!student.firstName || !student.lastName || !student.email) {
                    errors.push({
                        row: rowNumber,
                        error: 'Missing required fields (firstName, lastName, email)'
                    });
                    continue;
                }

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(student.email)) {
                    errors.push({
                        row: rowNumber,
                        error: 'Invalid email format'
                    });
                    continue;
                }

                // Transform and validate data
                const validatedStudent = {
                    firstName: student.firstName.trim(),
                    lastName: student.lastName.trim(),
                    email: student.email.toLowerCase().trim(),
                    phone: student.phone || '',
                    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : new Date('2000-01-01'),
                    gender: student.gender || 'Other',
                    course: student.course || 'General',
                    department: student.department || 'General',
                    batch: student.batch || new Date().getFullYear().toString(),
                    semester: parseInt(student.semester) || 1,
                    rollNumber: student.rollNumber || `AUTO_${Date.now()}_${i}`,
                    admissionDate: student.admissionDate ? new Date(student.admissionDate) : new Date(),
                    expectedGraduation: student.expectedGraduation ? new Date(student.expectedGraduation) : new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000),

                    // Family information
                    fatherName: student.fatherName || '',
                    fatherOccupation: student.fatherOccupation || '',
                    fatherEducation: student.fatherEducation || 'Graduate',
                    motherName: student.motherName || '',
                    motherOccupation: student.motherOccupation || '',
                    motherEducation: student.motherEducation || 'Graduate',

                    // Financial information
                    totalFees: parseFloat(student.totalFees) || 0,
                    feeStatus: student.feeStatus || 'Pending',

                    // Address
                    address: {
                        street: student.street || '',
                        city: student.city || '',
                        state: student.state || '',
                        pincode: student.pincode || '',
                        country: student.country || 'India'
                    },

                    // Default values
                    status: 'Active',
                    riskLevel: 'Low',
                    riskScore: 0
                };

                validatedStudents.push(validatedStudent);

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: `Data processing error: ${error.message}`
                });
            }
        }

        return { validatedStudents, errors };
    }

    static async importStudentsToDatabase(validatedData, userId) {
        const { validatedStudents, errors } = validatedData;
        const results = {
            successful: 0,
            failed: 0,
            errors: [...errors]
        };

        for (const studentData of validatedStudents) {
            try {
                studentData.createdBy = userId;

                // Check if student already exists
                const existingStudent = await Student.findOne({
                    $or: [
                        { email: studentData.email },
                        { rollNumber: studentData.rollNumber }
                    ]
                });

                if (existingStudent) {
                    // Update existing student
                    await Student.findByIdAndUpdate(existingStudent._id, {
                        ...studentData,
                        lastUpdatedBy: userId
                    });
                    results.successful++;
                } else {
                    // Create new student
                    const newStudent = new Student(studentData);
                    await newStudent.save();
                    results.successful++;
                }

            } catch (error) {
                results.failed++;
                results.errors.push({
                    student: `${studentData.firstName} ${studentData.lastName}`,
                    error: error.message
                });
            }
        }

        return results;
    }

    // Download template files for data import
    static async downloadTemplate(req, res) {
        try {
            const { type } = req.params;

            const templates = {
                students: {
                    headers: [
                        'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
                        'course', 'department', 'batch', 'semester', 'rollNumber',
                        'fatherName', 'fatherOccupation', 'fatherEducation',
                        'motherName', 'motherOccupation', 'motherEducation',
                        'totalFees', 'feeStatus', 'street', 'city', 'state', 'pincode'
                    ],
                    filename: 'student_import_template.csv'
                },
                attendance: {
                    headers: [
                        'studentId', 'date', 'subject', 'status', 'period', 'remarks'
                    ],
                    filename: 'attendance_import_template.csv'
                },
                grades: {
                    headers: [
                        'studentId', 'subject', 'subjectCode', 'semester', 'academicYear',
                        'assessmentType', 'maxMarks', 'obtainedMarks', 'assessmentDate'
                    ],
                    filename: 'grades_import_template.csv'
                }
            };

            if (!templates[type]) {
                return res.status(400).json({ message: 'Invalid template type' });
            }

            const template = templates[type];
            const csvContent = template.headers.join(',') + '\n';

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
            res.send(csvContent);

        } catch (error) {
            console.error('Error generating template:', error);
            res.status(500).json({ 
                message: 'Error generating template', 
                error: error.message 
            });
        }
    }

    // Get import history
    static async getImportHistory(req, res) {
        try {
            // This would typically come from a separate ImportLog model
            // For now, we'll return a mock response
            const importHistory = [
                {
                    id: 1,
                    type: 'Students',
                    source: 'CSV File',
                    filename: 'students_batch_2024.csv',
                    importedBy: 'Admin User',
                    importDate: new Date(),
                    recordsProcessed: 150,
                    recordsSuccessful: 145,
                    recordsFailed: 5,
                    status: 'Completed'
                }
                // Add more mock data as needed
            ];

            res.json({ importHistory });

        } catch (error) {
            console.error('Error fetching import history:', error);
            res.status(500).json({ 
                message: 'Error fetching import history', 
                error: error.message 
            });
        }
    }
}

module.exports = DataImportController;