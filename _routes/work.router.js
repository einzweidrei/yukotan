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
var Work = require('../_model/work');

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
            return res.status(200).send(msgRep.msgData(false, msg.msg_language_not_support));
        }
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
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
        Work.setDefaultLanguage(language);

        Work.find({}).exec((error, data) => {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                if (validate.isNullorEmpty(data)) {
                    return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                } else {
                    return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
                }
            }
        });
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
    }
});

module.exports = router;