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

var FCM = require('../_services/fcm.service');
var FCMService = new FCM.FCMService();

var Mail = require('../_services/mail.service');
var MailService = new Mail.MailService();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Bill = require('../_model/bill');
var Comment = require('../_model/comment');

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

// setting limit of FILE
router.use(bodyparser.urlencoded({
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

router.use(function (req, res, next) {
    console.log('package_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppInfo.setDefaultLanguage(language);
            next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/get').get((req, res) => {
    try {
        AppInfo.findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v').exec((error, data) => {
                return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0, data)
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').post((req, res) => {
    try {
        var app = new AppInfo();

        var language = req.cookies.language;
        AppInfo.setDefaultLanguage(language);

        var name = req.body.name;
        var address = req.body.address;
        var phone = req.body.phone;
        var note = req.body.note;
        var email = req.body.email;

        app.phone = phone;
        app.email = email;
        app.status = true;
        app.history.createAt = new Date();
        app.history.updateAt = new Date();

        app.set('name.all', {
            en: name,
            vi: name
        });

        app.set('address.all', {
            en: address,
            vi: address
        });

        app.set('note.all', {
            en: note,
            vi: note
        });

        app.save((error) => {
            return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0)
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;