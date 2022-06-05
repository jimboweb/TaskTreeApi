require('dotenv').load();
const createError = require('http-errors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local');
const db = require('./utility/dbUtil.js');

const dbPrtcl = process.env.MONGODB;
let dbUser = '';
let dbPw = '';
let dbStr = '';

if(process.env.DBENV==='LOCAL'){
    dbStr = process.env.DBLOCALSTR;
    dbUser = process.env.DBLOCALUSR;
    dbPw = process.env.DBLOCALPW;
} else {
    dbStr = process.env.DBREMODTESTR;
    dbUser = process.env.DBREMOTEUSR;
    dbPw = process.env.DBREMOTEPW;
}

let cookieSecure = process.env.COOKIESECURE;
let sessionSecret = process.env.SESSIONSECRET;

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const categoryRouter = require('./routes/category');
const eventRouter = require('./routes/event');
const taskRouter = require('./routes/task');
const noteRouter = require('./routes/note');
const searchRouter = require('./routes/search');


const app = express();

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: cookieSecure },
    // you can store your sessions in mongo or in mysql or redis where ever     you want.
    store: MongoStore.create({
        mongoUrl: db.makeDbUri(dbPrtcl, dbUser, dbPw, dbStr),
        touchAfter: 24 * 3600,
        collection: 'sessions' // collection in mongo where sessions are to be saved
    })
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());


app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/category', categoryRouter);
app.use('/event',eventRouter);
app.use('/task',taskRouter);
app.use('/note', noteRouter);
app.use('/search',searchRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

const Account = require('./models/Account');
passport.use( new localStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

const uri = db.makeDbUri(dbPrtcl, dbUser, dbPw, dbStr);
mongoose.connection.on('connected',()=>{console.log("connected to mongodb")});
console.log('uri = ' + uri);
try {
    mongoose.connect(uri, {useNewUrlParser: true});
}catch (e) {
    console.error("failed to connect to mongodb");
}


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({err})
});

// debug; list of routes
app._router.stack.map((r)=>{
if (r.route && r.route.path){
    console.log(r.route.path)
}
});


module.exports = app;
