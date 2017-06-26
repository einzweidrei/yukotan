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
var randomstring = require("randomstring");

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var ObjectId = require('mongoose').Types.ObjectId;

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

router.use(bodyparser.json({
    limit: '50mb',
}));

// setting limit of FILE
router.use(bodyparser.urlencoded({
    // limit: '50mb',
    // parameterLimit: 1000000,
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('owner_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

            // next();
            if (req.headers.hbbgvauth) {
                var token = req.headers.hbbgvauth;
                Session.findOne({ 'auth.token': token }).exec((error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            return msg.msgReturn(res, 14);
                        } else {
                            req.cookies['userId'] = data.auth.userId;
                            next();
                        }
                    }
                });
            } else {
                return msg.msgReturn(res, 14);
            }
        }
        else {
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

        Owner.findOne({ _id: id }).select('-history -wallet -auth -status -location -__v').exec((error, data) => {
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
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').put(multipartMiddleware, (req, res) => {
    try {
        var owner = new Owner();
        var id = req.cookies.userId;

        var phone = req.body.phone || "";
        var name = req.body.name || "";
        var age = req.body.age || 18;
        var address = {
            name: req.body.addressName || "",
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

        Owner.findOne({ _id: id, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    if (!req.files.image) {
                        Owner.findOneAndUpdate(
                            {
                                _id: id,
                                status: true
                            },
                            {
                                $set: {
                                    'info.phone': phone,
                                    'info.name': name,
                                    'info.age': age,
                                    'info.address': address,
                                    'info.gender': gender,
                                    location: location,
                                    'history.updateAt': new Date()
                                }
                            },
                            {
                                upsert: true
                            },
                            (error, m) => {
                                if (error) return msg.msgReturn(res, 3);
                                m.info.phone = phone;
                                m.info.name = name;
                                m.info.age = age;
                                m.info.address = address;
                                m.info.gender = gender;
                                var d = {
                                    _id: m._id,
                                    info: m.info,
                                    evaluation_point: m.evaluation_point,
                                    wallet: m.wallet
                                }
                                return msg.msgReturn(res, 0, d);
                            }
                        );
                    } else {
                        cloudinary.uploader.upload(
                            req.files.image.path,
                            function (result) {
                                Owner.findOneAndUpdate(
                                    {
                                        _id: id,
                                        status: true
                                    },
                                    {
                                        $set: {
                                            'info.phone': phone,
                                            'info.name': name,
                                            'info.age': age,
                                            'info.address': address,
                                            'info.gender': gender,
                                            'info.image': result.url,
                                            location: location,
                                            'history.updateAt': new Date()
                                        }
                                    },
                                    {
                                        upsert: true
                                    },
                                    (error, m) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        m.info.phone = phone;
                                        m.info.name = name;
                                        m.info.age = age;
                                        m.info.address = address;
                                        m.info.gender = gender;
                                        m.info.image = result.url;

                                        var d = {
                                            _id: m._id,
                                            info: m.info,
                                            evaluation_point: m.evaluation_point,
                                            wallet: m.wallet
                                        }
                                        return msg.msgReturn(res, 0, d);
                                    }
                                );
                            });
                    }
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getMyInfo').get((req, res) => {
    try {
        var id = req.cookies.userId;

        Owner.findOne({ _id: id }).select('-auth -status -location -__v').exec((error, data) => {
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
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllDeniedTasks').get((req, res) => {
    try {
        var ownerId = req.cookies.userId;

        var populateQuery = [
            {
                path: 'info.package',
                select: 'name'
            },
            {
                path: 'info.work',
                select: 'name image'
            },
            {
                path: 'stakeholders.received',
                select: 'info'
            },
            {
                path: 'process',
                select: 'name'
            }
        ];

        Task.find(
            {
                'stakeholders.owner': ownerId,
                process: {
                    $in: ['000000000000000000000003', '000000000000000000000004']
                },
                status: false
            }
        ).populate(populateQuery).exec((error, data) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0, data);
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Tasks By Owner ID
 * info {
 *      type: GET
 *      url: /getAllTasks
 *      name: Get All Tasks By Owner ID
 *      description: Get tasks by Owner's ID
 * }
 * 
 * params {
 *      id: owner_ID
 *      process: process_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getAllTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        // var id = '5911460ae740560cb422ac35';
        var process = req.query.process;

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 0;
        var sortByTaskTime = req.query.sortByTaskTime;

        var findQuery = {
            'stakeholders.owner': id,
            status: true
        }

        // if (process) {
        //     findQuery['process'] = 
        //     {process };
        // }

        if (process) {
            if (process == '000000000000000000000001') {
                // findQuery['$or'] = [
                //     { 'stakeholders.request.maid': new ObjectId(id) },
                //     { 'requestTo': new ObjectId(id) }
                // ]
                // findQuery['stakeholders.request.maid'] = id;
                findQuery['process'] = {
                    $in: ['000000000000000000000001', '000000000000000000000006']
                }
            } else {
                // findQuery['stakeholders.received'] = id;
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

        var populateQuery = [
            {
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

        if (sortByTaskTime) {
            sortQuery = { 'info.time.endAt': 1 };
        }

        Task
            .find(findQuery)
            .populate(populateQuery)
            .sort(sortQuery)
            .limit(parseFloat(limit))
            .select('-location -status -__v').exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Work.populate(data, { path: 'stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                            if (error) return msg.msgReturn(res, 3);
                            return msg.msgReturn(res, 0, data);
                        })
                    }
                }
            });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Tasks By Owner ID
 * info {
 *      type: GET
 *      url: /getAllTasks
 *      name: Get All Tasks By Owner ID
 *      description: Get tasks by Owner's ID
 * }
 * 
 * params {
 *      id: owner_ID
 *      process: process_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getHistoryTasks').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var maidId = req.query.maid;
        // var id = '5911460ae740560cb422ac35';
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

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

        var populateQuery = [
            {
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
            // {
            //     path: 'stakeholders.received.work_info.ability',
            //     select: 'name image'
            // },
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

        // Task
        //     .find(findQuery)
        //     .populate(populateQuery)
        //     .sort({ 'info.time.startAt': -1 })
        //     .limit(parseFloat(limit))
        //     .select('-location -status -__v').exec((error, data) => {
        //         if (error) {
        //             return msg.msgReturn(res, 3);
        //         } else {
        //             if (validate.isNullorEmpty(data)) {
        //                 return msg.msgReturn(res, 4);
        //             } else {
        //                 return msg.msgReturn(res, 0, data);
        //             }
        //         }
        //     });

        Task.paginate(findQuery, options).then(data => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                Work.populate(data, { path: 'docs.stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                    if (error) return msg.msgReturn(res, 3);
                    return msg.msgReturn(res, 0, data);
                })
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllWorkedMaid').get((req, res) => {
    try {
        var id = req.cookies.userId;

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

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

        Task.aggregate([
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
                    _id: '$stakeholders.received',
                    times: {
                        $push: '$info.time.startAt'
                    }
                }
            }
        ],
            // {
            //     allowDiskUse: true
            // },
            (error, data) => {
                console.log(data)
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Maid.populate(data, { path: '_id', select: 'info work_info' }, (error, owner) => {
                            if (error) return msg.msgReturn(res, 3);
                            Work.populate(owner, { path: '_id.work_info.ability', select: 'name image' }, (error, owner) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0, owner);
                            })
                        });
                    }
                }
            }
        );
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getTaskOfMaid').get((req, res) => {
    try {
        var id = req.cookies.userId;
        // var id = '5911460ae740560cb422ac35';
        var maidId = req.query.maid;
        var process = req.query.process || '000000000000000000000005';

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;

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

        var populateQuery = [
            {
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

        Task.paginate(findQuery, options).then(data => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                Work.populate(data, { path: 'docs.stakeholders.received.work_info.ability', select: 'name image' }, (error, data) => {
                    if (error) return msg.msgReturn(res, 3);
                    return msg.msgReturn(res, 0, data);
                })
                // return msg.msgReturn(res, 0, data);
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/comment').post((req, res) => {
    try {
        var comment = new Comment();
        comment.fromId = req.cookies.userId;
        // comment.fromId = req.body.fromId;
        comment.toId = req.body.toId;
        comment.task = req.body.task;
        comment.content = req.body.content;
        comment.evaluation_point = req.body.evaluation_point;
        comment.createAt = new Date();
        comment.status = true;

        Maid.findOne({ _id: comment.toId, status: true }).select('work_info').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Comment.findOne({ fromId: comment.fromId, task: comment.task }).exec((error, cmt) => {
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            if (validate.isNullorEmpty(cmt)) {
                                var ep_2 = data.work_info.evaluation_point;
                                var new_ep = (comment.evaluation_point + ep_2) / 2;

                                if ((comment.evaluation_point + ep_2) % 2 >= 5) {
                                    new_ep = Math.ceil(new_ep);
                                } else {
                                    new_ep = Math.round(new_ep);
                                }

                                Maid.findOneAndUpdate(
                                    {
                                        _id: comment.toId,
                                        status: true
                                    },
                                    {
                                        $set: {
                                            'work_info.evaluation_point': new_ep
                                        }
                                    },
                                    {
                                        upsert: true
                                    },
                                    (error) => {
                                        if (error) {
                                            return msg.msgReturn(res, 3);
                                        } else {
                                            comment.save((error) => {
                                                if (error) return msg.msgReturn(res, 3);
                                                return msg.msgReturn(res, 0);
                                            });
                                        }
                                    }
                                );
                            } else {
                                return msg.msgReturn(res, 2);
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
        report.from = 1
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
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

router.route('/statistical').get((req, res) => {
    try {
        const id = req.cookies.userId;
        // const id = '5911460ae740560cb422ac35';
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
            taskQuery['info.time.startAt'] = timeQuery;
        };


        async.parallel(
            {
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
                    Bill.aggregate([
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
                                callback(null, data);
                            }
                        }
                    });
                },
                task: function (callback) {
                    Task.aggregate([
                        {
                            $match: taskQuery
                        },
                        {
                            $group: {
                                _id: '$process',
                                // task: {
                                //     $push: '$_id'
                                // },
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
            }
        );
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getDebt').get((req, res) => {
    try {
        var id = req.cookies.userId;
        // var id = '5911460ae740560cb422ac35';
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

        Bill.aggregate(
            {
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
                                Work.populate(result,
                                    [
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
})

router.route('/getWallet').get((req, res) => {
    try {
        var id = req.cookies.userId

        Owner.findOne({ _id: id, status: true }).select('wallet').exec((error, data) => {
            return error ? msg.msgReturn(res, 3) : validate.isNullorEmpty(data) ? msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data)
        })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

module.exports = router;