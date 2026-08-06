const mongoose = require("mongoose");

const buyerWorkflowHistorySchema = new mongoose.Schema({

    buyerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Buyer",
        required:true
    },

    tenantId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tenant"
    },

changedById:{
    type:mongoose.Schema.Types.ObjectId
},

changedByName:String,

changedByRole:String,

    previousStatus:String,

    newStatus:String,

    changedAt:{
        type:Date,
        default:Date.now
    }

},{
    timestamps:true
});

module.exports = mongoose.model(
    "BuyerWorkflowHistory",
    buyerWorkflowHistorySchema
);