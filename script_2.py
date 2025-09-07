# Create MongoDB Models/Schemas

# Student Model
student_model = '''const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    // Basic Information
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    
    // Academic Information
    course: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    admissionDate: {
        type: Date,
        required: true
    },
    expectedGraduation: {
        type: Date,
        required: true
    },
    currentCGPA: {
        type: Number,
        min: 0,
        max: 4.0,
        default: 0
    },
    
    // Contact Information
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        email: String
    },
    
    // Family Background
    fatherName: {
        type: String,
        required: true
    },
    fatherOccupation: {
        type: String,
        required: true
    },
    fatherEducation: {
        type: String,
        enum: ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Professional'],
        required: true
    },
    fatherIncome: {
        type: Number,
        min: 0
    },
    motherName: {
        type: String,
        required: true
    },
    motherOccupation: {
        type: String,
        required: true
    },
    motherEducation: {
        type: String,
        enum: ['Below 10th', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Professional'],
        required: true
    },
    motherIncome: {
        type: Number,
        min: 0,
        default: 0
    },
    
    // Financial Information
    feeStatus: {
        type: String,
        enum: ['Paid', 'Pending', 'Defaulted', 'Partial'],
        default: 'Pending'
    },
    totalFees: {
        type: Number,
        required: true,
        min: 0
    },
    paidFees: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingFees: {
        type: Number,
        default: 0,
        min: 0
    },
    scholarship: {
        hasScholarship: {
            type: Boolean,
            default: false
        },
        scholarshipType: String,
        scholarshipAmount: {
            type: Number,
            default: 0
        }
    },
    
    // Academic Performance Tracking
    previousQualification: {
        qualification: String,
        board: String,
        year: Number,
        percentage: Number,
        subjects: [String]
    },
    
    // Behavioral & Social Factors
    nationality: {
        type: String,
        default: 'Indian'
    },
    displaced: {
        type: Boolean,
        default: false
    },
    specialNeeds: {
        hasSpecialNeeds: {
            type: Boolean,
            default: false
        },
        needsDescription: String
    },
    maritalStatus: {
        type: String,
        enum: ['Single', 'Married', 'Other'],
        default: 'Single'
    },
    
    // Risk Assessment Data
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    lastRiskAssessment: {
        type: Date,
        default: Date.now
    },
    
    // Status Tracking
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Graduated', 'Dropped Out', 'Suspended'],
        default: 'Active'
    },
    
    // System Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better performance
StudentSchema.index({ studentId: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({ course: 1, department: 1 });
StudentSchema.index({ riskLevel: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ batch: 1, semester: 1 });

// Virtual for full name
StudentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
StudentSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Method to calculate attendance percentage
StudentSchema.methods.calculateAttendancePercentage = async function() {
    const Attendance = mongoose.model('Attendance');
    const attendanceRecords = await Attendance.find({ studentId: this._id });
    
    if (attendanceRecords.length === 0) return 0;
    
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(record => record.status === 'Present').length;
    
    return Math.round((presentClasses / totalClasses) * 100 * 100) / 100; // Round to 2 decimal places
};

// Method to get latest grades
StudentSchema.methods.getLatestGrades = async function() {
    const Grade = mongoose.model('Grade');
    return await Grade.find({ studentId: this._id }).sort({ createdAt: -1 }).limit(10);
};

module.exports = mongoose.model('Student', StudentSchema);'''

# User Model for Authentication
user_model = '''const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'counselor', 'parent', 'student'],
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    employeeId: {
        type: String,
        trim: true,
        sparse: true // Allows null values but enforces uniqueness when present
    },
    
    // Role-specific data
    teacherData: {
        subjects: [String],
        classes: [String],
        experience: Number
    },
    counselorData: {
        specialization: [String],
        maxCaseload: {
            type: Number,
            default: 50
        },
        currentCaseload: {
            type: Number,
            default: 0
        }
    },
    parentData: {
        children: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }]
    },
    studentData: {
        studentProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }
    },
    
    // Permissions
    permissions: {
        canViewDashboard: { type: Boolean, default: true },
        canManageStudents: { type: Boolean, default: false },
        canViewAnalytics: { type: Boolean, default: false },
        canManageAlerts: { type: Boolean, default: false },
        canImportData: { type: Boolean, default: false },
        canManageUsers: { type: Boolean, default: false }
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    
    // Notification Preferences
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        frequency: {
            type: String,
            enum: ['immediate', 'daily', 'weekly'],
            default: 'daily'
        }
    }
}, {
    timestamps: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ employeeId: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to check specific permissions
UserSchema.methods.hasPermission = function(permission) {
    return this.permissions[permission] || this.role === 'admin';
};

module.exports = mongoose.model('User', UserSchema);'''

# Attendance Model
attendance_model = '''const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        required: true
    },
    period: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    remarks: {
        type: String,
        trim: true
    },
    
    // Metadata
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    markedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ date: 1, subject: 1 });
AttendanceSchema.index({ teacherId: 1, date: 1 });

// Compound index for unique attendance per student per subject per period per day
AttendanceSchema.index({ studentId: 1, date: 1, subject: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);'''

# Write model files
with open('Student.js', 'w') as f:
    f.write(student_model)

with open('User.js', 'w') as f:
    f.write(user_model)
    
with open('Attendance.js', 'w') as f:
    f.write(attendance_model)

print("✅ Core MongoDB Models Created:")
print("   📝 Student Model - Comprehensive student data with 30+ fields")
print("   👤 User Model - Authentication with role-based permissions")
print("   📊 Attendance Model - Daily attendance tracking")
print("\n🔍 Student Model includes:")
print("   • Basic info, academic data, family background")
print("   • Financial status, risk assessment")
print("   • Behavioral factors, contact information")
print("   • Built-in methods for calculations")