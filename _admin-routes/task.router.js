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
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

            // if (req.headers.hbbgvauth) {
            //     var token = req.headers.hbbgvauth;
            //     Session.findOne({ 'auth.token': token }).exec((error, data) => {
            //         if (error) {
            //             return msg.msgReturn(res, 3);
            //         } else {
            //             if (validate.isNullorEmpty(data)) {
            //                 return msg.msgReturn(res, 14);
            //             } else {
            //                 console.log(data)
            //                 req.cookies['userId'] = data.auth.userId;
            //                 // req.cookies['deviceToken'] = "d97ocXsgXC4:APA91bGQcYODiUMjGG9ysByxG_v8J_B9Ce4rVznRXGb3ArAMv-7Q-CCyEYvoIQ-i4hVl9Yl7tdNzRF9zfxh75iS4El6w7GDuzAKYELw9XG9L5RgAJUmVysxs7s7o_20QQXNhyCJnShj0";
            //                 next();
            //             }
            //         }
            //     });
            // } else {
            //     return msg.msgReturn(res, 14);
            // }
            next();
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
        var page = req.query.page || 1;
        var limit = req.query.limit || 10;
        var title = req.query.title;
        var process = req.query.process;
        var package = req.query.package;
        var work = req.query.work;
        var sort = req.query.sort || 'asc';

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

        var searchQuery = {
            status: true
        }

        if (title) searchQuery['info.title'] = new RegExp(title, 'i');
        if (process) searchQuery['process'] = process;
        if (package) searchQuery['info.package'] = package;
        if (work) searchQuery['info.work'] = work;

        var sortQuery = {}
        sort == 'desc' ? sortQuery['history.createAt'] = -1 : sortQuery['history.createAt'] = -1

        var options = {
            select: 'info process history',
            populate: populateQuery,
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Task.paginate(searchQuery, options)
            .then((data) => {
                return validate.isNullorEmpty(data) ?
                    msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data);
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

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

        Task.findOne({ _id: id, status: true })
            .select('-location -status -__v')
            .populate(populateQuery)
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Work.populate(data, { path: 'stakeholders.received.work_info.ability', select: 'name image' }, (error, result) => {
                            if (error) return msg.msgReturn(res, 3)
                            return msg.msgReturn(res, 0, result)
                        })
                    }
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/create').post(multipartMiddleware, (req, res) => {
    try {
        var username = req.body.username;
        var title = req.body.title || "";
        var package = req.body.package;
        var work = req.body.work;
        var hour = req.body.hour || 0;
        var description = req.body.description || "";
        var price = req.body.price || 0;
        var addressName = req.body.addressName || "";
        var lat = req.body.lat || 0;
        var lng = req.body.lng || 0;
        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var tools = req.body.tools || false;

        Owner.findOne({ 'info.username': username, status: true })
            .select('info')
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        var task = new Task();

                        task.info = {
                            title: title,
                            package: package,
                            work: work,
                            description: description,
                            price: price,
                            address: {
                                name: addressName,
                                coordinates: {
                                    lat: lat,
                                    lng: lng
                                }
                            },
                            time: {
                                startAt: new Date(startAt),
                                endAt: new Date(endAt),
                                hour: hour
                            },
                            tools: tools
                        };

                        task.stakeholders = {
                            owner: data._id,
                            request: [],
                            received: {}
                        };

                        task.process = new ObjectId('000000000000000000000001');

                        task.location = {
                            type: 'Point',
                            coordinates: [
                                lng,
                                lat
                            ]
                        };

                        task.history = {
                            createAt: new Date(),
                            updateAt: new Date()
                        };

                        task.status = true;

                        task.save((error) => {
                            if (error) {
                                return msg.msgReturn(res, 3)
                            }
                            return msg.msgReturn(res, 0);
                        })
                    }
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/update').post(multipartMiddleware, (req, res) => {
    try {
        var id = req.body.id;

        var title = req.body.title || "";
        var package = req.body.package;
        var work = req.body.work;
        var hour = req.body.hour || 0;
        var description = req.body.description || "";
        var price = req.body.price || 0;
        var addressName = req.body.addressName || "";
        var lat = req.body.lat || 0;
        var lng = req.body.lng || 0;
        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var tools = req.body.tools || false;

        var info = {
            title: title,
            package: package,
            work: work,
            description: description,
            price: price || 0,
            address: {
                name: addressName,
                coordinates: {
                    lat: lat,
                    lng: lng
                }
            },
            time: {
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                hour: hour
            },
            tools: tools
        };

        var location = {
            type: 'Point',
            coordinates: [
                lng,
                lat
            ]
        };

        Task.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    info: info,
                    location: location,
                    'history.updateAt': new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else {
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

router.route('/delete').post((req, res) => {
    try {
        var id = req.body.id;

        Task.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    status: false
                }
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

router.route('/getAllDeletedTasks').get((req, res) => {
    try {
        var page = req.query.page || 1;
        var limit = req.query.limit || 10;
        var title = req.query.title;
        var process = req.query.process;
        var package = req.query.package;
        var work = req.query.work;
        var sort = req.query.sort || 'asc';

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

        var searchQuery = {
            status: false
        }

        if (title) searchQuery['info.title'] = new RegExp(title, 'i');
        if (process) searchQuery['process'] = process;
        if (package) searchQuery['info.package'] = package;
        if (work) searchQuery['info.work'] = work;

        var sortQuery = {}
        sort == 'desc' ? sortQuery['history.createAt'] = -1 : sortQuery['history.createAt'] = -1

        var options = {
            select: 'info process history',
            populate: populateQuery,
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Task.paginate(searchQuery, options)
            .then((data) => {
                return validate.isNullorEmpty(data) ?
                    msg.msgReturn(res, 4) : msg.msgReturn(res, 0, data);
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/removeById').post((req, res) => {
    try {
        var id = req.body.id;

        Task.findByIdAndRemove({ _id: id, status: false }, (error, data) => {
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/removeAll').post((req, res) => {
    try {
        Task.remove({ status: false }, (error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;
