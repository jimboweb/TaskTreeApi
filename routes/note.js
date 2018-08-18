const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');

/**
 * create note attached to event or task
 * @param parentType 'event' or 'task'
 * @param parentId the parent of the new note
 * @param body: the json of the note
 * @return the new note
 */
router.post('/:parentType/:parentId', verifyToken, async (req,res)=>{
    const parentFunction = Branch.getParentType(req.params.parentType)
    const parentId = req.params.parentId;
    const newNote = req.body;
    if(!parentFunction){
        res.status(500).send({'err':`${parentFunction} is not a valid parent type`});
    }
    if(!(await Branch.verifyOwnership(parentFunction,parentId, req.userId))){
        res.status(403).send({'err':'you are not authorized to add to that parent'});
    }

    try {
        const parent = await Branch.getParentByType(parentFunction,parentId);
        const note = await Branch.createNote(newNote);
        note.accountId=req.userId;
        note.parent = parent._id;
        note.parentType = req.params.parentType;
        parent.notes.push(note._id);
        await Branch.updateParent(parentFunction, parentId, parent);
        res.status(200).send(note);
    } catch(err) {
        res.status(500).send({'err':`error creating note: ${err.message}`});
    }
});

/**
 * get note by id
 * @param id: the id of the note to get
 * @return the note
 */
router.get('/:id', verifyToken, async (req,res)=>{
    const id = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Note,id))){
        res.status(403).send({'err':'you are not authorized to retrieve that note'});
    }
   try {
       const note = await Branch.getNote(id);
       res.status(200).send(note);
   } catch(err){
       res.status(500).send('there was an error retrieving that note: ' + err.message)
   }
});

router.delete('/:id', verifyToken, async (req, res)=>{
    const id = req.params.id;
    if(!(await Branch.verifyOwnership(Branch.Note,id))){
        res.status(403).send({'err':'you are not authorized to delete that note'});
    }
    try {
        const deletedNote = await Branch.deleteNote(id);
        const parentId = deletedNote.parentId;
        const parentType = deletedNote.parentType;
        const updatedParent = Branch.getParentByType(parentType,parentId);
        const eventIndex = updatedParent.notes.indexOf(deletedNote._id);
        if(eventIndex === -1){
            throw new Error("task was not included in its parent");
        }
        updatedParent.tasks.splice(eventIndex);
        await Branch.updateParent(parentType,parentId,updatedParent);
        res.status(200).send(note);
    } catch(err){
        res.status(500).send('there was an error retrieving that note: ' + err.message)
    }

});

router.put('/:id', verifyToken, async (req,res)=>{
    const id = req.params.id;
    const newNote = req.body;
    if(!(await Branch.verifyOwnership(Branch.Note,id))){
        res.status(403).send({'err':'you are not authorized to modify that note'});
    }
    try {
        const note = await Branch.updateNote(id, newNote);
        res.status(200).send(note);
    } catch(err){
        res.status(500).send('there was an error retrieving that note: ' + err.message)
    }

});
module.exports=router;