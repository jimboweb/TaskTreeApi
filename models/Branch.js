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
            reject({error:parentType + ' is not a valid parent type'});
        }
        parentFunction.call(this,parentId,(err,result)=>{
            if(err){
                reject({error:'parent of type ' + parentType + ' with id ' + parentId + ' does not exist'});
            }
            resolve(result);
        });
    })
};

const updateParent = (parentType, parentId, parent)=>{
    return new Promise((resolve, reject)=>{
        const parentTypes = {'category':updateCategory,'task': updateTask};
        const parentFunction = parentTypes[parentType];
        if(!parentFunction){
            reject({error:parentType + ' is not a valid parent type'});
        }
        parentFunction.call(this,parentId,parent,(err,prnt)=>{
            if(err){
                reject({error:'unable to add new task to parent'});
            }
            resolve(prnt);
        })
    })
}

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
module.exports = queries;