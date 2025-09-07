# Create additional models for the system

# Grade Model
grade_model = '''const mongoose = require('mongoose');

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

module.exports = mongoose.model('Grade', GradeSchema);'''

# Alert Model
alert_model = '''const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    alertType: {
        type: String,
        enum: [
            'ATTENDANCE_LOW',
            'GRADES_DECLINING', 
            'FEE_OVERDUE',
            'BEHAVIORAL_ISSUE',
            'RISK_SCORE_HIGH',
            'INTERVENTION_NEEDED',
            'FOLLOW_UP_REQUIRED',
            'ACADEMIC_PROBATION',
            'CRITICAL_ALERT'
        ],
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    
    // Alert Data
    triggerValue: {
        type: mongoose.Schema.Types.Mixed // Can store any type of data
    },
    threshold: {
        type: mongoose.Schema.Types.Mixed
    },
    currentValue: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Status Tracking
    status: {
        type: String,
        enum: ['Active', 'Acknowledged', 'In Progress', 'Resolved', 'Dismissed'],
        default: 'Active'
    },
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Resolution
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
    resolutionNotes: {
        type: String,
        trim: true
    },
    
    // Notification Tracking
    notifications: [{
        method: {
            type: String,
            enum: ['email', 'sms', 'push', 'in-app']
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            default: 'sent'
        }
    }],
    
    // Auto-generated alerts tracking
    isAutoGenerated: {
        type: Boolean,
        default: false
    },
    generatedBy: {
        type: String, // System component that generated the alert
        trim: true
    },
    
    // Escalation
    escalationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    lastEscalated: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
AlertSchema.index({ studentId: 1, status: 1 });
AlertSchema.index({ alertType: 1, priority: 1 });
AlertSchema.index({ assignedTo: 1, status: 1 });
AlertSchema.index({ createdAt: 1 });
AlertSchema.index({ priority: 1, status: 1 });

// Methods
AlertSchema.methods.escalate = function() {
    if (this.escalationLevel < 3) {
        this.escalationLevel += 1;
        this.lastEscalated = new Date();
    }
};

AlertSchema.methods.acknowledge = function(userId) {
    this.status = 'Acknowledged';
    this.assignedTo = userId;
};

AlertSchema.methods.resolve = function(userId, notes) {
    this.status = 'Resolved';
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    this.resolutionNotes = notes;
};

module.exports = mongoose.model('Alert', AlertSchema);'''

# Prediction Model
prediction_model = '''const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    
    // Prediction Results
    dropoutProbability: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    riskScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    prediction: {
        type: String,
        enum: ['Dropout', 'Continue'],
        required: true
    },
    
    // Model Information
    modelVersion: {
        type: String,
        required: true
    },
    modelType: {
        type: String,
        default: 'HLRNN',
        required: true
    },
    accuracy: {
        type: Number,
        min: 0,
        max: 1
    },
    
    // Feature Analysis (SHAP/LIME)
    featureImportance: [{
        feature: {
            type: String,
            required: true
        },
        importance: {
            type: Number,
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed
        },
        impact: {
            type: String,
            enum: ['positive', 'negative', 'neutral']
        }
    }],
    
    // Input Features Used
    inputFeatures: {
        // Demographics
        age: Number,
        gender: String,
        nationality: String,
        
        // Academic
        currentCGPA: Number,
        attendanceRate: Number,
        semester: Number,
        
        // Financial
        feeStatus: String,
        hasScholarship: Boolean,
        
        // Family Background  
        fatherEducation: String,
        motherEducation: String,
        fatherOccupation: String,
        motherOccupation: String,
        
        // Behavioral
        disciplinaryIssues: Number,
        specialNeeds: Boolean,
        displaced: Boolean,
        
        // Additional computed features
        previousGPA: Number,
        attendanceTrend: String,
        gradeTrend: String
    },
    
    // Explanation
    explanation: {
        summary: String,
        keyFactors: [String],
        recommendations: [String],
        confidence: {
            type: Number,
            min: 0,
            max: 1
        }
    },
    
    // Tracking
    predictionDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Metadata
    generatedBy: {
        type: String,
        default: 'HLRNN_Model',
        required: true
    },
    processingTime: {
        type: Number // in milliseconds
    }
}, {
    timestamps: true
});

// Indexes
PredictionSchema.index({ studentId: 1, predictionDate: -1 });
PredictionSchema.index({ riskLevel: 1, predictionDate: -1 });
PredictionSchema.index({ modelVersion: 1 });
PredictionSchema.index({ validUntil: 1, isActive: 1 });

// Methods
PredictionSchema.methods.isExpired = function() {
    return new Date() > this.validUntil;
};

PredictionSchema.methods.getTopRiskFactors = function(limit = 5) {
    return this.featureImportance
        .filter(f => f.impact === 'negative')
        .sort((a, b) => b.importance - a.importance)
        .slice(0, limit);
};

PredictionSchema.methods.generateSummary = function() {
    const topFactors = this.getTopRiskFactors(3);
    return {
        riskLevel: this.riskLevel,
        probability: Math.round(this.dropoutProbability * 100),
        topFactors: topFactors.map(f => f.feature),
        recommendation: this.explanation.recommendations[0] || 'Monitor closely'
    };
};

module.exports = mongoose.model('Prediction', PredictionSchema);'''

# Intervention Model
intervention_model = '''const mongoose = require('mongoose');

const InterventionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert'
    },
    
    // Intervention Details
    type: {
        type: String,
        enum: [
            'Academic Support',
            'Counseling Session',
            'Financial Aid',
            'Peer Mentoring',
            'Family Conference',
            'Extra Classes',
            'Behavioral Support',
            'Career Guidance',
            'Medical Support',
            'Custom'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    
    // Goals and Objectives
    objectives: [String],
    measurableGoals: [{
        goal: String,
        target: mongoose.Schema.Types.Mixed,
        current: mongoose.Schema.Types.Mixed,
        deadline: Date
    }],
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Schedule
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    frequency: {
        type: String,
        enum: ['One-time', 'Daily', 'Weekly', 'Bi-weekly', 'Monthly'],
        default: 'One-time'
    },
    totalSessions: {
        type: Number,
        default: 1,
        min: 1
    },
    
    // Progress Tracking
    sessions: [{
        date: {
            type: Date,
            required: true
        },
        duration: Number, // in minutes
        notes: String,
        outcome: {
            type: String,
            enum: ['Excellent', 'Good', 'Satisfactory', 'Poor', 'No Show']
        },
        nextActions: [String],
        conductedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Status
    status: {
        type: String,
        enum: ['Planned', 'Active', 'Completed', 'Cancelled', 'On Hold'],
        default: 'Planned'
    },
    
    // Outcomes
    outcome: {
        type: String,
        enum: ['Successful', 'Partially Successful', 'Unsuccessful', 'Ongoing'],
        default: 'Ongoing'
    },
    effectivenessRating: {
        type: Number,
        min: 1,
        max: 5
    },
    
    // Follow-up
    followUpRequired: {
        type: Boolean,
        default: false
    },
    followUpDate: Date,
    followUpNotes: String,
    
    // Resources
    resourcesUsed: [String],
    estimatedCost: Number,
    actualCost: Number,
    
    // Collaboration
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String,
        involvement: {
            type: String,
            enum: ['Primary', 'Secondary', 'Consultant', 'Observer']
        }
    }],
    
    // Parent/Guardian Involvement
    parentInvolvement: {
        required: {
            type: Boolean,
            default: false
        },
        meetings: [{
            date: Date,
            attendees: [String],
            notes: String,
            outcome: String
        }]
    }
}, {
    timestamps: true
});

// Indexes
InterventionSchema.index({ studentId: 1, status: 1 });
InterventionSchema.index({ assignedTo: 1, status: 1 });
InterventionSchema.index({ type: 1, startDate: 1 });
InterventionSchema.index({ endDate: 1, status: 1 });

// Methods
InterventionSchema.methods.addSession = function(sessionData) {
    this.sessions.push(sessionData);
    
    // Update status based on sessions
    if (this.sessions.length >= this.totalSessions) {
        this.status = 'Completed';
    } else if (this.status === 'Planned') {
        this.status = 'Active';
    }
};

InterventionSchema.methods.calculateProgress = function() {
    if (this.totalSessions === 0) return 0;
    return Math.round((this.sessions.length / this.totalSessions) * 100);
};

InterventionSchema.methods.isOverdue = function() {
    return new Date() > this.endDate && this.status !== 'Completed';
};

module.exports = mongoose.model('Intervention', InterventionSchema);'''

# Write additional model files
with open('Grade.js', 'w') as f:
    f.write(grade_model)

with open('Alert.js', 'w') as f:
    f.write(alert_model)
    
with open('Prediction.js', 'w') as f:
    f.write(prediction_model)
    
with open('Intervention.js', 'w') as f:
    f.write(intervention_model)

print("✅ Additional MongoDB Models Created:")
print("   📊 Grade Model - Academic performance tracking")
print("   🚨 Alert Model - Notification and alert management") 
print("   🤖 Prediction Model - AI prediction results with SHAP/LIME")
print("   🎯 Intervention Model - Counseling and support tracking")
print("\n🔍 Key Features:")
print("   • Grade tracking with GPA calculation")
print("   • Alert escalation and notification system")
print("   • AI prediction storage with feature importance")
print("   • Comprehensive intervention management")
print("   • Built-in methods for calculations and status updates")