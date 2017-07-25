var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contContent = require('../_controller/content.controller');
var contentController = new contContent.Content();
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
    var type = req.query.type;
    contentController.getAll(type, (error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getWebAll').get((req, res) => {
    var type = req.query.type;
    contentController.getAll4Admin(type, (error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    contentController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/create').post((req, res) => {
    var type = req.body.type;
    var imageVi = req.body.imageVi || '';
    var imageEn = req.body.imageEn || '';

    var titleVi = req.body.titleVi || '';
    var titleEn = req.body.titleEn || '';

    var contentVi = req.body.contentVi || '';
    var contentEn = req.body.contentEn || '';

    contentController.create(type, imageVi, imageEn, titleVi, titleEn,
        contentVi, contentEn, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var imageVi = req.body.imageVi || '';
    var imageEn = req.body.imageEn || '';

    var titleVi = req.body.titleVi || '';
    var titleEn = req.body.titleEn || '';

    var contentVi = req.body.contentVi || '';
    var contentEn = req.body.contentEn || '';

    contentController.update(id, imageVi, imageEn, titleVi, titleEn,
        contentVi, contentEn, (error) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    contentController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;