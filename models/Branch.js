const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Permissions = require('../auth/permissions');

const standardOptions = {};
const updateOptions = Object.assign({new:true},standardOptions);

//TODO 190404: change all the findOnes to findById

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
 * will be some default category of 'uncategorized' for users who don't
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
    accountId: String
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
    accountId: String
})

const noteSchema = Schema({
    dateStamp: Date,
    note: String,
    accountId: String,
    parentType: String,
    parent: Schema.Types.ObjectId
});

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Task = mongoose.model('Task', taskSchema);
const Event = mongoose.model('Event', eventSchema);
const Note = mongoose.model('Note', noteSchema);

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
            return User.save(newUser,callback);
        })
};

const getUser = (id,callback)=>{
    const idQuery = {accountId:id};
    return User.findOne(idQuery,standardOptions,callback);
}
const updateUser = (id,obj, callback)=>{
    const idQuery = {accountId:id};
    return User.findOneAndUpdate(idQuery,obj, updateOptions,callback);
}
const createCategory = (category,callback)=>{
    const newCategory = new Category(category);
    return newCategory.save(callback);
};

const deleteCategory = (id,callback)=>{
    return Category.findByIdAndDelete(id,callback);
};

const updateCategory=(id,obj,callback)=>{
    return Category.findByIdAndUpdate(id, obj,updateOptions,callback);
};

const getCategory = (id,callback) => {
    return Category.findById(id, standardOptions,callback);
};

const getAllCategories = (accountId,callback)=>{
    const query = {accountId:accountId};
    return Category.find(query, standardOptions, callback);
};

const getAllTasks = (accountId,callback)=>{
    return Task.find({accountId:accountId}, standardOptions,callback);
}

const getTask = (id,callback)=>{
    return Task.findById(id, callback);
};

const createTask  = (task,callback)=>{
    return Task.create(task,callback);
};

const updateTask = (id,obj,callback)=>{
    return Task.findByIdAndUpdate(id,obj,updateOptions,callback);
};

const deleteTask = (id,callback)=>{
    return Task.findByIdAndRemove(id,callback);
};

const getEvent=(id,callback)=>{
    return Event.findById(id,standardOptions,callback)
};

const createEvent = (event,callback)=>{
    const newEvent = new Event(event);
    return newEvent.save(callback);

};

const deleteEvent = (id,callback)=>{
    return Event.findByIdAndRemove(id, standardOptions, callback);
};

const updateEvent = (id,obj,callback)=>{
    return Event.findByIdAndUpdate(id,obj,updateOptions,callback);
};

const createNote = (note, callback)=>{
    const newNote = new Note(note);
    return newNote.save(callback);
};

const getNote =(id,callback)=>{
    return Note.findById(id, standardOptions, callback);
};

const deleteNote = (id, callback)=>{
    return Note.findByIdAndRemove(id, standardOptions, callback);
};

const updateNote=(id, note, callback)=>{
    return Note.findByIdAndUpdate(id,note, updateOptions, callback);
};

const getTypeByString=(childTypeString)=>{
    const childType= {'task':Branch.Task,
        'category':Branch.Category,
        'event':Branch.event,
        'note':Branch.note}[childTypeString];

    if(!childType){
        throw {
            'err': 'invalid child type string in getChildTypeByString'
    }
    return childType;
}

const getChildren=(childTypeString, parentId, callback)=>{
    const childType = getTypeByString(childTypeString);
    return childType.find({parentId:parentId},null, callback);
}

/**
 * Get the parent of a task or event. For now only categories and tasks
 * can be parents; that may change.
 * @param parentType either 'category' or 'task'
 * @param parentId _id value of parent
 * @returns resolve - the parent category or task object/reject - error message
 */
const getParentByString=(parentType, parentId)=>{
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

const getParentByType=async (parentType, parentId)=>{
    const rtrn = await parentType.findById(parentId);
    return rtrn;
};

const getParentType=(parentTypeString)=>{
    const parentTypes = {'category':Category,'task': Task, 'event':Event};
    const parentFunction = parentTypes[parentTypeString];
    if(!parentFunction){
        return({'err' : parentTypeString + ' is not a valid parent type'});
    }
    return parentFunction;

}

const updateParent = (parentType, parentId, parent)=>{
    return new Promise((resolve, reject)=>{
        let parentFunction;
        if(parentType === Category){
            parentFunction = updateCategory;
        } else if (parentType === Task){
            parentFunction = updateTask;
        } else if (parentType === Event) {
            parentFunction = updateEvent;
        } else {
            throw new Error(`${parentType} is not a valid parent type`)
        }
        if(!parentFunction){
            reject({'err':`${parentType} is not a valid parent type`});
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
    const rslt = await type.findById.call(type, id,{}, standardOptions, err=>{
        if(err){
            return({err: err});
        }
    });

    const result = rslt.toObject();
    const tasks = result.tasks?result.tasks:result.subTasks;
    const events = result.events;
    result.children = {};
    result.children.tasks = await getAllTasksRecursive(tasks);
    result.children.events = await Promise.all(
            events.map(async eventId=>{
                const eventIdString = eventId.toString();
                return await Event.findById(eventIdString);
            }
        )
    );
    return result;


};




const deleteTaskOrCategoryRecursive = async (type, id)=>{
    const rslt = await type.findByIdAndRemove.call(type, id);
    const result = rslt.toObject();
    const tasks = result.tasks?result.tasks:result.subTasks;
    const events = result.events;
    const notes = result.notes;
    result.children = {};
    result.children.tasks = await deleteAllTasksRecursive(tasks);
    result.children.events = await Promise.all(
        events.map(async eventId=>{
                const eventIdString = eventId.toString();
                return await Event.findByIdAndRemove(eventIdString);
            }
        )
    );
    if(notes) {
        result.children.notes = await Promise.all(
            notes.map(async noteId => {
                    const noteIdString = noteId.toString();
                    return await Note.findByIdAndRemove(noteIdString);
                }
            )
        );
    }
    return result;

};

const getAllCategoriesRecursive = async(accountId)=>{
    const cats =await getAllCategories(accountId);
    const catIds = cats.map(
        cat=>{return cat._id}
    )
    const rtrn = await Promise.all(
        catIds.map(
            async catId=>{
                return await getCategoryRecursive(catId.toString());
            }
        )
    )
    return rtrn;
};


const getAllTasksRecursive = async(taskIds)=>{
    const rtrn = await Promise.all(
        taskIds.map(
            async taskId=>{
                return await getTaskRecursive(taskId.toString());
            }
        )
    )
    return rtrn;
};

const deleteAllTasksRecursive = async(taskIds)=>{
    const rtrn = await Promise.all(
        taskIds.map(
            async taskId=>{
                return await deleteTaskRecursive(taskId.toString());
            }
        )
    )
    return rtrn;
};

const applyAsyncToAll = async (func, ids)=>{
    const rtrn = await Promise.all(
        ids.map(
            async id=>{
                return await func(id.toString());
            }
        )
    )
};


const verifyOwnership = async (type, id, accountId)=>{
    try {
        const obj = await getParentByType(type, id);
        return Permissions.checkObjectPermissions(obj.accountId, accountId);
    } catch (err) {
        throw new Error("unable to get parent");
    }
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
 * @param objType the type of object to delete
 * @param objId the task to delete
 * @param newParentType the type of the new parent
 * @param newParentId the id of the new parent
 * @return {Promise<*>} the updated new parent
 */
const deleteTaskOrCategoryAndRebaseChildren = async (objType, objId, newParentType, newParentId) => {
    try {
        const deletedObj = await objType.findByIdAndRemove.call(objType, objId);
        const newParent = await getParentByType(newParentType, newParentId);
        await rebaseAllChildren(deletedObj, newParentType, newParent, true);
        return deletedObj;
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


//TODO 180909: need a method called from this that checks to avoid circular parent-child references
/**
 * assign a child to a new newParent
 * @param childType: Task or Event
 * @param newParentType Category or Task
 * @param child child to rebase
 * @param newParent the newParent to rebase to
 * @param oldParentIsDeleted true if old newParent has been deleted; if false child will be removed from old newParent child index
 * @return {Promise<void>} updated child
 */
const rebaseChild = async (childType, newParentType, child, newParent, oldParentIsDeleted) => {
    const oldParentId = child.parent.toString();
    const oldParentTypeString = child.parentType;
    child.parent = newParent._id;
     child.parentType = newParent instanceof Category?'category':'task';
    try{
        if(!oldParentIsDeleted){
            const oldParentType =  getParentType(oldParentTypeString);
            const oldParent = await getParentByType(oldParentType,oldParentId);
            const oldChildTypeList = getChildList(child,oldParent);
            const childOldIndex = oldChildTypeList.indexOf(child);
            oldChildTypeList.splice(childOldIndex);
            await oldParentType.findByIdAndUpdate(oldParent._id, oldParent, {});
        }
        await childType.findByIdAndUpdate(child._id, child, {});
        const newChildTypeList = getChildList(child, newParent);
        newChildTypeList.push(child);
        const modifiedNewParent = await newParentType.findByIdAndUpdate(newParent._id, newParent);
        return child;
    } catch (err){
        throw new Error('Error rebasing children:' + err);
    }

};

const getChildList = (child, parent)=>{
    let childTypeList;
    if(child instanceof Task){
        if(parent instanceof Category){
            childTypeList = parent.tasks;
        } else {
            childTypeList = parent.subTasks;
        }
    } else {
        childTypeList = parent.events;
    }
    return childTypeList;
}

const rebaseAllChildren = async (oldParent, newParentType, newParent, oldParentIsDeleted)=>{
    try{
        const taskList = oldParent.subTasks?oldParent.subTasks:oldParent.tasks;
        await Promise.all(
            taskList.map(
                async taskId=>{
                    const task = await getTask(taskId.toString());
                    await rebaseChild(Task,newParentType,task,newParent,oldParentIsDeleted);
                }
            )
        );
        await Promise.all(
            oldParent.events.map(
                async eventId=>{
                    const event = await getEvent(eventId);
                    await rebaseChild(Event, newParentType,event,newParent,oldParentIsDeleted);
                }
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

const searchByString = async (type, string)=>{
    try{
        return await type.find({$text:{$search:string}}, {score:{$meta:"textScore"}})

    } catch (e){
        return `error in search: ${e}`;
    }
}


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
queries.getAllTasks = getAllTasks;
queries.createEvent = createEvent;
queries.deleteEvent = deleteEvent;
queries.updateEvent = updateEvent;
queries.getEvent = getEvent;
queries.updateUser = updateUser;
queries.getAllCategories = getAllCategories;
queries.getParentByString = getParentByString;
queries.getParentByType = getParentByType;
queries.updateParent = updateParent;
queries.getCategoryRecursive = getCategoryRecursive;
queries.getTaskRecursive = getTaskRecursive;
queries.verifyOwnership = verifyOwnership;
queries.deleteCategoryRecursive = deleteCategoryRecursive;
queries.deleteTaskRecursive = deleteTaskRecursive;
queries.deleteTaskAndRebaseChildren = deleteTaskAndRebaseChildren;
queries.deleteCategoryAndRebaseChildren=deleteCategoryAndRebaseChildren;
queries.rebaseChild = rebaseChild;
queries.getParentType = getParentType;
queries.createNote = createNote;
queries.getNote = getNote;
queries.deleteNote = deleteNote;
queries.updateNote = updateNote;
queries.getAllCategoriesRecursive = getAllCategoriesRecursive;
queries.searchByString =searchByString;
queries.Task = Task;
queries.Category = Category;
queries.Event = Event;
queries.Note = Note;

module.exports = queries;