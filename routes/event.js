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
    }
    const event = await Branch.getEvent(eventId, err=>{
        res.status(500).send({"err":`error retrieving event: ${err}`});
    });
    res.status(200).send(event);
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
    if(!(await Branch.verifyOwnership(parentFunction,parentId))){
        res.status(403).send({'err':'you are not authorized to add to that parent'});
    }

    try {
        const parent = await Branch.getParent(parentFunction,parentId);
        const event = await Branch.createEvent(newEvent,err=>{
            res.status(403).send({"err":`error creating event: ${err.message}`});
        });
        parent.events.push(event);
        await Branch.updateParent(parentFunction, parentId, parent);
        res.status(200).send(event);
    } catch(err) {
        res.status(500).send({'err':`error creating event: ${err.message}`});
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
    }
    try{
        const deletedEvent = await Branch.deleteEvent(eventId);
        const parentId = deletedEvent.parentId;
        const parentType = deletedEvent.parentType;
        const updatedParent = Branch.getParent(parentType,parentId);
        const eventIndex = updatedParent.Events.indexOf(deletedEvent._id);
        if(eventIndex === -1){
            throw new Error("event was not included in its parent");
        }
        updatedParent.events.splice(eventIndex);
        await Branch.updateParent(parentType,parentId,updatedParent);
        res.status(200).send(deletedEvent);
    } catch(err) {
        res.status(500).send({'err':`error deleting event: ${err.message}`});
    }
})

module.exports=router;