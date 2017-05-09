// params
var express = require('express');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var cloudinary = require('cloudinary');
// var multer = require('multer')
// var upload = multer({ dest: 'uploads/' })
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = express();
var router = express.Router();

// connecting mongodb
// var mongodburi = 'mongodb://localhost:27017/Osin';
var mongodburi = 'mongodb://yuko001:yuko001@ds111771.mlab.com:11771/yukosama';
mongoose.Promise = global.Promise;
mongoose.connect(mongodburi);

// config cdn
cloudinary.config({
    cloud_name: 'einzweidrei2',
    api_key: '923252816135765',
    api_secret: '5bBDapVrya9p73sXqvZNZc029lE'
});

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    // res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)

    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// app.use(express.bodyparser());

app.post('/profile', function (req, res, next) {
    console.log(res.files);
    console.log(res.file);
    console.log(res.body);
    next();
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
});


// parse application/x-www-form-urlencoded
// app.use(bodyparser.json({
//     limit: '50mb',
// }));

// // setting limit of FILE
// app.use(bodyparser.urlencoded({
//     limit: '50mb',
//     parameterLimit: 1000000,
//     extended: true
// }));

// // // parse application/json
// app.use(bodyparser.json());
app.use(cookieParser());

// API
app.use('/:language/auth', require('./_routes/authenticate.router'));
app.use('/:language/owner', require('./_routes/owner.router'));
app.use('/:language/maid', require('./_routes/maid.router'));
app.use('/:language/package', require('./_routes/package.router'));
app.use('/:language/work', require('./_routes/work.router'));
app.use('/:language/task', require('./_routes/task.router'));
app.use('/:language/process', require('./_routes/process.router'));
app.use('/image', require('./_routes/uploadImage.router'));

// /:language(en|vi)
app.listen(process.env.PORT || 8080, function () {
    console.log('listening on 8080 <3')
});
