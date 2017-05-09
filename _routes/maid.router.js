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

router.use(bodyparser.json({
    limit: '50mb',
}));

// setting limit of FILE
router.use(bodyparser.urlencoded({
    limit: '50mb',
    parameterLimit: 1000000,
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

const hash_key = 'HBBSolution';
const token_length = 64;

function hash(content) {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', hash_key)
        .update(content)
        .digest('hex');
    return hash;
}

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
            next();
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

router.route('/getAllDeniedTasks').get((req, res) => {
    try {
        var maidId = req.query.maidId;

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

router.route('/getAllRequest').post((req, res) => {
    try {
        var language = req.cookies.language;
        Package.setDefaultLanguage(language);
        Work.setDefaultLanguage(language);
        Process.setDefaultLanguage(language);

        var maidId = req.body.maidId;

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
        var id = req.query.id;
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

/** POST - Create Maid's Information
 * info {
 *      type: POST
 *      url: /create
 *      name: Create Maid's Information
 *      description: Create one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/create').post((req, res) => {
    try {
        var maid = new Maid();
        maid.info = {
            username: req.body.username || "",
            email: req.body.email || "",
            phone: req.body.phone || "",
            image: req.body.image || "",
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
        };

        maid.evaluation_point = 0;

        maid.work_info = {
            price: 0
        };

        maid.auth = {
            password: hash(req.body.password),
            device_token: req.body.device_token
        };

        maid.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        maid.status = true;

        maid.location = {
            type: 'Point',
            coordinates: [req.body.lng, req.body.lat]
        };

        Maid.findOne({ 'info.username': req.body.username }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    maid.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0);
                    });
                } else {
                    return msg.msgReturn(res, 2);
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** PUT - Update Maid's Information
 * info {
 *      type: PUT
 *      url: /update
 *      name: Update Maid's Information
 *      description: Update one Maid's information
 * }
 * 
 * params {
 *      null
 * }
 * 
 * body {
 *      id: Maid_ID
 *      username: String
 *      email: String
 *      phone: String
 *      image: String
 *      addressName: String
 *      lat: Number
 *      lng: Number
 *      gender: Number
 * }
 */
router.route('/update').put((req, res) => {
    try {
        var id = req.body.id;

        var maid = new Maid();
        maid.info = {
            username: req.body.username || "",
            email: req.body.email || "",
            phone: req.body.phone || "",
            image: req.body.image || "",
            address: {
                name: req.body.addressName || "",
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
        };

        maid.work_info = {
            ability: req.body.ability,
            price: 0
        };

        maid.location = {
            type: 'Point',
            coordinates: [req.body.lng, req.body.lat]
        };

        Maid.findOne({ _id: id }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Maid.findOneAndUpdate(
                        {
                            _id: id,
                            status: true
                        },
                        {
                            $set: {
                                info: maid.info,
                                work_info: maid.work_info,
                                location: maid.location,
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
                    )
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;