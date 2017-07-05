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
var Bill = require('../_model/bill');


var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('giftcode_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            GiftCode.setDefaultLanguage(language);
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

        var isSolved = req.query.isSolved;

        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        var sort = req.query.sort || 'asc'; // asc | desc

        var findQuery = {
            status: true
        }

        if (count) findQuery['isSolved'] = isSolved;

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
        sort == 'asc' ? sortQuery['createAt'] = 1 : sortQuery['createAt'] = -1

        var options = {
            select: '-status -__v',
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Bill.paginate(findQuery, options).then((data) => {
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

        Bill.findOne({ _id: id, status: true }).select('-status -__v').exec((error, data) => {
            if (error) return msg.msgReturn(res, 3);
            else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
            return msg.msgReturn(res, 0, data);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/update').post((req, res) => {
    try {
        var id = req.body.id;
        var isSolved = req.body.isSolved;
        var method = req.body.method || 1;

        Bill.findOneAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    isSolved: isSolved,
                    method: method,
                    date: new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3)
    }
});

router.route('/delete').post((req, res) => {
    try {
        var id = req.body.id;

        Bill.findOneAndUpdate(
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