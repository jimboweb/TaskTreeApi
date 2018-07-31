const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');

//TODO 180729:
// create '/' get route to get all categories
// '/:id' GET route for specific category
// '/:id' PUT route to update category
// '/:id' DELETE route
// (maybe get rid of 'add' in route since post is automatically add)

/**
 * body of request should be category as json object
 * don't forget 'Content-Type':'application/json'!!
 */
router.post('/',verifyToken,userController.getUserByAccountId,(req,res, next)=>{
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

router.get('/',verifyToken,(req,res)=>{
    Branch.getAllCategories(req.userId, (err,cats)=>{
        if(err){
            res.status(500).send("Can't get categories. Error: \n" + err);
        }
        res.status(200).send(cats);
    });

});

module.exports=router;