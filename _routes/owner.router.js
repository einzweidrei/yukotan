var express = require('express');
var mongoose = require('mongoose');
var async = require('promise-async');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Mail = require('../_services/mail.service');
var MailService = new Mail.MailService();

var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();

var contOwner = require('../_controller/owner.controller');
var ownerController = new contOwner.Owner();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');
var Report = require('../_model/report');
var Bill = require('../_model/bill');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var ObjectId = require('mongoose').Types.ObjectId;
var cloudinary = require('cloudinary');

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

            if (req.headers.hbbgvauth) {
                var token = req.headers.hbbgvauth;
                sessionController.verifyToken(token, (error, data) => {
                    if (error) return msg.msgReturn(res, 3);
                    else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 14);
                    else {
                        req.cookies['userId'] = data.auth.userId;
                        next();
                    }
                });
            } else {
                return msg.msgReturn(res, 14);
            }
        } else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/checkToken').get((req, res) => {
    try {
        return msg.msgReturn(res, 0);
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

/** GET - Get Owner By Owner ID
 * info {
 *      type: GET
 *      url: /getById
 *      name: Get Owner By Owner ID
 *      description: Get one owner's information by Owner's ID
 * }
 * 
 * params {
 *      id: owner_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;
        ownerController.getById(id, (error, data) => {
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').put(multipartMiddleware, (req, res) => {
    try {
        var owner = new Owner();
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
                if (error) return msg.msgReturn(res, 3, {});
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4, {});
                return msg.msgReturn(res, 0, data);
            });
        } else {
            cloudinary.uploader.upload(
                req.files.image.path,
                function (result) {
                    image = result.url;
                    ownerController.updateInfo(id, name, phone, age, address, gender, location, image, (error, data) => {
                        if (error) return msg.msgReturn(res, 3, {});
                        else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4, {});
                        return msg.msgReturn(res, 0, data);
                    })
                });
        }
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3, {});
    }
});

router.route('/getMyInfo').get((req, res) => {
    try {
        var id = req.cookies.userId;

        ownerController.getMyInfo(id, (error, data) => {
            if (error) return msg.msgReturn(res, 3, {});
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4, {});
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3, {});
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
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
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
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllWorkedMaid').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        ownerController.getAllWorkedMaid(id, startAt, endAt, (error, data) => {
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
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
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
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
            if (error) return msg.msgReturn(res, error);
            return msg.msgReturn(res, 0);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getComment').get((req, res) => {
    try {
        var id = req.query.id;

        var limit = parseFloat(req.query.limit) || 20;
        var page = req.query.page || 1;

        var query = { toId: id };
        var options = {
            select: 'evaluation_point content task createAt fromId',
            populate: { path: 'task', select: 'info' },
            sort: {
                createAt: -1
            },
            page: page,
            limit: limit
        };

        Comment.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                Maid.populate(data, { path: 'docs.fromId', select: 'info' }, (error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            return msg.msgReturn(res, 4);
                        } else {
                            return msg.msgReturn(res, 0, data);
                        }
                    }
                });
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/report').post((req, res) => {
    try {
        var report = new Report();
        report.ownerId = req.cookies.userId;
        report.maidId = req.body.toId;
        report.from = 1;
        report.content = req.body.content;
        report.createAt = new Date();
        report.status = true;

        Maid.findOne({ _id: report.maidId, status: true }).select('work_info').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    report.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0);
                    });
                }
            }
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

        const billQuery = {
            owner: new ObjectId(id),
            isSolved: true
        };

        const taskQuery = {
            'stakeholders.owner': new ObjectId(id),
            status: true
        };

        if (startAt || endAt) {
            const timeQuery = {};

            if (startAt) {
                var date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                var date = new Date(endAt);
                date.setUTCHours(0, 0, 0, 0);
                date = new Date(date.getTime() + 1000 * 3600 * 24 * 1);
                timeQuery['$lt'] = date;
            }

            billQuery['createAt'] = timeQuery;
            // taskQuery['info.time.startAt'] = timeQuery;
            taskQuery['history.createAt'] = timeQuery;
        };

        async.parallel({
            owner: function (callback) {
                Owner.findOne({ _id: id, status: true }).exec((error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        callback(null, data);
                    }
                });
            },
            bill: function (callback) {
                Bill.aggregate([{
                    $match: billQuery
                },
                {
                    $group: {
                        _id: null,
                        totalPrice: {
                            $sum: '$price'
                        }
                    }
                },
                ], (error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            const d = {
                                _id: null,
                                totalPrice: 0
                            }
                            callback(null, d);
                        } else {
                            callback(null, data[0]);
                        }
                    }
                });
            },
            task: function (callback) {
                Task.aggregate([{
                    $match: taskQuery
                },
                {
                    $group: {
                        _id: '$process',
                        count: {
                            $sum: 1
                        }
                    }
                }
                ], (error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        callback(null, data);
                    }
                });
            }
        }, (error, result) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                var task = result.task;
                var bill = result.bill;
                var owner = result.owner;

                var g = {};

                const d = {
                    totalPrice: bill.totalPrice,
                    task: task,
                    wallet: owner.wallet
                }

                return msg.msgReturn(res, 0, d);
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getDebt').get((req, res) => {
    try {
        var id = req.cookies.userId;
        const startAt = req.query.startAt;
        const endAt = req.query.endAt;

        var billQuery = {
            owner: new ObjectId(id),
            isSolved: false
        }

        var sortQuery = { createAt: -1 };

        if (startAt || endAt) {
            const timeQuery = {};

            if (startAt) {
                var date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                var date = new Date(endAt);
                date.setUTCHours(0, 0, 0, 0);
                date = new Date(date.getTime() + 1000 * 3600 * 24 * 1);
                timeQuery['$lt'] = date;
            }

            billQuery['createAt'] = timeQuery;
        };

        Bill.aggregate({
            $match: billQuery
        }, {
                $sort: sortQuery
            }, {
                $project: {
                    _id: 1,
                    task: 1,
                    price: 1,
                    period: 1,
                    wallet: 1
                }
            },
            (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Task.populate(data, { path: 'task', select: 'info stakeholders check process history' }, (error, result) => {
                            if (error) return msg.msgReturn(res, 3);
                            if (validate.isNullorEmpty(result)) return msg.msgReturn(res, 4);
                            Maid.populate(result, { path: 'task.stakeholders.received', select: 'info work_info' }, (error, result) => {
                                Work.populate(result, [
                                    { path: 'task.info.work', select: 'name image' },
                                    { path: 'task.stakeholders.received.work_info.ability', select: 'name image' }
                                ],
                                    (error, result) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        Package.populate(result, { path: 'task.info.package', select: 'name' }, (error, result) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            Process.populate(result, { path: 'task.process', select: 'name' }, (error, result) => {
                                                if (error) return msg.msgReturn(res, 3);
                                                return msg.msgReturn(res, 0, result)
                                            });
                                        });
                                    });
                            });
                        });
                    }
                }
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getWallet').get((req, res) => {
    try {
        var id = req.cookies.userId

        Owner.findOne({ _id: id, status: true }).select('wallet').exec((error, data) => {
            return error ? msg.msgReturn(res, 3) : validate.isNullorEmpty(data) ? msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data)
        })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
});

router.route('/onAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;
        var device_token = req.body.device_token;

        Owner.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    'auth.device_token': device_token
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3)
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4)
                return msg.msgReturn(res, 0)
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
});

router.route('/offAnnouncement').post((req, res) => {
    try {
        var id = req.cookies.userId;

        Owner.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    'auth.device_token': ''
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3)
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4)
                return msg.msgReturn(res, 0)
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
});

module.exports = router;