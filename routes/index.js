// index.js
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.get("/", function(req, res) {
    res.json({
        status: "My API is alive!"
    });
});

app.listen(port, function() {
    console.log("My API is running...");
});

module.exports = app;  