const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const Branch = require('../models/Branch');


/**
 * get event by id
 * @param req.params.id: id of event
 * @return the event
 */
router.get(':/id', verifyToken, async (req,res)=>{
    const eventId = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Event,eventId))){
        res.status(403).send({"err":"You are not authorized to get that event"});
    } else {
        const event = await Branch.getEvent(eventId, err => {
            res.status(500).send({"err": `error retrieving event: ${err}`});
        });
        res.status(200).send(event);
    }
});


/**
 * Creates event and adds to task or category
 * @param req.params.parentType: 'Task' or 'Category'
 * @param req.params.parentId: id of parent
 * @return created event
 */
router.post('/:parentType/:parentId', verifyToken, async (req,res)=>{
    const parentFunction = Branch.getParentType(req.params.parentType)
    const parentId = req.params.parentId;
    const newEvent = req.body;
    if(!parentFunction){
        res.status(500).send({'err':`${parentFunction} is not a valid parent type`});
    }
    if(!(await Branch.verifyOwnership(parentFunction,parentId, req.userId))){
        res.status(403).send({'err':'you are not authorized to add to that parent'});
    }
    else {
        try {
            const parent = await Branch.getParentByType(parentFunction, parentId);
            newEvent.accountId = req.userId;
            newEvent.parent = parent._id;
            newEvent.parentType = req.params.parentType;
            const event = await Branch.createEvent(newEvent);
            parent.events.push(event._id);
            await Branch.updateParent(parentFunction, parentId, parent);
            res.status(200).send(event);
        } catch (err) {
            res.status(500).send({'err': `error creating event: ${err.message}`});
        }
    }
});

/**
 * delete event and remove its index from parent
 * @param req.params.id: id of event to delete
 * @return deleted event
 */
router.delete('/:id', verifyToken, async (req,res)=>{
    const eventId = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Event, eventId,req.userId))){
        res.status(403).send({'err':'You are not authorized to delete that event'});
    } else {
        try {
            const deletedEvent = await Branch.deleteEvent(eventId);
            const parentId = deletedEvent.parentId;
            const parentType = deletedEvent.parentType;
            const updatedParent = Branch.getParentByType(parentType, parentId);
            const eventIndex = updatedParent.events.indexOf(deletedEvent._id);
            if (eventIndex === -1) {
                throw new Error("event was not included in its parent");
            }
            updatedParent.events.splice(eventIndex);
            await Branch.updateParent(parentType, parentId, updatedParent);
            res.status(200).send(deletedEvent);
        } catch (err) {
            res.status(500).send({'err': `error deleting event: ${err.message}`});
        }
    }
})

/**
 * Patch verb is currently only used to rebase an object. The body should contain the
 * new parent type and new parentId. Per PATCH convention, changed values will be a single
 * item in an array, as in:
 * [{'parentType':'Category', 'parentId':[id value]}]
 */
router.patch('/:eventId', verifyToken, async(req,res)=>{
    try{
        const rebaseInstructionsArray = req.body;
        if(rebaseInstructionsArray.type===Array && rebaseInstructionsArray.length===1){
            const rebaseInstructions = rebaseInstructionsArray[0];
            if(rebaseInstructions.parentType && rebaseInstructions.parentId){
                const newParentType = Branch.getParentType(rebaseInstructions.parentType);
                const newParentId = rebaseInstructions.parentId;
                const eventToRebase = await Branch.getEvent(req.params.eventId);
                const parentType = Branch.getParentType(eventToRebase.parentType);
                const newParent = await Branch.getParentByString(newParentType,newParentId)
                const rebasedChild = await Branch.rebaseChild(Branch.Event,parentType, eventToRebase,newParent,false);
                res.status(200).send(rebasedChild);
            } else {
                res.status(500).send({'err':'Patch verb currently is only used in this API for rebasing to new parent. ' +
                    'To modify an object, send the whole modified object using the PUT verb.'})
            }
        } else {
            res.status(500).send({'err':'please send patch rebase instructions as an array with one item'})
        }
    }catch (e) {
        res.status(500).send('error rebasing event' + e.message);
    }
})


module.exports=router;