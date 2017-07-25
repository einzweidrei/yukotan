var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();
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
    var title = req.query.title;
    var process = req.query.process;
    var package = req.query.package;
    var work = req.query.work;
    var sort = req.query.sort || 'asc';

    taskController.getAll4Admin(page, limit, title, process,
        package, work, sort, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;
    taskController.getById(id, (error, data) => {
        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
    });
});

router.route('/create').post((req, res) => {
    var username = req.body.username;
    var title = req.body.title || "";
    var package = req.body.package;
    var work = req.body.work;
    var hour = req.body.hour || 0;
    var description = req.body.description || "";
    var price = req.body.price || 0;
    var addressName = req.body.addressName || "";
    var lat = req.body.lat || 0;
    var lng = req.body.lng || 0;
    var startAt = req.body.startAt || new Date();
    var endAt = req.body.endAt || new Date();
    var tools = req.body.tools || false;

    taskController.create4Admin(username, title, package, work, hour, description,
        price, addressName, lat, lng, startAt, endAt, tools, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/update').post((req, res) => {
    var id = req.body.id;
    var title = req.body.title || "";
    var package = req.body.package;
    var work = req.body.work;
    var hour = req.body.hour || 0;
    var description = req.body.description || "";
    var price = req.body.price || 0;
    var addressName = req.body.addressName || "";
    var lat = req.body.lat || 0;
    var lng = req.body.lng || 0;
    var startAt = req.body.startAt || new Date();
    var endAt = req.body.endAt || new Date();
    var tools = req.body.tools || false;

    taskController.update4Admin(id, title, package, work, hour, description,
        price, addressName, lat, lng, startAt, endAt, tools, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
});

router.route('/delete').post((req, res) => {
    var id = req.query.id;

    taskController.delete4Admin(id, (error, data) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/getAllDeletedTasks').get((req, res) => {
    var page = req.query.page || 1;
    var limit = req.query.limit || 10;
    var title = req.query.title;
    var process = req.query.process;
    var package = req.query.package;
    var work = req.query.work;
    var sort = req.query.sort || 'asc';

    taskController.getAllDeletedTasks(page, limit, title, process,
        package, work, sort, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
});

router.route('/removeById').post((req, res) => {
    var id = req.query.id;

    taskController.removeById(id, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

router.route('/removeAll').post((req, res) => {
    taskController.removeAll((error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;
