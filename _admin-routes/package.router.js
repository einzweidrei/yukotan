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
            Package.setDefaultLanguage(language);
            next();
        }
        else return msg.msgReturn(res, 6);
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        var package = new Package();

        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;

        package.status = true;
        package.history.createAt = new Date();
        package.history.updateAt = new Date();

        package.set('name.all', {
            en: nameVi,
            vi: nameEn
        });

        package.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').put((req, res) => {
    try {
        var id = req.body.id;
        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;

        Package.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    name: {
                        vi: nameVi,
                        en: nameEn
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
});

router.route('/delete').put((req, res) => {
    try {
        var id = req.query.id;
        Package.findByIdAndUpdate(
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
        Package.findOne({ _id: id, status: true }).select('name').exec((error, data) => {
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
        Package.find({ status: true }).select('name').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    d = []
                    data.map(item => {
                        var g = {
                            _id: item._id,
                            name: item.get('name.all')
                        }
                        d.push(g)
                    })
                    return msg.msgReturn(res, 0, d);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;