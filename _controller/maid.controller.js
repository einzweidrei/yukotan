var mMaid = require('../_model/maid');
var mTask = require('../_model/task');
var mOwner = require('../_model/owner');
var mComment = require('../_model/comment');
var mBill = require('../_model/bill');
var mReport = require('../_model/report');
var async = require('promise-async');
var as = require('../_services/app.service');
var AppService = new as.App();
var contReport = require('../_controller/report.controller');
var reportController = new contReport.Report();
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var mail = require('../_services/mail.service');
var mailService = new mail.MailService();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var ObjectId = require('mongoose').Types.ObjectId;

var Maid = (function () {
    function Maid() { }

    Maid.prototype.findOne = (searchQuery, callback) => {
        mMaid.findOne(searchQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Maid.prototype.findOneAndUpdate = (searchQuery, setQuery, callback) => {
        mMaid.findOneAndUpdate(
            searchQuery,
            {
                $set: setQuery
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, data);
            }
        );
    }

    Maid.prototype.aggregate = (aggregateQuery, callback) => {
        mMaid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Maid.prototype.getAllMaids = (minDistance, maxDistance, limit, page, skip, priceMin, priceMax, ageMin, ageMax, workId, gender, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == 'desc') {
            sortBy == 'price' ? sortQuery = { 'work_info.price': -1 } : sortQuery = { 'dist.calculated': -1 }
        } else {
            sortBy == 'price' ? sortQuery = { 'work_info.price': 1 } : sortQuery = { 'dist.calculated': 1 }
        };

        var matchQuery = { status: true };

        if (ageMin || ageMax) {
            var query = {};
            if (ageMin) query['$gte'] = parseFloat(ageMin);
            if (ageMax) query['$lte'] = parseFloat(ageMax);
            matchQuery['info.age'] = query;
        }

        if (priceMin || priceMax) {
            var query = {};
            if (priceMin) query['$gte'] = parseFloat(priceMin);
            if (priceMax) query['$lte'] = parseFloat(priceMax);
            matchQuery['work_info.price'] = query;
        }

        if (workId) matchQuery['work_info.ability'] = new ObjectId(workId);
        if (gender) matchQuery['info.gender'] = parseFloat(gender);

        var maid = new Maid();

        var aggregateQuery = [
            {
                $geoNear: {
                    near: location,
                    distanceField: 'dist.calculated',
                    minDistance: parseFloat(minDistance),
                    maxDistance: parseFloat(maxDistance) * 1000,
                    spherical: true
                }
            },
            {
                $match: matchQuery
            },
            {
                $sort: sortQuery
            },
            {
                $project: {
                    info: 1,
                    work_info: 1
                }
            }
        ];

        maid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    Maid.prototype.forgotPassword = (username, email, callback) => {
        var verifyToken = AppService.getVerifyToken();
        var searchQuery = {
            'info.username': username,
            'info.email': email,
            status: true
        };

        var maid = new Maid();
        maid.findOne(searchQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                var sessionSearch = {
                    'auth.userId': data._id,
                    status: true
                };

                var sessionSet = {
                    verification: {
                        password: {
                            key: verifyToken,
                            date: new Date()
                        }
                    }
                };

                sessionController.findOneAndUpdate(sessionSearch, sessionSet, true, (error, sess) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else {
                        mailService.sendConfirmForgotPwMail(data, verifyToken, (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            return callback(null, data);
                        });
                    }
                });
            }
        });
    }

    Maid.prototype.getAbility = (id, callback) => {
        mMaid
            .findOne({ _id: id, status: true })
            .populate({ path: 'work_info.ability', select: 'name image' })
            .select('work_info.ability').exec((error, data) => {
                if (error) callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    Maid.prototype.getById = (id, callback) => {
        mMaid
            .findOne({ _id: id, status: true })
            .select('-status -location -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    Maid.prototype.getAllTasks = (id, process, startAt, endAt, limit, sortByTaskTime, callback) => {
        var findQuery = {
            status: true
        }

        if (process) {
            if (process == '000000000000000000000001') {
                findQuery['stakeholders.request.maid'] = id;
                findQuery['process'] = {
                    $in: ['000000000000000000000001', '000000000000000000000006']
                }
            } else {
                findQuery['stakeholders.received'] = id;
                findQuery['process'] = process;
            }
        }

        var populateQuery = [{
            path: 'info.package',
            select: 'name'
        },
        {
            path: 'info.work',
            select: 'name image'
        },
        {
            path: 'process',
            select: 'name'
        },
        {
            path: 'stakeholders.owner',
            select: 'info evaluation_point'
        }
        ]

        if (startAt || endAt) {
            var timeQuery = {};

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

            findQuery['info.time.startAt'] = timeQuery;
        }

        var sortQuery = { 'history.createAt': -1 };

        if (sortByTaskTime) {
            sortQuery = { 'info.time.endAt': 1 };
        }

        mTask
            .find(findQuery)
            .populate(populateQuery)
            .sort(sortQuery)
            .limit(parseFloat(limit))
            .select('-location -status -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    Maid.prototype.getComment = (id, limit, page, callback) => {
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

        mComment.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mOwner.populate(data, { path: 'docs.fromId', select: 'info' }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    return callback(null, data);
                });
            }
        });
    }

    Maid.prototype.getHistoryTasks = (id, process, startAt, endAt, limit, page, callback) => {
        var findQuery = {
            'stakeholders.received': id,
            status: true
        }

        if (process) {
            findQuery['process'] = process;
        }

        if (startAt || endAt) {
            var timeQuery = {};

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

            findQuery['info.time.startAt'] = timeQuery;
        }

        var populateQuery = [{
            path: 'info.package',
            select: 'name'
        },
        {
            path: 'info.work',
            select: 'name image'
        },
        {
            path: 'stakeholders.owner',
            select: 'info evaluation_point'
        },
        {
            path: 'process',
            select: 'name'
        }
        ];

        var options = {
            select: '-location -status -__v',
            populate: populateQuery,
            sort: {
                'info.time.startAt': -1
            },
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        mTask
            .paginate(findQuery, options)
            .then(data => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    Maid.prototype.getAllWorkedOwner = (id, startAt, endAt, callback) => {
        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.received': new ObjectId(id)
        };

        if (startAt || endAt) {
            var timeQuery = {};

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

            matchQuery['info.time.startAt'] = timeQuery;
        };

        mTask.aggregate([
            {
                $match: matchQuery
            },
            {
                $sort: {
                    'info.time.startAt': -1
                },
            },
            {
                $group: {
                    _id: '$stakeholders.owner',
                    times: {
                        $push: '$info.time.startAt'
                    }
                }
            }],
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    mOwner.populate(data, { path: '_id', select: 'info evaluation_point' }, (error, owner) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        return callback(null, owner);
                    });
                }
            }
        );
    }

    Maid.prototype.getTaskComment = (id, task, callback) => {
        mComment
            .findOne({ toId: id, task: task, status: true })
            .select('createAt evaluation_point content')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    }

    Maid.prototype.getTaskOfOwner = (id, ownerId, process, startAt, endAt, limit, page, callback) => {
        var findQuery = {
            'stakeholders.owner': ownerId,
            'stakeholders.received': id,
            status: true
        }

        if (process) {
            findQuery['process'] = process;
        }

        if (startAt || endAt) {
            var timeQuery = {};

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

            findQuery['info.time.startAt'] = timeQuery;
        }

        var populateQuery = [{
            path: 'info.package',
            select: 'name'
        },
        {
            path: 'info.work',
            select: 'name image'
        },
        {
            path: 'stakeholders.owner',
            select: 'info evaluation_point'
        },
        {
            path: 'process',
            select: 'name'
        }
        ];

        var options = {
            select: '-location -status -__v',
            populate: populateQuery,
            sort: {
                'info.time.startAt': -1
            },
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        mTask.paginate(findQuery, options).then(data => {
            if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    }

    Maid.prototype.statistical = (id, startAt, endAt, callback) => {
        var billQuery = {
            maid: new ObjectId(id)
        };

        var taskQuery = {
            'stakeholders.received': new ObjectId(id),
            status: true
        };

        if (startAt || endAt) {
            var timeQuery = {};

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
            taskQuery['info.time.startAt'] = timeQuery;
        };

        async.parallel({
            bill: function (callback) {
                mBill.aggregate([
                    {
                        $match: billQuery
                    },
                    {
                        $group: {
                            _id: null,
                            totalPrice: {
                                $sum: '$price'
                            }
                        }
                    }],
                    (error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else {
                            if (validate.isNullorEmpty(data)) {
                                const d = {
                                    _id: null,
                                    totalPrice: 0
                                }
                                return callback(null, d);
                            } else {
                                return callback(null, data[0]);
                            }
                        }
                    });
            },
            task: function (callback) {
                mTask.aggregate([
                    {
                        $match: taskQuery
                    },
                    {
                        $group: {
                            _id: '$process',
                            count: {
                                $sum: 1
                            }
                        }
                    }],
                    (error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                        return callback(null, data);
                    });
            }
        }, (error, result) => {
            if (error) return callback(error);
            else {
                var task = result.task;
                var bill = result.bill;
                var d = {
                    totalPrice: bill.totalPrice,
                    task: task
                }
                return callback(null, d);
            }
        });
    }

    Maid.prototype.report = (maidId, ownerId, content, callback) => {
        reportController.save(ownerId, maidId, 2, content, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    }

    Maid.prototype.onAnnouncement = (id, device_token, callback) => {
        mMaid.findOneAndUpdate(
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
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            }
        )
    }

    Maid.prototype.offAnnouncement = (id, callback) => {
        mMaid.findOneAndUpdate(
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
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            }
        )
    }

    return Maid;
}());

exports.Maid = Maid;
