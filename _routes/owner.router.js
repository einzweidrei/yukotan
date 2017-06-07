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
                let token = req.headers.hbbgvauth;
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

        let phone = req.body.phone || "";
        let name = req.body.name || "";
        let age = req.body.age || 18;
        let address = {
            name: req.body.addressName || "",
            coordinates: {
                lat: req.body.lat || 0,
                lng: req.body.lng || 0
            }
        };
        let gender = req.body.gender || 0;

        let location = {
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
                            (error, result) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0);
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
                                    (error, result) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        return msg.msgReturn(res, 0);
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
        let ownerId = req.cookies.userId;

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
        let id = req.cookies.userId;
        // let id = '5911460ae740560cb422ac35';
        let process = req.query.process;

        let startAt = req.query.startAt;
        let endAt = req.query.endAt;
        let limit = req.query.limit || 0;
        let sortByTaskTime = req.query.sortByTaskTime;

        let findQuery = {
            'stakeholders.owner': id,
            status: true
        }

        if (process) {
            findQuery['process'] = process;
        }

        if (startAt || endAt) {
            let timeQuery = {};

            if (startAt) {
                let date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                let date = new Date(endAt);
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

        let sortQuery = { 'history.createAt': -1 };

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
                        return msg.msgReturn(res, 0, data);
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
        let id = req.cookies.userId;
        // let id = '5911460ae740560cb422ac35';
        let process = req.query.process || '000000000000000000000005';

        let startAt = req.query.startAt;
        let endAt = req.query.endAt;
        let limit = req.query.limit || 10;
        let page = req.query.page || 1;

        let findQuery = {
            'stakeholders.owner': id,
            status: true
        }

        if (process) {
            findQuery['process'] = process;
        }

        if (startAt || endAt) {
            let timeQuery = {};

            if (startAt) {
                let date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                let date = new Date(endAt);
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

        let options = {
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
                return msg.msgReturn(res, 0, data);
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAllWorkedMaid').get((req, res) => {
    try {
        let id = req.cookies.userId;

        let startAt = req.query.startAt;
        let endAt = req.query.endAt;

        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.owner': new ObjectId(id)
        };

        if (startAt || endAt) {
            let timeQuery = {};

            if (startAt) {
                let date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                let date = new Date(endAt);
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
                    // time: '$info.time.startAt'
                }
            }
        ],
            // {
            //     allowDiskUse: true
            // },
            (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Maid.populate(data, { path: '_id', select: 'info work_info' }, (error, owner) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                if (validate.isNullorEmpty(owner)) {
                                    return msg.msgReturn(res, 4);
                                } else {
                                    return msg.msgReturn(res, 0, owner);
                                }
                            }
                        });
                    }
                }
            }
        );
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/comment').post((req, res) => {
    try {
        let comment = new Comment();
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
                                let ep_2 = data.work_info.evaluation_point;
                                let new_ep = (comment.evaluation_point + ep_2) / 2;

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
        let id = req.query.id;

        let limit = parseFloat(req.query.limit) || 20;
        let page = req.query.page || 1;

        let query = { toId: id };
        let options = {
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
        let report = new Report();
        report.fromId = req.cookies.userId;
        report.toId = req.body.toId;
        report.content = req.body.content;
        report.createAt = new Date();
        report.status = true;

        Maid.findOne({ _id: report.toId, status: true }).select('work_info').exec((error, data) => {
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
                let date = new Date(startAt);
                date.setUTCHours(0, 0, 0, 0);
                timeQuery['$gte'] = date;
            }

            if (endAt) {
                let date = new Date(endAt);
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
                    let task = result.task;
                    let bill = result.bill;
                    let owner = result.owner;

                    let g = {};

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

        Bill.aggregate(
            {
                $match: {
                    owner: new ObjectId(id),
                    isSolved: false
                }
            },
            {
                // $group: {
                //     _id: '$owner',
                //     tasks: { $push: '$task' }
                // }
                $project: {
                    _id: 1,
                    task: 1,
                    price: 1,
                    period: 1
                }
            },
            (error, data) => {
                console.log(data);
                // return msg.msgReturn(res, 0, data);
                // if (error) {
                //     return msg.msgReturn(res, 3);
                // } else {
                //     if (validate.isNullorEmpty(data)) {
                //         return msg.msgReturn(res, 4);
                //     } else {
                //         Task.populate(data, { path: 'tasks', select: 'info stakeholders check process history' }, (error, result) => {
                //             if (error) return msg.msgReturn(res, 3);
                //             var result = result[0].tasks;
                //             if (validate.isNullorEmpty(result)) return msg.msgReturn(res, 4);
                //             Work.populate(result, { path: 'info.work', select: 'name image' }, (error, result) => {
                //                 if (error) return msg.msgReturn(res, 3);
                //                 Package.populate(result, { path: 'info.package', select: 'name' }, (error, result) => {
                //                     if (error) return msg.msgReturn(res, 3);
                //                     Maid.populate(result, { path: 'stakeholders.received', select: 'info work_info' }, (error, result) => {
                //                         if (error) return msg.msgReturn(res, 3);
                //                         return msg.msgReturn(res, 0, result);
                //                     });
                //                 });
                //             });
                //         });
                //     }
                // }

                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Task.populate(data, { path: 'task', select: 'info stakeholders check process history' }, (error, result) => {
                            if (error) return msg.msgReturn(res, 3);
                            if (validate.isNullorEmpty(result)) return msg.msgReturn(res, 4);
                            Work.populate(result, { path: 'task.info.work', select: 'name image' }, (error, result) => {
                                if (error) return msg.msgReturn(res, 3);
                                Package.populate(result, { path: 'task.info.package', select: 'name' }, (error, result) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    Process.populate(result, { path: 'task.process', select: 'name' }, (error, result) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        Maid.populate(result, { path: 'task.stakeholders.received', select: 'info work_info' }, (error, result) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            return msg.msgReturn(res, 0, result);
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

module.exports = router;