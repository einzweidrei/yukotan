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

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware)

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

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;
        Term.findOne({ _id: id, status: true }).select('name content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    var d = {
                        _id: data._id,
                        name: data.name,
                        content: data.get('content.all')
                    }
                    return msg.msgReturn(res, 0, d);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/update').post((req, res) => {
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