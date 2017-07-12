var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var mail = require('../_services/mail.service');
var mailService = new mail.MailService();

var as = require('../_services/app.service');
var AppService = new as.App();

var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var contMaid = require('../_controller/maid.controller');
var maidController = new contMaid.Maid();

var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();

var contTerm = require('../_controller/term.controller');
var termController = new contTerm.Term();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Term = require('../_model/term');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');
var AppInfo = require('../_model/app-info');
var cloudinary = require('cloudinary');
var ObjectId = require('mongoose').Types.ObjectId;

router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = AppService.getAppLanguage(baseUrl);

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            AppService.setLanguage(language);
            next();
        }
        else return msg.msgReturn(res, ms.LANGUAGE_NOT_SUPPORT);
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

// router.route('/resetPassword').post((req, res) => {
//     try {
//         var newPw = AppService.randomString(7);
//         var hashPw = AppService.hashString(newPw);

//         var username = req.body.username;
//         var email = req.body.email;

//         Owner.findOne({ 'info.username': username, 'info.email': email }).exec((error, data) => {
//             if (error) {
//                 console.log(error);
//                 return msg.msgReturn(res, 3);
//             } else {
//                 if (validate.isNullorEmpty(data)) {
//                     return msg.msgReturn(res, 4);
//                 } else {
//                     Owner.findOneAndUpdate({
//                         'info.username': username,
//                         'info.email': email
//                     }, {
//                             $set: {
//                                 'auth.password': hashPw
//                             }
//                         }, {
//                             upsert: true
//                         },
//                         (error) => {
//                             if (error) {
//                                 return msg.msgReturn(res, 3);
//                             } else {
//                                 return mailService.resetPassword(email, newPw, res);

//                                 // console.log(mailService.resetPassword(email, newPw));
//                                 // if (boolean) return msg.msgReturn(res, 0);
//                                 // return msg.msgReturn(res, 0);
//                             }
//                         }
//                     )
//                 }
//             }
//         });
//     } catch (error) {
//         return msg.msgReturn(res, 3);
//     }
// });

router.route('/getAllMaids').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 2;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var priceMin = req.query.priceMin;
        var priceMax = req.query.priceMax;

        var ageMin = req.query.ageMin;
        var ageMax = req.query.ageMax;

        var workId = req.query.workId;

        var gender = req.query.gender;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        maidController.getAllMaids(minDistance, maxDistance, limit, page, skip, priceMin, priceMax,
            ageMin, ageMax, workId, gender, sortBy, sortType, location, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskAround').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 5;
        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        taskController.getTaskAround(minDistance, maxDistance, sortBy, sortType, location, (error, data) => {
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getTaskByWork').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 5;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var title = req.query.title;
        var package = req.query.package;
        var work = req.query.work;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var location = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        taskController.getTaskByWork(minDistance, maxDistance, limit, page, skip, title, package, work,
            sortBy, sortType, location, (error, data) => {
                return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
            });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED);
    }
});

router.route('/getGV24HInfo').get((req, res) => {
    try {
        var id = req.query.id;

        termController.getInfo(id, (error, data) => {
            return error ? msg.msgReturn(res, error, {}) : msg.msgReturn(res, ms.SUCCESS, data);
        });
    } catch (error) {
        return msg.msgReturn(res, ms.EXCEPTION_FAILED, {});
    }
});

router.route('/maidForgotPassword').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;
        var verifyToken = AppService.getVerifyToken();

        Maid.findOne({ 'info.username': username, 'info.email': email, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3)
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4)
                } else {
                    Session.findOneAndUpdate({
                        'auth.userId': data._id,
                        status: true
                    }, {
                            $set: {
                                verification: {
                                    password: {
                                        key: verifyToken,
                                        date: new Date()
                                    }
                                }
                            }
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3)
                            return mailService.sendMail(res, data, verifyToken);
                        }
                    )
                }
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/ownerForgotPassword').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;
        var verifyToken = AppService.getVerifyToken();

        Owner.findOne({ 'info.username': username, 'info.email': email, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3)
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4)
                } else {
                    Session.findOneAndUpdate({
                        'auth.userId': data._id,
                        status: true
                    }, {
                            $set: {
                                verification: {
                                    password: {
                                        key: verifyToken,
                                        date: new Date()
                                    }
                                }
                            }
                        },
                        (error, session) => {
                            if (error) return msg.msgReturn(res, 3)
                            else if (validate.isNullorEmpty(session)) return msg.msgReturn(res, 4)
                            else return mailService.sendMail(res, data, verifyToken);
                        }
                    )
                }
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/getContact').get((req, res) => {
    try {
        AppInfo.findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v').exec((error, data) => {
                return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0, data)
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;