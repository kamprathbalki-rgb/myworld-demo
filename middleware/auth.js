function isLoggedIn(req, res, next) {

    if (req.session.user || req.session.executiveId) {
        return next();
    }

    return res.redirect('/login');
}

function isAdmin(req, res, next) {

    if (req.session.user?.role === 'admin') {
        return next();
    }

    if (req.session.executiveType === 'HR') {
        return next();
    }

    return res.send("Access Denied");

}

function isExecutive(req,res,next){

if(req.session.user.role !== 'executive'){
return res.send("Access Denied")
}

next()

}

const isSaasAdmin =
(req, res, next) => {

if (
    req.session.user &&
    req.session.user.role ===
    'saasadmin'
) {
    return next();
}

return res.redirect(
    '/dashboard'
);

}

module.exports = { isLoggedIn,isAdmin,isExecutive,isSaasAdmin }