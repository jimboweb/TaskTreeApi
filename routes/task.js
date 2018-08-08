const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');

/**
 * Get category recursive with tasks and subtasks etc.
 */
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

/**
 * TODO 180807: use getTaskRecursive here
 */
router.get('/:taskId', verifyToken, (req,res)=>{
    const taskId = req.params.taskId;
    Branch.getTask(taskId, (err,task)=>{
        if(err){
            res.status(500).send("Error retrieving task: " + err);
        }
        if(!Permissions.checkObjectPermissions(task.accountId,req.userId)){
            res.status(403).send('You do not have access to that task object');
        }
        res.status(200).send(task);
    })
})

/**
 * TODO 180807: need a recursive method and an option to move subtasks up to parent
 */
router.delete('/:taskId', verifyToken, (req,res)=>{
    const taskId = req.params.taskId;
    Branch.getTask(taskId,(err, task)=>{
        if(!Permissions.checkObjectPermissions(task.accountId,req.userId)){
            res.status(403).send('You do not have access to that task object');
        } else {
            Branch.deleteTask(taskId,(err, deletedTask)=>{
                if(err){
                    res.status(500).send('Error deleting task: ' + err)
                }
                res.status(200).send(deletedTask);
            })
        }

    })
})


/**
 * This method is not for adding subtasks, events or notes; they'll be added in the create
 * method. Only for changing top-level properties.
 */
router.put('/:taskId', verifyToken, (req,res)=>{
    const taskId = req.params.taskId;
    const update = req.body;
    Branch.getTask(taskId,(err, task)=>{
        if(!Permissions.checkObjectPermissions(task.accountId,req.userId)){
            res.status(403).send('You do not have access to that task object');
        } else {
            Branch.updateTask(taskId,update(err, updatedTask)=>{
                if(err){
                    res.status(500).send('Error deleting task: ' + err)
                }
                res.status(200).send(updatedTask);
            })
        }

    })
})


module.exports=router;