var express = require('express');
var router = express.Router();
var messageService = require('../_services/message.service');
var msg = new messageService.Message();
var languageService = require('../_services/language.service');
var lnService = new languageService.Language();
var as = require('../_services/app.service');
var AppService = new as.App();
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();
var as = require('../_services/app.service');
var AppService = new as.App();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

router.use(function(req, res, next) {
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

router.route('/create').post((req, res) => {
    try {
        var ownerId = req.cookies.userId;
        var title = req.body.title || '';
        var package = req.body.package;
        var work = req.body.work;
        var description = req.body.description || '';
        var price = req.body.price || 0;
        var addressName = req.body.addressName || '';
        var lat = req.body.lat || 1;
        var lng = req.body.lng || 1;
        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var hour = req.body.hour || 1;
        var tools = req.body.tools || false;

        taskController.create(title, package, work, description, price, addressName, lat, lng,
            startAt, endAt, hour, tools, ownerId, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/update').put((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        var title = req.body.title || '';
        var package = req.body.package;
        var work = req.body.work;
        var description = req.body.description || '';
        var price = req.body.price || 0;
        var addressName = req.body.addressName || '';
        var lat = req.body.lat || 1;
        var lng = req.body.lng || 1;
        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var hour = req.body.hour || 1;
        var tools = req.body.tools || false;

        taskController.update(id, title, package, work, description, price, addressName,
            lat, lng, startAt, endAt, hour, tools, ownerId, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/delete').delete((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        var language = req.cookies.language;

        taskController.delete(id, ownerId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/cancel').delete((req, res) => {
    try {
        var id = req.body.id;
        var maidId = req.cookies.userId;
        var language = req.cookies.language;

        taskController.cancel(id, maidId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/reserve').post((req, res) => {
    try {
        var id = req.body.id;
        var maidId = req.cookies.userId;

        taskController.reverse(id, maidId, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/submit').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        var maidId = req.body.maidId;
        var language = req.cookies.language;

        taskController.submit(id, ownerId, maidId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/checkin').post(multipartMiddleware, (req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        if (!req.files.image) return msg.msgReturn(res, ms.EXCEPTION_FAILED);
        else {
            cloudinary.uploader.upload(
                req.files.image.path,
                function(result) {
                    var imageUrl = result.url;
                    taskController.checkIn(id, ownerId, imageUrl, (error, data) => {
                        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
                    });
                });
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/checkout').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        var language = req.cookies.language;

        taskController.checkOut(id, ownerId, language, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/sendRequest').post((req, res) => {
    try {
        var maidId = req.body.maidId;
        var ownerId = req.cookies.userId;
        var title = req.body.title || '';
        var package = req.body.package;
        var work = req.body.work;
        var description = req.body.description || '';
        var price = req.body.price || 0;
        var addressName = req.body.addressName || '';
        var lat = req.body.lat || 1;
        var lng = req.body.lng || 1;
        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var hour = req.body.hour || 1;
        var tools = req.body.tools || false;
        var language = req.cookies.language;

        taskController.sendRequest(maidId, ownerId, title, package, work, description, price,
            addressName, lat, lng, startAt, endAt, hour, tools, language, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/acceptRequest').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.body.ownerId;
        var maidId = req.cookies.userId;
        var language = req.cookies.language;

        taskController.acceptRequest(id, ownerId, maidId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/denyRequest').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.body.ownerId;
        var maidId = req.cookies.userId;
        var language = req.cookies.language;

        taskController.denyRequest(id, ownerId, maidId, language, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getRequest').get((req, res) => {
    try {
        var id = req.query.id;

        taskController.getRequest(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getComment').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var taskId = req.query.task;

        taskController.getComment(id, taskId, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

module.exports = router;