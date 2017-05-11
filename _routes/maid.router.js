var express = require('express');
var mongoose = require('mongoose');
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
        var language = req.cookies.language;
        Package.setDefaultLanguage(language);
        Work.setDefaultLanguage(language);
        Process.setDefaultLanguage(language);

        var minDistance = req.query.minDistance || 1;
        var maxDistance = req.query.maxDistance || 2000;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var name = req.body.name;
        var work = req.body.work;

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

        if (work) {
            var arr = new Array();
            if (work instanceof Array) {
                for (var i = 0; i < work.length; i++) {
                    arr.push(new ObjectId(work[i]));
                }
                matchQuery['work_info.ability.work'] = {
                    $in: arr
                }
            }
        }

        if (name) {
            matchQuery['info.name'] = new RegExp(name, 'i');
        }

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
                    auth: 0,
                    location: 0,
                    status: 0,
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
                    Work.populate(places, { path: 'work_info.ability.work', select: 'name' }, (error, data) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0, data);
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
                select: 'name'
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
        var language = req.cookies.language;
        Package.setDefaultLanguage(language);
        Work.setDefaultLanguage(language);
        Process.setDefaultLanguage(language);

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
                        Work.populate(data, { path: 'info.work', select: 'name' }, (error, data) => {
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
        var id = req.cookies.userId;
        var process = req.query.process;

        var findQuery = {
            status: true
        }

        if (process) {
            if (process == '000000000000000000000001' || process == '000000000000000000000002') {
                findQuery['stakeholders.request.maid'] = id;
                findQuery['process'] = process;
            } else {
                findQuery['stakeholders.received.maid'] = id;
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
                select: 'name'
            },
            {
                path: 'process',
                select: 'name'
            }
        ]

        Task.find(findQuery).populate(populateQuery).select('-location -status -__v').exec((error, data) => {
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

router.route('/getAllWorkedOwner').get((req, res) => {
    try {
        let id = req.cookies.userId;
        console.log(id);

        var matchQuery = {
            process: new ObjectId('000000000000000000000005'),
            'stakeholders.received': new ObjectId(id)
        };

        Task.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: '$stakeholders.owner',
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
                        Owner.populate(data, { path: '_id', select: 'info' }, (error, owner) => {
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

module.exports = router;