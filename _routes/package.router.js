var express = require('express');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var as = require('../_services/app.service');
var AppService = new as.App();

var contPackage = require('../_controller/package.controller');
var packageController = new contPackage.Package();

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getAppLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            next();
        }
        else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getAll').get((req, res) => {
    try {
        packageController.getAll((error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

module.exports = router;