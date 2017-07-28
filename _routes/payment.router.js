var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var contPayment = require('../_controller/payment.controller');
var paymentController = new contPayment.Payment();
var as = require('../_services/app.service');
var AppService = new as.App();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getAppLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            if (req.headers.hbbgvauth) {
                var token = req.headers.hbbgvauth;
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

router.route('/payBillGV').post((req, res) => {
    try {
        var userId2 = req.cookies.userId;
        var billId = req.body.billId;

        paymentController.payByNGV247(userId2, billId, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/payDirectly').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;
        var language = req.cookies.language;

        paymentController.payDirectly(userId, billId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getDirectlyBill').get((req, res) => {
    try {
        var id = req.query.id;
        var userId = req.cookies.userId;

        paymentController.getDirectlyBill(id, userId, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/payDirectConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;
        var language = req.cookies.language;

        paymentController.payDirectConfirm(userId, billId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/cancelDirectConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;
        var language = req.cookies.language;

        paymentController.cancelDirectConfirm(userId, billId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/payOnlineConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        paymentController.payOnlineConfirm(userId, billId, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/payOnline').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        paymentController.payOnline(userId, billId, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/chargeOnlineFiConfirm').post((req, res) => {
    try {
        var price = req.body.price || 0;
        var ownerId = req.cookies.userId;

        paymentController.chargeOnlineFirst(ownerId, price, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/chargeOnlineSecConfirm').post((req, res) => {
    try {
        if (req.headers.hbbgvaccesskey) {
            var key = req.headers.hbbgvaccesskey;
            var ownerId = req.cookies.userId;
            var billId = req.body.billId;

            paymentController.chargeOnlineSecond(ownerId, billId, key, (error, data) => {
                return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
            });
        } else {
            return msg.msgReturn(res, ms.INVALID_KEY, { key: req.headers.hbbgv_accesskey });
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/chargeOnlineThiConfirm').post((req, res) => {
    try {
        if (req.headers.hbbgvaccesskey) {
            var key = req.headers.hbbgvaccesskey;
            var ownerId = req.cookies.userId;
            var billId = req.body.billId;

            paymentController.chargeOnlineThird(ownerId, billId, key, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
        } else {
            return msg.msgReturn(res, ms.INVALID_KEY);
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

module.exports = router;