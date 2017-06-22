var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var async = require('promise-async');

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
var Bill = require('../_model/bill');

var ObjectId = require('mongoose').Types.ObjectId;
var bodyparser = require('body-parser');

router.use(bodyparser.urlencoded({
    extended: true
}));
router.use(bodyparser.json());

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('maid_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

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
            // next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get Maid By Maid ID
 * info {
 *      type: GET
 *      url: /getById
 *      name: Get Maid By Maid ID
 *      description: Get one maid's information by maid's ID
 * }
 * 
 * params {
 *      id: Maid_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        Maid.findOne({ _id: id }).select('-status -location -__v').exec((error, data) => {
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

/** GET - Get All Maids
 * info {
 *      type: GET
 *      url: /getAll
 *      role: Owner
 *      name: Get All Maids
 *      description: Get all maids which is around [input location]
 * }
 * 
 * params {
 *      lat: Number
 *      lng: Number
 *      minDistance: Number
 *      maxDistance: Number
 *      limit: Number
 *      page: Number
 *      sortBy: "distance" | "price"
 *      sortType: "asc" | "desc"
 * }
 */
router.route('/getAll').get((req, res) => {
    try {
        // var language = req.cookies.language;
        // Package.setDefaultLanguage(language);
        // Work.setDefaultLanguage(language);
        // Process.setDefaultLanguage(language);

        var minDistance = req.query.minDistance || 1;
        var maxDistance = req.query.maxDistance || 2000;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        //         var name = req.body.name;
        //         var work = req.body.work;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var sortQuery = {};

        if (sortType == "desc") {
            if (sortBy == "price") {
                sortQuery = {
                    'work_info.price': -1
                }
            } else {
                sortQuery = {
                    'dist.calculated': -1
                }
            }
        } else {
            if (sortBy == "price") {
                sortQuery = {
                    'work_info.price': 1
                }
            } else {
                sortQuery = {
                    'dist.calculated': 1
                }
            }
        };

        var loc = {
            type: 'Point',
            coordinates: [
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        var matchQuery = { status: true };

        //         if (work) {
        //             var arr = new Array();
        //             if (work instanceof Array) {
        //                 for (var i = 0; i < work.length; i++) {
        //                     arr.push(new ObjectId(work[i]));
        //                 }
        //                 matchQuery['work_info.ability.work'] = {
        //                     $in: arr
        //                 }
        //             }
        //         }

        //         if (name) {
        //             matchQuery['info.name'] = new RegExp(name, 'i');
        //         }

        Maid.aggregate([
            {
                $geoNear: {
                    near: loc,
                    distanceField: 'dist.calculated',
                    minDistance: minDistance,
                    maxDistance: maxDistance,
                    num: limit,
                    spherical: true
                }
            },
            {
                $match: matchQuery
            },
            {
                // $sort: {
                //     'dist.calculated': 1
                // }
                $sort: sortQuery
            },
            {
                $skip: skip
            },
            {
                $project: {
                    info: 1,
                    work_info: 1
                    // history: 1,
                    // __v: 0
                }
            }
        ], (error, places) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Work.populate(places, { path: 'work_info.ability.work', select: 'name' }, (error, data) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0, places);
                    });
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Denied Tasks
 * info {
 *      type: GET
 *      url: /getAllDeniedTasks
 *      role: Maid
 *      name: Get All Denied Tasks
 *      description: Get all denied tasks
 * }
 */
router.route('/getAllDeniedTasks').get((req, res) => {
    try {
        var maidId = req.cookies.userId;

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
                path: 'stakeholders.owner',
                select: 'info'
            },
            {
                path: 'process',
                select: 'name'
            }
        ];

        Task.find(
            {
                'stakeholders.received': maidId,
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

/** GET - Get All Direct Requests
 * info {
 *      type: GET
 *      url: /getAll
 *      role: Maid
 *      name: Get All Direct Requests
 *      description: Get all direct request of Owner
 * }
 * 
 * body {
 *      lat: Number
 *      lng: Number
 *      minDistance: Number
 *      maxDistance: Number
 *      limit: Number
 *      page: Number
 *      sortBy: "distance" | "price"
 *      sortType: "asc" | "desc"
 *      title: String
 *      package: [package_ID]
 *      work: [work_ID]
 * }
 */
router.route('/getAllRequest').post((req, res) => {
    try {
        // var language = req.cookies.language;
        // Package.setDefaultLanguage(language);
        // Work.setDefaultLanguage(language);
        // Process.setDefaultLanguage(language);

        var maidId = req.cookies.userId;

        var minDistance = req.body.minDistance || 1;
        var maxDistance = req.body.maxDistance || 2000;
        var limit = req.body.limit || 20;
        var page = req.body.page || 1;
        var skip = (page - 1) * limit;

        var title = req.body.title;
        var package = req.body.package;
        var work = req.body.work;

        var sortBy = req.body.sortBy || "distance"; //distance & price
        var sortType = req.body.sortType || "asc"; //asc & desc

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

        var loc = {
            type: 'Point',
            coordinates: [
                parseFloat(req.body.lng) || 0,
                parseFloat(req.body.lat) || 0
            ]
        };

        var matchQuery = {
            process: new ObjectId('000000000000000000000006'),
            requestTo: new ObjectId(maidId),
            status: true
        };

        if (package) {
            var arr = new Array();
            if (package instanceof Array) {
                for (var i = 0; i < package.length; i++) {
                    arr.push(new ObjectId(package[i]));
                }

                matchQuery['info.package'] = {
                    $in: arr
                }
            }
        }

        if (work) {
            var arr = new Array();
            if (work instanceof Array) {
                for (var i = 0; i < work.length; i++) {
                    arr.push(new ObjectId(work[i]));
                }
                matchQuery['info.work'] = {
                    $in: arr
                }
            }
        }

        if (title) {
            matchQuery['info.title'] = new RegExp(title, 'i');
        }

        Task.aggregate([
            {
                $geoNear: {
                    near: loc,
                    distanceField: 'dist.calculated',
                    minDistance: minDistance,
                    maxDistance: maxDistance,
                    num: limit,
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
                $skip: skip
            },
            {
                $project: {
                    location: 0,
                    __v: 0
                }
            }
        ], (error, places) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Owner.populate(places, { path: 'stakeholders.owner', select: 'info' }, (error, data) => {
                        if (error) return msg.msgReturn(res, 3);
                        Work.populate(data, { path: 'info.work', select: 'name image' }, (error, data) => {
                            if (error) return msg.msgReturn(res, 3);
                            Package.populate(data, { path: 'info.package', select: 'name' }, (error, data) => {
                                if (error) return msg.msgReturn(res, 3);
                                Process.populate(data, { path: 'process', select: 'name' }, (error, data) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    return msg.msgReturn(res, 0, data);
                                });
                            });
                        });
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Tasks By Maid ID
 * info {
 *      type: GET
 *      url: /getAllTasks
 *      name: Get All Tasks By Maid ID
 *      description: Get tasks by Maid's ID
 * }
 * 
 * params {
 *      id: Maid_ID
 *      process: process_ID
 * }
 * 
 * body {
 *      null
 * } 
 */
router.route('/getAllTasks').get((req, res) => {
    try {
        // console.log(req.body)
        let id = req.cookies.userId;
        // let id = '5923c12f7d7da13b240e7a77';
        let process = req.query.process;
        let startAt = req.query.startAt;
        let endAt = req.query.endAt;
        let limit = req.query.limit || 0;
        let sortByTaskTime = req.query.sortByTaskTime;

        console.log(req.body)

        var findQuery = {
            status: true
        }

        if (process) {
            if (process == '000000000000000000000001') {
                // findQuery['$or'] = [
                //     { 'stakeholders.request.maid': new ObjectId(id) },
                //     { 'requestTo': new ObjectId(id) }
                // ]
                findQuery['stakeholders.request.maid'] = new ObjectId(id);
                findQuery['process'] = {
                    $in: ['000000000000000000000001', '000000000000000000000006']
                }
            } else {
                findQuery['stakeholders.received'] = new ObjectId(id);
                findQuery['process'] = process;
            }
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
                path: 'process',
                select: 'name'
            },
            {
                path: 'stakeholders.owner',
                select: 'info evaluation_point'
            }
        ]

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

        let sortQuery = { 'history.createAt': -1 };

        if (sortByTaskTime) {
            sortQuery = { 'info.time.endAt': 1 };
        }

        console.log(findQuery)

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
        console.log(error)
        return msg.msgReturn(res, 3);
    }
});

router.route('/comment').post((req, res) => {
    try {
        let comment = new Comment();
        comment.fromId = req.cookies.userId;
        comment.toId = req.body.toId;
        comment.task = req.body.task;
        comment.content = req.body.content;
        comment.evaluation_point = req.body.evaluation_point;
        comment.createAt = new Date();
        comment.status = true;

        Owner.findOne({ _id: comment.toId, status: true }).select('evaluation_point').exec((error, data) => {
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
                                let ep_2 = data.evaluation_point;
                                let new_ep = (comment.evaluation_point + ep_2) / 2;

                                if ((comment.evaluation_point + ep_2) % 2 >= 5) {
                                    new_ep = Math.ceil(new_ep);
                                } else {
                                    new_ep = Math.round(new_ep);
                                }

                                Owner.findOneAndUpdate(
                                    {
                                        _id: comment.toId,
                                        status: true
                                    },
                                    {
                                        $set: {
                                            evaluation_point: new_ep
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
            console.log(data);
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                Owner.populate(data, { path: 'docs.fromId', select: 'info' }, (error, data) => {
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
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

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
            'stakeholders.received': id,
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
                path: 'stakeholders.owner',
                select: 'info evaluation_point'
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

router.route('/getAllWorkedOwner').get((req, res) => {
    try {
        let id = req.cookies.userId;

        let startAt = req.query.startAt;
        let endAt = req.query.endAt;

        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.received': new ObjectId(id)
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
                    _id: '$stakeholders.owner',
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
                        Owner.populate(data, { path: '_id', select: 'info evaluation_point' }, (error, owner) => {
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

router.route('/getTaskComment').get((req, res) => {
    try {
        let id = req.cookies.userId;
        let task = req.query.task;

        Comment.findOne({ toId: id, task: task, status: true }).select('createAt evaluation_point content').exec((error, data) => {
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

router.route('/getTaskOfOwner').get((req, res) => {
    try {
        let id = req.cookies.userId;
        // let id = '5911460ae740560cb422ac35';
        var ownerId = req.query.owner;
        let process = req.query.process || '000000000000000000000005';

        let startAt = req.query.startAt;
        let endAt = req.query.endAt;
        let limit = req.query.limit || 10;
        let page = req.query.page || 1;

        let findQuery = {
            'stakeholders.owner': ownerId,
            'stakeholders.received': id,
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
                path: 'stakeholders.owner',
                select: 'info evaluation_point'
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

        console.log(findQuery)

        Task.paginate(findQuery, options).then(data => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                return msg.msgReturn(res, 0, data);
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/statistical').get((req, res) => {
    try {
        var id = req.cookies.userId;
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

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
                    var d = {
                        totalPrice: bill.totalPrice,
                        task: task
                    }
                    return msg.msgReturn(res, 0, d);
                }
            }
        );
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

        Owner.findOne({ _id: report.toId, status: true }).exec((error, data) => {
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

module.exports = router;