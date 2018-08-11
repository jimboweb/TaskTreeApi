const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const standardOptions = {/*lean:true*/};


/**
 * accountId linked to Account object
 * userName same as in Account object (unnecessary?)
 */
const userSchema = Schema ({
    accountId: String,
    userName: String,
    email: String,
    categories: [{type: Schema.Types.ObjectId, ref:'Category'}]
});

/**
 * Category is top level branch from User. Categories can never be
 * completed. All Tasks and Events are in categories.
 * Examples of Categories are 'work', 'household'. There
 * will be some default category of 'General' for users who don't
 * want to think about categories.
 */
const categorySchema = Schema({
    name: String,
    tasks: [{type: Schema.Types.ObjectId, ref: 'Task'}],
    events: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    accountId: String
});

/**
 * external means that it's outside user's control
 * (for future versions with tasks shared between users I can create 'owner')
 * TODO: interface needs warning if startTime>deadline or startTime+estTime>deadline
 * completed - will depend on completion of subtaska and events except for leaves
 * parent will either be a category or task
 * prqTask must be completed before this one
 * prqEvent must have occurred before doing this
 * estTime is in minutes. in interface it will be either minutes, hours or days.
 * estTime includes subTasks; if subtasks > estTime then estTime = sum of subTasks
 * (probably want a warning for this in the interface)
 */
const taskSchema = Schema({
    name: String,
    description: String,
    subTasks: [{type: Schema.Types.ObjectId, ref: 'Task'}],
    events: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    completed: Boolean,
    deadline: Date,
    startDate: Date,
    notes: [{type: Schema.Types.ObjectId, ref: 'Note'}],
    external: Boolean,
    parent: Schema.Types.ObjectId,
    parentType: String,
    prqTask: [{type: Schema.Types.ObjectId, ref: 'Task'}],
    prqEvent: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    estTime: Number,
    accountId: String,
});

/**
 * length is in minutes
 * prevDates is dates that event has been rescheduled from
 */
const eventSchema = Schema({
    name: String,
    dateTime: Date,
    length: Number, //in minutes
    notes: [{type: Schema.Types.ObjectId, ref: 'Note'}],
    prqTask: [{type: Schema.Types.ObjectId, ref: 'Task'}],
    prqEvent: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    parent: Schema.Types.ObjectId,
    parentType: String,
    completed: Boolean,
    prevDates: [Date],
    accountId: String,
})

const noteSchema = Schema({
    dateStamp: Date,
    note: String
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Task = mongoose.model('Task', taskSchema);
const Event = mongoose.model('Event', eventSchema);
const Note = mongoose.model('Note', userSchema);

//TODO someday: do the following with some kind of createObject thunk
const createUser = (user,callback)=>{
    const uncat = {
        name: 'Uncategorized',
        tasks: [],
        events: [],
        accountId: user.accountId
    }
    createCategory(uncat,
        (err,cat)=>{
            const catId = cat._id.toString();
            const newUser = new User({userName:user.userName,
                accountId:user.accountId,
                email:user.email,
                categories:[catId]
            });
            User.create(newUser,callback);
        })
};

const getUser = (id,callback)=>{
    const idQuery = {accountId:id};
    User.findOne(idQuery,standardOptions,callback);
}
const updateUser = (id,obj, callback)=>{
    const idQuery = {accountId:id};
    User.findOneAndUpdate(idQuery,obj, standardOptions,callback);
}
const createCategory = (category,callback)=>{
    Category.create(category,
        callback);
};

const deleteCategory = (id,callback)=>{
    const idQuery = {_id:id};
    Category.findOneAndRemove(idQuery,callback);
};

const updateCategory=(id,obj,callback)=>{
    const idQuery = {_id:id};
    Category.findOneAndUpdate(idQuery, obj,standardOptions,callback);
};

const getCategory = (id,callback) => {
    const idQuery = {_id:id};
    Category.findOne(idQuery, standardOptions,callback);
};

const getAllCategories = (accountId,callback)=>{
    const query = {accountId:accountId};
    Category.find(query, standardOptions, callback);
};

const getTask = (id,callback)=>{
    const idQuery = {_id:id};
    Task.findOne(idQuery,standardOptions,callback);
};

const createTask  = (task,callback)=>{
    Task.create(task,callback);
};

const updateTask = (id,obj,callback)=>{
    const idQuery = {_id:id};
    Task.findOneAndUpdate(idQuery,obj,standardOptions,callback);
};

const deleteTask = (id,callback)=>{
    const idQuery = {_id:id};
    Task.findOneAndRemove(idQuery,callback);
};

const getEvent=(id,callback)=>{
    const idQuery = {_id:id};
    Event.findOne(idQuery,standardOptions,callback)
};

const createEvent = (event,callback)=>{
    Event.create(event,callback);
}

const deleteEvent = (id,callback)=>{
    const idQuery = {_id:id};
    Event.findOneAndRemove(idQuery,callback);
}

const updateEvent = (id,obj,callback)=>{
    const idQuery = {_id:id};
    Event.findOneAndUpdate(idQuery,obj,standardOptions,callback);
}



/**
 * Get the parent of a task or event. For now only categories and tasks
 * can be parents; that may change.
 * @param parentType either 'category' or 'task'
 * @param parentId _id value of parent
 * @returns resolve - the parent category or task object/reject - error message
 */
const getParent=(parentType, parentId)=>{
    return new Promise((resolve, reject)=>{
        const parentTypes = {'category':getCategory,'task': getTask};
        const parentFunction = parentTypes[parentType];
        if(!parentFunction){
            reject({err:parentType + ' is not a valid parent type'});
        }
        parentFunction.call(this,parentId,(err,result)=>{
            if(err){
                reject({err:'parent of type ' + parentType + ' with id ' + parentId + ' does not exist'});
            }
            resolve(result);
        });
    })
};

const getParentType=(parentTypeString)=>{
    const parentTypes = {'category':getCategory,'task': getTask};
    const parentFunction = parentTypes[parentTypeString];
    if(!parentFunction){
        return({'err' : parentTypeString + ' is not a valid parent type'});
    }
    return parentFunction;

}

const updateParent = (parentType, parentId, parent)=>{
    return new Promise((resolve, reject)=>{
        const parentTypes = {'category':updateCategory,'task': updateTask};
        const parentFunction = parentTypes[parentType];
        if(!parentFunction){
            reject({"err":parentType + ' is not a valid parent type'});
        }
        parentFunction.call(this,parentId,parent,(err,prnt)=>{
            if(err){
                reject({error:'unable to add new task to parent'});
            }
            resolve(prnt);
        })
    })
}


const getTaskOrCategoryRecursive = async (type, id)=>{
    const rslt = await type.findOne.call(type, {_id:id},{}, standardOptions, err=>{
        if(err){
            return({err: err});
        }
    });

    const result = rslt.toObject();
    const tasks = result.tasks?result.tasks:result.subTasks;
    const events = result.events;
    result.children = {};
    result.children.tasks = await getAllTasksRecursive(tasks);
    result.children.events = events.map(async eventId=>{
        const eventIdString = eventId.toString();
        await Event.findOne({_id:eventIdString}, standardOptions,err=>{
            if(err){
                return({err: err});
            }
        });
    });
    return result;


};

const deleteTaskOrCategoryRecursive = async (type, id)=>{
    const rslt = await type.findOneAndRemove.call(type, {_id:id},{}, standardOptions, err=>{
        if(err){
            return({err: err});
        }
    });
    const result = rslt.toObject();
    const tasks = result.tasks?result.tasks:result.subTasks;
    const events = result.events;
    result.children = {};
    result.children.tasks = await deleteAllTasksRecursive(tasks);
    result.children.events = events.map(async eventId=>{
        const eventIdString = eventId.toString();
        await Event.findOneAndRemove({_id:eventIdString}, standardOptions,err=>{
            if(err){
                return({err: err});
            }
        });
    });
    return result;

};

const getAllTasksRecursive = async(taskIds)=>{
    const rtrn = await Promise.all(
        taskIds.map(
            async taskId=>{
                return await getTaskRecursive(taskId.toString(), err=>{if(err){return {err:err}}});
            }
        )
    )
    return rtrn;
};

const deleteAllTasksRecursive = async(taskIds)=>{
    const rtrn = await Promise.all(
        taskIds.map(
            async taskId=>{
                return await deleteTaskRecursive(taskId.toString(), err=>{if(err){return {err:err}}});
            }
        )
    )
    return rtrn;
};


const verifyOwnership = async (type, id, accountId)=>{
    const obj = await type.findOne({_id:id}, err=>{
        return false;
    }).select({"accountId":1});
    if(obj){
        return obj.accountId ===accountId;
    }
    return false;
};

/**
 * returns a promise
 * @param taskId
 */
const getTaskRecursive = (taskId)=>{
    return getTaskOrCategoryRecursive(Task, taskId);
};

const deleteTaskRecursive = async taskId =>{
    return deleteTaskOrCategoryRecursive(Task, taskId);
};

/**
 * Delete task and reassign all its children to a new parent
 * @param objId the task to delete
 * @param newParentType the type of the new parent
 * @param newParentId the id of the new parent
 * @return {Promise<*>} the updated new parent
 */
const deleteTaskOrCategoryAndRebaseChildren = async (objType, objId, newParentType, newParentId) => {
    try {
        const deletedObj = await objType.findOneAndRemove({_id:objId});
        const newParent = await getParent(newParentType, newParentId);
        const updatedNewParent = await rebaseAllChildren(deletedObj,newParentType,newParent,true);
        return updatedNewParent;
    } catch (err){
        throw new Error('Error deleting task:' + err);
    }
};

const deleteCategoryAndRebaseChildren = async (id,newParentType,newParentId)=>{
    return deleteTaskOrCategoryAndRebaseChildren(Category,id,newParentType,newParentId);
};

const deleteTaskAndRebaseChildren = async(id,newParentType,newParentId)=>{
    return deleteTaskOrCategoryAndRebaseChildren(Task,id,newParentType,newParentId);
}


/**
 * assign a child to a new parent
 * @param childType: Task or Event
 * @param parentType Category or Task
 * @param child child to rebase
 * @param parent the parent to rebase to
 * @param oldParentIsDeleted true if old parent has been deleted; if false child will be removed from old parent child index
 * @return {Promise<void>} updated child
 */
const rebaseChild = async (childType, parentType, child, parent, oldParentIsDeleted) => {
    child.parentId = parent._id;
    try{
        if(!oldParentIsDeleted){
            const oldParentType =  getParentType(child.parentType);
            const oldParentId = child.parentId;
            const oldParent = getParent(oldParentType,oldParentId);
            const oldChildTypeList = childType === Task?oldParent.tasks:oldParent.events;
            const childOldIndex = oldChildTypeList.indexOf(child);
            oldChildTypeList.splice(childOldIndex);
            await oldParentType.findOneAndUpdate({_id:oldParent:_id}, oldParent, {});
        }
        await childType.findOneAndUpdate({_id:child._id}, child, {});
        const childTypeList = childType === Task?parent.tasks:parent.events;
        childTypeList.push(child);
        await parentType.findOneAndUpdate({id:parent._id}, parent, {});
        return child;
    } catch (err){
        throw new Error('Error rebasing children:' + err);
    }

};

const rebaseAllChildren = async (oldParent, newParentType, newParent, oldParentIsDeleted)=>{
    try{
        await Promise.all(
            oldParent.tasks.map(
                task=>rebaseChild(Task,newParentType,task,newParent,oldParentIsDeleted)
            )
        );
        await Promise.all(
            oldParent.events.map(
                event=>rebaseChild(Event, newParentType,event,newParent,oldParentIsDeleted)
            )
        );
    } catch(err){
        throw new Error('Error rebasing children' + err);
    }
    return newParent;
};

const deleteCategoryRecursive = async catId =>{
    return deleteTaskOrCategoryRecursive(Category, catId);

};


/**
 * returns a promise
 * @param categoryId
 */
const getCategoryRecursive=(categoryId)=>{
    return getTaskOrCategoryRecursive(Category,categoryId);
};

const queries = {};
queries.createUser = createUser;
queries.getUser = getUser;
queries.createCategory = createCategory;
queries.deleteCategory = deleteCategory;
queries.updateCategory = updateCategory;
queries.getCategory = getCategory;
queries.createTask = createTask;
queries.deleteTask = deleteTask;
queries.updateTask = updateTask;
queries.getTask = getTask;
queries.createEvent = createEvent;
queries.deleteEvent = deleteEvent;
queries.updateEvent = updateEvent;
queries.getEvent = getEvent;
queries.updateUser = updateUser;
queries.getAllCategories = getAllCategories;
queries.getParent = getParent;
queries.updateParent = updateParent;
queries.getCategoryRecursive = getCategoryRecursive;
queries.getTaskRecursive = getTaskRecursive;
queries.verifyOwnership = verifyOwnership;
queries.deleteCategoryRecursive = deleteCategoryRecursive;
queries.deleteTaskRecursive = deleteTaskRecursive;
queries.deleteTaskAndRebaseChildren = deleteTaskAndRebaseChildren;
queries.deleteCategoryAndRebaseChildren=deleteCategoryAndRebaseChildren;
queries.getParentType = getParentType;
queries.Task = Task;
queries.Category = Category;
queries.Event = Event;
queries.Note = Note;

module.exports = queries;