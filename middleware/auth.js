function isLoggedIn(req,res,next){

if(!req.session.user){
return res.redirect('/login')
}

next()

}

function isAdmin(req,res,next){

if(req.session.user.role !== 'admin'){
return res.send("Access Denied")
}

next()

}

function isExecutive(req,res,next){

if(req.session.user.role !== 'executive'){
return res.send("Access Denied")
}

next()

}

module.exports = { isLoggedIn,isAdmin,isExecutive }