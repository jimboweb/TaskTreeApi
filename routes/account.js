const express = require('express');
const passport = require('passport');
const Account = require('../models/Account');
const Branch = require('../models/Branch');
const config = require('../config');
var jwt = require('jsonwebtoken');
// var bcrypt = require('bcryptjs');
const router = express.Router({mergeParams: true});


const registerAccount = (req, res, next) => {
    Account.register(new Account({username: req.body.username, email:req.body.email}),
        req.body.password,
        function (err, account) {
            if (err) {
                return res.json(account);
            }

            passport.authenticate('local')(req, res, function () {
                next();
            })
        })
};

const createUser  = (req,res, next) => {
    const user = {userName:req.user.username, accountId: req.user._id.toString(),email:req.body.email};

    Branch.createUser(user,(err, user)=> {

        // check errors
        if(err) {
            console.log(err);
            throw err;
        }

        // carry on
        else {
            const token = jwt.sign({id: user._id}, config.jwtSecret, {
                expiresIn: 3600 // expires in 1 hour
            });//getToken(user);
            res.status(200).send({auth: true, token: token});
        }
    });

};

const getToken=(user)=>{
        return jwt.sign({id: user._id}, config.jwtSecret, {
            expiresIn: 3600 // expires in 1 hour
        });
};


router.post('/register',
    registerAccount,
    createUser);




router.post('/login', (req,res,next)=>{passport.authenticate('local', (err, user) => {
    //TODO 180726 make error and unauthorized login redirects something better
    if (err) {
        res.status(503).send("There was an error");
    }
    if (!user) {
        res.status(401).send("unauthorized login");
    }
    const token = getToken(user);
    res.status(200).send({auth: true, token: token});
})(req, res, next);
});

    //TODO later: fix the logout so we invalidate the token somehow
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});
router.stack.map((r)=>{
    if (r.route && r.route.path){
        console.log(r.route.path);
    }

});

module.exports=router;