const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');

// language=JavaScript 1.8
/**
 * Add task to a category or parent
 * @parentType 'Task' or 'Category'
 * @param req.params.parentId: the id of the parent
 * @return added task
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
 * Get task and subtasks recursively
 * @param req.params.taskId: the id of task to get
 * @return task and all subtasks or error
 */
router.get('/:taskId', verifyToken, async (req,res)=>{
    const taskId = req.params.taskId;
    if(!(await Branch.verifyOwnership(Branch.Task,taskId,req.userId))) {
        res.status(403).send({"err": "You are not authorized to get that task"});
    }
    const task = await Branch.getTaskRecursive(taskId);
    if(task.err){
        res.status(500).send({"err":task.err});
    }
    res.status(200).send(task);
})

/**
 * Delete task and all subtasks recursively
 * @param req.params.id: id of task to delte
 * @return the deleted task or error
 * TODO 180810: delete index from parent
 */
router.delete('/:id', verifyToken, async (req,res)=>{
    const taskId = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Task,taskId,req.userId))){
        res.status(403).send({"err":"You are not authorized to delete that task"});
    }
    const deletedTask = await Branch.deleteTaskRecursive(taskId);
    if(deletedTask.err){
        res.status(500).send({"err":"error deleting task" + deletedTask.err});
    }
    res.status(200).send(deletedTask);
});




/**
 * Modify parent-level elements of categroy.
 * @param req.params.id: the id of the category to update
 * @param req.body: the json of the updated category
 * @return the updated category
 */
router.put('/:taskId', verifyToken, async (req,res)=>{
    const taskId = req.params.taskId;
    const update = req.body;
    if(!(await Branch.verifyOwnership(Branch.Task, taskId,req.userId))){
        res.status(403).send({"err":"You are not authorized to modify that task"})
    }
    const updatedTask = await Branch.updateTask(taskId,update);
    if(updatedTask.err){
        res.status(500).send({"err":"error updating task" + updatedTask.err});
    }
    res.status(200).send(updatedTask);
})


module.exports=router;