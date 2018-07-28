const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');

router.post('/add',verifyToken,(req,res, next)=>{

});