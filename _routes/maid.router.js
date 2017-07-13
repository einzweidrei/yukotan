var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var contMaid = require('../_controller/maid.controller');
var maidController = new contMaid.Maid();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var as = require('../_services/app.service');
var AppService = new as.App();

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
            }
            else return msg.msgReturn(res, ms.UNAUTHORIZED);
        }
        else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/checkToken').get((req, res) => {
    try {
        return msg.msgReturn(res, ms.SUCCESS);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
})

router.route('/getAbility').get((req, res) => {
    try {
        var id = req.cookies.userId;
        maidController.getAbility(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        maidController.getById(id, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getAllTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var process = req.query.process;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 0;
        var sortByTaskTime = req.query.sortByTaskTime;

        maidController.getAllTasks(id, process, startAt, endAt, limit, sortByTaskTime, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getComment').get((req, res) => {
    try {
        var id = req.query.id;

        var limit = parseFloat(req.query.limit) || 20;
        var page = req.query.page || 1;

        maidController.getComment(id, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getHistoryTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

        maidController.getHistoryTasks(id, process, startAt, endAt, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getAllWorkedOwner').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        maidController.getAllWorkedOwner(id, startAt, endAt, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskComment').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var task = req.query.task;

        maidController.getTaskComment(id, task, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getTaskOfOwner').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var ownerId = req.query.owner;
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

        maidController.getTaskOfOwner(id, ownerId, process, startAt, endAt, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/statistical').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        maidController.statistical(id, startAt, endAt, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/report').post((req, res) => {
    try {
        var maidId = req.cookies.userId;
        var ownerId = req.body.toId;
        var content = req.body.content;

        maidController.report(maidId, ownerId, content, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/onAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;
        var device_token = req.body.device_token;

        maidController.onAnnouncement(id, device_token, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/offAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;

        maidController.offAnnouncement(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

module.exports = router;