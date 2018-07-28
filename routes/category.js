const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');


/**
 * body of request should be category as json object
 */
router.post('/add',verifyToken,userController.getUserByAccountId,(req,res, next)=>{
    const category = req.body;
    Branch.createCategory(category,(err,cat)=>{
        if(err){
            res.status(500).send(err);
        }
        req.userObj.categories.push(category);
        Branch.updateUser(req.userObj.accountId,req.userObj,(err,usr)=>{
            if(err){
                res.status(500).send(err);
            }
        });
    });
});

module.exports=router;