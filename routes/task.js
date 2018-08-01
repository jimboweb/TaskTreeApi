const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');

router.post('/:parentType/:parentId', verifyToken, (req,res)=>{
    const parentId = req.params.parentId;
    const parentType = req.params.parentType;
    Branch.getParent(parentType,parentId).then((result)=>{
        if(!Permissions.checkObjectPermissions(result.accountId,req.userId)){
            res.status(403).send('You do not have access to that parent object');
        }
        const parent = result;
        const task = req.body;
        task.accountId=req.userId;
        task.parent = parent._id;
        Branch.createTask(task,(err,tsk)=>{
            if(err){
                res.status(500).send("Error creating task: " + err );
            }
            parent.tasks.push(tsk._id);
            Branch.updateParent(parentType, parentId, parent).then((prnt)=>{
                res.status(200).send(tsk);
            })
        })
    }, (error)=>{
        res.status(500).send(error);
    })
});



module.exports=router;