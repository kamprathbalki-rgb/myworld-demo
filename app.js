require('dotenv').config()

require(
'./utils/subscriptionReminderJob'
)

const express = require('express')
const connectDB = require('./config/db')

const app = express()

const session = require('express-session')

const companyActiveGuard =
require(
'./middleware/companyActiveGuard'
)

connectDB()

app.use(express.json())
app.use(express.urlencoded({ extended:true }))

app.use(session({
secret: process.env.SESSION_SECRET || 'myworldsecret',
resave:false,
saveUninitialized:false,
cookie:{ maxAge: 30 * 60 * 1000 }
}))

app.set('view engine','ejs')
app.use(express.static('public'))

const authRoutes = require('./routes/authRoutes')
const propertyRoutes = require('./routes/propertyRoutes')
const buyerRoutes = require('./routes/buyerRoutes')
const matchRoutes = require('./routes/matchRoutes')
const visitRoutes = require('./routes/visitRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const tenantRoutes = require('./routes/tenantRoutes')
const tenantGuard = require('./middleware/tenantGuard')
const saasRoutes = require('./routes/saasRoutes')
const executiveRoutes = require('./routes/executiveRoutes')
const BuyerProjectVisit = require('./models/BuyerProjectVisit')
const Property = require('./models/Property')
const Buyer = require('./models/Buyer')
const Visit = require('./models/Visit')
const Executive = require('./models/Executive')

const ExecutiveAttendance = require('./models/ExecutiveAttendance')

app.use('/',authRoutes)
app.use('/', saasRoutes)
app.use('/', tenantRoutes)

app.use(
'/buyer',
tenantGuard,
companyActiveGuard,
buyerRoutes
)

app.use(
'/property',
tenantGuard,
companyActiveGuard,
propertyRoutes
)

app.use(
'/match',
tenantGuard,
companyActiveGuard,
matchRoutes
)

app.use(
'/visit',
tenantGuard,
companyActiveGuard,
visitRoutes
)

app.use(
'/dashboard',
tenantGuard,
companyActiveGuard,
dashboardRoutes
)

app.use(
'/executive',
executiveRoutes
)

app.get('/', (req,res)=>{
res.send("MyWorld Server Running")
})


app.get('/dashboard', async (req, res) => {

const today = new Date()
today.setHours(0,0,0,0)

const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

    const properties = await Property.countDocuments({
        tenantId: req.session.tenantId
    })

    const buyers = await Buyer.countDocuments({
        tenantId: req.session.tenantId
    })

const visits = await BuyerProjectVisit.countDocuments({
        tenantId: req.session.tenantId,
        scheduledVisitDate: {
        $gte: today,
        $lt: tomorrow
    }
})

const executives = await Executive.countDocuments({
    tenantId: req.session.tenantId,
    isActive: true
})

const followUps = await Buyer.countDocuments({
    tenantId: req.session.tenantId,
    nextFollowUp: {
        $gte: today,
        $lt: tomorrow
    }
})

const contacted = await Buyer.countDocuments({
    status: 'Contacted'
});

const negotiation = await Buyer.countDocuments({
    status: 'Negotiation'
});

const pipelineCount = 0;
const pipelineValue = 0;
const closedCount = 0;
const closedValue = 0;
const lostCount = 0;
const lostValue = 0;

const availableProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: { $ne: 'Sold' }
    })

const soldProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: 'Sold'
    })

const tokenProperties =
    await Property.countDocuments({
        tenantId: req.session.tenantId,
        propertyStatus: 'Token Received'
    })

res.render('dashboard', {
    properties,
    buyers,
    visits,
    executives,
    followUps,
    contacted,
    negotiation,

    pipelineCount,
    pipelineValue,

    closedCount,
    closedValue,

lostCount,
lostValue,

availableProperties,
soldProperties,
tokenProperties
})

})

app.all('/api/leads', async (req, res) => {
  try {
    let lead = {}

    // Housing (JSON body)
    if (req.body && req.body.name) {
      lead = {
        name: req.body.name,
        phone: req.body.mobile_number,
        email: req.body.email,
        projectName: req.body.project_name,
        source: 'Housing'
      }
    }

    // MagicBricks (query params)
    else {
      lead = {
        name: req.query.name,
        phone: req.query.mobile,
        email: req.query.email,
        projectName: req.query.project,
        source: 'MagicBricks'
      }
    }

    console.log("Incoming Lead:", lead);

console.log("Lead route file loaded");

    res.send("Success: Lead punched in the CRM")

  } catch (err) {
    console.error(err)
    res.send("Failure: Lead error")
  }
})

app.get('/attendance-report', async (req, res) => {

    if (!req.session.tenantId) {
        return res.redirect('/login')
    }

    const records = await ExecutiveAttendance.find({
        tenantId: req.session.tenantId
    }).sort({ date: -1 })

    res.render('adminAttendanceReport', {
        records
    })

})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on port " + PORT)
})