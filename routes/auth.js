const auth = {};
const express = require('express');
const passport = require('passport');


auth.checkAuthentication=(req,res,next)=>{
    if(req.isAuthenticated()){
        //req.isAuthenticated() will return true if user is logged in
        next();
    } else{
        res.redirect("/login");
    }
}

module.exports = auth;