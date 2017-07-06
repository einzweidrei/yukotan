var express = require('express');
var bodyparser = require('body-parser');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var cloudinary = require('cloudinary');
var app = express();
var router = express.Router();

// firebase admin setting
var admin = require('firebase-admin');
var serviceAccount = require('./_path/serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gv24h-4792c.firebaseio.com"
});

// connecting mongodb
var mongodburi = 'mongodb://127.0.0.1:58418/NGV247';
// var mongodburi = 'mongodb://yuko001:yuko001@ds111771.mlab.com:11771/yukosama';
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization, hbbgvauth');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(cookieParser());

app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(bodyparser.json());

// API
app.use('/:language/auth', require('./_routes/authenticate.router'));
app.use('/:language/owner', require('./_routes/owner.router'));
app.use('/:language/maid', require('./_routes/maid.router'));
app.use('/:language/package', require('./_routes/package.router'));
app.use('/:language/work', require('./_routes/work.router'));
app.use('/:language/task', require('./_routes/task.router'));
app.use('/:language/process', require('./_routes/process.router'));
app.use('/:language/more', require('./_routes/more.router'));
app.use('/:language/payment', require('./_routes/payment.router'));
app.use('/:language/giftcode', require('./_routes/giftcode.router'));

app.use('/admin/:language/owner', require('./_admin-routes/owner.router'));
app.use('/admin/:language/maid', require('./_admin-routes/maid.router'));
app.use('/admin/:language/more', require('./_admin-routes/more.router'));
app.use('/admin/:language/work', require('./_admin-routes/work.router'));
app.use('/admin/:language/package', require('./_admin-routes/package.router'));
app.use('/admin/:language/report', require('./_admin-routes/report.router'));
app.use('/admin/:language/task', require('./_admin-routes/task.router'));
app.use('/admin/:language/giftcode', require('./_admin-routes/giftcode.router'));
app.use('/admin/:language/bill', require('./_admin-routes/bill.router'));
app.use('/admin/:language/contact', require('./_admin-routes/contact.router'));
// app.use('/admin/:language/function', require('./_admin-routes/web-func.router'));
// app.use('/admin/:language/role', require('./_admin-routes/web-role.router'));

app.listen(process.env.PORT || 8000, function () {
    console.log('listening on 8000 <3')
});
