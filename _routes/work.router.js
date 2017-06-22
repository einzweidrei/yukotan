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

var bodyparser = require('body-parser');

router.use(bodyparser.json({
    limit: '50mb',
}));

// setting limit of FILE
router.use(bodyparser.urlencoded({
    limit: '50mb',
    parameterLimit: 1000000,
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

router.use(function (req, res, next) {
    console.log('work_router is connecting');

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

router.route('/create').post((req, res) => {
    try {
        var work = new Work();

        var language = req.cookies.language;
        Work.setDefaultLanguage(language);

        var name = req.body.name;

        work.status = true;
        work.history.createAt = new Date();
        work.history.updateAt = new Date();

        work.set('name.all', {
            en: name,
            vi: name
        });

        work.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAll').get((req, res) => {
    try {
        var language = req.cookies.language;
        Work.setDefaultLanguage(language);

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