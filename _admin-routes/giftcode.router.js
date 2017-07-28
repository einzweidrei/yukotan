var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contGiftCode = require('../_controller/giftcode.controller');
var giftCodeController = new contGiftCode.Giftcode();
var as = require('../_services/app.service');
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getWebLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            if (req.headers.token) {
                var token = req.headers.token;
                sessionController.verifyWebToken(token, (error, data) => {
                    if (error) return msg.msgReturn(res, error);
                    else {
                        req.cookies['userId'] = data.auth.userId;
                        next();
                    }
                });
            } else return msg.msgReturn(res, ms.UNAUTHORIZED);
        } else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getAll').get((req, res) => {
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;

    var name = req.query.code;
    var valueMin = req.query.valueMin;
    var valueMax = req.query.valueMax;

    var limitStartAt = req.query.limitStartAt;
    var limitEndAt = req.query.limitEndAt;

    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var count = req.query.count;

    var sort = req.query.sort || 'asc'; // asc | desc

    giftCodeController.getAll(page, limit, name, valueMin, valueMax, limitStartAt,
        limitEndAt, startAt, endAt, count, sort, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    giftCodeController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/create').post((req, res) => {
    var name = req.body.code || "";
    var value = req.body.value || 0;
    var descriptionVi = req.body.descriptionVi || "";
    var descriptionEn = req.body.descriptionEn || "";
    var startAt = req.body.startAt || new Date();
    var endAt = req.body.endAt || new Date();
    var count = req.body.count || 0;

    giftCodeController.create(name, value, descriptionVi, descriptionEn,
        startAt, endAt, count, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var name = req.body.code || '';
    var value = req.body.value || 0;
    var descriptionVi = req.body.descriptionVi || '';
    var descriptionEn = req.body.descriptionEn || '';
    var startAt = req.body.startAt || new Date();
    var endAt = req.body.endAt || new Date();
    var count = req.body.count || 0;

    giftCodeController.update(id, name, value, descriptionVi, descriptionEn,
        startAt, endAt, count, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    giftCodeController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;