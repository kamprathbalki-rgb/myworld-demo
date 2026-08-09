const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const Executive = require('../models/Executive');
const ExecutiveAttendance = require('../models/ExecutiveAttendance');

const { appendDailyLog } = require('../services/dailyLogService');

router.get('/login', (req, res) => {
    res.render('hrLogin');
});

router.post('/login', async (req, res) => {

console.log("===== HR LOGIN =====");
console.log("RAW EMAIL:", req.body.email);

const email = (req.body.email || "").trim().toLowerCase();

console.log("NORMALIZED EMAIL:", email);

const hr = await Executive.findOne({
    email: email,
    executiveType: "HR",
    isActive: true
});

console.log("HR FOUND:", hr ? hr.name : "NOT FOUND");


if (!hr) {
    return res.send('HR NOT FOUND');
}

const valid = await bcrypt.compare(
    req.body.password,
    hr.password
);

if (!valid) {
    return res.send('PASSWORD MISMATCH');
}

    req.session.executiveId = hr._id;
    req.session.executiveName = hr.name;
    req.session.tenantId = hr.tenantId;
    req.session.executiveType = 'HR';

appendDailyLog(

    hr.tenantId,

    `${hr.name} logged in`

);

    return res.redirect('/hr/dashboard');
});

router.get('/dashboard', async (req, res) => {

    if (
        !req.session.executiveId ||
        req.session.executiveType !== 'HR'
    ) {
        return res.redirect('/hr/login');
    }

    const employeeCount =
        await Executive.countDocuments({
            tenantId: req.session.tenantId
        });

    const attendanceToday =
        await ExecutiveAttendance.countDocuments({
            tenantId: req.session.tenantId,
            date: new Date().toISOString().slice(0, 10)
        });

    res.render('hrDashboard', {
        hrName: req.session.executiveName,
        employeeCount,
        attendanceToday
    });

});

// ==========================================
// HR - EMPLOYEE LIST
// ==========================================

router.get('/employees', (req, res) => {
    return res.redirect('/executive/list');
});


// ==========================================
// HR - TODAY'S ATTENDANCE
// ==========================================

router.get('/attendance', (req, res) => {
    return res.redirect('/attendance/admin');
});


// ==========================================
// HR - ATTENDANCE REPORT
// ==========================================


router.get('/logout', (req, res) => {

    appendDailyLog(

        req.session.tenantId,

        `${req.session.executiveName} logged out`

    );

    req.session.destroy(err => {

        if (err) {
            return res.redirect('/hr/dashboard');
        }

        res.clearCookie('connect.sid');

        res.redirect('/hr/login');

    });

});

// EMPLOYEES
router.get('/employees', (req, res) => {
    return res.redirect('/executive/list');
});

// ADD EMPLOYEE
router.get('/executive/add', (req, res) => {
    return res.redirect('/executive/add');
});

router.post('/executive/add', (req, res) => {
    return res.redirect(307, '/executive/add');
});

// EDIT EMPLOYEE
router.get('/executive/edit/:id', (req, res) => {
    return res.redirect('/executive/edit/' + req.params.id);
});

router.post('/executive/edit/:id', (req, res) => {
    return res.redirect(307, '/executive/edit/' + req.params.id);
});

// EXECUTIVE STATUS
router.get('/executive-status', (req, res) => {
    return res.redirect('/dashboard/executive-status');
});

// ATTENDANCE
router.get('/attendance', (req, res) => {
    return res.redirect('/attendance/admin');
});

// ATTENDANCE LOG
router.get('/attendance/log/:id', (req, res) => {
    return res.redirect('/attendance/log/' + req.params.id);
});

// DAILY ROUTE REPORT
router.get('/daily-route-report', (req,res)=>{
    return res.send('Not implemented');
});

// GPS ACTIVITY LOG
router.get('/gps-log', (req,res)=>{
    return res.send('Open Attendance → View Route');
});

// CHANGE PASSWORD
router.get('/change-password', (req, res) => {
    return res.redirect('/change-password');
});

router.post('/change-password', (req, res) => {
    return res.redirect(307, '/change-password');
});

router.get('/attendance/route-report/:id', (req,res)=>{
    return res.redirect('/attendance/route-report/' + req.params.id);
});

router.get('/attendance/log/:id', (req,res)=>{
    return res.redirect('/attendance/log/' + req.params.id);
});

module.exports = router;