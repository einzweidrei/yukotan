var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var logsService = require('../_services/log.service');
var logs = new logsService.Logs();

var as = require('../_services/app.service');
var AppService = new as.App();

var Account = require('../_model/account');
var Session = require('../_model/session');

var ObjectId = require('mongoose').Types.ObjectId;
var bodyparser = require('body-parser');
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('cms-owner_router is connecting');
    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));
        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
            // if (req.headers.hbbgvauth) {
            //     var token = req.headers.hbbgvauth;
            //     Session.findOne({ 'auth.token': token }).exec((error, data) => {
            //         if (error) {
            //             return msg.msgReturn(res, 3);
            //         } else {
            //             if (validate.isNullorEmpty(data)) {
            //                 return msg.msgReturn(res, 14);
            //             } else {
            //                 req.cookies['userId'] = data.auth.userId;
            //                 next();
            //             }
            //         }
            //     });
            // } else {
            //     return msg.msgReturn(res, 14);
            // }
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;

        var account = new Account();
        account.info = {
            username: username,
            email: email,
            name: req.body.name || '',
            phone: req.body.phone || '',
            image: req.body.image || '',
            address: req.body.address || '',
            gender: req.body.gender || 0
        }

        var p = req.body.password;
        var password = AppService.hashString(p);

        console.log(p, password);

        account.auth = {
            password: password
        }

        account.history = {
            createAt: new Date(),
            updateAt: new Date()
        }

        account.status = true

        Account
            .findOne({ $or: [{ 'info.username': req.body.username }, { 'info.email': req.body.email }] })
            .exec((error, data) => {
                if (error) {
                    console.log(error)
                    return msg.msgReturn(res, 3);
                } else if (validate.isNullorEmpty(data)) {
                    account.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0);
                    })
                } else {
                    return msg.msgReturn(res, 2);
                }
            })
    } catch (error) {
        console.log(error)
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;