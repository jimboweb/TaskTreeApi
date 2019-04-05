const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');

router.post('/',verifyToken, async (req,res)=>{
    try {
        const types = req.body.types.map(typeString =>{return Branch.getParentType(typeString)});
        const results = await Promise.all(types.map(type=>{
            return Branch.searchByString(type,req.body.string)})
        )
            res.status(200).send(results.reduce((accum,curr)=>accum.concat(curr))
            .sort((a,b)=>a.score-b.score));
    } catch(e) {
        res.status(500).send({err:`error in search:${e}`})
    }
 });

module.exports = router;