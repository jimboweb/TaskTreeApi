const express = require('express');
const router = express.Router();
const verifyToken = require('../auth/verifyToken');
const userController = require('./user');
const Branch = require('../models/Branch');
const Permissions = require('../auth/permissions');
const httpUtils = require('../utility/httpUtil');

//TODO 180824: refactor the first three category routes using 'await' and add the verifyownership step

/**
 * body of request should be category as json object
 * don't forget 'Content-Type':'application/json'!!
 */
router.post('/',verifyToken,userController.getUserByAccountId,  async (req,res, next)=>{
    try {
        const category = req.body;
        category.accountId = req.userObj.accountId;
        const cat = await Branch.createCategory(category);
        const userObj = req.userObj;
        userObj.categories.push(cat);
        const usr = Branch.updateUser(userObj.accountId, userObj)
        res.status(200).send(cat);
    } catch (e) {
        res.status(500).send({'err':`There was an error creating the category: ${e.message}`})
    }

});



/**
 * Get all categories for user associated with token
 */
router.get('/',
    
    verifyToken,
    async (req,res)=>{
    try {
        const cats = await Branch.getAllCategoriesRecursive(req.userId)
        res.status(200).send(cats);
    } catch (err) {
        res.status(500).send({'err':`There was a problem getting the category: ${err.message}`})
    }
});


/**
 * Get category by id. Will return unauthorized if accountId
 * doesn't match userId of user associated with token
 */
router.get('/:id', verifyToken,  async (req,res)=>{
    try {
        if ((await Branch.verifyOwnership(Branch.Category, req.params.id, req.userId))) {
            const cat = await Branch.getCategoryRecursive(req.params.id);
            res.status(200).send(cat);
        } else {
            res.status(403).send({"err": "You are not authorized to get that category"});
        }
    } catch (e) {
        res.status(500).send({'err':`There was a problem retrieving that category: ${e.message}`})
    }
});

router.delete('/:id', verifyToken,  async (req,res)=>{
    try {
        if (await Branch.verifyOwnership(Branch.Category, req.params.id, req.userId)) {
            const deletedCategory = await Branch.deleteCategoryRecursive(req.params.id);
            res.status(200).send(deletedCategory);
        } else {
            res.status(403).send({"err": "You are not authorized to delete that category"});
        }
    } catch (e) {
        res.status(500).send({'err':`There was an error deleting the category: ${e.message}`})
    }
});

/**
 * delete category and rebase children to new parent
 * @param id: id of category to delete
 * @param newParentType: type of new parent
 * @param newParentId: id of new parent
 * @return deleted task;
 */
router.delete('/:id/:newParentType/:newParentId', verifyToken,  async(req,res)=>{
    const id = req.params.id;
    try {
        if(!(await Branch.verifyOwnership(Branch.Category, req.params.id, req.userId))){
            res.status(403).send({"err":"You are not authorized to delete that category"});
        } else {
                const newParentType = Branch.getParentType(req.params.newParentType);
                const newParentId = req.params.newParentId;
                const deletedCategory = await Branch.deleteCategoryAndRebaseChildren(id, newParentType, newParentId);
                res.status(200).send(deletedCategory);
        }
    } catch (err) {
        res.status(500).send('error deleting category' + err.message);
    }
});

router.put('/:id', verifyToken,  async (req,res)=>{
    const catId = req.params.id;
    const update = req.body;
    try {
        if (!(await Branch.verifyOwnership(Branch.Category, catId, req.userId))) {
            res.status(403).send({"err": "You are not authorized to modify that Category"})
        } else {
            const updatedCategory = await Branch.updateCategory(catId, update);
            if (updatedCategory.err) {
                res.status(500).send({"err": "error updating category" + updatedCategory.err});
            }
            res.status(200).send(updatedCategory);
        }
    } catch (e){
        res.status(500).send({'err':`There was a problem modifying that category: ${e.message}`})
    }
})

module.exports=router;