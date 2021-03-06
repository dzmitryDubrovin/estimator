var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var HttpError = require('./error').HttpError;
var fileupload = require('express-fileupload');
var mongoose = require('./lib/mongoose');

var app = express();

app.use(express.static(path.join(__dirname, 'views')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(fileupload());
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// auth setup
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore(
    {
        uri: 'mongodb://localhost/estimator',
        collection: 'sessions'
    });
// Catch errors
store.on('error', function (err) {
    console.log(err);
});

var sessionOpts = {
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true
};
app.use(session(sessionOpts));

// view engine setup

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(function (req, res, next) {

    var allowedOrigins = ["http://localhost:3000", "http://estimator.senla.eu", "http://192.168.1.60"];

    var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    next();
});

var passport = require('./auth');

app.use(passport.initialize());
app.use(passport.session());


// routing
var routes = require('./routes/index');
var estimations = require('./routes/estimations');
var projects = require('./routes/projects');
var users = require('./routes/users');
var estimationModels = require('./routes/estimationModels');

app.use('/', routes);
app.use('/estimations', estimations);
app.use('/projects', projects);
app.use('/users', users);
app.use('/estimationModels', estimationModels);





module.exports = app;
