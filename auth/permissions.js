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