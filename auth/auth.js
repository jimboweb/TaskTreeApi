// auth.js
var passport = require("passport");
var passportJWT = require("passport-jwt");
var users = require("../routes/user.js");
var cfg = require("../config.js");
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var params = {
    secretOrKey: cfg.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

module.exports = () => {
    var strategy = new Strategy(params, function(payload, done) {
        var user = users[payload.id] || null;
        if (user) {
            return done(null, {
                id: user.id
            });
        } else {
            return done(new Error("User not found"), null);
        }
    });
    passport.use(strategy);
    return {
        initialize: () => passport.initialize(),
        authenticate: () => passport.authenticate("jwt", cfg.jwtSession),
        checkAuthentication:(req,res,next)=>{
            if(req.isAuthenticated()){
                //req.isAuthenticated() will return true if user is logged in
                next();
            } else{
                res.redirect("/login");
            }
        }
    };
};