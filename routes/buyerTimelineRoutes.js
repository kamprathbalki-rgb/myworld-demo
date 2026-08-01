const express = require('express');
const router = express.Router();

const fs = require('fs');
const path = require('path');

const Buyer = require('../models/Buyer');

function safeName(name) {

    return (name || 'buyer')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_');

}

function getIST() {

    return new Date().toLocaleString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }
    ) + ' IST';

}

function appendBuyerTimeline(
    buyer,
    userName,
    userRole,
    action,
    previous = '',
    current = ''
) {

    const folder = path.join(
        __dirname,
        '..',
        'data',
        'buyer',
        safeName(buyer.name)
    );

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    const file = path.join(folder, 'timeline.txt');

    let entry = '';

    entry += '========================================================\n';
    entry += `Timestamp : ${getIST()}\n`;
    entry += `User      : ${userName}\n`;
    entry += `Role      : ${userRole}\n`;
    entry += `Action    : ${action}\n`;
    entry += '--------------------------------------------------------\n';

if (action === 'Buyer Updated') {

    entry += 'Changes\n\n';

    // Structured input (Status : Old)
    if (
        String(previous).includes(':') &&
        String(current).includes(':')
    ) {

        const oldLines = String(previous).split('\n');
        const newLines = String(current).split('\n');

        for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {

            const oldLine = oldLines[i] || '';
            const newLine = newLines[i] || '';

            if (!oldLine && !newLine) continue;

            const field =
                (oldLine.split(':')[0] ||
                 newLine.split(':')[0]).trim();

            const oldValue =
                oldLine.split(':').slice(1).join(':').trim();

            const newValue =
                newLine.split(':').slice(1).join(':').trim();

            entry += `${field}\n`;
            entry += `   Old : ${oldValue || '-'}\n`;
            entry += `   New : ${newValue || '-'}\n\n`;
        }

    } else {

        // Simple values (old status, new status)

        entry += `Status\n`;
        entry += `   Old : ${previous || '-'}\n`;
        entry += `   New : ${current || '-'}\n\n`;

    }

} else {

    if (previous)
        entry += `Previous : ${previous}\n`;

    if (current)
        entry += `Current  : ${current}\n`;

}

    entry += '========================================================\n\n';

    fs.appendFileSync(file, entry);

}


router.get('/:id', async (req,res)=>{

    const buyer = await Buyer.findById(req.params.id);

    if(!buyer){

        return res.send('Buyer Not Found');

    }

    const folder = path.join(

        __dirname,
        '..',
        'data',
        'buyer',
        safeName(buyer.name)

    );

    const file = path.join(

        folder,
        'timeline.txt'

    );

    if(!fs.existsSync(folder)){

        fs.mkdirSync(folder,{recursive:true});

    }

    if(!fs.existsSync(file)){

        fs.writeFileSync(

            file,

`==========================================
Buyer Timeline
==========================================

Buyer : ${buyer.name}
Created : ${getIST()}

==========================================

`

        );

    }

    const timeline = fs.readFileSync(

        file,

        'utf8'

    );

    res.render(

        'buyerTimeline',

        {

            session:req.session,

            buyer,

            timeline

        }

    );

});

module.exports = {
    router,
    appendBuyerTimeline
};