const { sendWhatsApp } =
require("./whatsappService");

const ADMIN_MOBILE =
process.env.ADMIN_MOBILE;

async function notifyAdmin(message){

    try{

        if(!ADMIN_MOBILE) return;

await sendWhatsApp(
    ADMIN_MOBILE,
    message
);

    }catch(err){

        console.log(
            "ADMIN WHATSAPP:",
            err.message
        );

    }

}

module.exports = notifyAdmin;