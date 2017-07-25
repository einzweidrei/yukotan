var mOwner = require('../_model/owner');
var mMaid = require('../_model/maid');
var mWork = require('../_model/work');
var mTask = require('../_model/task');
var mPackage = require('../_model/package');
var mProcess = require('../_model/process');
var mComment = require('../_model/comment');
var mBill = require('../_model/bill');
var mSession = require('../_model/session');
var async = require('promise-async');
var as = require('../_services/app.service');
var ObjectId = require('mongoose').Types.ObjectId;
var AppService = new as.App();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var contTask = require('../_controller/task.controller');
var taskController = new contTask.Task();
var contComment = require('../_controller/comment.controller');
var commentController = new contComment.Comment();
var contMaid = require('../_controller/maid.controller');
var maidController = new contMaid.Maid();
var contReport = require('../_controller/report.controller');
var reportController = new contReport.Report();
var contBill = require('../_controller/bill.controller');
var billController = new contBill.Bill();
var mail = require('../_services/mail.service');
var mailService = new mail.MailService();
var contSession = require('../_controller/session.controller');
var sessionController = new contSession.Session();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;

var Owner = (function () {
    function Owner() { }

    Owner.prototype.findOneAndUpdate = (searchQuery, setQuery, callback) => {
        mOwner.findOneAndUpdate(
            searchQuery, {
                $set: setQuery
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, data);
            }
        );
    };

    Owner.prototype.findOne = (searchQuery, selectQuery, callback) => {
        mOwner.findOne(searchQuery).select(selectQuery).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Owner.prototype.getById = (id, callback) => {
        mOwner
            .findOne({ _id: id })
            .select('-history -wallet -auth -status -location -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

    Owner.prototype.getMyInfo = (id, callback) => {
        mOwner
            .findOne({ _id: id })
            .select('-auth -status -location -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

    Owner.prototype.getAllTasks = (id, process, startAt, endAt, limit, sortByTaskTime, callback) => {
        try {
            var findQuery = {
                'stakeholders.owner': id,
                status: true
            }

            if (process) {
                if (process == '000000000000000000000001') {
                    findQuery['process'] = {
                        $in: ['000000000000000000000001', '000000000000000000000006']
                    }
                } else {
                    findQuery['process'] = process;
                }
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
                path: 'stakeholders.received',
                select: 'info work_info'
            },
            {
                path: 'process',
                select: 'name'
            }
            ];

            var sortQuery = { 'history.createAt': -1 };

            if (sortByTaskTime) sortQuery = { 'info.time.endAt': 1 };

            mTask
                .find(findQuery)
                .populate(populateQuery)
                .sort(sortQuery)
                .limit(parseFloat(limit))
                .select('-location -status -__v').exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        mWork.populate(data, { path: 'stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            return callback(null, data);
                        });
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getHistoryTasks = (id, process, startAt, endAt, limit, page, callback) => {
        var findQuery = {
            'stakeholders.owner': id,
            status: true
        };

        if (process) findQuery['process'] = process;

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
            path: 'stakeholders.received',
            select: 'info work_info'
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

        taskController.paginate(findQuery, options, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else {
                mWork.populate(data, { path: 'docs.stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    return callback(null, data);
                });
            }
        });
    };

    Owner.prototype.getAllWorkedMaid = (id, startAt, endAt, callback) => {
        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.owner': new ObjectId(id)
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

        var sortQuery = { 'info.time.startAt': -1 };
        var groupQuery = {
            _id: '$stakeholders.received',
            times: {
                $push: '$info.time.startAt'
            }
        };

        var taskAggregate = [{
            $match: matchQuery
        },
        {
            $sort: sortQuery
        },
        {
            $group: groupQuery
        }
        ];

        taskController.aggregate(taskAggregate, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mMaid.populate(data, { path: '_id', select: 'info work_info' }, (error, owner) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    mWork.populate(owner, { path: '_id.work_info.ability', select: 'name image' }, (error, owner) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        return callback(null, owner);
                    });
                });
            }
        });
    };

    Owner.prototype.getTaskOfMaid = (id, maidId, process, startAt, endAt, limit, page, callback) => {
        var findQuery = {
            'stakeholders.owner': id,
            'stakeholders.received': maidId,
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
            path: 'stakeholders.received',
            select: 'info work_info'
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

        taskController.paginate(findQuery, options, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else {
                mWork.populate(data, { path: 'docs.stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    return callback(null, data);
                });
            }
        });
    };

    Owner.prototype.updateInfo = (id, name, phone, age, address, gender, location, image, callback) => {
        var owner = new Owner();
        var setQuery = {};
        var searchQuery = {
            _id: id,
            status: true
        };
        if (image == '') {
            setQuery = {
                'info.phone': phone,
                'info.name': name,
                'info.address': address,
                'info.gender': gender,
                location: location,
                'history.updateAt': new Date()
            }

            owner.findOneAndUpdate(searchQuery, setQuery, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    data.info.phone = phone;
                    data.info.name = name;
                    data.info.age = age;
                    data.info.address = address;
                    data.info.gender = gender;
                    var d = {
                        _id: data._id,
                        info: data.info,
                        evaluation_point: data.evaluation_point,
                        wallet: data.wallet
                    }
                    return callback(null, d);
                }
            });
        } else {
            setQuery = {
                'info.phone': phone,
                'info.name': name,
                'info.address': address,
                'info.gender': gender,
                'info.image': image,
                location: location,
                'history.updateAt': new Date()
            };

            owner.findOneAndUpdate(searchQuery, setQuery, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    data.info.phone = phone;
                    data.info.name = name;
                    data.info.age = age;
                    data.info.address = address;
                    data.info.gender = gender;
                    data.info.image = image;
                    var d = {
                        _id: data._id,
                        info: data.info,
                        evaluation_point: data.evaluation_point,
                        wallet: data.wallet
                    }
                    return callback(null, d);
                }
            });
        }
    };

    Owner.prototype.comment = (fromId, toId, task, content, evaluation_point, callback) => {
        var maidSearch = {
            _id: toId,
            status: true
        };

        maidController.findOne(maidSearch, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                var commentSearch = {
                    fromId: fromId,
                    task: task
                };

                commentController.findOne(commentSearch, (error, comment) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(comment)) {
                        var ep_2 = data.work_info.evaluation_point;
                        var new_ep = (evaluation_point + ep_2) / 2;

                        if ((evaluation_point + ep_2) % 2 >= 5) {
                            new_ep = Math.ceil(new_ep);
                        } else {
                            new_ep = Math.round(new_ep);
                        }

                        if (new_ep >= 5) {
                            new_ep = 5;
                        }

                        var maidSet = {
                            'work_info.evaluation_point': new_ep
                        }

                        maidController.findOneAndUpdate(maidSearch, maidSet, (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                commentController.save(fromId, toId, task, content, evaluation_point, (error, data) => {
                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                    return callback(null, data);
                                });
                            }
                        });
                    } else {
                        return callback(ms.DUPLICATED);
                    }
                });
            }
        });
    };

    Owner.prototype.getComment = (id, limit, page, callback) => {
        try {
            var query = { toId: id };
            var options = {
                select: 'evaluation_point content task createAt fromId',
                populate: { path: 'task', select: 'info' },
                sort: {
                    createAt: -1
                },
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            commentController.paginate(query, options, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST); {
                    mMaid.populate(data, { path: 'docs.fromId', select: 'info' }, (error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        return callback(null, data);
                    });
                }
            })
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.report = (ownerId, maidId, content, callback) => {
        reportController.save(ownerId, maidId, 1, content, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Owner.prototype.getWallet = (id, callback) => {
        var owner = new Owner();
        var searchQuery = {
            _id: id,
            status: true
        };

        var selectQuery = 'wallet';

        owner.findOne(searchQuery, selectQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DUPLICATED);
            return callback(null, data);
        });
    };

    Owner.prototype.onAnnouncement = (id, device_token, callback) => {
        var owner = new Owner();
        var ownerSearch = {
            _id: id,
            status: true
        };

        var ownerSet = {
            'auth.device_token': device_token
        };

        owner.findOneAndUpdate(ownerSearch, ownerSet, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    };

    Owner.prototype.offAnnouncement = (id, callback) => {
        var owner = new Owner();
        var ownerSearch = {
            _id: id,
            status: true
        };

        var ownerSet = {
            'auth.device_token': ''
        };

        owner.findOneAndUpdate(ownerSearch, ownerSet, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            return callback(null, data);
        });
    };

    Owner.prototype.statistical = (id, startAt, endAt, callback) => {
        var own = new Owner();

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
            taskQuery['history.createAt'] = timeQuery;
        };

        async.parallel({
            owner: function (callback) {
                var ownerSearch = {
                    _id: id,
                    status: true
                };

                own.findOne(ownerSearch, '-__v', (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                });
            },
            bill: function (callback) {
                var billAggregate = [{
                    $match: billQuery
                },
                {
                    $group: {
                        _id: null,
                        totalPrice: {
                            $sum: '$price'
                        }
                    }
                }
                ];

                billController.aggregate(billAggregate, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) {
                        const data = {
                            _id: null,
                            totalPrice: 0
                        }
                        callback(null, data);
                    } else return callback(null, data[0]);
                });
            },
            task: function (callback) {
                var taskAggregate = [{
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
                ];

                taskController.aggregate(taskAggregate, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                });
            }
        },
            (error, result) => {
                if (error) return callback(error);
                else {
                    var task = result.task;
                    var bill = result.bill;
                    var owner = result.owner;

                    const d = {
                        totalPrice: bill.totalPrice,
                        task: task,
                        wallet: owner.wallet
                    };

                    return callback(null, d);
                }
            }
        );
    };

    Owner.prototype.getDebt = (id, startAt, endAt, callback) => {
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

        var billAggregate = [{
            $match: billQuery
        },
        {
            $sort: sortQuery
        },
        {
            $project: {
                _id: 1,
                task: 1,
                price: 1,
                period: 1,
                wallet: 1
            }
        }
        ];

        billController.aggregate(billAggregate, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mTask.populate(data, { path: 'task', select: 'info stakeholders check process history' }, (error, result) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    mMaid.populate(result, { path: 'task.stakeholders.received', select: 'info work_info' }, (error, result) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        mWork.populate(result, [
                            { path: 'task.info.work', select: 'name image' },
                            { path: 'task.stakeholders.received.work_info.ability', select: 'name image' }
                        ],
                            (error, result) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                mPackage.populate(result, { path: 'task.info.package', select: 'name' }, (error, result) => {
                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                    mProcess.populate(result, { path: 'task.process', select: 'name' }, (error, result) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        return callback(null, result);
                                    });
                                });
                            });
                    });
                });
            }
        });
    };

    Owner.prototype.forgotPassword = (username, email, callback) => {
        var verifyToken = AppService.getVerifyToken();
        var searchQuery = {
            'info.username': username,
            'info.email': email,
            status: true
        };

        var owner = new Owner();
        owner.findOne(searchQuery, '-__v', (error, data) => {
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
    };

    Owner.prototype.resetPassword = (url, callback) => {
        try {
            var m = url.split('-');
            var id = m[0];
            var key = m[1];

            mSession
                .findOne({ 'auth.userId': id, status: true })
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var verifyKey = data.verification.password.key;

                        if (key == verifyKey) {
                            var time = new Date(data.verification.password.date);
                            var now = new Date();

                            var diff = now - time;
                            var hours = ~~(Math.abs(diff) / 36e5);

                            if (hours > 168) {
                                return callback(ms.KEY_EXPIRED);
                            } else {
                                var newPw = AppService.randomString(7);
                                mOwner.findOneAndUpdate({
                                    _id: id,
                                    status: true
                                }, {
                                        $set: {
                                            'auth.password': newPw,
                                            'history.updateAt': new Date()
                                        }
                                    }, (error, owner) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        else if (validate.isNullorEmpty(owner)) return callback(ms.DATA_NOT_EXIST);
                                        else {
                                            mSession.findOneAndUpdate({
                                                'auth.userId': id,
                                                status: true
                                            }, {
                                                    'verification.password.key': ''
                                                }, (error, data) => {
                                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                                    else {
                                                        mailService.sendNewPassword(owner, newPw, (error, data) => {
                                                            if (error) return callback(error);
                                                            else return callback(null, data);
                                                        });
                                                    }
                                                });
                                        }
                                    });
                            }
                        } else {
                            return callback(ms.INVALID_KEY);
                        }
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.checkAccountExist = (username, callback) => {
        try {
            mOwner
                .findOne({ 'info.username': username, status: true })
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getAll4Admin = (page, limit, startAt, endAt, sort, email, username, name, gender, callback) => {
        try {
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

                findQuery['history.createAt'] = timeQuery;
            };

            var sortQuery = {};

            sort == 'asc' ? sortQuery = { 'history.createAt': 1 } : sortQuery = { 'history.createAt': -1 };

            var query = { status: true };

            if (email) query['info.email'] = new RegExp(email, 'i');
            if (username) query['info.username'] = new RegExp(username, 'i');
            if (name) query['info.name'] = new RegExp(name, 'i');
            if (gender) query['info.gender'] = new RegExp(gender, 'i');

            var options = {
                select: 'evaluation_point info wallet history',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mOwner.paginate(query, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getById4Admin = (id, callback) => {
        try {
            mOwner.findOne({ _id: id, status: true })
                .select('evaluation_point info wallet history')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getAllTasks4Admin = (id, process, startAt, endAt, limit, page, sort, title, callback) => {
        try {
            var findQuery = {
                'stakeholders.owner': id,
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
                path: 'stakeholders.received',
                select: 'info work_info'
            },
            {
                path: 'process',
                select: 'name'
            }
            ];

            var sortQuery = {};
            sort == 'asc' ? sortQuery = { 'history.createAt': 1 } : sortQuery = { 'history.createAt': -1 };

            if (title) findQuery['info.title'] = new RegExp(title, 'i');

            var options = {
                select: '-location -status -__v',
                populate: populateQuery,
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mTask.paginate(findQuery, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getInfo4Admin = (id, callback) => {
        try {
            mOwner
                .findOne({ _id: id, status: true })
                .select('evaluation_point info wallet history')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.create = (username, email, phone, name, image, addressName, lat, lng, gender, password, device_token, callback) => {
        try {
            var owner = new mOwner();

            owner.info = {
                username: username,
                email: email,
                phone: phone,
                name: name,
                image: image,
                address: {
                    name: addressName,
                    coordinates: {
                        lat: lat,
                        lng: lng
                    }
                },
                gender: gender,
            };

            owner.evaluation_point = 3;

            owner.wallet = 0;

            owner.auth = {
                password: AppService.hashString(password),
                device_token: device_token
            };

            owner.history = {
                createAt: new Date(),
                updateAt: new Date()
            };

            owner.status = true;

            owner.location = {
                type: 'Point',
                coordinates: [lng, lat]
            };

            mOwner.findOne({
                $or: [
                    { 'info.username': username },
                    { 'info.email': email }
                ]
            }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) {
                    owner.save((error) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else return callback(null, owner);
                    });
                } else return callback(ms.DUPLICATED);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.update = (id, phone, name, image, addressName, lat, lng, gender, email, callback) => {
        try {
            var address = {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            };

            var location = {
                type: 'Point',
                coordinates: [lng, lat]
            };

            mOwner.findOne({ 'info.email': email, status: true }, (error, owner) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(owner)) {
                    mOwner.findOneAndUpdate(
                        {
                            _id: id,
                            status: true
                        },
                        {
                            $set: {
                                'info.email': email,
                                'info.phone': phone,
                                'info.name': name,
                                'info.address': address,
                                'info.gender': gender,
                                'info.image': image,
                                location: location,
                                'history.updateAt': new Date()
                            }
                        },
                        (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                            else return callback(null, data);
                        }
                    );
                } else {
                    var m = owner._id;
                    if (m == id) {
                        mOwner.findOneAndUpdate(
                            {
                                _id: id,
                                status: true
                            },
                            {
                                $set: {
                                    'info.phone': phone,
                                    'info.name': name,
                                    'info.address': address,
                                    'info.gender': gender,
                                    'info.image': image,
                                    location: location,
                                    'history.updateAt': new Date()
                                }
                            },
                            (error, data) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                                else return callback(null, data);
                            }
                        );
                    } else {
                        return callback(ms.DUPLICATED);
                    }
                }
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.delete = (id, callback) => {
        try {
            mOwner.findOneAndUpdate({
                _id: id,
                status: true
            }, {
                    $set: {
                        'history.updateAt': new Date(),
                        status: false
                    }
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.deleteComment = (id, callback) => {
        try {
            mComment.findByIdAndRemove({
                _id: id,
                status: true
            },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.chargeWallet = (id, price, callback) => {
        try {
            mOwner.findOne({
                _id: id,
                status: true
            },
                (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var wallet = data.wallet;
                        wallet += parseFloat(price);
                        mOwner.findOneAndUpdate({
                            _id: id,
                            status: true
                        }, {
                                $set: {
                                    wallet: wallet
                                }
                            },
                            (error, data) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                                else return callback(null, data);
                            });
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.statistical4Admin = (id, startAt, endAt, isSolved, callback) => {
        try {
            var matchQuery = { 'owner': new ObjectId(id), isSolved: isSolved, status: true }

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

                matchQuery['date'] = timeQuery;
            }

            mBill.aggregate(
                [{
                    $match: matchQuery
                },
                {
                    $group: {
                        _id: '$method',
                        taskNumber: {
                            $sum: 1
                        },
                        price: {
                            $sum: '$price'
                        }
                    }
                }
                ], (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var totalPrice = 0;
                        data.map(a => {
                            totalPrice += a.price
                        });

                        var d = {
                            data: data,
                            totalPrice: totalPrice
                        }

                        return callback(null, d);
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.getStatisticalTasks = (id, method, startAt, endAt, isSolved, callback) => {
        try {
            var matchQuery = { 'owner': new ObjectId(id), isSolved: isSolved, status: true };

            if (method) matchQuery['method'] = parseFloat(method);

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

                matchQuery['date'] = timeQuery;
            };

            mBill.aggregate(
                [{
                    $match: matchQuery
                },
                {
                    $project: {
                        task: 1
                    }
                }
                ], (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        mTask.populate(data, { path: 'task', select: 'info' }, (error, data) => {
                            return callback(null, data);
                        });
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Owner.prototype.changePassword = (id, password, callback) => {
        try {
            var password = AppService.hashString(password);

            mOwner.findOneAndUpdate(
                {
                    _id: id,
                    status: true
                },
                {
                    $set: {
                        'auth.password': password,
                        'history.updateAt': new Date()
                    }
                }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    return Owner;
}());

exports.Owner = Owner;