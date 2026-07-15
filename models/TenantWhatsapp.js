const mongoose =
require('mongoose')

const schema =
new mongoose.Schema({

tenantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true,
  unique: true
},

phoneNumber: {

type: String,

default: ''

},

clientId: {

type: String,

default: ''

},

isAuthenticated: {

type: Boolean,

default: false

},

lastConnectedAt: Date

},
{
timestamps: true
})

module.exports =
mongoose.model(
'TenantWhatsapp',
schema
)