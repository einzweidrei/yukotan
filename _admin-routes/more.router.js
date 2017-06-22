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
var Term = require('../_model/term');

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
            Term.setDefaultLanguage(language);
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
        Term.find({}).select('name content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    var m = []
                    data.map(a => {
                        var d = {
                            _id: a._id,
                            name: a.name,
                            content: a.get('content.all')
                        }
                        m.push(d)
                    })
                    return msg.msgReturn(res, 0, m);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/update').put((req, res) => {
    try {
        var id = req.body.id;

        var contentVi = req.body.contentVi;
        var contentEn = req.body.contentEn;

        Term.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    content: {
                        vi: contentVi,
                        en: contentEn
                    }
                }
            },
            (error) => {
                if (error) return msg.msgReturn(res, 3);
                return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;