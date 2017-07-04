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

var as = require('../_services/app.service');
var AppService = new as.App();

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
var ObjectId = require('mongoose').Types.ObjectId;

router.use(function(req, res, next) {
    console.log('more_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        } else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/resetPassword').post((req, res) => {
    try {
        var newPw = AppService.randomString(7);
        var hashPw = AppService.hashString(newPw);

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
                    Owner.findOneAndUpdate({
                            'info.username': username,
                            'info.email': email
                        }, {
                            $set: {
                                'auth.password': hashPw
                            }
                        }, {
                            upsert: true
                        },
                        (error) => {
                            if (error) {
                                return msg.msgReturn(res, 3);
                            } else {
                                return mailService.resetPassword(email, newPw, res);

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

router.route('/getAllMaids').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
        var maxDistance = req.query.maxDistance || 2;
        var limit = req.query.limit || 20;
        var page = req.query.page || 1;
        var skip = (page - 1) * limit;

        var priceMin = req.query.priceMin;
        var priceMax = req.query.priceMax;

        var ageMin = req.query.ageMin;
        var ageMax = req.query.ageMax;

        var workId = req.query.workId;

        var gender = req.query.gender;

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
            var query = {};

            if (ageMin) {
                query['$gte'] = parseFloat(ageMin);
            }

            if (ageMax) {
                query['$lte'] = parseFloat(ageMax);
            }

            matchQuery['info.age'] = query;
        }

        if (priceMin || priceMax) {
            var query = {};

            if (priceMin) {
                query['$gte'] = parseFloat(priceMin);
            }

            if (priceMax) {
                query['$lte'] = parseFloat(priceMax);
            }

            matchQuery['work_info.price'] = query;
        }

        if (workId) {
            matchQuery['work_info.ability'] = new ObjectId(workId);
        }

        if (gender) {
            matchQuery['info.gender'] = parseFloat(gender);
        }

        Maid.aggregate([{
                $geoNear: {
                    near: loc,
                    distanceField: 'dist.calculated',
                    minDistance: parseFloat(minDistance),
                    maxDistance: parseFloat(maxDistance) * 1000,
                    // num: limit,
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
            //     $skip: skip
            // },
            {
                $project: {
                    info: 1,
                    work_info: 1
                }
            }
        ], (error, places) => {
            // console.log(places)
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(places)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Work.populate(places, { path: 'work_info.ability', select: 'name image' }, (error, data) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0, data);
                        // else {
                        //     result = []
                        //     for (i = skip; i < skip + parseFloat(limit); i++) {
                        //         if (!data[i] || data[i] == null) break
                        //         result.push(data[i])
                        //     }

                        //     var d = {
                        //         docs: result,
                        //         total: data.length,
                        //         limit: limit,
                        //         page: page,
                        //         pages: Math.ceil(data.length / limit)
                        //     }
                        //     return msg.msgReturn(res, 0, d);
                        // }
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

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

        var now = new Date();
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
            status: true
        };

        Task.aggregate([{
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

router.route('/getTaskByWork').get((req, res) => {
    try {
        var minDistance = req.query.minDistance || 0;
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

        // if (maxDistance == 0) { maxDistance = 0.001 }

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

        var now = new Date()
        var matchQuery = {
            process: new ObjectId('000000000000000000000001'),
            'info.time.startAt': {
                $gt: now
            },
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

        Task.aggregate([{
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

                                        var d = {
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

router.route('/maidForgotPassword').post((req, res) => {

    try {
        var username = req.body.username;
        var email = req.body.email;
        var verifyToken = AppService.getVerifyToken();

        Maid.findOne({ 'info.username': username, 'info.email': email, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3)
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4)
                } else {
                    Session.findOneAndUpdate({
                            'auth.userId': data._id,
                            status: true
                        }, {
                            $set: {
                                verification: {
                                    password: {
                                        key: verifyToken,
                                        date: new Date()
                                    }
                                }
                            }
                        }, {
                            upsert: true
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3)
                            return mailService.sendMail(res, data, verifyToken);
                        }
                    )
                }
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/ownerForgotPassword').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;
        var verifyToken = AppService.getVerifyToken();

        Owner.findOne({ 'info.username': username, 'info.email': email, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3)
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4)
                } else {
                    Session.findOneAndUpdate({
                            'auth.userId': data._id,
                            status: true
                        }, {
                            $set: {
                                verification: {
                                    password: {
                                        key: verifyToken,
                                        date: new Date()
                                    }
                                }
                            }
                        }, {
                            upsert: true
                        },
                        (error) => {
                            if (error) return msg.msgReturn(res, 3)
                            return mailService.sendMail(res, data, verifyToken);
                        }
                    )
                }
            }
        })
    } catch (error) {
        console.log(error)
        return msg.msgReturn(res, 3)
    }
})

// router.route('/updateAbility').post((req, res) => {
//     try {
//         var ab = req.body.ab;
//         var maid = new Maid();

//         var id = '5923c12f7d7da13b240e7322'

//         if (ab) {
//             ab.forEach(item => {
//                 maid.work_info.ability.push(item)
//             })
//         }

//         Maid.findOneAndUpdate({
//             _id: id,
//             status: true
//         }, {
//                 $set: {
//                     'work_info.ability': maid.work_info.ability
//                 }
//             }, {
//                 upsert: true
//             },
//             (error) => {
//                 return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0)
//             }
//         )
//     } catch (error) {
//         return msg.msgReturn(res, 3)
//     }
// })

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

module.exports = router;