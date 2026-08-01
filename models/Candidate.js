const mongoose = require('mongoose')

const candidateSchema = new mongoose.Schema({

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },

    candidateName: {
        type: String,
        required: true,
        trim: true
    },

    mobile: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        default: '',
        trim: true
    },

    qualification: {
        type: String,
        default: ''
    },

    experience: {
        type: Number,
        default: 0
    },

    appliedFor: {
        type: String,
        default: ''
    },

    currentCompany: {
        type: String,
        default: ''
    },

    currentSalary: {
        type: Number,
        default: 0
    },

    expectedSalary: {
        type: Number,
        default: 0
    },

    noticePeriod: {
        type: String,
        default: ''
    },

    source: {
        type: String,
        default: ''
    },

    resumeStatus: {
        type: String,
        enum: ['Pending', 'Uploaded'],
        default: 'Pending'
    },

    resumeFile: {
        type: String,
        default: ''
    },

    interviewStatus: {
        type: String,
        enum: [
            'Applied',
            'Screening',
            'Interview Scheduled',
            'Interview Completed',
            'Selected',
            'Offer Released',
            'Joined',
            'Rejected',
            'On Hold'
        ],
        default: 'Applied'
    },

    remarks: {
        type: String,
        default: ''
    },

    appliedDate: {
        type: Date,
        default: Date.now
    }

},{
    timestamps:true
})

module.exports = mongoose.model('Candidate', candidateSchema)