// params
var express = require('express');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');

var app = express();
var router = express.Router();

// connecting mongodb
// var mongodburi = 'mongodb://localhost:27017/Osin';
var mongodburi = 'mongodb://yuko001:yuko001@ds111771.mlab.com:11771/yukosama';
mongoose.Promise = global.Promise;
mongoose.connect(mongodburi);

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)

    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// parse application/x-www-form-urlencoded
app.use(bodyparser.urlencoded({
    extended: true
}));

// parse application/json
app.use(bodyparser.json());

app.use(cookieParser());

// API
app.use('/:language/auth', require('./_routes/authenticate.router'));
app.use('/:language/owner', require('./_routes/owner.router'));
app.use('/:language/maid', require('./_routes/maid.router'));
app.use('/:language/package', require('./_routes/package.router'));
app.use('/:language/work', require('./_routes/work.router'));
app.use('/:language/task', require('./_routes/task.router'));
app.use('/:language/process', require('./_routes/process.router'));

// /:language(en|vi)
app.listen(process.env.PORT || 8080, function () {
    console.log('listening on 8080 <3')
});
