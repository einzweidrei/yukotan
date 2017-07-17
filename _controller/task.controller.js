var mTask = require('../_model/task');
var mWork = require('../_model/work');
var mPackage = require('../_model/package');
var mProcess = require('../_model/process');
var mOwner = require('../_model/owner');
var mMaid = require('../_model/maid');
var async = require('promise-async');
var ObjectId = require('mongoose').Types.ObjectId;
var as = require('../_services/app.service');
var AppService = new as.App();
var contBill = require('../_controller/bill.controller');
var billController = new contBill.Bill();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var FCM = require('../_services/fcm.service');
var FCMService = new FCM.FCMService();
var microsoftAPI = require('../_services/microsoft-api.service');
var microsoftAPIService = new microsoftAPI.MicrosoftAPI();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var pushStatus = require('../_services/push-status.service');
var ps = pushStatus.PushStatus;

var Task = (function() {
    function Task() {}

    Task.prototype.find = (findQuery, populateQuery, sortQuery, limit, selectQuery, callback) => {
        mTask
            .find(findQuery)
            .populate(populateQuery)
            .sort(sortQuery)
            .limit(parseFloat(limit))
            .select(selectQuery).exec((error, data) => {
                if (error) return callback(error);
                return callback(null, data);
            });
    };

    Task.prototype.paginate = (findQuery, options, callback) => {
        mTask.paginate(findQuery, options).then(data => {
            return callback(null, data);
        });
    };

    Task.prototype.aggregate = (aggregateQuery, callback) => {
        mTask.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(error);
            return callback(null, data);
        });
    };

    Task.prototype.getTaskAround = (minDistance, maxDistance, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == "desc") {
            if (sortBy == "price") {
                sortQuery = {
                    'info.price': -1
                }
            } else {
                sortQuery = {
                    'dist.calculated': -1
                }
            }
        } else {
            if (sortBy == "price") {
                sortQuery = {
                    'info.price': 1
                }
            } else {
                sortQuery = {
                    'dist.calculated': 1
                }
            }
        };

        var now = new Date();
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
            status: true
        };

        var aggregateQuery = [{
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
                $group: {
                    _id: '$info.work',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: sortQuery
            }
        ];

        var task = new Task();
        task.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mWork.populate(data, { path: '_id', select: 'name image' }, (error, data) => {
                    return callback(null, data);
                });
            }
        });
    };

    Task.prototype.getTaskByWork = (minDistance, maxDistance, limit, page, skip, title, package, work, sortBy, sortType, location, callback) => {
        var sortQuery = {};

        if (sortType == 'desc') {
            sortBy == 'price' ? sortQuery = { 'info.price': -1 } : sortQuery = { 'dist.calculated': -1 };
        } else {
            sortBy == 'price' ? sortQuery = { 'info.price': 1 } : sortQuery = { 'dist.calculated': 1 };
        };

        var now = new Date()
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
            status: true
        };

        if (package) matchQuery['info.package'] = new ObjectId(package);
        if (work) matchQuery['info.work'] = new ObjectId(work);
        if (title) matchQuery['info.title'] = new RegExp(title, 'i');

        var task = new Task();

        var aggregateQuery = [{
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
                    process: 1,
                    history: 1,
                    stakeholders: 1,
                    info: 1,
                    dist: 1
                }
            }
        ];

        task.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mOwner.populate(data, { path: 'stakeholders.owner', select: 'info' }, (error, data) => {
                    mWork.populate(data, { path: 'info.work', select: 'name image' }, (error, data) => {
                        mPackage.populate(data, { path: 'info.package', select: 'name' }, (error, data) => {
                            mProcess.populate(data, { path: 'process', select: 'name' }, (error, data) => {
                                result = []
                                for (i = skip; i < skip + parseFloat(limit); i++) {
                                    if (!data[i] || data[i] == null) break
                                    result.push(data[i])
                                }

                                var d = {
                                    docs: result,
                                    total: data.length,
                                    limit: limit,
                                    page: page,
                                    pages: Math.ceil(data.length / limit)
                                }
                                return callback(null, d);
                            });
                        });
                    });
                });
            }
        });
    };

    Task.prototype.getById = (id, callback) => {
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
                select: 'info'
            },
            {
                path: 'stakeholders.received',
                select: 'info'
            },
            {
                path: 'stakeholders.request.maid',
                select: 'info'
            },
            {
                path: 'process',
                select: 'name'
            }
        ];

        mTask
            .findOne({ _id: id, status: true })
            .populate(populateQuery)
            .select('-location -status -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

    Task.prototype.create = (title, package, work, description, price, addressName, lat, lng, startAt, endAt, hour, tools, ownerId, callback) => {
        var task = new mTask();

        task.info = {
            title: title,
            package: package,
            work: work,
            description: description,
            price: price,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            time: {
                startAt: startAt,
                endAt: endAt,
                hour: hour
            },
            tools: tools
        };

        task.stakeholders = {
            owner: ownerId
        };

        task.process = new ObjectId('000000000000000000000001');

        task.location = {
            type: 'Point',
            coordinates: [lng, lat]
        };

        task.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        task.status = true;

        var start = new Date(startAt);
        var end = new Date(endAt);

        if (start >= end) {
            return callback(ms.TIME_NOT_VALID);
        } else {
            mTask.find({
                'stakeholders.owner': ownerId,
                process: { $in: ['000000000000000000000001', '000000000000000000000006'] },
                status: true
            }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data) || !data || data.length <= AppService.getTaskLimit()) {
                    task.save((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        return callback(null, data);
                    });
                } else return callback(ms.TASK_OUT_OF_LIMIT);
            });
        }
    };

    Task.prototype.update = (id, title, package, work, description, price, addressName, lat, lng, startAt, endAt, hour, tools, ownerId, callback) => {
        var info = {
            title: title,
            package: package,
            work: work,
            description: description,
            price: price,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            time: {
                startAt: startAt,
                endAt: endAt,
                hour: hour
            },
            tools: tools
        };

        var location = {
            type: 'Point',
            coordinates: [lng, lat]
        };

        var start = new Date(startAt);
        var end = new Date(endAt);

        if (start >= end) {
            return callback(ms.TIME_NOT_VALID);
        } else {
            mTask.findOneAndUpdate({
                    _id: id,
                    'stakeholders.owner': ownerId,
                    process: new ObjectId('000000000000000000000001'),
                    status: true
                }, {
                    $set: {
                        info: info,
                        location: location,
                        'history.updateAt': new Date()
                    }
                },
                (error, data) => {
                    if (error) return callback(msg.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(msg.DATA_NOT_EXIST);
                    return callback(null, data);
                }
            );
        }
    };

    Task.prototype.delete = (id, ownerId, language, callback) => {
        mTask.findOneAndUpdate({
                _id: id,
                'stakeholders.owner': ownerId,
                status: true
            }, {
                $set: {
                    'history.updateAt': new Date(),
                    status: false
                }
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    if (data.process == '000000000000000000000001') return callback(null, data);
                    else {
                        var maidId = data.stakeholders.received;
                        mMaid
                            .findOne({ _id: maidId, status: true })
                            .exec((error, maid) => {
                                if (error || validate.isNullorEmpty(maid)) return callback(null, data);
                                else {
                                    FCMService.pushNotify(maid, language, ps.DELETE, '', (error, data) => {
                                        if (error) return callback(error);
                                        return callback(null, data);
                                    });
                                }
                            });
                    }
                }
            }
        )
    };

    Task.prototype.cancel = (id, maidId, language, callback) => {
        mTask.findOne({
            _id: id,
            'stakeholders.request.maid': maidId,
            status: true
        }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                if (data.process == '000000000000000000000001') {
                    mTask.findOneAndUpdate({
                            _id: id,
                            'stakeholders.request.maid': maidId,
                            process: '000000000000000000000001',
                            status: true
                        }, {
                            $pull: {
                                'stakeholders.request': { maid: maidId }
                            }
                        },
                        (error, result) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else if (validate.isNullorEmpty(result)) return callback(ms.DATA_NOT_EXIST);
                            else return callback(null, result);
                        }
                    )
                } else if (data.process == '000000000000000000000003') {
                    mOwner
                        .findOne({ _id: data.stakeholders.owner, status: true })
                        .select('auth')
                        .exec((error, owner) => {
                            mTask.findOneAndUpdate({
                                    _id: id,
                                    'stakeholders.received': maidId,
                                    process: '000000000000000000000003',
                                    status: true
                                }, {
                                    $set: {
                                        process: new ObjectId('000000000000000000000001')
                                    },
                                    $pull: {
                                        'stakeholders.request': { maid: maidId }
                                    },
                                    $unset: {
                                        'stakeholders.received': new ObjectId(maidId),
                                    }
                                },
                                (error, result) => {
                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                    else if (validate.isNullorEmpty(result)) return callback(ms.DATA_NOT_EXIST);
                                    else {
                                        FCMService.pushNotify(owner, language, ps.CANCEL, '', (error, data) => {
                                            if (error) return callback(error);
                                            else return callback(null, data);
                                        });
                                    }
                                }
                            )
                        });
                } else return callback(ms.DELETE_DENY);
            }
        });
    };

    Task.prototype.reverse = (id, maidId, callback) => {
        mTask.findOne({
            _id: id,
            process: '000000000000000000000001',
            'stakeholders.request.maid': maidId,
            status: true
        }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) {
                var maid = {
                    maid: maidId,
                    time: new Date()
                };

                mTask.findOneAndUpdate({
                        _id: id,
                        process: '000000000000000000000001',
                        status: true
                    }, {
                        $push: {
                            'stakeholders.request': maid
                        }
                    },
                    (error) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else return callback(null, data);
                    }
                );
            } else return callback(ms.RESERVE_EXIST);
        });
    };

    Task.prototype.checkTaskTimeExist = (maidId, startAt, endAt, callback) => {
        mTask.findOne({
            'stakeholders.received': maidId,
            $or: [
                //x >= s & y <= e
                {
                    'info.time.startAt': { $gte: startAt },
                    'info.time.endAt': { $lte: endAt }
                },

                //x <= s & y >= e
                {
                    'info.time.startAt': { $lte: startAt },
                    'info.time.endAt': { $gte: endAt }
                },

                //x [>= s & <= e] & y >= e
                {
                    'info.time.startAt': {
                        $gte: startAt,
                        $lte: endAt
                    },
                    'info.time.endAt': { $gte: endAt }
                },

                //x <= s & y [>= s & <= e]
                {
                    'info.time.startAt': { $lte: startAt },
                    'info.time.endAt': {
                        $gte: startAt,
                        $lte: endAt
                    }
                },
            ]
        }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(null, data);
            else return callback(ms.SCHEDULE_DUPLICATED);
        });
    };

    Task.prototype.submit = (id, ownerId, maidId, language, callback) => {
        async.parallel({
            maid: function(callback) {
                mMaid
                    .findOne({ _id: maidId, status: true })
                    .exec((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                        else return callback(null, data);
                    });
            },
            task: function(callback) {
                mTask.findOne({
                    _id: id,
                    'stakeholders.owner': ownerId,
                    process: new ObjectId('000000000000000000000001'),
                    status: true
                }).exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        var task = new Task();
                        var startAt = data.info.time.startAt;
                        var endAt = data.info.time.endAt;

                        task.checkTaskTimeExist(maidId, startAt, endAt, (error, data) => {
                            if (error) return callback(error);
                            else return callback(null, data);
                        });
                    }
                });
            }
        }, (error, result) => {
            if (error) return callback(error);
            else {
                mTask.findOneAndUpdate({
                        _id: id,
                        'stakeholders.owner': ownerId,
                        process: new ObjectId('000000000000000000000001'),
                        status: true
                    }, {
                        $set: {
                            'stakeholders.received': maidId,
                            process: new ObjectId('000000000000000000000003')
                        }
                    },
                    (error) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else {
                            var maid = result.maid;
                            FCMService.pushNotify(maid, language, ps.SUBMIT, '', (error, data) => {
                                if (error) return callback(error);
                                else return callback(null, data);
                            });
                        }
                    }
                );
            }
        });
    };

    Task.prototype.checkIn = (id, ownerId, imageUrl, callback) => {
        mTask
            .findOne({
                _id: id,
                'stakeholders.owner': ownerId,
                process: '000000000000000000000003',
                status: true
            })
            .populate('stakeholders.owner')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    async.parallel({
                        faceId1: function(callback) {
                            microsoftAPIService.detectFace(imageUrl, (error, faceId) => {
                                if (error) return callback(error);
                                else return callback(null, faceId);
                            });
                        },
                        faceId2: function(callback) {
                            mMaid
                                .findOne({ _id: data.stakeholders.received, status: true })
                                .exec((error, maid) => {
                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                    else if (validate.isNullorEmpty(maid)) return callback(ms.DATA_NOT_EXIST);
                                    else {
                                        var maidImageUrl = maid.info.image;
                                        microsoftAPIService.detectFace(maidImageUrl, (error, faceId) => {
                                            if (error) return callback(error);
                                            else return callback(null, faceId);
                                        });
                                    }
                                });
                        },
                        task: function(callback) {
                            mTask.findOne({
                                    process: '000000000000000000000004',
                                    'stakeholders.received': data.stakeholders.received,
                                    status: true
                                },
                                (error, res) => {
                                    if (error) return callback(ms.EXCEPTION_FAILED);
                                    else if (validate.isNullorEmpty(res)) return callback(null, res);
                                    else return callback(ms.CHECK_IN_EXIST);
                                });
                        }
                    }, (error, result) => {
                        if (error) return callback(error);
                        else {
                            microsoftAPIService.verifyFace(result.faceId1, result.faceId2, (error, data) => {
                                if (error) return callback(error);
                                else {
                                    if (data.isIdentical) {
                                        mTask.findOneAndUpdate({
                                                _id: id,
                                                'stakeholders.owner': ownerId,
                                                process: '000000000000000000000003',
                                                status: true
                                            }, {
                                                $set: {
                                                    process: new ObjectId('000000000000000000000004'),
                                                    'check.check_in': new Date()
                                                }
                                            },
                                            (error, data) => {
                                                if (error) return callback(ms.EXCEPTION_FAILED);
                                                else return callback(null, data);
                                            }
                                        )
                                    } else return callback(ms.FACE_IDENTICAL_FAILED);
                                }
                            });
                        }
                    });
                }
            });
    };

    Task.prototype.checkInWithoutVerify = (id, ownerId, callback) => {
        mTask.findOneAndUpdate({
            _id: id,
            'stakeholders.owner': ownerId,
            process: '000000000000000000000003',
            status: true
        }, {
            $set: {
                process: new ObjectId('000000000000000000000004'),
                'check.check_in': new Date()
            }
        }, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else return callback(null, data);
        });
    };

    Task.prototype.checkOut = (id, ownerId, language, callback) => {
        var timeCheckOut = new Date();
        mTask.findOneAndUpdate({
                _id: id,
                'stakeholders.owner': ownerId,
                process: '000000000000000000000004',
                status: true
            }, {
                $set: {
                    process: new ObjectId('000000000000000000000005'),
                    'check.check_out': timeCheckOut
                }
            },
            (error, task) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(task)) return callback(ms.DATA_NOT_EXIST);
                else {
                    mMaid
                        .findOne({ _id: task.stakeholders.received, status: true })
                        .exec((error, maid) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                var timeIn = new Date(task.check.check_in);
                                var timeOut = new Date(timeCheckOut);
                                var period = new Date(timeOut.getTime() - timeIn.getTime());
                                var maidId = task.stakeholders.received;
                                var taskId = task._id;
                                var price = 0;

                                if (task.info.package == '000000000000000000000001') {
                                    price = task.info.price;
                                } else {
                                    price = AppService.countPrice(period, maid.work_info.price);
                                }

                                billController.save(ownerId, maidId, taskId, price, period, (error, data) => {
                                    if (error) return callback(error);
                                    else {
                                        var result = {
                                            _id: data._id,
                                            period: data.period,
                                            price: data.price,
                                            date: data.date
                                        };

                                        FCMService.pushNotify(maid, language, ps.CHECK_OUT, '', (error) => {
                                            return callback(null, result);
                                        });
                                    }
                                });
                            }
                        });
                }
            }
        )
    };

    Task.prototype.sendRequest = (maidId, ownerId, title, package, work, description, price, addressName, lat, lng, startAt, endAt, hour, tools, language, callback) => {
        var task = new mTask();

        task.info = {
            title: title,
            package: package,
            work: work,
            description: description,
            price: price,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            time: {
                startAt: startAt,
                endAt: endAt,
                hour: hour
            },
            tools: tools
        };

        task.stakeholders = {
            owner: ownerId,
            request: [{
                maid: maidId,
                time: new Date()
            }],
            received: maidId
        };

        task.process = new ObjectId('000000000000000000000006');

        task.location = {
            type: 'Point',
            coordinates: [lng, lat]
        };

        task.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        task.status = true;

        var start = new Date(startAt);
        var end = new Date(endAt);

        if (start >= end) {
            return callback(ms.TIME_NOT_VALID);
        } else {
            async.parallel({
                maid: function(callback) {
                    mMaid
                        .findOne({ _id: maidId, status: true })
                        .exec((error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                            else return callback(null, data);
                        });
                },
                task: function(callback) {
                    mTask.find({
                        'stakeholders.owner': ownerId,
                        process: { $in: ['000000000000000000000001', '000000000000000000000006'] },
                        status: true
                    }).exec((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data) || !data || data.length <= 10) return callback(null, data);
                        else return callback(ms.TASK_OUT_OF_LIMIT);
                    });
                }
            }, (error, result) => {
                if (error) return callback(error);
                else {
                    var maid = result.maid;

                    task.save((error) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else {
                            FCMService.pushNotify(maid, language, ps.SEND_REQUEST, '', (error, data) => {
                                if (error) return callback(error);
                                else return callback(null, data);
                            });
                        }
                    });
                }
            });
        }
    };

    Task.prototype.acceptRequest = (id, ownerId, maidId, language, callback) => {
        mTask.findOne({
            _id: id,
            'stakeholders.owner': ownerId,
            process: '000000000000000000000006',
            status: true
        }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                async.parallel({
                    owner: function(callback) {
                        mOwner
                            .findOne({ _id: ownerId, status: true })
                            .exec((error, owner) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else if (validate.isNullorEmpty(owner)) return callback(ms.DATA_NOT_EXIST);
                                else return callback(null, owner);
                            });
                    },
                    task: function(callback) {
                        var task = new Task();
                        var startAt = data.info.time.startAt;
                        var endAt = data.info.time.endAt;
                        task.checkTaskTimeExist(maidId, startAt, endAt, (error, res) => {
                            if (error) return callback(error);
                            else return callback(null, res);
                        });
                    }
                }, (error, result) => {
                    if (error) return callback(error);
                    else {
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
                            },
                            (error) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else {
                                    var owner = result.owner;
                                    FCMService.pushNotify(owner, language, ps.ACCEPT_REQUEST, '', (error, data) => {
                                        if (error) return callback(error);
                                        else return callback(null, data);
                                    });
                                }
                            }
                        );
                    }
                });
            }
        });
    };

    return Task;
}());

exports.Task = Task;