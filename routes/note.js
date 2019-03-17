const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');
const httpUtils = require('../utility/httpUtil');

/**
 * create note attached to event or task
 * @param parentType 'event' or 'task'
 * @param parentId the parent of the new note
 * @param body: the json of the note
 * @return the new note
 */
router.post('/:parentType/:parentId', verifyToken,  async (req,res)=>{
    const parentFunction = Branch.getParentType(req.params.parentType)
    const parentId = req.params.parentId;
    const newNote = req.body;
    if(!parentFunction){
        res.status(500).send({'err':`${parentFunction} is not a valid parent type`});
    }
    if(!(await Branch.verifyOwnership(parentFunction,parentId, req.userId))) {
        res.status(403).send({'err': 'you are not authorized to add to that parent'});
    }else {
        try {
            const parent = await Branch.getParentByType(parentFunction, parentId);
            newNote.accountId = req.userId;
            newNote.parent = parent._id;
            newNote.parentType = req.params.parentType;
            const note = await Branch.createNote(newNote);
            parent.notes.push(note._id);
            await Branch.updateParent(parentFunction, parentId, parent);
            res.status(200).send(note);
        } catch (err) {
            res.status(500).send({'err': `error creating note: ${err.message}`});
        }
    }
});

/**
 * get note by id
 * @param id: the id of the note to get
 * @return the note
 */
router.get('/:id', verifyToken,  async (req,res)=>{
    const id = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Note,id))){
        res.status(403).send({'err':'you are not authorized to retrieve that note'});
    } else {
        try {
            const note = await Branch.getNote(id);
            res.status(200).send(note);
        } catch (err) {
            res.status(500).send('there was an error retrieving that note: ' + err.message)
        }
    }
});

router.delete('/:id', verifyToken,  async (req, res)=>{
    const id = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Note,id, req.userId))){
        res.status(403).send({'err':'you are not authorized to delete that note'});
    } else { //TODO 180819: add this `else` to all the other verifyOwnership or it'll still go ahead and do the action wtihout permission
        try {
            const deletedNote = await Branch.deleteNote(id);
            const parentId = deletedNote.parent.toString();
            const parentType = Branch.getParentType(deletedNote.parentType);
            const originalParent = await Branch.getParentByType(parentType, parentId);
            const updatedNotes = originalParent.notes.filter(id=>id.toString()!==deletedNote._id.toString());
            const updatedParent = Object.assign(originalParent, {tasks:updatedNotes});
            await Branch.updateParent(parentType, parentId, updatedParent);
            res.status(200).send(deletedNote);
        } catch (err) {
            res.status(500).send({'err':'there was an error deleting that note: ' + err.message})
        }
    }
});

router.put('/:id', verifyToken,  async (req,res)=>{
    const id = req.params.id;
    const newNote = req.body;
    if(!(await Branch.verifyOwnership(Branch.Note,id))){
        res.status(403).send({'err':'you are not authorized to modify that note'});
    }
    else {
        try {
            const note = await Branch.updateNote(id, newNote);
            res.status(200).send(note);
        } catch (err) {
            res.status(500).send('there was an error retrieving that note: ' + err.message)
        }
    }

});
module.exports=router;