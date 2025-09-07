const mongoose = require('mongoose');

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

module.exports = mongoose.model('Prediction', PredictionSchema);