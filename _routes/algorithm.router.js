var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Work = require('../_model/work');

var bodyparser = require('body-parser');

// setting limit of FILE
router.use(bodyparser.urlencoded({
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

router.use(function (req, res, next) {
    console.log('algorithm is connecting');
    next();
});

router.route('/testTime').post((req, res) => {
    try {
        var timeIn = new Date('2017-05-24T12:00:39.311Z');
        var timeOut = new Date('2017-05-24T15:50:39.311Z');

        console.log(timeIn.getTime());
        console.log(timeOut.getTime());

        console.log(timeIn.getUTCHours());
        console.log(timeOut.getUTCHours());


        // var e = timeOut.getDate() - timeIn.getDate();

        console.log(e);
        var d = new Date(e);

        console.log(d);
    } catch (error) {
        console.log(error);
    }
});

router.route('/get').post((req, res) => {
    try {
        var num = req.body.num;
        var result = totalBinSum(num);
        return res.json({ result: result })
    } catch (error) {
        console.log(error);
    }
});

function totalBinSum(num) {
    var string = '';
    var res = 0;

    // console.log(num instanceof Int16Array);
    console.log('Result: ' + parseInt(num, 2) % (Math.pow(10, 9) + 7))

    console.log(num.match(/^([a-z0-9]{5,})$/g))

    var isnum = /^\d+$/.test(num);
    console.log(isnum);

    for (var i = 0; i < num.length; i++) {
        string += num[0, i];
        res += parseInt(string, 2);

        console.log('ParseInt: ' + parseInt(string, 2) % (Math.pow(10, 9) + 7))
        console.log('Res: ' + res % (Math.pow(10, 9) + 7));
    }
    return res;
}

module.exports = router;