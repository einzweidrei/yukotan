var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = messageService.Message;
var msgRep = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');

router.use(function (req, res, next) {
    console.log('package_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        }
        else {
            return res.status(200).send(msgRep.msgData(false, msg.msg_language_not_support));
        }
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
    }
});

router.route('/create').post((req, res) => {
    try {
        var package = new Package();

        var language = req.cookies.language;
        Package.setDefaultLanguage(language);

        var name = req.body.name;

        package.status = true;
        package.history.createAt = new Date();
        package.history.updateAt = new Date();

        package.set('name.all', {
            en: name,
            vi: name
        });

        package.save((error) => {
            if (error) return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            return res.status(200).send(msgRep.msgData(true, msg.msg_success));
        })
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
    }
});

router.route('/getAll').get((req, res) => {
    try {
        var language = req.cookies.language;
        Package.setDefaultLanguage(language);

        Package.find({}).exec((error, data) => {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                if (validate.isNullorEmpty(data)) {
                    return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                } else {
                    Package.setDefaultLanguage('en');
                    return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
                }
            }
        });
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
    }
});

module.exports = router;