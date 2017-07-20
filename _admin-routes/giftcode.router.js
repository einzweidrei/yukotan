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

var FCM = require('../_services/fcm.service');
var FCMService = new FCM.FCMService();

var Mail = require('../_services/mail.service');
var MailService = new Mail.MailService();

var as = require('../_services/app.service');
var AppService = new as.App();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Comment = require('../_model/comment');
var GiftCode = require('../_model/giftcode');


var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function(req, res, next) {
    console.log('giftcode_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            GiftCode.setDefaultLanguage(language);
            next();
        } else {
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

        var name = req.query.code;
        var valueMin = req.query.valueMin;
        var valueMax = req.query.valueMax;

        var limitStartAt = req.query.limitStartAt;
        var limitEndAt = req.query.limitEndAt;

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;
        var count = req.query.count;

        var sort = req.query.sort || 'asc'; // asc | desc

        var findQuery = {
            status: true
        }

        if (name) findQuery['info.name'] = new RegExp(name, 'i');
        if (valueMin || valueMax) {
            var valueQuery = {};

            if (valueMin) {
                valueQuery['$gte'] = valueMin;
            }

            if (valueMax) {
                valueQuery['$lte'] = valueMax;
            }

            findQuery['info.value'] = valueQuery;
        }

        if (limitStartAt) findQuery['limit.startAt'] = { $gte: new Date(startAt) }
        if (limitEndAt) findQuery['limit.endAt'] = { $lte: new Date(endAt) }

        if (count) findQuery['limit.count'] = count;

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

        var sortQuery = {}
        sort == 'asc' ? sortQuery['history.createAt'] = 1 : sortQuery['history.createAt'] = -1

        var options = {
            select: '-status -__v',
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        GiftCode.paginate(findQuery, options).then((data) => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                return msg.msgReturn(res, 0, data);
            }
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        GiftCode.findOne({ _id: id, status: true }, (error, data) => {
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/create').post((req, res) => {
    try {
        var name = req.body.code || '';
        var value = req.body.value || 0;
        var descriptionVi = req.body.descriptionVi || '';
        var descriptionEn = req.body.descriptionEn || '';

        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var count = req.body.count || 0;

        var giftcode = new GiftCode();
        giftcode.name = name;
        giftcode.value = value;

        giftcode.set('description.all', {
            en: descriptionEn,
            vi: descriptionVi
        });

        giftcode.limit = {
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            count: count
        };

        giftcode.history = {
            createAt: new Date(),
            updateAt: new Date()
        }

        giftcode.status = true

        giftcode.save((error) => {
            return error ? msg.msgReturn(res, 3) : msg.msgReturn(res, 0);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/update').post((req, res) => {
    try {
        var id = req.body.id;

        var name = req.body.code || '';
        var value = req.body.value || 0;
        var descriptionVi = req.body.descriptionVi || '';
        var descriptionEn = req.body.descriptionEn || '';

        var startAt = req.body.startAt || new Date();
        var endAt = req.body.endAt || new Date();
        var count = req.body.count || 0;

        GiftCode.findOneAndUpdate({
                _id: id,
                status: true
            }, {
                $set: {
                    name: name,
                    value: value,
                    description: {
                        vi: descriptionVi,
                        en: descriptionEn
                    },
                    'limit.startAt': new Date(startAt),
                    'limit.endAt': new Date(endAt),
                    'limit.count': count,
                    'history.updateAt': new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3)
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4)
                return msg.msgReturn(res, 0)
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

router.route('/delete').post((req, res) => {
    try {
        var id = req.query.id;

        GiftCode.findOneAndUpdate({
                _id: id,
                status: true
            }, {
                $set: {
                    status: false,
                    'history.updateAt': new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3)
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4)
                return msg.msgReturn(res, 0)
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
})

module.exports = router;