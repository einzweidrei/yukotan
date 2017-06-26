var express = require('express');
var mongoose = require('mongoose');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var mail = require('../_services/mail.service');
var mailService = new mail.MailService();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Term = require('../_model/term');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');
var AppInfo = require('../_model/app-info');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');
var randomstring = require("randomstring");

var ObjectId = require('mongoose').Types.ObjectId;

router.use(bodyparser.urlencoded({
    extended: true
}));
router.use(bodyparser.json());

const hash_key = 'LULULUL';
// const hash_key = 'HBBSolution';

function hash(content) {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', hash_key)
        .update(content)
        .digest('hex');
    return hash;
}

router.use(function (req, res, next) {
    console.log('package_router is connecting');

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

router.route('/create').post((req, res) => {
    try {
        let term = new Term();
        let language = req.cookies.language;
        Term.setDefaultLanguage(language);

        let name = req.body.name;
        let content = req.body.content;

        term.name = name
        term.status = true;
        term.history.createAt = new Date();
        term.history.updateAt = new Date();

        term.set('content.all', {
            en: content,
            vi: content
        })

        term.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        console.log(error)
        return msg.msgReturn(res, 3);
    }
});

router.route('/resetPassword').post((req, res) => {
    try {
        let newPw = randomstring.generate(7);
        let hashPw = hash(newPw);

        var username = req.body.username;
        var email = req.body.email;

        Owner.findOne({ 'info.username': username, 'info.email': email }).exec((error, data) => {
            if (error) {
                console.log(error);
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Owner.findOneAndUpdate(
                        {
                            'info.username': username,
                            'info.email': email
                        },
                        {
                            $set: {
                                'auth.password': hashPw
                            }
                        },
                        {
                            upsert: true
                        },
                        (error) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                mailService.resetPassword(email, newPw, res);

                                // console.log(mailService.resetPassword(email, newPw));
                                // if (boolean) return msg.msgReturn(res, 0);
                                // return msg.msgReturn(res, 0);
                            }
                        }
                    )
                }
            }
        });
    } catch (error) {
        console.log(error);
        return msg.msgReturn(res, 3);
    }
});

/** GET - Get All Maids
 * info {
 *      type: GET
 *      url: /getAllMaids
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
router.route('/getAllMaids').get((req, res) => {
    try {
        let minDistance = req.query.minDistance || 1;
        let maxDistance = req.query.maxDistance || 2000;
        let limit = req.query.limit || 20;
        let page = req.query.page || 1;
        let skip = (page - 1) * limit;

        let priceMin = req.query.priceMin;
        let priceMax = req.query.priceMax;

        let ageMin = req.query.ageMin;
        let ageMax = req.query.ageMax;

        let workId = req.query.workId;

        let gender = req.query.gender;

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

        if (ageMin || ageMax) {
            let query = {};

            if (ageMin) {
                query['$gte'] = parseFloat(ageMin);
            }

            if (ageMax) {
                query['$lte'] = parseFloat(ageMax);
            }

            matchQuery['info.age'] = query;
        }

        if (priceMin || priceMax) {
            let query = {};

            if (priceMin) {
                query['$gte'] = parseFloat(priceMin);
            }

            if (priceMax) {
                query['$lte'] = parseFloat(priceMax);
            }

            matchQuery['work_info.price'] = query;
        }

        if (workId) {
            matchQuery['work_info.ability.work'] = workId;
        }

        if (gender) {
            matchQuery['info.gender'] = parseFloat(gender);
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
                $sort: sortQuery
            },
            {
                $skip: skip
            },
            {
                $project: {
                    info: 1,
                    work_info: 1
                }
            }
        ], (error, places) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Work.populate(places, { path: 'work_info.ability', select: 'name image' }, (error, data) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0, data);
                    });
                }
            }
        });
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
 */
router.route('/getTaskAround').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 5;
        if (maxDistance == 0) { maxDistance = 0.001 }

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

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
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            status: true
        };

        Task.aggregate([
            {
                $geoNear: {
                    near: loc,
                    distanceField: 'dist.calculated',
                    minDistance: parseFloat(minDistance),
                    maxDistance: parseFloat(maxDistance) * 1000,
                    // maxDistance: (maxDistance / 111.12),
                    // num: limit,
                    // distanceMultiplier: 0.001,
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
        ], (error, places) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Work.populate(places, { path: '_id', select: 'name image' }, (error, data) => {
                        return msg.msgReturn(res, 0, data);
                    });
                }
            }
        });
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
router.route('/getTaskByWork').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 1;
        var maxDistance = req.query.maxDistance || 5;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var title = req.query.title;
        var package = req.query.package;
        var work = req.query.work;

        var sortBy = req.query.sortBy || "distance"; //distance & price
        var sortType = req.query.sortType || "asc"; //asc & desc

        var sortQuery = {};

        if (maxDistance == 0) { maxDistance = 0.001 }

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
                parseFloat(req.query.lng) || 0,
                parseFloat(req.query.lat) || 0
            ]
        };

        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            status: true
        };

        if (package) {
            matchQuery['info.package'] = new ObjectId(package);
        }

        if (work) {
            matchQuery['info.work'] = new ObjectId(work);
        }

        if (title) {
            matchQuery['info.title'] = new RegExp(title, 'i');
        }

        Task.aggregate([
            {
                $geoNear: {
                    near: loc,
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
            // {
            //     $limit: parseFloat(limit)
            // },
            // {
            //     $skip: skip
            // },
            {
                $project: {
                    process: 1,
                    history: 1,
                    stakeholders: 1,
                    info: 1,
                    dist: 1
                }
            }
        ], (error, places) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4, {});
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
                                        result = []
                                        for (i = skip; i < skip + parseFloat(limit); i++) {
                                            if (!data[i] || data[i] == null) break
                                            result.push(data[i])
                                        }

                                        let d = {
                                            docs: result,
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

router.route('/getTerm').get((req, res) => {
    try {
        var language = req.cookies.language;
        Term.setDefaultLanguage(language);

        var id = req.query.id;

        Term.find({ _id: id }).select('name content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data[0]);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getGV24HInfo').get((req, res) => {
    try {
        var language = req.cookies.language;
        Term.setDefaultLanguage(language);

        var id = req.query.id;

        Term.find({ _id: id }).select('name content').exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    return msg.msgReturn(res, 0, data[0]);
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/updateAbility').post((req, res) => {
    try {
        let ab = req.body.ab;
        let maid = new Maid();

        let id = '5923c12f7d7da13b240e7322'

        if (ab) {
            ab.forEach(item => {
                maid.work_info.ability.push(item)
            })
        }

        Maid.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    'work_info.ability': maid.work_info.ability
                }
            },
            {
                upsert: true
            },
            (error) => {
                return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0)
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/getMaidInfo').get((req, res) => {
    try {
        let id = '5923c12f7d7da13b240e7322'

        Maid
            // .find({ status: true })
            .findOne({ _id: id, status: true })
            .populate({ path: 'work_info.ability', select: 'name image' })
            .select('info work_info')
            .exec((error, data) => {
                if (error) return msg.msgReturn(res, 3)
                else {
                    // Work.populate(data, { path: 'work_info.ability', select: 'name image' }, (error, data) => {
                    //     return validate.isNullorEmpty(data) ? msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data)
                    // })
                    return validate.isNullorEmpty(data) ? msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data)
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/createAppInfo').post((req, res) => {
    try {
        var app = new AppInfo();

        var language = req.cookies.language;
        AppInfo.setDefaultLanguage(language);

        var name = req.body.name;
        var address = req.body.address;
        var phone = req.body.phone;
        var note = req.body.note;
        var email = req.body.email;

        app.phone = phone;
        app.email = email;
        app.status = true;
        app.history.createAt = new Date();
        app.history.updateAt = new Date();

        app.set('name.all', {
            en: name,
            vi: name
        });

        app.set('address.all', {
            en: address,
            vi: address
        });

        app.set('note.all', {
            en: note,
            vi: note
        });

        app.save((error) => {
            return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0)
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/getContact').get((req, res) => {
    try {
        AppInfo.findOne({ _id: '000000000000000000000001', status: true })
            .select('-status -history -__v').exec((error, data) => {
                return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0, data)
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/test1').get((req, res) => {
    try {

    } catch (error) {
        console.log(error)
    }
})

module.exports = router;