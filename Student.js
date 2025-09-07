const mongoose = require('mongoose');

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

module.exports = mongoose.model('Student', StudentSchema);