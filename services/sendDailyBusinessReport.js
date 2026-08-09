const nodemailer = require("nodemailer");
const { sendEmail } = require("../utils/emailService");
const Tenant = require("../models/Tenant");

const Executive = require("../models/Executive");
const ExecutiveAttendance = require("../models/ExecutiveAttendance");
const Buyer = require("../models/Buyer");
const Property = require("../models/Property");
const Visit = require("../models/Visit");
const fs = require("fs");
const path = require("path");



const OpenAI = require("openai");

const TenantAIUsage =
    require("../models/TenantAIUsage");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const { marked } = require("marked");

const promptTemplate = fs.readFileSync(

    path.join(
        process.cwd(),
        "prompts",
        "dailyBusinessSummary.txt"
    ),

    "utf8"

);



const dashboardRoutes = require("../routes/dashboardRoutes");

const ExecutiveLocationLog =
    require("../models/ExecutiveLocationLog");

async function sendDailyBusinessReport(tenantId) {

const today = new Date().toISOString().slice(0,10);

const logFile=path.join(

process.cwd(),

"data",

String(tenantId),

today,

"dailylog.jsonl"

);

const executives =
await Executive.find({
    tenantId,
    isActive:true
}).sort({name:1});

const attendance =
await ExecutiveAttendance.find({
    tenantId,
    date:today
});

const buyers =
await Buyer.find({
    tenantId
});

const properties =
await Property.find({
    tenantId
});

const visits =
await Visit.find({
    tenantId
});

const report =
await dashboardRoutes.getExecutivePerformanceData(
    tenantId
);

let performanceHtml = `

<h2>Executive Performance</h2>

<table border="1" cellpadding="6" cellspacing="0" width="100%">

<tr>

<th>Rank</th>
<th>Executive</th>
<th>Imported</th>
<th>Phone Call</th>
<th>Qualified</th>
<th>Site Visit</th>
<th>Negotiation</th>
<th>Won</th>
<th>Lost</th>

</tr>

`;

for (const e of report.result) {

    performanceHtml += `

<tr>

<td>${e.rank}</td>
<td>${e.executive}</td>
<td>${e.imported}</td>
<td>${e.phoneCall}</td>
<td>${e.qualified}</td>
<td>${e.siteVisit}</td>
<td>${e.negotiation}</td>
<td>${e.won}</td>
<td>${e.lost}</td>

</tr>

`;

}

performanceHtml += `

<tr style="font-weight:bold;background:#f2f2f2">

<td></td>
<td>Total</td>
<td>${report.totals.imported}</td>
<td>${report.totals.phoneCall}</td>
<td>${report.totals.qualified}</td>
<td>${report.totals.siteVisit}</td>
<td>${report.totals.negotiation}</td>
<td>${report.totals.won}</td>
<td>${report.totals.lost}</td>

</tr>

</table>

`;




let attendanceHtml = `

<h2>Executive Attendance</h2>

<table
border="1"
cellpadding="6"
cellspacing="0"
width="100%">

<tr>

<th>Executive</th>

<th>First Login</th>

<th>Last Logout</th>

<th>Productive</th>

<th>Tea</th>

<th>Lunch</th>

</tr>

`;

for(const e of executives){

    const a =
    attendance.find(x=>x.executiveName===e.name);

    attendanceHtml += `

<tr>

<td>${e.name}</td>

<td>${a?.loginTimes?.[0] || "-"}</td>

<td>${a?.logoutTimes?.slice(-1)[0] || "-"}</td>

<td>${a?.productiveHours || "-"}</td>

<td>${a?.totalTeaBreak || 0} min</td>

<td>${a?.totalLunchBreak || 0} min</td>

</tr>

`;

}

attendanceHtml += "</table>";


const buyerStatus={};

buyers.forEach(b=>{

    buyerStatus[b.status]=
    (buyerStatus[b.status]||0)+1;

});

let buyerHtml=`

<h2>Buyer Summary</h2>

<table border="1"
cellpadding="6"
width="100%">

<tr>

<th>Status</th>

<th>Count</th>

</tr>

`;

Object.keys(buyerStatus)
.sort()
.forEach(status=>{

buyerHtml+=`

<tr>

<td>${status}</td>

<td>${buyerStatus[status]}</td>

</tr>

`;

});

buyerHtml+="</table>";

const available=
properties.filter(
p=>p.propertyStatus==="Available"
).length;

const sold=
properties.filter(
p=>p.propertyStatus==="Sold"
).length;

const token=
properties.filter(
p=>p.propertyStatus==="Token Received"
).length;

const propertyHtml=`

<h2>Property Summary</h2>

<table border="1"
cellpadding="6">

<tr>

<td>Total</td>

<td>${properties.length}</td>

</tr>

<tr>

<td>Available</td>

<td>${available}</td>

</tr>

<tr>

<td>Sold</td>

<td>${sold}</td>

</tr>

<tr>

<td>Token</td>

<td>${token}</td>

</tr>

</table>

`;

const completed=
visits.filter(
v=>v.status==="Completed"
).length;

const scheduled=
visits.filter(
v=>v.status==="Scheduled"
).length;

const deals=
visits.filter(
v=>v.dealClosed
).length;

const visitHtml=`

<h2>Visit Summary</h2>

<table border="1"
cellpadding="6">

<tr>

<td>Total Visits</td>

<td>${visits.length}</td>

</tr>

<tr>

<td>Completed</td>

<td>${completed}</td>

</tr>

<tr>

<td>Scheduled</td>

<td>${scheduled}</td>

</tr>

<tr>

<td>Deals Closed</td>

<td>${deals}</td>

</tr>

</table>

`;

let hrHtml = `
<h2>HR Activity</h2>
<table border="1" cellpadding="6" cellspacing="0" width="100%">
<tr>
<th>Activity</th>
<th>Count</th>
</tr>
`;

let usersAdded = 0;
let usersModified = 0;
let usersDeleted = 0;

if (fs.existsSync(logFile)) {

    const logs = fs
        .readFileSync(logFile, "utf8")
        .split("\n");

    logs.forEach(line => {

        if (line.includes("User Added"))
            usersAdded++;

        if (line.includes("User Modified"))
            usersModified++;

        if (line.includes("User Deleted"))
            usersDeleted++;

    });

}

hrHtml += `
<tr>
<td>Users Added</td>
<td>${usersAdded}</td>
</tr>

<tr>
<td>Users Modified</td>
<td>${usersModified}</td>
</tr>

<tr>
<td>Users Deleted</td>
<td>${usersDeleted}</td>
</tr>

</table>
`;


let timelineHtml="<h2>Daily Timeline</h2>";

try{

if(fs.existsSync(logFile)){

timelineHtml+="<pre>";

timelineHtml+=
fs.readFileSync(
logFile,
"utf8"
);

timelineHtml+="</pre>";

}else{

timelineHtml+="No activity.";

}

}catch(err){

timelineHtml+="Unable to read log.";

}

const locations =
await ExecutiveLocationLog.find({
    timestamp: {
        $gte: new Date(today + "T00:00:00"),
        $lt: new Date(today + "T23:59:59")
    }
}).sort({
    executiveName: 1,
    timestamp: 1
});

let locationHtml = `

<h2>Executive Field Activity</h2>

<table border="1" cellpadding="6" cellspacing="0" width="100%">

<tr>

<th>Executive</th>
<th>Activity</th>
<th>Time</th>
<th>Google Maps</th>

</tr>

`;

for (const log of locations) {

    const mapLink =
`https://www.google.com/maps?q=${log.latitude},${log.longitude}`;

    locationHtml += `

<tr>

<td>${log.executiveName}</td>

<td>${log.type}</td>

<td>${new Date(log.timestamp).toLocaleString("en-IN")}</td>

<td>

<a href="${mapLink}" target="_blank">

Open Location

</a>

</td>

</tr>

`;

}

locationHtml += `

</table>

`;

const reportData = {

    reportDate: today,

    executives: report.result,

    totals: report.totals,

    attendance,

    buyers: buyerStatus,

    properties: {
        total: properties.length,
        available,
        sold,
        token
    },

    visits: {
        total: visits.length,
        completed,
        scheduled,
        deals
    },

    hr: {
        usersAdded,
        usersModified,
        usersDeleted
    },

    fieldActivity: locations

};

const aiPrompt = promptTemplate.replace(
    "{{REPORT_DATA}}",
    JSON.stringify(reportData, null, 2)
);

let aiSummary = `
<div style="padding:12px;background:#fff3cd;border:1px solid #ffe69c;border-radius:6px;">
    <b>AI Executive Summary</b><br>
    The AI summary could not be generated for this report. The business report below contains the complete operational data.
</div>`;

try {

const aiResponse = await openai.chat.completions.create({

    model: process.env.OPENAI_MODEL,

    temperature: Number(process.env.OPENAI_TEMPERATURE),

    max_completion_tokens: Number(process.env.OPENAI_MAX_TOKENS),

    messages: [

        {
            role: "system",
            content: "You are an experienced business operations analyst."
        },

        {
            role: "user",
            content: aiPrompt
        }

    ]

});

aiSummary = marked(
    aiResponse.choices[0].message.content
);

const usage = aiResponse.usage || {};

await TenantAIUsage.create({

    tenantId,

    feature: "Daily Business Report",

    model: aiResponse.model,

    promptTokens:
        usage.prompt_tokens || 0,

    completionTokens:
        usage.completion_tokens || 0,

    totalTokens:
        usage.total_tokens || 0,

    reasoningTokens:
        usage.completion_tokens_details?.reasoning_tokens || 0,

    cachedTokens:
        usage.prompt_tokens_details?.cached_tokens || 0,

    cacheWriteTokens:
        usage.prompt_tokens_details?.cache_write_tokens || 0,

    acceptedPredictionTokens:
        usage.completion_tokens_details?.accepted_prediction_tokens || 0,

    rejectedPredictionTokens:
        usage.completion_tokens_details?.rejected_prediction_tokens || 0,

    requestCount: 1

});

}
catch(err){

    console.error(
        "AI Summary Error:",
        err.message
    );

}

const html = `

<h1>MyWorld Daily Business Report</h1>

<hr>

<h2>AI Executive Summary</h2>

<div style="background:#f7f7f7;
padding:15px;
border-radius:8px;">

${aiSummary}

</div>

<hr>


${attendanceHtml}

<br>

${performanceHtml}

<br>

${hrHtml}

<br>

${buyerHtml}

<br>

${propertyHtml}

<br>

${visitHtml}

<br>

${locationHtml}

<br>

<hr>

<p>
<b>Detailed Daily Timeline:</b> Attached as
<b>DailyTimeline.jsonl</b>.
</p>

`;

const recipient =
    tenant?.adminEmail ||
    tenant?.email;

if (!recipient) {
    throw new Error(
        `No email configured for tenant ${tenant.name}`
    );
}

await sendEmail(
    recipient,
    "MyWorld Daily Business Report",
    html,
    attachments
);

}

module.exports = {
    sendDailyBusinessReport
};