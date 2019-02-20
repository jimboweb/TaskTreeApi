const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');

router.post('/',verifyToken, async (req,res)=>{
    try {
        const types = req.body.types.map(typeString =>{return Branch.getParentType(typeString)});
        //fixme 190220: this isn't quite right it'll return an array of arrays. need to get the score, append then sort
        return types.map(type=>{
            return Branch.searchByString(type,req.body.string)
        })
    } catch(e) {
        res.status(500).send({err:`error in search:${e}`})
    }
 });