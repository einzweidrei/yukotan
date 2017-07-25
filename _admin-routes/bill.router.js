var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contBill = require('../_controller/bill.controller');
var billController = new contBill.Bill();
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
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var isSolved = req.query.isSolved;
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var sort = req.query.sort || 'asc'; // asc | desc

    billController.getAll(page, limit, isSolved, startAt,
        endAt, sort, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    billController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var isSolved = req.body.isSolved;
    var method = req.body.method || 1;

    billController.update(id, isSolved, method, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    billController.delete(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/getUserBills').get((req, res) => {
    var id = req.query.id;
    var user = req.query.user || 1;
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var isSolved = req.query.isSolved;
    var startAt = req.query.startAt;
    var endAt = req.query.endAt;
    var sort = req.query.sort || 'asc'; // asc | desc

    billController.getUserBills(id, user, page, limit, isSolved,
        startAt, endAt, sort, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

module.exports = router;