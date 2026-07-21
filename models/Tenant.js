const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema({

    name:String,

    email:String,

    adminName:String,

    adminEmail:String,

    stateName:{
        type:String,
        required:true
    },

    primaryDistrict:{
        type:String,
        required:true
    },

    subscriptionMonths:{
        type:Number,
        default:12
    },

    subscriptionStartDate:{
        type:Date,
        default:Date.now
    },

    subscriptionEndDate:{
        type:Date
    },

    isActive:{
        type:Boolean,
        default:true
    },

    companyType:{
        type:String,
        enum:[
            'Builder',
            'Real Estate Agency',
            'Channel Partner',
            'Broker',
            'Developer',
            'Property Consultant',
            'Individual'
        ],
        default:'Real Estate Agency'
    },

    credits:{
        type:Number,
        default:0
    },

    usedCredits:{
        type:Number,
        default:0
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

})

tenantSchema.virtual('availableCredits').get(function () {
    return (this.credits || 0) - (this.usedCredits || 0);
})

module.exports = mongoose.model('Tenant', tenantSchema)