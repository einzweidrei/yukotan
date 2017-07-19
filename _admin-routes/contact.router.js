var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contAppInfo = require('../_controller/app-info.controller');
var appInfoController = new contAppInfo.AppInfo();
var as = require('../_services/app.service');
var AppService = new as.App();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getWebLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            next();
        }
        else {
            return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/get').get((req, res) => {
    appInfoController.getContact4Admin((error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/update').post((req, res) => {
    var nameVi = req.body.nameVi;
    var nameEn = req.body.nameEn;

    var addressVi = req.body.addressVi;
    var addressEn = req.body.addressEn;

    var phone = req.body.phone;

    var noteVi = req.body.noteVi;
    var noteEn = req.body.noteEn;

    var email = req.body.email;

    var bankVi = req.body.bankVi;
    var bankEn = req.body.bankEn;

    appInfoController.update(nameVi, nameEn, addressVi, addressEn,
        phone, noteVi, noteEn, email, bankVi, bankEn, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

module.exports = router;