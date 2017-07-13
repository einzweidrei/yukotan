var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var async = require('promise-async');
var request = require('request');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var FCM = require('../_services/fcm.service');
var FCMService = new FCM.FCMService();

var as = require('../_services/app.service');
var AppService = new as.App();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Bill = require('../_model/bill');
var Comment = require('../_model/comment');
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var ObjectId = require('mongoose').Types.ObjectId;

var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();
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
                function (result) {
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

/** POST - Check Out Task
 * info {
 *      type: POST
 *      url: /checkout
 *      role: Owner
 *      name: Check Out Task
 *      description: Check out one task by Owner
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 *      ownerId: owner_ID
 * }
 */
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

        Owner.findOne({ _id: ownerId, status: true }).exec((error, owner) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(owner)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Task.findOne({ _id: id, process: '000000000000000000000006', 'stakeholders.owner': ownerId }).exec((error, data) => {
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            if (validate.isNullorEmpty(data)) {
                                return msg.msgReturn(res, 4);
                            } else {
                                Task.findOneAndUpdate({
                                    _id: id,
                                    process: '000000000000000000000006',
                                    'stakeholders.owner': ownerId
                                }, {
                                        status: false
                                    },
                                    (error) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        return owner.auth.device_token == '' ?
                                            msg.msgReturn(res, 17) :
                                            FCMService.pushNotification(res, owner, req.cookies.language, 13, [], '')
                                    }
                                )
                            }
                        }
                    });
                }
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getRequest').get((req, res) => {
    try {
        var id = req.query.id;
        var matchQuery = { _id: new ObjectId(id), status: true };

        Task.aggregate([{
            $match: matchQuery
        },
        {
            $project: {
                request: '$stakeholders.request'
            }
        }
        ], (error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Maid.populate(data, { path: 'request.maid', select: 'info work_info' }, (error, result) => {
                        if (error) return msg.msgReturn(res, 3)
                        Work.populate(result, { path: 'request.maid.work_info.ability', select: 'name image' }, (error, result) => {
                            if (error) return msg.msgReturn(res, 3)
                            return msg.msgReturn(res, 0, result)
                        })
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getComment').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var task = req.query.task;

        Comment.findOne({ fromId: id, task: task, status: true }).select('createAt evaluation_point content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3, {});
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4, {});
                } else {
                    return msg.msgReturn(res, 0, data);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3, {});
    }
});

module.exports = router;