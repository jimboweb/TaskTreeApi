const Branch = require('../models/Branch');

/**
 * For now this just checks that the user owns the object. In
 * the future this may allow for tasks to be shared wtih other users.
 * @param objAccountId the account id the object is associated with
 * @param userAccountId the userId associated with a token
 * @returns {boolean} if the user has access to the object
 */
exports.checkObjectPermissions=(objAccountId,userAccountId)=>{
    return objAccountId===userAccountId;
}

exports.runIfOwnershipVerified = async (objType, verbString, id, userId, res, callback)=>{
    let typeString;
    if(objType === Branch.Category){
        typeString = 'category';
    } else if (objType === Branch.Task){
        typeString = 'task';
    } else if (objType === Branch.Event){
        typeString = 'event'
    } else {
        typeString = 'note'
    }
    try {
        if (!(await Branch.verifyOwnership(Branch.Category, id, userId))) {
            res.status(403).send({"err": `You are not authorized to ${verbString} that ${typeString}`})
        } else {
            callback();
        }
    } catch (e) {
        res.status(500).send({'err':`There was an error verifying the ownership of that ${typeString}`})
    }

}