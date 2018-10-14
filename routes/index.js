// index.js
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jwt-simple");
const auth = require("../auth/auth.js")();
const users = require("./user.js");
const cfg = require("../config.js");
const accountController = require('./account');
const httpUtils = require('../utility/httpUtil');
const cors = require('cors');
const app = express();
app.use(cors(httpUtils.corsOptions));
app.options('*', cors());
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


app.post("/token",  function(req, res) {
    if (req.body.email && req.body.password) {
        const email = req.body.email;
        const password = req.body.password;
        const user = users.find(function(u) {
            return u.email === email && u.password === password;
        });
        if (user) {
            const payload = {
                id: user.id
            };
            const token = jwt.encode(payload, cfg.jwtSecret);
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