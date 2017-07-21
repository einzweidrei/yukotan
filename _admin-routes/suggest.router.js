var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contSuggest = require('../_controller/suggest.controller');
var suggestController = new contSuggest.Suggest();
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

router.route('/getSuggest').get((req, res) => {
    suggestController.getAll((error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getAll').get((req, res) => {
    suggestController.getAll4Admin((error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    suggestController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/create').post((req, res) => {
    var nameVi = req.body.nameVi || '';
    var nameEn = req.body.nameEn || '';

    suggestController.create(nameVi, nameEn, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var nameVi = req.body.nameVi || '';
    var nameEn = req.body.nameEn || '';

    suggestController.update(id, nameVi, nameEn, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/delete').post((req, res) => {
    var id = req.body.id;

    suggestController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;