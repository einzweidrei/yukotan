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
var Comment = require('../_model/comment');
var Maid = require('../_model/maid');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

// setting limit of FILE
router.use(bodyparser.urlencoded({
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

router.use(function (req, res, next) {
    console.log('comment_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/comment').post((req, res) => {
    try {
        var comment = new Comment();
        comment.fromId = req.body.fromId;
        comment.toId = req.body.toId;
        comment.content = req.body.content;
        comment.evaluation_point = req.body.evaluation_point;
        comment.status = true;

        comment.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getComment').get((req, res) => {
    try {
        var id = req.query.id;

        Comment.find({ toId: id }).exec((error, data) => {
            if (error) {

            } else {
                if (validate.isNullorEmpty(data)) {

                } else {
                    Maid.populate(data, { path: 'fromId', select: 'info' }, (error, data) => {
                        if (error) {

                        } else {
                            if (validate.isNullorEmpty(data)) {

                            } else {
                                return msg.msgReturn(res, 0, data);
                            }
                        }
                    });
                }
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});


module.exports = router;