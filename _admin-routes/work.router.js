var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contWork = require('../_controller/work.controller');
var workController = new contWork.Work();
var as = require('../_services/app.service');
var AppService = new as.App();
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
                sessionController.verifyToken(token, (error, data) => {
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

router.route('/create').post((req, res) => {
    try {
        var nameVi = req.body.nameVi;
        var nameEn = req.body.nameEn;
        var image = req.body.image;
        var titleVi = req.body.titleVi || '';
        var titleEn = req.body.titleEn || '';
        var descriptionVi = req.body.descriptionVi || '';
        var descriptionEn = req.body.descriptionEn || '';
        var price = req.body.price || 0;
        var suggest = req.body.suggest || '';
        var weight = req.body.weight || 0;

        workController.create(nameVi, nameEn, image, titleVi, titleEn,
            descriptionVi, descriptionEn, price, suggest, weight, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/update').post((req, res) => {
    try {
        var id = req.body.id;
        var nameVi = req.body.nameVi || '';
        var nameEn = req.body.nameEn || '';
        var image = req.body.image || '';
        var titleVi = req.body.titleVi || '';
        var titleEn = req.body.titleEn || '';
        var descriptionVi = req.body.descriptionVi || '';
        var descriptionEn = req.body.descriptionEn || '';
        var price = req.body.price || 0;
        var suggest = req.body.suggest || '';
        var weight = req.body.weight || 0;

        workController.update(id, nameVi, nameEn, image, titleVi, titleEn,
            descriptionVi, descriptionEn, price, suggest, weight, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/delete').post((req, res) => {
    try {
        var id = req.query.id;

        workController.delete(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        workController.getInfo4Admin(id, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getAll').get((req, res) => {
    try {
        workController.getAll4Admin((error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

module.exports = router;