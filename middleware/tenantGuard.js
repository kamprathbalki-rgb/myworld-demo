module.exports = function(req,res,next){

if(!req.session.tenantId){
return res.redirect('/login')
}

next()

}