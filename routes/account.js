const express = require('express');
const passport = require('passport');
const Account = require('../models/Account');
const Branch = require('../models/Branch')
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

const createUser  = (req,res) => {
    const user = {userName:req.user.username, accountId: req.user._id.toString(),email:req.email};

    Branch.createUser(user,(err, user)=> {

        // check errors
        if(err) {
            console.log(err);
            throw err;
        }

        // carry on
        else {
            //TODO 07/25/18: create and return a token
            res.json(user);
        }
    });
    
}


router.post('/register',
    registerAccount,
    createUser);



router.get('/login', function(req, res) {
    res.json(user);
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
router.stack.map((r)=>{
    if (r.route && r.route.path){
        console.log(r.route.path);
    }

});

module.exports=router;