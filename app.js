require('dotenv').config()
require('./utils/subscriptionReminderJob')
require('./jobs/followupReminderJob');
require('./jobs/siteVisitReminderJob');
require('./jobs/dailySummaryJob');
require('./jobs/overdueFollowupJob');
require('./jobs/uncontactedLeadJob');

const express = require('express')
const connectDB = require('./config/db')
const app = express()
const session = require('express-session')
const companyActiveGuard = require('./middleware/companyActiveGuard')
const Tenant = require('./models/Tenant')
const startWhatsapp = require('./services/startWhatsapp')
const keywordRoutes = require('./routes/keywordRoutes')
const tenantWhatsappRoutes = require('./routes/tenantWhatsappRoutes')
const restoreSessions = require('./services/tenantWhatsapp/restoreSessions')
const aiDashboardRoutes = require('./routes/adminAiDashboardRoutes');
const whatsappDataRoutes = require('./routes/whatsappDataRoutes');
const learningCorrectionRoutes = require('./routes/learningCorrectionRoutes');

connectDB()

if (
    process.env.ENABLE_WHATSAPP === 'true'
) {

    setTimeout(async () => {

        try {

            await restoreSessions()

            console.log(
                'WHATSAPP SESSION RESTORE COMPLETE'
            )

        } catch (err) {

            console.error(
                'SESSION RESTORE ERROR:',
                err
            )

        }

    }, 5000)

}

app.use(express.json())
app.use(express.urlencoded({ extended:true }))
app.use(session({secret: process.env.SESSION_SECRET || 'myworldsecret',resave:false,saveUninitialized:false,
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

app.use('/buyer',tenantGuard,companyActiveGuard,buyerRoutes)
app.use('/property', tenantGuard, companyActiveGuard, propertyRoutes);
app.use('/match', tenantGuard, companyActiveGuard, matchRoutes);
app.use('/visit', tenantGuard, companyActiveGuard, visitRoutes);
app.use('/dashboard', tenantGuard, companyActiveGuard, dashboardRoutes);
app.use('/executive', executiveRoutes);
app.use('/keyword', keywordRoutes);
app.use('/tenant-whatsapp',tenantWhatsappRoutes)
app.use(aiDashboardRoutes);
app.use('/whatsapp-data',tenantGuard,companyActiveGuard,whatsappDataRoutes);
app.use('/learning-correction',learningCorrectionRoutes);


app.get('/', (req, res) => { res.send('MyWorld Server Running'); });
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

const Tenant = require('./models/Tenant')

const tenant = await Tenant.findById(
    req.session.tenantId
)

let daysRemaining = 0

if (
    tenant &&
    tenant.subscriptionEndDate
) {
    daysRemaining = Math.max(
        0,
        Math.ceil(
            (
                new Date(tenant.subscriptionEndDate) -
                new Date()
            ) / (1000 * 60 * 60 * 24)
        )
    )
}


res.render('dashboard', {
    tenant,
    daysRemaining,
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

app.get(
'/session-test',
(req,res) => {

    res.json({
        user: req.session.user,
        tenantId: req.session.tenantId
    });

});

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