const mongoose = require('mongoose');

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

module.exports = mongoose.model('Attendance', AttendanceSchema);