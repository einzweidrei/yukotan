var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var logsService = require('../_services/log.service');
var logs = new logsService.Logs();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');

var ObjectId = require('mongoose').Types.ObjectId;

var bodyparser = require('body-parser');

var cloudinary = require('cloudinary');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

// var logger = log4js.getLogger('logs/logs-' + new Date().getUTCDate() + new Date().getUTCMonth() + new Date().getUTCFullYear() + '.log');
// router.use(bodyparser.json({
//     limit: '50mb',
// }));

const hash_key = 'LULULUL';
// const hash_key = 'HBBSolution';
const token_length = 64;

function hash(content) {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', hash_key)
        .update(content)
        .digest('hex');
    return hash;
}

function getToken() {
    var crypto = require('crypto');
    var token = crypto.randomBytes(token_length).toString('hex');
    return token;
}

router.use(multipartMiddleware);

/** Middle Ware
 * 
 */
router.use(function (req, res, next) {
    console.log('cms-owner_router is connecting');
    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));
        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

            next();
            // if (req.headers.hbbgvauth) {
            //     var token = req.headers.hbbgvauth;
            //     Session.findOne({ 'auth.token': token }).exec((error, data) => {
            //         if (error) {
            //             return msg.msgReturn(res, 3);
            //         } else {
            //             if (validate.isNullorEmpty(data)) {
            //                 return msg.msgReturn(res, 14);
            //             } else {
            //                 req.cookies['userId'] = data.auth.userId;
            //                 next();
            //             }
            //         }
            //     });
            // } else {
            //     return msg.msgReturn(res, 14);
            // }
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/getAll').get((req, res) => {
    try {
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var page = req.query.page || 1;
        var limit = req.query.limit || 10;
        var sort = req.query.sort || 'asc';

        var email = req.query.email;
        var username = req.query.username;
        var name = req.query.name;
        var gender = req.query.gender;

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
            select: 'evaluation_point info wallet history',
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Owner.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                return msg.msgReturn(res, 0, data);
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

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

        Owner.findOne({ _id: id, status: true })
            .select('evaluation_point info wallet history')
            .exec((error, data) => {
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
        var id = req.query.id;
        var process = req.query.process;

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var limit = req.query.limit || 10;
        var page = req.query.page || 1;
        var sort = req.query.sort || 'asc';

        var title = req.query.title;

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

        Task.paginate(findQuery, options).then((data) => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                Work.populate(data, { path: 'docs.stakeholders.received.work_info.ability', select: 'name image' }, (error, result) => {
                    if (error) return msg.msgReturn(res, 3)
                    return msg.msgReturn(res, 0, result)
                })
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/create').post((req, res) => {
    try {
        var owner = new Owner();

        owner.info = {
            username: req.body.username || '',
            email: req.body.email || '',
            phone: req.body.phone || '',
            name: req.body.name || '',
            image: req.body.image || '',
            age: req.body.age || 18,
            address: {
                name: req.body.addressName || '',
                coordinates: {
                    lat: req.body.lat || 0,
                    lng: req.body.lng || 0
                }
            },
            gender: req.body.gender || 0,
        };

        owner.evaluation_point = 2.5;

        owner.wallet = 0;

        owner.auth = {
            password: hash(req.body.password),
            device_token: req.body.device_token || ''
        };

        owner.history = {
            createAt: new Date(),
            updateAt: new Date()
        };

        owner.status = true;

        owner.location = {
            type: 'Point',
            coordinates: [req.body.lng || 0, req.body.lat || 0]
        };

        Owner.findOne({ 'info.username': req.body.username }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            } else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    owner.save((error, data) => {
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            var session = new Session();
                            session.auth.userId = data._id;
                            session.auth.token = getToken();
                            session.loginAt = new Date();
                            session.status = true;

                            session.save((error) => {
                                if (error) {
                                    return msg.msgReturn(res, 3);
                                } else {
                                    var dt = {
                                        token: session.auth.token,
                                        user: {
                                            _id: data._id,
                                            info: data.info,
                                            evaluation_point: data.evaluation_point,
                                            wallet: data.wallet
                                        }
                                    };
                                    return msg.msgReturn(res, 0, dt);
                                }
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/update').post((req, res) => {
    try {
        var id = req.body.id;

        var phone = req.body.phone || "";
        var name = req.body.name || "";
        var age = req.body.age || 18;
        var image = req.body.image || '';
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
                    'info.image': image,
                    location: location,
                    'history.updateAt': new Date()
                }
            },
            (error) => {
                if (error) return msg.msgReturn(res, 3);
                else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        return msg.msgReturn(res, 0);
                    }
                }
            }
        );
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/delete').post((req, res) => {
    try {
        var id = req.body.id;

        Owner.findOneAndUpdate(
            {
                _id: id,
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
                else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        return msg.msgReturn(res, 0);
                    }
                }

            }
        );
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

router.route('/deleteComment').post((req, res) => {
    try {
        var id = req.body.id;

        Comment.findByIdAndRemove(
            {
                _id: id,
                status: true
            },
            (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        return msg.msgReturn(res, 0);
                    }
                }
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;