const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const Candidate = require('../models/Candidate');

// ==========================================
// MULTER
// ==========================================

const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, 'data/resumes');
    },

    filename(req, file, cb) {

        const fileName =
            Date.now() +
            '-' +
            file.originalname.replace(/\s+/g, '_');

        cb(null, fileName);

    }

});

const upload = multer({ storage });

// ==========================================
// CANDIDATE LIST
// ==========================================

router.get('/', async (req, res) => {

    const candidates = await Candidate.find({

        tenantId: req.session.tenantId

    }).sort({

        createdAt: -1

    });

res.render('candidateList', {

    session: req.session,
    candidates,
    isAdmin: !!req.session.user

});

});

// ==========================================
// ADD CANDIDATE
// ==========================================

router.get('/add', (req, res) => {

    res.render('addCandidate', {

        session: req.session

    });

});

// ==========================================
// SAVE CANDIDATE
// ==========================================

router.post(
    '/add',
    upload.single('resume'),
    async (req, res) => {

        await Candidate.create({

            tenantId: req.session.tenantId,

            candidateName: req.body.candidateName,

            mobile: req.body.mobile,

            email: req.body.email,

            qualification: req.body.qualification,

            experience: Number(req.body.experience || 0),

            appliedFor: req.body.appliedFor,

            currentCompany: req.body.currentCompany,

            currentSalary: Number(req.body.currentSalary || 0),

            expectedSalary: Number(req.body.expectedSalary || 0),

            noticePeriod: req.body.noticePeriod,

            source: req.body.source,

            resumeStatus:
                req.file ? 'Uploaded' : 'Pending',

            resumeFile:
                req.file ? req.file.filename : '',

            interviewStatus:
                req.body.interviewStatus,

            remarks: req.body.remarks

        });

        res.redirect('/recruitment');

    }
);

// ==========================================
// EDIT
// ==========================================

router.get('/edit/:id', async (req, res) => {

    const candidate =
        await Candidate.findById(req.params.id);

    res.render('editCandidate', {

        session: req.session,

        candidate

    });

});

// ==========================================
// UPDATE
// ==========================================

router.post(
    '/update/:id',
    upload.single('resume'),
    async (req, res) => {

        const update = {

            candidateName: req.body.candidateName,

            mobile: req.body.mobile,

            email: req.body.email,

            qualification: req.body.qualification,

            experience: Number(req.body.experience || 0),

            appliedFor: req.body.appliedFor,

            currentCompany: req.body.currentCompany,

            currentSalary: Number(req.body.currentSalary || 0),

            expectedSalary: Number(req.body.expectedSalary || 0),

            noticePeriod: req.body.noticePeriod,

            source: req.body.source,

            interviewStatus: req.body.interviewStatus,

            remarks: req.body.remarks

        };

        if (req.file) {

            update.resumeFile = req.file.filename;

            update.resumeStatus = 'Uploaded';

        }

        await Candidate.findByIdAndUpdate(

            req.params.id,

            update

        );

        res.redirect('/recruitment');

    }
);

// ==========================================
// DOWNLOAD RESUME
// ==========================================

router.get('/download/:id', async (req, res) => {

    const candidate =
        await Candidate.findById(req.params.id);

    if (
        !candidate ||
        !candidate.resumeFile
    ) {

        return res.send('Resume not found');

    }

    res.download(

        path.join(
            __dirname,
            '..',
            'data',
            'resumes',
            candidate.resumeFile
        )

    );

});

// ==========================================
// DELETE
// ==========================================

router.get('/delete/:id', async (req, res) => {

    await Candidate.findByIdAndDelete(
        req.params.id
    );

    res.redirect('/recruitment');

});

module.exports = router;