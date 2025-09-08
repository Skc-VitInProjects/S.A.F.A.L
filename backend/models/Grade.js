const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    subjectCode: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    academicYear: {
        type: String,
        required: true
    },

    // Assessment Types
    assessmentType: {
        type: String,
        enum: ['Quiz', 'Assignment', 'Midterm', 'Final', 'Project', 'Lab', 'Viva'],
        required: true
    },

    // Grading Information
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    obtainedMarks: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
        required: true
    },
    gradePoints: {
        type: Number,
        required: true,
        min: 0,
        max: 4
    },

    // Assessment Details
    assessmentDate: {
        type: Date,
        required: true
    },
    submissionDate: {
        type: Date
    },
    isRetest: {
        type: Boolean,
        default: false
    },
    attemptNumber: {
        type: Number,
        default: 1,
        min: 1
    },

    // Faculty Information
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    remarks: {
        type: String,
        trim: true
    },

    // Metadata
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
GradeSchema.index({ studentId: 1, semester: 1 });
GradeSchema.index({ subject: 1, assessmentType: 1 });
GradeSchema.index({ assessmentDate: 1 });
GradeSchema.index({ facultyId: 1, assessmentDate: 1 });

// Methods
GradeSchema.methods.isPassingGrade = function() {
    return this.gradePoints >= 1.0; // D grade or above
};

GradeSchema.statics.calculateSemesterGPA = async function(studentId, semester) {
    const grades = await this.find({ studentId, semester });
    if (grades.length === 0) return 0;

    const totalGradePoints = grades.reduce((sum, grade) => sum + grade.gradePoints, 0);
    return Math.round((totalGradePoints / grades.length) * 100) / 100;
};

module.exports = mongoose.model('Grade', GradeSchema);