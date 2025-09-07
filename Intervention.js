const mongoose = require('mongoose');

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

module.exports = mongoose.model('Intervention', InterventionSchema);