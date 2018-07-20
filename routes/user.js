const express = require('express');
const auth = require('./auth.js')
const User = require('../models/Branch')
const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
    res.send('respond with a resource');
});

router.post('/create',auth.checkAuthentication, (req, res) => {
    const user = req.body;

    User.create(user, function(err, user) {

        // check errors
        if(err) {
            console.log(err);
            throw err;
        }

        // carry on
        else {
            // send response
            res.json(user);
        }
    });
});



module.exports = router;
