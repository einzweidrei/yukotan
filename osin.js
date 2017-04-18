// params
var express = require('express');
var app = express();
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var router = express.Router();

// connecting mongodb
// var mongodburi = 'mongodb://localhost:27017/Osin';
var mongodburi = 'mongodb://capstone:Anhcanem123@ds139198.mlab.com:39198/hailyuko';
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

router.use((req, res, next) => {
    console.log('Something is happening');
    next();
});

// API
app.use('/auth', require('./_routes/authenticate.router'));
app.use('/owner', require('./_routes/owner.router'));

app.listen(process.env.PORT || 8080, function () {
    console.log('listening on 8080 <3')
});
