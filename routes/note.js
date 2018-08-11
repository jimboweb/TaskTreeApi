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
    if(!(await Branch.verifyOwnership(parentFunction,parentId))){
        res.status(403).send({'err':'you are not authorized to add to that parent'});
    }

    try {
        const parent = await Branch.getParent(parentFunction,parentId);
        const event = await Branch.createNote(newNote,err=>{
            res.status(403).send({"err":`error creating event: ${err.message}`});
        });
        parent.notes.push(event);
        await Branch.updateParent(parentFunction, parentId, parent);
        res.status(200).send(event);
    } catch(err) {
        res.status(500).send({'err':`error creating note: ${err.message}`});
    }
});

/**
 * get note by id
 * @param id: the id of the note to get 
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
        const note = await Branch.deleteNote(id);
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