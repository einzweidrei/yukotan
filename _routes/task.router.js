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
            return error ? msg.msgReturn(res, error) : msg.msgReturn(res, ms.SUCCESS, data);
        });

        // async.parallel({
        //     task: function (callback) {
        //         Task.findOne({
        //             _id: id,
        //             'stakeholders.owner': ownerId,
        //             process: '000000000000000000000004',
        //             status: true
        //         }).exec((error, data) => {
        //             if (error) {
        //                 callback(null, 2);
        //             } else {
        //                 if (validate.isNullorEmpty(data)) {
        //                     callback(null, 1);
        //                 } else {
        //                     if (validate.isNullorEmpty(data.check.check_in)) {
        //                         callback(null, 4);
        //                     } else if (validate.isNullorEmpty(data.check.check_out)) {
        //                         callback(null, 0);
        //                     } else {
        //                         callback(null, 3);
        //                     }
        //                 }
        //             }
        //         });
        //     }
        // }, (error, result) => {
        //     if (error) {
        //         return msg.msgReturn(res, 3, {});
        //     } else {
        //         if (result.task == 0) {
        //             var checkOut = new Date();
        //             Task.findOneAndUpdate({
        //                 _id: id,
        //                 'stakeholders.owner': ownerId,
        //                 process: '000000000000000000000004',
        //                 status: true
        //             }, {
        //                     $set: {
        //                         process: new ObjectId('000000000000000000000005'),
        //                         'check.check_out': checkOut
        //                     }
        //                 }, {
        //                     upsert: true
        //                 },
        //                 (error, task) => {
        //                     if (error) return msg.msgReturn(res, 3, {});
        //                     else {
        //                         var bill = new Bill();
        //                         bill.owner = task.stakeholders.owner;
        //                         bill.maid = task.stakeholders.received;
        //                         bill.task = task._id;
        //                         bill.isSolved = false;
        //                         bill.date = new Date();
        //                         bill.createAt = new Date();
        //                         bill.method = 1;
        //                         bill.status = true;

        //                         Maid.findOne({ _id: task.stakeholders.received, status: true }).exec((error, maid) => {
        //                             if (error) return msg.msgReturn(res, 3, {});
        //                             else if (validate.isNullorEmpty(maid)) return msg.msgReturn(res, 4, {});
        //                             else {
        //                                 if (task.info.package == '000000000000000000000001') {
        //                                     bill.price = task.info.price;

        //                                     var timeIn = new Date(task.info.time.startAt);
        //                                     var timeOut = new Date(task.info.time.endAt);

        //                                     var t = new Date(timeOut.getTime() - timeIn.getTime());
        //                                     bill.period = t;

        //                                     var dt = {
        //                                         _id: bill._id,
        //                                         period: t,
        //                                         price: task.info.price,
        //                                         date: new Date()
        //                                     }

        //                                     bill.save((error) => {
        //                                         if (error) return msg.msgReturn(res, 3);
        //                                         return maid.auth.device_token == '' ?
        //                                             msg.msgReturn(res, 17, dt) :
        //                                             FCMService.pushNotification(res, maid, req.cookies.language, 5, dt, '')
        //                                     });
        //                                 } else if (task.info.package == '000000000000000000000002') {
        //                                     if (error) {
        //                                         return msg.msgReturn(res, 0, {});
        //                                     } else {
        //                                         if (validate.isNullorEmpty(maid)) {
        //                                             return msg.msgReturn(res, 4, {});
        //                                         } else {
        //                                             var timeIn = new Date(task.check.check_in);
        //                                             var timeOut = new Date(checkOut);
        //                                             var diff = new Date(timeOut.getTime() - timeIn.getTime());

        //                                             var price = AppService.countPrice(diff, maid.work_info.price);

        //                                             bill.period = diff;
        //                                             bill.price = price;

        //                                             var dt = {
        //                                                 _id: bill._id,
        //                                                 period: diff,
        //                                                 price: price,
        //                                                 date: new Date()
        //                                             }

        //                                             bill.save((error) => {
        //                                                 if (error) return msg.msgReturn(res, 3);
        //                                                 else {
        //                                                     return maid.auth.device_token == '' ?
        //                                                         msg.msgReturn(res, 17, dt) :
        //                                                         FCMService.pushNotification(res, maid, req.cookies.language, 5, dt, '')
        //                                                 }
        //                                             });
        //                                         }
        //                                     }
        //                                 } else {
        //                                     return msg.msgReturn(res, 4, {});
        //                                 }
        //                             }
        //                         })
        //                     }
        //                 }
        //             );
        //         } else {
        //             if (result.task == 1) {
        //                 return msg.msgReturn(res, 4, {});
        //             } else if (result.task == 3) {
        //                 return msg.msgReturn(res, 12, {});
        //             } else if (result.task == 4) {
        //                 return msg.msgReturn(res, 13, {});
        //             } else {
        //                 return msg.msgReturn(res, 3, {});
        //             }
        //         }
        //     }
        // });
    } catch (error) {
        return msg.msgReturn(res, 3, {});
    }
});

router.route('/sendRequest').post((req, res) => {
    try {
        var task = new Task();
        var maidId = req.body.maidId;
        var ownerId = req.cookies.userId;

        task.info = {
            title: req.body.title || "",
            package: req.body.package,
            work: req.body.work,
            description: req.body.description || "",
            price: req.body.price || 0,
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            time: {
                startAt: req.body.startAt || new Date(),
                endAt: req.body.endAt || new Date(),
                hour: req.body.hour || 0
            },
            tools: req.body.tools || false
        };

        task.stakeholders = {
            owner: ownerId,
            request: [{
                maid: maidId,
                time: new Date()
            }],
            received: maidId
        };

        task.process = '000000000000000000000006';

        task.location = {
            type: 'Point',
            coordinates: [
                req.body.lng || 0,
                req.body.lat || 0
            ]
        };

        task.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        task.status = true;

        Owner.findOne({ _id: ownerId, status: true }).exec((error, owner) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(owner)) {
                    return msg.msgReturn(res, 4);
                } else {
                    async.parallel({
                        maid: function (callback) {
                            Maid.findOne({ _id: maidId }).exec((error, data) => {
                                if (error) {
                                    callback(null, { value: 2 });
                                } else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, { value: 1 });
                                    } else {
                                        callback(null, { value: 0, data: data });
                                    }
                                }
                            });
                        },
                        work: function (callback) {
                            Work.findOne({ _id: req.body.work }).exec((error, data) => {
                                if (error) {
                                    callback(null, 2);
                                } else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, 1);
                                    } else {
                                        callback(null, 0);
                                    }
                                }
                            });
                        },
                        task: function (callback) {
                            Task.find({
                                'stakeholders.owner': ownerId,
                                process: { $in: ['000000000000000000000001', '000000000000000000000006'] },
                                status: true
                            }).exec((error, data) => {
                                if (error) {
                                    callback(null, 2);
                                } else {
                                    if (validate.isNullorEmpty(data) || !data || data.length <= 10) {
                                        callback(null, 0);
                                    } else {
                                        callback(null, 4);
                                    }
                                }
                            });
                        },
                        // task2: function (callback) {
                        //     Task.findOne(
                        //         {
                        //             'stakeholders.received': maidId,
                        //             process: { $in: ['000000000000000000000003', '000000000000000000000004'] },
                        //             status: true,
                        //             $or: [
                        //                 //x >= s & y <= e
                        //                 {
                        //                     'info.time.startAt': {
                        //                         $gte: data.info.time.startAt
                        //                     },
                        //                     'info.time.endAt': {
                        //                         $lte: data.info.time.endAt
                        //                     }
                        //                 },

                        //                 //x <= s & y >= e
                        //                 {
                        //                     'info.time.startAt': {
                        //                         $lte: data.info.time.startAt
                        //                     },
                        //                     'info.time.endAt': {
                        //                         $gte: data.info.time.endAt
                        //                     }
                        //                 },

                        //                 //x [>= s & <= e] & y >= e
                        //                 {
                        //                     'info.time.startAt': {
                        //                         $gte: data.info.time.startAt,
                        //                         $lte: data.info.time.endAt
                        //                     },
                        //                     'info.time.endAt': {
                        //                         $gte: data.info.time.endAt
                        //                     }
                        //                 },

                        //                 //x <= s & y [>= s & <= e]
                        //                 {
                        //                     'info.time.startAt': {
                        //                         $lte: data.info.time.startAt
                        //                     },
                        //                     'info.time.endAt': {
                        //                         $gte: data.info.time.startAt,
                        //                         $lte: data.info.time.endAt
                        //                     }
                        //                 },
                        //             ]
                        //         }
                        //     ).exec((error, result) => {
                        //         if (error) {
                        //             callback(null, 2);
                        //         } else {
                        //             if (validate.isNullorEmpty(result)) {
                        //                 callback(null, 0);
                        //             } else {
                        //                 callback(null, 3);
                        //             }
                        //         }
                        //     });
                        // }
                    }, (error, result) => {
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            if (result.work == 0 && result.maid.value == 0 && result.task == 0) {
                                task.save((error) => {
                                    if (error) {
                                        return msg.msgReturn(res, 3);
                                    } else {
                                        return result.maid.data.auth.device_token == '' ?
                                            msg.msgReturn(res, 17) :
                                            FCMService.pushNotification(res, result.maid.data, req.cookies.language, 6, [], '')
                                    }
                                });
                            } else {
                                if (result.work == 1) {
                                    return msg.msgReturn(res, 4);
                                } else if (result.task == 4) {
                                    return msg.msgReturn(res, 8);
                                }
                                // else if (result.task2 == 3) {
                                //     return msg.msgReturn(res, 10);
                                // } 
                                else {
                                    return msg.msgReturn(res, 3);
                                }
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/acceptRequest').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.body.ownerId;
        var maidId = req.cookies.userId;

        async.parallel({
            //check maid exist
            owner: function (callback) {
                Owner.findOne({ _id: ownerId, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, { value: 2 });
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, { value: 1 });
                        } else {
                            callback(null, { value: 0, data: data });
                        }
                    }
                });
            },

            //check task exist
            task: function (callback) {
                Task.findOne({
                    _id: id,
                    'stakeholders.owner': ownerId,
                    process: '000000000000000000000006',
                    status: true
                }).exec((error, data) => {
                    if (error) {
                        callback(null, 2);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            //check no-duplicated time of task
                            Task.findOne({
                                'stakeholders.received': maidId,
                                process: '000000000000000000000003',
                                status: true,
                                $or: [
                                    //x >= s & y <= e
                                    {
                                        'info.time.startAt': {
                                            $gte: data.info.time.startAt
                                        },
                                        'info.time.endAt': {
                                            $lte: data.info.time.endAt
                                        }
                                    },

                                    //x <= s & y >= e
                                    {
                                        'info.time.startAt': {
                                            $lte: data.info.time.startAt
                                        },
                                        'info.time.endAt': {
                                            $gte: data.info.time.endAt
                                        }
                                    },

                                    //x [>= s & <= e] & y >= e
                                    {
                                        'info.time.startAt': {
                                            $gte: data.info.time.startAt,
                                            $lte: data.info.time.endAt
                                        },
                                        'info.time.endAt': {
                                            $gte: data.info.time.endAt
                                        }
                                    },

                                    //x <= s & y [>= s & <= e]
                                    {
                                        'info.time.startAt': {
                                            $lte: data.info.time.startAt
                                        },
                                        'info.time.endAt': {
                                            $gte: data.info.time.startAt,
                                            $lte: data.info.time.endAt
                                        }
                                    },
                                ]
                            }).exec((error, result) => {
                                if (error) {
                                    callback(null, 2);
                                } else {
                                    if (validate.isNullorEmpty(result)) {
                                        callback(null, 0);
                                    } else {
                                        callback(null, 3);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }, (error, result) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (result.owner.value == 0 && result.task == 0) {
                    Task.findOneAndUpdate({
                        _id: id,
                        'stakeholders.owner': ownerId,
                        process: '000000000000000000000006',
                        status: true
                    }, {
                            $set: {
                                'stakeholders.received': maidId,
                                process: new ObjectId('000000000000000000000003')
                            }
                        }, {
                            upsert: true
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3);
                            else {
                                return result.owner.data.auth.device_token == '' ?
                                    msg.msgReturn(res, 17) :
                                    FCMService.pushNotification(res, result.owner.data, req.cookies.language, 2, [], '')
                            }
                        }
                    );
                } else {
                    if (result.owner.value == 1 || result.task == 1) {
                        return msg.msgReturn(res, 4);
                    } else if (result.task == 3) {
                        return msg.msgReturn(res, 10);
                    } else {
                        return msg.msgReturn(res, 3);
                    }
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
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