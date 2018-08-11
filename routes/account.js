const express = require('express');
const passport = require('passport');
const Account = require('../models/Account');
const Branch = require('../models/Branch');
const config = require('../config');
var jwt = require('jsonwebtoken');
// var bcrypt = require('bcryptjs');
const router = express.Router({mergeParams: true});

/**
 * Creates user account on registration
 * @param req
 * @param res
 * @param next
 */
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

/**
 * creates 'user' object which is separate from the account but refers
 * to the account with a userId. user account is the root of the tree.
 * also will create a default 'uncategorized' categorry from which all tasks
 * and events will descend unless you create another one. responds with
 * the token.
 * @param req
 * @param res
 * @param next
 */
const createUser  = (req,res, next) => {
    const user = {userName:req.user.username, accountId: req.user._id.toString(),email:req.body.email};

    Branch.createUser(user,(err, user)=> {

        // check errors
        if(err) {
            console.log(err);
            throw err;
        }

        // creates the token and returns it to the user
        else {
            const token = jwt.sign({id: user._id}, config.jwtSecret, {
                expiresIn: 3600 // expires in 1 hour
            });//getToken(user);
            res.status(200).send({auth: true, token: token});
        }
    });

};

/**
 * creates a token from the user
 * @param user
 * @returns the token
 */
const getToken=(user)=>{
        return jwt.sign({id: user._id}, config.jwtSecret, {
            expiresIn: 3600 // expires in 1 hour
        });
};


router.post('/register',
    registerAccount,
    createUser);


/**
 * If login works, responds with a token
 */
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

    //TODO later: fix the logout so we invalidate the token somehow. alternately do a toeken-refresh thing.
/**
 * Logout doesn't really do anything now; should delete the token. logout
 * should probably just be done on the ui side. tokens will be short-lived
 * so they are hard to abuse.
 */
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

//debug list of routes
// router.stack.map((r)=>{
//     if (r.route && r.route.path){
//         console.log(r.route.path);
//     }
//
// });

module.exports=router;