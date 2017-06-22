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

var cloudinary = require('cloudinary');
var bodyparser = require('body-parser');

// setting limit of FILE
router.use(bodyparser.urlencoded({
    extended: true
}));

// // parse application/json
router.use(bodyparser.json());

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

router.route('/get').get((req, res) => {
    try {
        var page = req.query.page || 1
        var limit = req.query.limit || 10
        var from = req.query.from

        let query = {
            status: true
        }

        if (from) query['from'] = from

        var populateQuery = [
            { path: 'ownerId', select: 'info' },
            { path: 'maidId', select: 'info' }
        ]

        let options = {
            select: '-status -__v',
            populate: populateQuery,
            sort: {
                'createAt': -1
            },
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Report.paginate(query, options).then((data) => {
            if (validate.isNullorEmpty(data)) {
                return msg.msgReturn(res, 4);
            } else {
                return msg.msgReturn(res, 0, data);
            }
        });
    } catch (error) {
        // console.log(error)
        return msg.msgReturn(res, 3);
    }
})

router.route('/delete').put((req, res) => {
    try {
        var id = req.query.id

        Report.findByIdAndUpdate(
            {
                _id: id,
                status: true
            },
            {
                $set: {
                    status: false,
                    updateAt: new Date()
                }
            },
            {
                upsert: true
            },
            (error) => {
                if (error) return msg.msgReturn(res, 3);
                return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;