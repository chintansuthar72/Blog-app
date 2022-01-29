const jwt = require('jsonwebtoken');

module.exports = function(req,res,next){
    // const token = req.header('auth-token');
    const token = req.query.token;
    if(!token){
        res.status(401).send('Access denied!')
    } else {
        jwt.verify(token,process.env.TOKEN_SECRET,(err,decoded)=>{
            if(err){
                res.status(400).send("Invalid token!")
            } else {
                req.user = decoded;
                next();
            }
        })
    }
}