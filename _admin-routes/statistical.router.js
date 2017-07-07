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

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Report = require('../_model/report');
var Bill = require('../_model/bill');

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

router.use(multipartMiddleware);

router.use(function (req, res, next) {
    console.log('report_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/admin/') + 7, baseUrl.lastIndexOf('/'));

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

router.route('/all').get((req, res) => {
    try {
        var startAt = req.query.startAt;
        var endAt = req.query.endAt;

        var matchQuery = { status: true }

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

            matchQuery['date'] = timeQuery;
        }

        Bill.aggregate(
            [
                {
                    $match: matchQuery
                },
                {
                    $group: {
                        _id: '$maid',
                        taskNumber: {
                            $sum: 1
                        },
                        price: {
                            $sum: '$price'
                        }
                    }
                }
            ], (error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                }
                else if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                }
                else {
                    var totalPrice = 0;
                    data.map(a => {
                        totalPrice += a.price
                    });

                    var d = {
                        data: data,
                        totalPrice: totalPrice
                    }

                    return msg.msgReturn(res, 0, d);
                }
            }
        )
    } catch (error) {

    }
});

module.exports = router;