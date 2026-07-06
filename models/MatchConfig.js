const mongoose = require('mongoose')

const matchConfigSchema = new mongoose.Schema({

tenantId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Tenant'
},

weights:{
price:Number,
bedrooms:Number,
area:Number,
distance:Number
},

extras:[
{
field:String,
weight:Number
}
]

})

matchConfigSchema.pre('save',function(next){

let total =
this.weights.price +
this.weights.bedrooms +
this.weights.area +
this.weights.distance

this.extras.forEach(e=>{
total += e.weight
})

if(total !== 100){
return next(new Error("Total must equal 100"))
}

next()

})

module.exports = mongoose.model('MatchConfig',matchConfigSchema)