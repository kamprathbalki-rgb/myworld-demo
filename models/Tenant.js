const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema({

    name:String,

    email:String,

    adminName:String,

    adminEmail:String,

companyName: {
    type: String,
    default: ""
},

mobile: {
    type: String,
    default: ""
},

name:String,

email:String,

adminName:String,

adminEmail:String,

tenantCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
},

stateName:{
    type:String,
    required:true
},

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

aiEnabled: {
    type: Boolean,
    default: true
},

aiRole: {
    type: String,
    default: "You are the official AI assistant."
},

aiInstructions: {
    type: String,
    default: ""
},

businessDescription: {
    type: String,
    default: ""
},

features:{

    whatsapp:{
        type:Boolean,
        default:false
    },

    whatsappAI:{
        type:Boolean,
        default:false
    },

    website:{
        type:Boolean,
        default:false
    },

    digitalMarketing:{
        type:Boolean,
        default:false
    },

    mobileApp:{
        type:Boolean,
        default:false
    },

    api:{
        type:Boolean,
        default:false
    }

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