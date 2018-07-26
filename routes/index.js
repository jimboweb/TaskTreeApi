// index.js
var express = require("express");
var bodyParser = require("body-parser");
var jwt = require("jwt-simple");
var auth = require("../auth/auth.js")();
var users = require("./users.js");
var cfg = require("../config.js");
const accountController = require('./account');

var app = express();

app.use(bodyParser.json());
app.use(auth.initialize());
app.use('/account',accountController);

app.get("/", function(req, res) {
    res.json({
        status: "My API is alive!"
    });
});

// app.get("/user", auth.authenticate(), function(req, res) {
//     res.json(users[req.user.id]);
// });


app.post("/token", function(req, res) {
    if (req.body.email && req.body.password) {
        var email = req.body.email;
        var password = req.body.password;
        var user = users.find(function(u) {
            return u.email === email && u.password === password;
        });
        if (user) {
            var payload = {
                id: user.id
            };
            var token = jwt.encode(payload, cfg.jwtSecret);
            res.json({
                token: token
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(401);
    }
});

// debug; list of routes
// app._router.stack.map((r)=>{
// if (r.route && r.route.path){
//     console.log(r.route.path)
// }
// });
module.exports = app;