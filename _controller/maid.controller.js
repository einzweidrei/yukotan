var mMaid = require('../_model/maid');
var mTask = require('../_model/task');
var mOwner = require('../_model/owner');
var mComment = require('../_model/comment');
var mBill = require('../_model/bill');
var mWork = require('../_model/work');
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
    };

    Maid.prototype.findOneAndUpdate = (searchQuery, setQuery, callback) => {
        mMaid.findOneAndUpdate(
            searchQuery, {
                $set: setQuery
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                return callback(null, data);
            }
        );
    };

    Maid.prototype.aggregate = (aggregateQuery, callback) => {
        mMaid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

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
                info: 1,
                work_info: 1
            }
        }
        ];

        maid.aggregate(aggregateQuery, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mWork.populate(data, { path: 'work_info.ability', select: 'name image' }, (error, result) => {
                    return callback(null, result);
                });
                // return callback(null, data);
            }
        });
    };

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
    };

    Maid.prototype.getAbility = (id, callback) => {
        mMaid
            .findOne({ _id: id, status: true })
            .populate({ path: 'work_info.ability', select: 'name image' })
            .select('work_info.ability').exec((error, data) => {
                if (error) callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

    Maid.prototype.getById = (id, callback) => {
        mMaid
            .findOne({ _id: id, status: true })
            .select('-status -location -__v')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

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
    };

    Maid.prototype.getComment = (id, limit, page, callback) => {
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

        mComment.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mOwner.populate(data, { path: 'docs.fromId', select: 'info' }, (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    return callback(null, data);
                });
            }
        });
    };

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
    };

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

        mTask.aggregate([{
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
        }
        ],
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
    };

    Maid.prototype.getTaskComment = (id, task, callback) => {
        mComment
            .findOne({ toId: id, task: task, status: true })
            .select('createAt evaluation_point content')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                return callback(null, data);
            });
    };

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
    };

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
                mBill.aggregate([{
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
                ],
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
                mTask.aggregate([{
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
                ],
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
    };

    Maid.prototype.report = (maidId, ownerId, content, callback) => {
        reportController.save(ownerId, maidId, 2, content, (error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            return callback(null, data);
        });
    };

    Maid.prototype.onAnnouncement = (id, device_token, callback) => {
        mMaid.findOneAndUpdate({
            _id: id,
            status: true
        }, {
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
    };

    Maid.prototype.offAnnouncement = (id, callback) => {
        mMaid.findOneAndUpdate({
            _id: id,
            status: true
        }, {
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
    };

    Maid.prototype.checkAccountExist = (username, callback) => {
        try {
            mMaid
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

    Maid.prototype.getAll4Admin = (page, limit, startAt, endAt, sort, email, username, name, gender, callback) => {
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
            }

            var sortQuery = {};
            sort == 'asc' ? sortQuery = { 'history.createAt': 1 } : sortQuery = { 'history.createAt': -1 };

            var query = { status: true };

            if (email) query['info.email'] = new RegExp(email, 'i');
            if (username) query['info.username'] = new RegExp(username, 'i');
            if (name) query['info.name'] = new RegExp(name, 'i');
            if (gender) query['info.gender'] = new RegExp(gender, 'i');

            var options = {
                select: 'info work_info history',
                sort: sortQuery,
                page: parseFloat(page),
                limit: parseFloat(limit)
            };

            mMaid.paginate(query, options).then((data) => {
                if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.DATA_NOT_EXIST);
        }
    };

    Maid.prototype.getById4Admin = (id, callback) => {
        try {
            mMaid.findOne({ _id: id, status: true })
                .select('info work_info history')
                .exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Maid.prototype.getAllTasks4Admin = (id, process, startAt, endAt, limit, page, sort, title, callback) => {
        try {
            var findQuery = {
                'stakeholders.request.maid': id,
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

    Maid.prototype.create = (username, password, email, phone, name, image, age, addressName, lat, lng, gender, ability, price, device_token, callback) => {
        try {
            var maid = new mMaid();

            maid.info = {
                username: username,
                email: email,
                phone: phone,
                name: name,
                image: image,
                age: age,
                address: {
                    name: addressName,
                    coordinates: {
                        lat: lat,
                        lng: lng
                    }
                },
                gender: gender,
            };

            var temp = [];
            temp = ability.split(',');

            maid.work_info = {
                ability: temp,
                evaluation_point: 3,
                price: price
            }

            maid.auth = {
                password: AppService.hashString(password),
                device_token: device_token
            };

            maid.history = {
                createAt: new Date(),
                updateAt: new Date()
            };

            maid.status = true;

            maid.location = {
                type: 'Point',
                coordinates: [lng, lat]
            };

            mMaid.findOne({
                $or: [
                    { 'info.username': username },
                    { 'info.email': email }
                ]
            }).exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) {
                    maid.save((error) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else return callback(null, maid);
                    });
                } else return callback(ms.DUPLICATED);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Maid.prototype.update = (id, email, phone, name, age, image, addressName, lat, lng, gender, ability, price, callback) => {
        try {
            var address = {
                name: addressName,
                coordinates: {
                    lat: lat || 0,
                    lng: lng || 0
                }
            };

            var temp = [];
            temp = ability.split(',');

            var location = {
                type: 'Point',
                coordinates: [lng, lat]
            };

            mMaid.findOne({ 'info.email': email, status: true }, (error, maid) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(maid)) {
                    mMaid.findOneAndUpdate({
                        _id: id,
                        status: true
                    }, {
                            $set: {
                                'info.email': email,
                                'info.phone': phone,
                                'info.name': name,
                                'info.age': age,
                                'info.address': address,
                                'info.gender': gender,
                                'info.image': image,
                                'work_info.ability': temp,
                                'work_info.price': price,
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
                    var m = maid._id;
                    if (m == id) {
                        mMaid.findOneAndUpdate({
                            _id: id,
                            status: true
                        }, {
                                $set: {
                                    'info.phone': phone,
                                    'info.name': name,
                                    'info.age': age,
                                    'info.address': address,
                                    'info.gender': gender,
                                    'info.image': image,
                                    'work_info.ability': temp,
                                    'work_info.price': price,
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

    Maid.prototype.delete = (id, callback) => {
        try {
            mMaid.findOneAndUpdate({
                _id: id,
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
                    else return callback(null, data);
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Maid.prototype.deleteComment = (id, callback) => {
        try {
            mComment.findByIdAndRemove({
                _id: id,
                status: true
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Maid.prototype.statistical4Admin = (id, startAt, endAt, isSolved, callback) => {
        try {
            var matchQuery = { 'maid': new ObjectId(id), status: true }

            if (isSolved) matchQuery['isSolved'] = isSolved;

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

            mBill.aggregate([{
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

    Maid.prototype.getStatisticalTasks = (id, method, startAt, endAt, isSolved, callback) => {
        try {
            var matchQuery = { 'maid': new ObjectId(id), status: true }

            if (isSolved) matchQuery['isSolved'] = isSolved;
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
            }

            mBill.aggregate(
                [
                    {
                        $match: matchQuery
                    },
                    {
                        $project: {
                            task: 1,
                            period: 1,
                            price: 1
                        }
                    }
                ], (error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                        else {
                            mTask.populate(data, { path: 'task', select: 'info' }, (error, data) => {
                                return callback(null, data);
                            });
                        }
                    }
                });
        } catch (error) {
            return callback(ms.EXCEPTION_FAILED);
        }
    };

    Maid.prototype.changePassword = (id, password, callback) => {
        try {
            var password = AppService.hashString(password);

            mMaid.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
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

    return Maid;
}());

exports.Maid = Maid;