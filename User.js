const mongoose = require('mongoose');
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

module.exports = mongoose.model('User', UserSchema);