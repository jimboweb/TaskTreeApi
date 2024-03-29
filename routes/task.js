const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');

// language=JavaScript 1.8



/**
 * Add task to a category or parent
 * @param parentType 'Task' or 'Category'
 * @param req.params.parentId: the id of the parent
 * @return added task
 */
router.post('/:parentType/:parentId', verifyToken, async (req,res)=>{
    const parentId = req.params.parentId;
    const parentTypeString = req.params.parentType;
    try {
        const parentType = Branch.getParentType(parentTypeString);
        const result = await Branch.getParentByType(parentType,parentId)
        if (await Branch.verifyOwnership(parentType, parentId, req.userId)) {
            const parent = result;
            const task = req.body;
            task.accountId = req.userId;
            task.parent = parent._id;
            task.parentType = parentTypeString;
            task.completed = false;
            const tsk = await Branch.createTask(task)
            res.status(200).send(tsk);
        } else {
            res.status(403).send('You do not have access to that parent object');
        }
    } catch (e) {
        res.status(500).send({'err': `there was an error: ${e.message}`})
    }

});

router.get('/',verifyToken, async (req,res)=>{
    try {
        const tasks = await Branch.getAllTasks(req.userId);

        res.status(200).send(tasks);
    } catch (err) {
        res.status(500).send({'err':`There was a problem getting the tasks: ${err.message}`})
    }})


/**
 * Get task with only its children's ids
 * @param req.params.taskId: the id of task to get
 * @return task and all subtasks or error
 */
router.get('/:taskId', verifyToken, async (req,res)=>{
    const taskId = req.params.taskId;
    try {
        if (await Branch.verifyOwnership(Branch.Task, taskId, req.userId)) {
            const task = await Branch.getTask(taskId);
            res.status(200).send(task);
        } else {
            res.status(403).send({"err": "You are not authorized to get that task"});
        }
    } catch(err){
        res.status(500).send({'err': `error retrieving task: ${err.message}`});
    }

})

/**
 * Get task and subtasks recursively
 * @param req.params.taskId: the id of task to get
 * @return task and all subtasks or error
 */
router.get('/r/:taskId', verifyToken, async (req,res)=>{
    const taskId = req.params.taskId;
    try {
        if (await Branch.verifyOwnership(Branch.Task, taskId, req.userId)) {
            const task = await Branch.getTaskRecursive(taskId);
            res.status(200).send(task);
        } else {
            res.status(403).send({"err": "You are not authorized to get that task"});
        }
    } catch(err){
        res.status(500).send({'err': `error retrieving task: ${err.message}`});
    }

})


/**
 * Delete task and all subtasks recursively
 * @param req.params.id: id of task to delete
 * @return the deleted task or error
 */
router.delete('/:id', verifyToken, async (req,res)=>{
    const taskId = req.params.id;
    try {
        if (!await Branch.verifyOwnership(Branch.Task, taskId, req.userId)) {
            res.status(403).send({"err": "You are not authorized to delete that task"});
        } else {
            const deletedTask = await Branch.deleteTaskRecursive(taskId);
            res.status(200).send(deletedTask);
        }
    } catch (err) {
        res.status(500).send({'err': `error deleting task: ${err.message}`});
    }

});

//fixme 190304: delete and rebase leaves stubs in parents and doesn't rebase. part of that may be from UI
//see ui taskList.js line 32
/**
 * delete task and rebase children to new parent
 * @param id: id of task to delete
 * @param newParentType: type of new parent
 * @param newParentId: id of new parent
 * @return deleted task;
 */
router.delete('/:id/:newParentType/:newParentId', verifyToken, async(req,res)=>{
    const taskId = req.params.id;
    const newParentTypeString = req.params.newParentType;
    const newParentId = req.params.newParentId;
    try {
        if (await Branch.verifyOwnership(Branch.Task, taskId, req.userId)) {
            const newParentType = Branch.getParentType(newParentTypeString);
            const deletedTask = await Branch.deleteTaskAndRebaseChildren(taskId, newParentType, newParentId);
            res.status(200).send(deletedTask);
        } else {
            res.status(403).send({"err": "You are not authorized to delete that task"});
        }
    } catch (err) {
        res.status(500).send('error deleting task ' + err.message);
    }
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
    try {
        if (await Branch.verifyOwnership(Branch.Task, taskId, req.userId)) {
            const updatedTask = await Branch.updateTask(taskId, update);
            if (updatedTask.err) {
                res.status(500).send({"err": "error updating task" + updatedTask.err});
            }
            res.status(200).send(updatedTask);
        } else {
            res.status(403).send({"err": "You are not authorized to modify that task"})
        }
    }catch (e) {
        res.status(500).send('error updating category' + e.message);
    }
});

/**
 * Patch verb is currently only used to rebase an object. The body should contain the
 * new parent type and new parentId. Per PATCH convention, changed values will be a single
 * item in an array, as in:
 * [{'parentType':'Category', 'parentId':[id value]}]
 */
router.patch('/:taskId', verifyToken, async(req,res)=>{
    try{
        const rebaseInstructionsArray = req.body;
        if(rebaseInstructionsArray instanceof Array && rebaseInstructionsArray.length===1){
            const rebaseInstructions = rebaseInstructionsArray[0];
            if(rebaseInstructions.parentType && rebaseInstructions.parentId){
                const newParentType = Branch.getParentType(rebaseInstructions.parentType);
                const newParentId = rebaseInstructions.parentId;
                const taskToRebase = await Branch.getTask(req.params.taskId);
                const parentType = Branch.getParentType(taskToRebase.parentType);
                const newParent = await Branch.getParentByType(newParentType,newParentId)
                const rebasedChild = await Branch.rebaseChild(Branch.Task,newParentType, taskToRebase,newParent,false);
                res.status(200).send(rebasedChild);
            } else {
                res.status(500).send({'err':'Patch verb currently is only used in this API for rebasing to new parent. ' +
                    'To modify an object, send the whole modified object using the PUT verb.'})
            }
        } else {
            res.status(500).send({'err':'please send patch rebase instructions as an array with one item'})
        }
    }catch (e) {
        res.status(500).send({'err':'error rebasing task' + e.message});
    }
});




module.exports=router;
