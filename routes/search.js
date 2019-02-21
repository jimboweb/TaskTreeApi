const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');

router.post('/',verifyToken, async (req,res)=>{
    try {
        const types = req.body.types.map(typeString =>{return Branch.getParentType(typeString)});
        //todo 190220: try this and see if it works
        return Promise.all(types.map(type=>{
            return Branch.searchByString(type,req.body.string)
        })).reduce((accum,cur)=>accum.concat(cur))
            .sort((a,b)=>a.textScore-b.textScore);
    } catch(e) {
        res.status(500).send({err:`error in search:${e}`})
    }
 });