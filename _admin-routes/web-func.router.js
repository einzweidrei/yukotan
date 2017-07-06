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

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('web-func_router is connecting');

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

router.route('/getAll').get((req, res) => {
    try {
        WebFunction
            .find({ status: true })
            .select('name')
            .exec((error, data) => {
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

router.route('/create').post((req, res) => {
    try {
        var webFunction = new WebFunction();
        webFunction.name = req.body.name;
        webFunction.createAt = new Date();
        webFunction.status = true;

        webFunction.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;