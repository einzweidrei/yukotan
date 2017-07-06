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
var AppInfo = require('../_model/app-info');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

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
        AppInfo
            .findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v')
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3)
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        var g = {
                            _id: data._id,
                            name: data.get('name.all'),
                            address: data.get('address.all'),
                            phone: data.phone,
                            note: data.get('note.all'),
                            email: data.email,
                            status: data.status,
                            history: data.history,
                            bank: data.get('bank.all')
                        }
                    }
                }
                return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0, g)
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').post((req, res) => {
    try {
        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;

        var addressVi = req.body.addressVi;
        var addressEn = req.body.addressEn;

        var phone = req.body.phone;

        var noteVi = req.body.noteVi;
        var noteEn = req.body.noteEn;

        var email = req.body.email;

        var bankVi = req.body.bankVi;
        var bankEn = req.body.bankEn;

        AppInfo.findOneAndUpdate(
            {
                _id: '000000000000000000000001',
                status: true
            },
            {
                $set: {
                    name: {
                        vi: nameVi,
                        en: nameEn
                    },
                    address: {
                        vi: addressVi,
                        en: addressEn
                    },
                    note: {
                        vi: noteVi,
                        en: noteEn
                    },
                    bank: {
                        vi: bankVi,
                        en: bankEn
                    },
                    email: email,
                    phone: phone,
                    'history.updateAt': new Date()
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