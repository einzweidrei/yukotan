var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contMaidRegister = require('../_controller/maid-register.controller');
var maidRegisterController = new contMaidRegister.MaidRegister();
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

router.route('/getAll').get((req, res) => {
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var sort = req.query.sort || 'asc';

    maidRegisterController.getAll(page, limit, sort, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    maidRegisterController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var process = req.body.process || false;

    maidRegisterController.update(id, process, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    maidRegisterController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/statistical').get((req, res) => {
    maidRegisterController.statistical((error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

module.exports = router;