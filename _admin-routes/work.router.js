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
var Work = require('../_model/work');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

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
            Work.setDefaultLanguage(language);
            next();
        }
        else return msg.msgReturn(res, 6);
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post(multipartMiddleware, (req, res) => {
    try {
        var work = new Work();

        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;

        work.status = true;
        work.history.createAt = new Date();
        work.history.updateAt = new Date();

        work.set('name.all', {
            en: nameVi,
            vi: nameEn
        });

        if (req.files.image) {
            cloudinary.uploader.upload(
                req.files.image.path,
                function (result) {
                    work.image = result.url;
                    work.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0);
                    })
                })
        } else {
            work.image = ''
            work.save((error) => {
                if (error) return msg.msgReturn(res, 3);
                return msg.msgReturn(res, 0);
            })
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').put(multipartMiddleware, (req, res) => {
    try {
        var id = req.body.id;
        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;

        if (req.files.image) {
            cloudinary.uploader.upload(
                req.files.image.path,
                function (result) {
                    var image = result.url;
                    work.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        Work.findOneAndUpdate(
                            {
                                _id: id,
                                status: true
                            },
                            {
                                $set: {
                                    name: {
                                        vi: nameVi,
                                        en: nameEn
                                    },
                                    image: image,
                                    'history.updateAt': new Date()
                                }
                            },
                            (error) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0);
                            }
                        )
                    })
                })
        } else {
            Work.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        name: {
                            vi: nameVi,
                            en: nameEn
                        },
                        'history.updateAt': new Date()
                    }
                },
                (error) => {
                    if (error) return msg.msgReturn(res, 3);
                    return msg.msgReturn(res, 0);
                }
            )
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/delete').put((req, res) => {
    try {
        var id = req.query.id;
        Work.findByIdAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    status: false
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

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;
        Work.findOne({ _id: id, status: true }).select('name').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    var g = {
                        _id: data._id,
                        name: data.get('name.all')
                    }
                    return msg.msgReturn(res, 0, g);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/getAll').get((req, res) => {
    try {
        Work.find({ status: true }).select('name').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;