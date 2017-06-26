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

var bodyparser = require('body-parser');

router.use(bodyparser.urlencoded({
    extended: true
}));
router.use(bodyparser.json());

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('task_router is connecting');

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
                            console.log(data)
                            req.cookies['userId'] = data.auth.userId;
                            // req.cookies['deviceToken'] = "d97ocXsgXC4:APA91bGQcYODiUMjGG9ysByxG_v8J_B9Ce4rVznRXGb3ArAMv-7Q-CCyEYvoIQ-i4hVl9Yl7tdNzRF9zfxh75iS4El6w7GDuzAKYELw9XG9L5RgAJUmVysxs7s7o_20QQXNhyCJnShj0";
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

/** POST - Get All Tasks
 * info {
 *      type: POST
 *      url: /getAll
 *      role: Owner
 *      name: Get All Tasks
 *      description: Get all tasks which is around [input location]
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
 * 
 * body {
 *      title: String
 *      process: process_ID
 *      package: [ package_ID ]
 *      work: [ work_ID ]
 * }
 */
router.route('/getAll').post((req, res) => {
    try {
        var minDistance = req.body.minDistance || 1;
        var maxDistance = req.body.maxDistance || 2000;
        var limit = req.body.limit || 20;
        var page = req.body.page || 1;
        var skip = (page - 1) * limit;

        var title = req.body.title;
        var process = req.body.process;
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

        var matchQuery = { status: true };

        if (!process) {
            matchQuery['process'] = new ObjectId('000000000000000000000001');
        } else {
            matchQuery['process'] = {
                $in: [
                    new ObjectId(process)
                ]
            };
        }

        if (package) {
            matchQuery['info.package'] = new ObjectId(package);
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

        // console.log(matchQuery);
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
                    process: 1,
                    history: 1,
                    stakeholders: 1,
                    info: 1,
                    dist: 1
                    // status: 1
                }
            }
        ], (error, places) => {
            // console.log(places);
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
                                    else {
                                        let d = {
                                            docs: data,
                                            total: data.length,
                                            limit: limit,
                                            page: page,
                                            pages: Math.ceil(data.length / limit)
                                        }
                                        return msg.msgReturn(res, 0, d);
                                    }
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

/** GET - Get Task By Task ID
 * info {
 *      type: GET
 *      url: /getById
 *      role: All
 *      name: Get Task By Task ID
 *      description: Get one task by task ID
 * }
 * 
 * params {
 *      id: task_ID
 * }
 * 
 * body {
 *      null
 * }
 */
router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

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
        ]

        Task.findOne({ _id: id, status: true }).populate(populateQuery).select('-location -status -__v').exec((error, data) => {
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

/** POST - Create Task
 * info {
 *      type: POST
 *      url: /create
 *      role: Owner
 *      name: Create Task
 *      description: Create one task by owner
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      title: String
 *      package: package_ID
 *      work: work_ID
 *      description: String
 *      price: Number
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      startAt: Date
 *      endAt: Date
 *      hour: Number
 *      tools: Boolean
 *      process: process_ID
 * }
 */
router.route('/create').post((req, res) => {
    try {
        var task = new Task();

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
            owner: req.cookies.userId
        };

        task.process = new ObjectId('000000000000000000000001');

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

        let start = new Date(task.info.time.startAt);
        let end = new Date(task.info.time.endAt);
        if (start >= end) {
            return msg.msgReturn(res, 9);
        }

        // if (task.info.time.startAt >= task.info.time.endAt) {
        //     return msg.msgReturn(res, 9);
        // } else {
        //     var h = task.info.time.startAt.getHours() + task.info.time.endAt.getHours();
        //     if (task.info.time.hour > h) {
        //         return msg.msgReturn(res, 9);
        //     }
        // }

        Owner.findOne({ _id: req.cookies.userId }).exec((error, owner) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(owner)) {
                    return msg.msgReturn(res, 4);
                } else {
                    async.parallel({
                        work: function (callback) {
                            Work.findOne({ _id: req.body.work }).exec((error, data) => {
                                if (error) {
                                    callback(null, 2);
                                }
                                else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, 1);
                                    } else {
                                        callback(null, 0);
                                    }
                                }
                            });
                        },
                        package: function (callback) {
                            Package.findOne({ _id: req.body.package }).exec((error, data) => {
                                if (error) {
                                    callback(null, 2);
                                }
                                else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, 1);
                                    } else {
                                        callback(null, 0);
                                    }
                                }
                            });
                        },
                        process: function (callback) {
                            Process.findOne({ _id: task.process }).exec((error, data) => {
                                if (error) {
                                    callback(null, 2);
                                }
                                else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, 1);
                                    } else {
                                        callback(null, 0);
                                    }
                                }
                            });
                        },
                        task: function (callback) {
                            Task.find(
                                {
                                    'stakeholders.owner': req.cookies.userId,
                                    process: '000000000000000000000001',
                                    status: true
                                }).exec((error, data) => {
                                    if (error) {
                                        callback(null, 2);
                                    }
                                    else {
                                        if (validate.isNullorEmpty(data) || !data || data.length <= 10) {
                                            callback(null, 0);
                                        }
                                        else {
                                            callback(null, 4);
                                        }
                                    }
                                });
                        }
                    }, (error, result) => {
                        console.log(result);
                        if (error) {
                            console.log(error);
                            return msg.msgReturn(res, 3);
                        } else {
                            if (result.work == 0 && result.package == 0 && result.process == 0) {
                                if (result.task == 0) {
                                    task.save((error) => {
                                        if (error) {
                                            return msg.msgReturn(res, 3);
                                        }
                                        else {
                                            return msg.msgReturn(res, 0);
                                        }
                                    });
                                }
                                else if (result.task == 4) {
                                    return msg.msgReturn(res, 8);
                                }
                                else {
                                    return msg.msgReturn(res, 3);
                                }
                            } else {
                                if (result.work == 1 || result.package == 1 || result.process == 1) {
                                    return msg.msgReturn(res, 4);
                                } else {
                                    return msg.msgReturn(res, 3);
                                }
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** PUT - Update Task
 * info {
 *      type: PUT
 *      url: /update
 *      role: Owner
 *      name: Update Task
 *      description: Update one task by owner
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 *      title: String
 *      package: package_ID
 *      work: work_ID
 *      description: String
 *      price: Number
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      startAt: Date
 *      endAt: Date
 *      hour: Number
 *      tools: Boolean
 *      process: process_ID
 * }
 */
router.route('/update').put((req, res) => {
    try {
        var task = new Task();
        var id = req.body.id;

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

        // task.process = req.body.process;

        task.location = {
            type: 'Point',
            coordinates: [
                req.body.lng || 0,
                req.body.lat || 0
            ]
        };

        // let start = new Date(task.info.time.startAt);
        // let end = new Date(task.info.time.endAt);
        // if (start >= end) {
        //     return msg.msgReturn(res, 9);
        // }

        // if (task.info.time.startAt >= task.info.time.endAt) {
        //     return msg.msgReturn(res, 9);
        // } else {
        //     var h = task.info.time.startAt.getHours() + task.info.time.endAt.getHours();
        //     if (task.info.time.hour > h) {
        //         return msg.msgReturn(res, 9);
        //     }
        // }

        async.parallel({
            work: function (callback) {
                Work.findOne({ _id: req.body.work, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, 2);
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            callback(null, 0);
                        }
                    }
                });
            },
            package: function (callback) {
                Package.findOne({ _id: req.body.package, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, 2);
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            callback(null, 0);
                        }
                    }
                });
            },
            task: function (callback) {
                Task.findOne({ _id: req.body.id, 'stakeholders.owner': req.cookies.userId, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, 2);
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            if (data.process == '000000000000000000000001') {
                                callback(null, 0);
                            } else {
                                callback(null, 3);
                            }
                        }
                    }
                });
            }
        }, (error, result) => {
            console.log(result);
            if (error) {
                console.log(error);
                return msg.msgReturn(res, 3);
            } else {
                if (result.work == 0 && result.package == 0 && result.task == 0) {
                    Task.findOneAndUpdate(
                        {
                            _id: id,
                            'stakeholders.owner': req.cookies.userId,
                            status: true
                        },
                        {
                            $set: {
                                info: task.info,
                                // process: task.process,
                                location: task.location,
                                'history.updateAt': new Date()
                            }
                        },
                        {
                            upsert: true
                        },
                        (error, result) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                return msg.msgReturn(res, 0);
                            }
                        }
                    )
                } else {
                    if (result.work == 1 || result.package == 1 || result.task == 1) {
                        return msg.msgReturn(res, 4);
                    } else if (result.task == 3) {
                        return msg.msgReturn(res, 7);
                    } else {
                        return msg.msgReturn(res, 3);
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** DELETE - Delete Task
 * info {
 *      type: DELETE
 *      url: /delete
 *      role: Owner
 *      name: Delete Task
 *      description: Delete one task by owner
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 * }
 */
router.route('/delete').delete((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;

        Task.findOne(
            {
                _id: id,
                'stakeholders.owner': ownerId,
                status: true
            }).exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Task.findOneAndUpdate(
                            {
                                _id: id,
                                'stakeholders.owner': ownerId,
                                status: true
                            },
                            {
                                $set: {
                                    'history.updateAt': new Date(),
                                    status: false
                                }
                            },
                            {
                                upsert: true
                            },
                            (error, result) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0);
                            }
                        )
                    }
                }
            });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** DELETE - Cancel Task
 * info {
 *      type: DELETE
 *      url: /Cancel
 *      role: Maid
 *      name: Cancel Task
 *      description: Cancel one task by maid
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 *      maidId: maid_ID
 * }
 */
router.route('/cancel').delete((req, res) => {
    try {
        var id = req.body.id;
        var maidId = req.cookies.userId;

        Task.findOne(
            {
                _id: id,
                'stakeholders.request.maid': maidId,
                status: true
            }
        ).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    if (data.process == '000000000000000000000001') {
                        Task.findOneAndUpdate(
                            {
                                _id: id,
                                'stakeholders.request.maid': maidId,
                                process: '000000000000000000000001',
                                status: true
                            },
                            {
                                $pull: {
                                    'stakeholders.request': { maid: maidId }
                                }
                            },
                            {
                                safe: true
                            },
                            (error, result) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0);
                            }
                        )
                    } else if (data.process == '000000000000000000000003') {
                        Owner.findOne({ _id: data.stakeholders.owner, status: true }).select('auth').exec((error, owner) => {
                            Task.findOneAndUpdate(
                                {
                                    _id: id,
                                    'stakeholders.received': maidId,
                                    process: '000000000000000000000003',
                                    status: true
                                },
                                {
                                    $set: {
                                        process: new ObjectId('000000000000000000000001')
                                    },
                                    $pull: {
                                        'stakeholders.request': { maid: maidId }
                                    },
                                    $unset: {
                                        'stakeholders.received': maidId,
                                    }
                                },
                                {
                                    safe: true
                                },
                                (error, result) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    else {
                                        return owner.auth.device_token == '' ?
                                            msg.msgReturn(res, 17) :
                                            FCMService.pushNotification(res, owner, req.cookies.language, 0, [])
                                    }
                                    // return msg.msgReturn(res, 0);
                                }
                            )
                        })
                    } else {
                        return msg.msgReturn(res, 15);
                    }
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

/** POST - Reserve Task
 * info {
 *      type: POST
 *      url: /reserve
 *      role: Maid
 *      name: Reserve Task
 *      description: Reserve one task by maid
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 *      maidId: maid_ID
 * }
 */
router.route('/reserve').post((req, res) => {
    try {
        var id = req.body.id;
        var maidId = req.cookies.userId;

        async.parallel({
            maid: function (callback) {
                Maid.findOne({ _id: maidId, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, 2);
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            callback(null, 0);
                        }
                    }
                });
            }
        }, (error, result) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (result.maid == 0) {
                    maid = {
                        maid: maidId,
                        time: new Date()
                    };

                    Task.findOne(
                        {
                            _id: id,
                            process: '000000000000000000000001',
                            'stakeholders.request.maid': maidId,
                            status: true
                        }).exec((error, data) => {
                            console.log(data)
                            if (error) {
                                return msg.msgReturn(res, 3);
                            }
                            else {
                                if (validate.isNullorEmpty(data)) {
                                    Task.findOneAndUpdate(
                                        {
                                            _id: id,
                                            process: '000000000000000000000001',
                                            status: true
                                        },
                                        {
                                            $push: {
                                                'stakeholders.request': maid
                                            }
                                        },
                                        {
                                            upsert: true
                                        },
                                        (error) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            else return msg.msgReturn(res, 0);
                                        }
                                    );
                                    // return msg.msgReturn(res, 4);
                                } else {
                                    return msg.msgReturn(res, 16);
                                    // var check = false
                                    // var lstMaid = data.stakeholders.request;

                                    // if (!validate.isNullorEmpty(lstMaid)) {
                                    //     for (i = 0; i < lstMaid.length; i++) {
                                    //         if (lstMaid[i].maid == maidId) {
                                    //             check = true
                                    //             break
                                    //         }
                                    //     }
                                    // }

                                    // if (check) {
                                    //     return msg.msgReturn(res, 16);
                                    // } else {
                                    //     Task.findOneAndUpdate(
                                    //         {
                                    //             _id: id,
                                    //             process: '000000000000000000000001',
                                    //             status: true
                                    //         },
                                    //         {
                                    //             $push: {
                                    //                 'stakeholders.request': maid
                                    //             }
                                    //         },
                                    //         {
                                    //             upsert: true
                                    //         },
                                    //         (error) => {
                                    //             if (error) return msg.msgReturn(res, 3);
                                    //             else return msg.msgReturn(res, 0);
                                    //         }
                                    //     );
                                    // }
                                }
                            }
                        });
                } else {
                    if (result.maid == 1) {
                        return msg.msgReturn(res, 4);
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

/** POST - Submit Task
 * info {
 *      type: POST
 *      url: /submit
 *      role: Owner
 *      name: Submit Task
 *      description: Submit one task by maid
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: task_ID
 *      ownerId: owner_ID
 *      maidId: maid_ID
 * }
 */
router.route('/submit').post((req, res) => {
    try {
        var id = req.body.id;
        var ownerId = req.cookies.userId;
        // var ownerId = '5911460ae740560cb422ac35';
        var maidId = req.body.maidId;

        console.log(req.body);
        async.parallel({
            //check maid exist
            maid: function (callback) {
                Maid.findOne({ _id: maidId, status: true }).exec((error, data) => {
                    if (error) {
                        console.log(error)
                        callback(null, 2);
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, 1);
                        } else {
                            callback(null, 0);
                        }
                    }
                });
            },

            //check task exist
            task: function (callback) {
                Task.findOne(
                    {
                        _id: id,
                        'stakeholders.owner': ownerId,
                        process: new ObjectId('000000000000000000000001'),
                        status: true
                    }).exec((error, data) => {
                        if (error) {
                            console.log(error)
                            callback(null, 2);
                        }
                        else {
                            if (validate.isNullorEmpty(data)) {
                                callback(null, 1);
                            } else {
                                //check no-duplicated time of task
                                // Task.findOne(
                                //     {
                                //         'stakeholders.received': maidId,
                                //         $or: [
                                //             //x >= s & y <= e
                                //             {
                                //                 'info.time.startAt': {
                                //                     $gte: data.info.time.startAt
                                //                 },
                                //                 'info.time.endAt': {
                                //                     $lte: data.info.time.endAt
                                //                 }
                                //             },

                                //             //x <= s & y >= e
                                //             {
                                //                 'info.time.startAt': {
                                //                     $lte: data.info.time.startAt
                                //                 },
                                //                 'info.time.endAt': {
                                //                     $gte: data.info.time.endAt
                                //                 }
                                //             },

                                //             //x [>= s & <= e] & y >= e
                                //             {
                                //                 'info.time.startAt': {
                                //                     $gte: data.info.time.startAt,
                                //                     $lte: data.info.time.endAt
                                //                 },
                                //                 'info.time.endAt': {
                                //                     $gte: data.info.time.endAt
                                //                 }
                                //             },

                                //             //x <= s & y [>= s & <= e]
                                //             {
                                //                 'info.time.startAt': {
                                //                     $lte: data.info.time.startAt
                                //                 },
                                //                 'info.time.endAt': {
                                //                     $gte: data.info.time.startAt,
                                //                     $lte: data.info.time.endAt
                                //                 }
                                //             },
                                //         ]
                                //     }
                                // ).exec((error, result) => {
                                //     if (error) {
                                //         console.log(error)
                                //         callback(null, 2);
                                //     } else {
                                //         if (validate.isNullorEmpty(result)) {
                                //             callback(null, 0);
                                //         } else {
                                //             callback(null, 3);
                                //         }
                                //     }
                                // });
                                callback(null, 0);
                            }
                        }
                    });
            }
        }, (error, result) => {
            console.log(result);
            if (error) {
                // console.log(error)
                return msg.msgReturn(res, 3);
            } else {
                if (result.maid == 0 && result.task == 0) {
                    Task.findOneAndUpdate(
                        {
                            _id: id,
                            'stakeholders.owner': ownerId,
                            process: new ObjectId('000000000000000000000001'),
                            status: true
                        },
                        {
                            $set: {
                                'stakeholders.received': maidId,
                                process: new ObjectId('000000000000000000000003')
                            }
                        },
                        {
                            upsert: true
                        },
                        (error) => {
                            console.log(error)
                            if (error) return msg.msgReturn(res, 3);
                            return msg.msgReturn(res, 0);
                        }
                    );
                } else {
                    if (result.maid == 1 || result.task == 1) {
                        return msg.msgReturn(res, 4);
                    }
                    // else if (result.task == 3) {
                    //     return msg.msgReturn(res, 10);
                    // }
                    else {
                        return msg.msgReturn(res, 3);
                    }
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** POST - Check In Task
 * info {
 *      type: POST
 *      url: /checkin
 *      role: Owner
 *      name: Check In Task
 *      description: Check in one task by Owner
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
router.route('/checkin').post(multipartMiddleware, (req, res) => {
    try {
        let id = req.body.id;
        let ownerId = req.cookies.userId;
        // let ownerId = req.body.ownerId;
        // let subs_key = '8f22becb14664c0c87864d840dfcf114';
        let subs_key = 'b1726597dcc74171abf38be836846977'

        Task.findOne(
            {
                _id: id,
                'stakeholders.owner': ownerId,
                process: '000000000000000000000003',
                status: true
            })
            .populate('stakeholders.owner')
            .exec((error, data) => {
                // console.log(data.stakeholders.owner.info);
                if (error) {
                    return msg.msgReturn(res, 3);
                }
                else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        // if (validate.isNullorEmpty(data.check.check_in)) {
                        //     cloudinary.uploader.upload(
                        //         req.files.image.path,
                        //         function (result) {

                        //             let imgUrl = data.stakeholders.owner.info.image;
                        //             console.log(imgUrl);

                        //             async.parallel({
                        //                 faceId1: function (callback) {
                        //                     request({
                        //                         method: 'POST',
                        //                         preambleCRLF: true,
                        //                         postambleCRLF: true,
                        //                         uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                        //                         headers: {
                        //                             'Content-Type': 'application/json',
                        //                             'Ocp-Apim-Subscription-Key': subs_key
                        //                         },
                        //                         body: JSON.stringify(
                        //                             {
                        //                                 url: imgUrl
                        //                             }
                        //                         )
                        //                     },
                        //                         function (error, response, body) {
                        //                             if (error) {
                        //                                 console.error('upload failed:', error);
                        //                                 callback(null, null);
                        //                             }
                        //                             console.log('FaceId1 successful!  Server responded with:', body);
                        //                             var data = JSON.parse(body);

                        //                             if (validate.isNullorEmpty(data)) callback(null, [])
                        //                             callback(null, data[0].faceId);
                        //                         });
                        //                 },
                        //                 faceId2: function (callback) {
                        //                     request({
                        //                         method: 'POST',
                        //                         preambleCRLF: true,
                        //                         postambleCRLF: true,
                        //                         uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false',
                        //                         headers: {
                        //                             'Content-Type': 'application/json',
                        //                             'Ocp-Apim-Subscription-Key': subs_key
                        //                         },
                        //                         body: JSON.stringify(
                        //                             {
                        //                                 url: result.url
                        //                             }
                        //                         )
                        //                     },
                        //                         function (error, response, body) {
                        //                             if (error) {
                        //                                 // console.error('upload failed:', error);
                        //                                 callback(null, null);
                        //                             }
                        //                             console.log('FaceId2 successful!  Server responded with:', body);
                        //                             var data = JSON.parse(body);
                        //                             if (validate.isNullorEmpty(data)) callback(null, [])
                        //                             callback(null, data[0].faceId);
                        //                         });
                        //                 }
                        //             }, (error, data) => {
                        //                 if (error) {
                        //                     return msg.msgReturn(res, 3);
                        //                 } else {
                        //                     if (validate.isNullorEmpty(data.faceId1) || validate.isNullorEmpty(data.faceId2)) {
                        //                         return msg.msgReturn(res, 3);
                        //                     }
                        //                     else {
                        //                         request({
                        //                             method: 'POST',
                        //                             preambleCRLF: true,
                        //                             postambleCRLF: true,
                        //                             uri: 'https://southeastasia.api.cognitive.microsoft.com/face/v1.0/verify',
                        //                             headers: {
                        //                                 'Content-Type': 'application/json',
                        //                                 'Ocp-Apim-Subscription-Key': subs_key
                        //                             },
                        //                             body: JSON.stringify(
                        //                                 {
                        //                                     "faceId1": data.faceId1,
                        //                                     "faceId2": data.faceId2
                        //                                 }
                        //                             )
                        //                         },
                        //                             function (error, response, body) {
                        //                                 if (error) {
                        //                                     console.error('upload failed:', error);
                        //                                     return msg.msgReturn(res, 3);
                        //                                 }
                        //                                 var item = JSON.parse(body);
                        //                                 return msg.msgReturn(res, 0, item);
                        //                             });
                        //                     }
                        //                 }
                        //             });
                        //         }
                        //     );
                        // }
                        // else {
                        //     return msg.msgReturn(res, 11);
                        // }

                        if (validate.isNullorEmpty(data.check.check_in)) {
                            Task.findOneAndUpdate(
                                {
                                    _id: id,
                                    'stakeholders.owner': ownerId,
                                    process: '000000000000000000000003',
                                    status: true
                                },
                                {
                                    $set: {
                                        process: new ObjectId('000000000000000000000004'),
                                        'check.check_in': new Date()
                                    }
                                },
                                {
                                    upsert: true
                                }, (error, data) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    return msg.msgReturn(res, 0);
                                }
                            )
                        } else {
                            return msg.msgReturn(res, 11);
                        }
                    }
                }
            });
    } catch (error) {
        return msg.msgReturn(res, 3);
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
        // var ownerId = '5911460ae740560cb422ac35';

        async.parallel({
            task: function (callback) {
                Task.findOne(
                    {
                        _id: id,
                        'stakeholders.owner': ownerId,
                        process: '000000000000000000000004',
                        status: true
                    }).exec((error, data) => {
                        if (error) {
                            callback(null, 2);
                        }
                        else {
                            if (validate.isNullorEmpty(data)) {
                                callback(null, 1);
                            } else {
                                if (validate.isNullorEmpty(data.check.check_in)) {
                                    callback(null, 4);
                                }
                                else if (validate.isNullorEmpty(data.check.check_out)) {
                                    callback(null, 0);
                                }
                                else {
                                    callback(null, 3);
                                }
                            }
                        }
                    });
            }
        }, (error, result) => {
            console.log(result);
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (result.task == 0) {
                    // if (0 === 0) {
                    console.log('doing')
                    let checkOut = new Date();
                    Task.findOneAndUpdate(
                        {
                            _id: id,
                            'stakeholders.owner': ownerId,
                            process: '000000000000000000000004',
                            status: true
                        },
                        {
                            $set: {
                                process: new ObjectId('000000000000000000000005'),
                                'check.check_out': checkOut
                            }
                        },
                        {
                            upsert: true
                        },
                        (error, task) => {
                            if (error) return msg.msgReturn(res, 3);
                            else {
                                let bill = new Bill();
                                bill.owner = task.stakeholders.owner;
                                bill.maid = task.stakeholders.received;
                                bill.task = task._id;
                                bill.isSolved = false;
                                bill.date = new Date();
                                bill.createAt = new Date();
                                bill.method = 1;
                                bill.status = true;

                                Maid.findOne({ _id: task.stakeholders.received, status: true }).exec((error, maid) => {
                                    if (error) return msg.msgReturn(res, 3);
                                    if (validate.isNullorEmpty(maid)) return msg.msgReturn(res, 4);

                                    if (task.info.package == '000000000000000000000001') {
                                        bill.price = task.info.price;

                                        let timeIn = new Date(task.info.time.startAt);
                                        let timeOut = new Date(task.info.time.endAt);

                                        let t = new Date(timeOut.getTime() - timeIn.getTime());
                                        bill.period = t;

                                        let dt = {
                                            _id: bill._id,
                                            period: t,
                                            price: task.info.price,
                                            date: new Date()
                                        }

                                        bill.save((error) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            return maid.auth.device_token == '' ?
                                                msg.msgReturn(res, 17) :
                                                FCMService.pushNotification(res, maid, req.cookies.language, 5, dt)
                                        });
                                    }

                                    if (task.info.package == '000000000000000000000002') {

                                        // console.log(maid);
                                        if (error) {
                                            return msg.msgReturn(res, 0);
                                        } else {
                                            if (validate.isNullorEmpty(maid)) {
                                                return msg.msgReturn(res, 4);
                                            } else {
                                                let timeIn = new Date(task.check.check_in);
                                                let timeOut = new Date(checkOut);
                                                // console.log(timeIn);
                                                // console.log(timeOut);

                                                let t = new Date(timeOut.getTime() - timeIn.getTime());
                                                console.log(t);

                                                var price = 0;
                                                console.log(price);

                                                let maidPrice = maid.work_info.price;
                                                console.log(maidPrice);

                                                let hours = t.getUTCHours();
                                                let minutes = t.getUTCMinutes();

                                                if (hours == 0) {
                                                    price = maidPrice;
                                                } else {
                                                    if (minutes >= 0 && minutes < 15) {
                                                        price = maidPrice * hours + maidPrice / 4;
                                                    } else if (minutes >= 15 && minutes < 30) {
                                                        price = maidPrice * hours + maidPrice / 2;
                                                    } else if (minutes >= 30 && minutes < 45) {
                                                        price = maidPrice * hours + maidPrice * (3 / 4);
                                                    } else {
                                                        price = maidPrice * (hours + 1);
                                                    }
                                                }
                                                // console.log('price: ' + price);

                                                // console.log(maid.work_info.price);

                                                // console.log(t)
                                                // console.log(period)

                                                bill.period = t;
                                                bill.price = price;

                                                let dt = {
                                                    _id: bill._id,
                                                    period: t,
                                                    price: price,
                                                    date: new Date()
                                                }

                                                bill.save((error) => {
                                                    console.log(error)
                                                    if (error) return msg.msgReturn(res, 3);
                                                    else {
                                                        return maid.auth.device_token == '' ?
                                                            msg.msgReturn(res, 17) :
                                                            FCMService.pushNotification(res, maid, req.cookies.language, 5, dt)
                                                    }
                                                    // return msg.msgReturn(res, 0, bill);
                                                });
                                            }
                                        }
                                    } else {
                                        return msg.msgReturn(res, 4);
                                    }
                                })
                            }
                        }
                    );
                } else {
                    if (result.task == 1) {
                        return msg.msgReturn(res, 4);
                    }
                    else if (result.task == 3) {
                        return msg.msgReturn(res, 12);
                    }
                    else if (result.task == 4) {
                        return msg.msgReturn(res, 13);
                    }
                    else {
                        return msg.msgReturn(res, 3);
                    }
                }
            }
        });
    } catch (error) {
        console.log(error)
        return msg.msgReturn(res, 3);
    }
});

router.route('/sendRequest').post((req, res) => {
    try {
        var task = new Task();
        var maidId = req.body.maidId;
        let ownerId = req.cookies.userId;

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
            request: [
                {
                    maid: maidId,
                    time: new Date()
                }
            ],
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

        // task.requestTo = maidId;

        task.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        task.status = true;

        // let start = new Date(task.info.time.startAt);
        // let end = new Date(task.info.time.endAt);
        // if (start >= end) {
        //     return msg.msgReturn(res, 9);
        // }

        // if (task.info.time.startAt >= task.info.time.endAt) {
        //     return msg.msgReturn(res, 9);
        // } else {
        //     var h = task.info.time.startAt.getHours() + task.info.time.endAt.getHours();
        //     if (task.info.time.hour > h) {
        //         return msg.msgReturn(res, 9);
        //     }
        // }

        // console.log(task);

        Owner.findOne({ _id: ownerId, status: true }).exec((error, owner) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(owner)) {
                    return msg.msgReturn(res, 4);
                } else {
                    async.parallel({
                        maid: function (callback) {
                            Maid.findOne({ _id: req.body.maidId }).exec((error, data) => {
                                if (error) {
                                    callback(null, { value: 2 });
                                }
                                else {
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
                                }
                                else {
                                    if (validate.isNullorEmpty(data)) {
                                        callback(null, 1);
                                    } else {
                                        callback(null, 0);
                                    }
                                }
                            });
                        }
                    }, (error, result) => {
                        console.log(result)
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            if (result.work == 0 && result.maid.value == 0) {
                                task.save((error) => {
                                    if (error) {
                                        return msg.msgReturn(res, 3);
                                    }
                                    else {
                                        // result.maid.data.auth.device_token = 'd97ocXsgXC4:APA91bGQcYODiUMjGG9ysByxG_v8J_B9Ce4rVznRXGb3ArAMv-7Q-CCyEYvoIQ-i4hVl9Yl7tdNzRF9zfxh75iS4El6w7GDuzAKYELw9XG9L5RgAJUmVysxs7s7o_20QQXNhyCJnShj0'
                                        return result.maid.data.auth.device_token == '' ?
                                            msg.msgReturn(res, 17) :
                                            FCMService.pushNotification(res, result.maid.data, req.cookies.language, 6)
                                    }
                                });
                            } else {
                                if (result.work == 1) {
                                    return msg.msgReturn(res, 4);
                                } else {
                                    return msg.msgReturn(res, 3);
                                }
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.log(error)
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
                    }
                    else {
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
                Task.findOne(
                    {
                        _id: id,
                        'stakeholders.owner': ownerId,
                        process: '000000000000000000000006',
                        status: true
                    }).exec((error, data) => {
                        if (error) {
                            callback(null, 2);
                        }
                        else {
                            if (validate.isNullorEmpty(data)) {
                                callback(null, 1);
                            } else {
                                //check no-duplicated time of task
                                Task.findOne(
                                    {
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
                                    }
                                ).exec((error, result) => {
                                    console.log(result)
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
            console.log(result)
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (result.owner.value == 0 && result.task == 0) {
                    Task.findOneAndUpdate(
                        {
                            _id: id,
                            'stakeholders.owner': ownerId,
                            process: '000000000000000000000006',
                            status: true
                        },
                        {
                            $set: {
                                'stakeholders.received': maidId,
                                process: new ObjectId('000000000000000000000003')
                            }
                        },
                        {
                            upsert: true
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3);
                            else {
                                return result.owner.data.auth.device_token == '' ?
                                    msg.msgReturn(res, 17) :
                                    FCMService.pushNotification(res, result.owner.data, req.cookies.language, 2, [])
                            }
                            // return msg.msgReturn(res, 0);
                        }
                    );
                } else {
                    if (result.owner.value == 1 || result.task == 1) {
                        return msg.msgReturn(res, 4);
                    }
                    else if (result.task == 3) {
                        return msg.msgReturn(res, 10);
                    }
                    else {
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

        Task.findOne({ _id: id, process: '000000000000000000000006', 'stakeholders.owner': ownerId }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Task.findOneAndUpdate(
                        {
                            _id: id,
                            process: '000000000000000000000006',
                            'stakeholders.owner': ownerId
                        },
                        {
                            status: false
                        },
                        {
                            upsert: true
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3);
                            return msg.msgReturn(res, 0);
                        }
                    )
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getRequest').get((req, res) => {
    try {
        let id = req.query.id;
        let matchQuery = { _id: new ObjectId(id), status: true };

        Task.aggregate([
            {
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
        let id = req.cookies.userId;
        let task = req.query.task;

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
