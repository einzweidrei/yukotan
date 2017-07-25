var express = require('express');
var mongoose = require('mongoose');
var async = require('promise-async');
var ObjectId = require('mongoose').Types.ObjectId;
var router = express.Router();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var cloudinary = require('cloudinary');

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();

var contOwner = require('../_controller/owner.controller');
var ownerController = new contOwner.Owner();

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

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;
        ownerController.getById(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/update').put(multipartMiddleware, (req, res) => {
    try {
        var id = req.cookies.userId;

        var image = '';
        var phone = req.body.phone || '';
        var name = req.body.name || '';
        var age = req.body.age || 18;
        var address = {
            name: req.body.addressName || '',
            coordinates: {
                lat: req.body.lat || 0,
                lng: req.body.lng || 0
            }
        };
        var gender = req.body.gender || 0;

        var location = {
            type: 'Point',
            coordinates: [req.body.lng || 0, req.body.lat || 0]
        }

        if (!req.files.image) {
            ownerController.updateInfo(id, name, phone, age, address, gender, location, image, (error, data) => {
                return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
            });
        } else {
            cloudinary.uploader.upload(
                req.files.image.path,
                function (result) {
                    image = result.url;
                    ownerController.updateInfo(id, name, phone, age, address, gender, location, image, (error, data) => {
                        return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
                    });
                });
        }
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getMyInfo').get((req, res) => {
    try {
        var id = req.cookies.userId;

        ownerController.getMyInfo(id, (error, data) => {
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

        ownerController.getAllTasks(id, process, startAt, endAt, limit, sortByTaskTime, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getHistoryTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        // var maidId = req.query.maid;
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

        ownerController.getHistoryTasks(id, process, startAt, endAt, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getAllWorkedMaid').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        ownerController.getAllWorkedMaid(id, startAt, endAt, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskOfMaid').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var maidId = req.query.maid;
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

        ownerController.getTaskOfMaid(id, maidId, process, startAt, endAt, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/comment').post((req, res) => {
    try {
        var fromId = req.cookies.userId;
        var toId = req.body.toId;
        var task = req.body.task;
        var content = req.body.content;
        var evaluation_point = req.body.evaluation_point;

        ownerController.comment(fromId, toId, task, content, evaluation_point, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
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

        ownerController.getComment(id, limit, page, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/report').post((req, res) => {
    try {
        var ownerId = req.cookies.userId;
        var maidId = req.body.toId;
        var content = req.body.content;

        ownerController.report(ownerId, maidId, content, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, 0);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/statistical').get((req, res) => {
    try {
        const id = req.cookies.userId;
        const startAt = req.query.startAt;
        const endAt = req.query.endAt;

        ownerController.statistical(id, startAt, endAt, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/getDebt').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        ownerController.getDebt(id, startAt, endAt, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getWallet').get((req, res) => {
    try {
        var id = req.cookies.userId

        ownerController.getWallet(id, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/onAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;
        var device_token = req.body.device_token;

        ownerController.onAnnouncement(id, device_token, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/offAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;

        ownerController.onAnnouncement(id, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/changePassword').post((req, res) => {
    var id = req.body.id;
    var oldpw = req.body.oldpw;
    var newpw = req.body.newpw;

    ownerController.changePassword(id, oldpw, newpw, (error) => {
        return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS);
    });
});

module.exports = router;