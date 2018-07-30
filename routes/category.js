const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');



/**
 * body of request should be category as json object
 * don't forget 'Content-Type':'application/json'!!
 */
router.post('/add',verifyToken,userController.getUserByAccountId,(req,res, next)=>{
    const category = req.body;
    category.accountId = req.userObj.accountId;
    Branch.createCategory(category,(err,cat)=>{
        if(err){
            res.status(500).send(err);
        }
        const userObj = req.userObj;
        userObj.categories.push(cat);
        Branch.updateUser(userObj.accountId,userObj,(err,usr)=>{
            if(err){
                res.status(500).send(err);
            }
            res.status(200).send(cat);
        });
    });
});

module.exports=router;