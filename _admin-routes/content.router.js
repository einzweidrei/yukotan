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

var as = require('../_services/app.service');
var AppService = new as.App();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');
var GiftCode = require('../_model/giftcode');
var Content = require('../_model/content');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Content.setDefaultLanguage(language);
            next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAll').get((req, res) => {
    try {
        var type = req.query.type;
        Content
            .find({ type: type, status: true })
            .select('type info')
            .exec((error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                else return msg.msgReturn(res, 0, data);
            });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        var type = req.body.type;
        var image = req.body.image || '';
        var title = req.body.title || '';
        var content = req.body.content || '';

        var ct = new Content();
        ct.type = type;
        ct.info = {
            image: image,
            title: title,
            content: content
        };
        ct.history = {
            createAt: new Date(),
            updateAt: new Date()
        };
        ct.status = true
        ct.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').post((req, res) => {
    try {
        var id = req.body.id;
        var image = req.body.image || '';
        var title = req.body.title || '';
        var content = req.body.content || '';

        Content.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    'info.image': image,
                    'info.title': title,
                    'info.content': content,
                    'history.updateAt': new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                else return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/delete').post((req, res) => {
    try {
        var id = req.body.id;

        Content.findOneAndRemove(
            {
                _id: id,
                status: true
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                else return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;