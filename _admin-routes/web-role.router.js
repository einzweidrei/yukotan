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
var WebFunction = require('../_model/web-func');
var WebRole = require('../_model/web-role');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

// router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('web-func_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        }
        else return msg.msgReturn(res, 6);
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAll').get((req, res) => {
    try {
        WebRole
            .findOne({ _id: '000000000000000000000001', status: true })
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        return msg.msgReturn(res, 0);
                    }
                }
            });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        var webRole = new WebRole();
        webRole.name = 'Admin';
        webRole.perm = [
            {
                func: '000000000000000000000001',
                isActivated: true
            },
            {
                func: '000000000000000000000002',
                isActivated: true
            },
        ];
        webRole.history = {
            createAt: new Date(),
            updateAt: new Date()
        }
        webRole.status = true

        webRole.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;