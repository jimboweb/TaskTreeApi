const express = require('express');
const passport = require('passport');
const Account = require('../models/Account');
const Branch = require('../models/Branch')
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', { });
});

const registerAccount = (req, res, next) => {
    Account.register(new Account({username: req.body.username}),
        req.body.password,
        function (err, account) {
            if (err) {
                return res.render('register', {account: account})
            }

            passport.authenticate('local')(req, res, function () {
                next();
            })
        })
};

const createUser  = (req,res) => {
    const user = {userName:req.user.username, accountId: req.user._id.toString(),email:'nobody@nowhere.com'};

    Branch.createUser(user,(err, user)=> {

        // check errors
        if(err) {
            console.log(err);
            throw err;
        }

        // carry on
        else {

        }
    });

    res.redirect('/');
}


router.post('/register',
    [registerAccount, createUser]);



router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/',
    failureRedirect: '/login' }));

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

module.exports = router;
