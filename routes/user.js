const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch')

// /* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });

router.get('/',(req,res)=>{
    res.status(200).send("user controller working")
})

router.get('/:userId', verifyToken, function(req, res) {
    const userId = req.params.userId;
    Branch.getUser(userId, function (err, user) {
        if (err) return res.status(500).send("There was a problem finding the user.");
        if (!user) return res.status(404).send("No user found.");

        res.status(200).send(user);
    });

});

module.exports = router;

// // user.js
// // Fake list of users to be used in the authentication
// var users = [{
//     id: 1,
//     name: "John",
//     email: "john@mail.com",
//     password: "john123"
// }, {
//     id: 2,
//     name: "Sarah",
//     email: "sarah@mail.com",
//     password: "sarah123"
// }];
//
// module.exports = users;