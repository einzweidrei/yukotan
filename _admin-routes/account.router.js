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

var as = require('../_services/app.service');
var AppService = new as.App();

var Account = require('../_model/account');
var Session = require('../_model/session');

var ObjectId = require('mongoose').Types.ObjectId;
var bodyparser = require('body-parser');
var cloudinary = require('cloudinary');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

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
            select: 'info history',
            sort: sortQuery,
            page: parseFloat(page),
            limit: parseFloat(limit)
        };

        Account.paginate(query, options).exec((data) => {
            return msg.msgReturn(res, 0, data);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/getById').get((req, res) => {
    try {
        var id = req.query.id;

        Account.findOne({ _id: id, status: true })
            .select('info history')
            .exec((error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else if (validate.isNullorEmpty(data)) return msg.msgReturn(res, 4);
                else return msg.msgReturn(res, 0, data);
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/create').post((req, res) => {
    try {
        var username = req.body.username;
        var email = req.body.email;

        var account = new Account();
        account.info = {
            username: username,
            email: email,
            name: req.body.name || '',
            phone: req.body.phone || '',
            image: req.body.image || '',
            address: req.body.address || '',
            gender: req.body.gender || 0
        }

        var p = req.body.password;
        var password = AppService.hashString(p);

        account.auth = {
            password: password
        }

        account.history = {
            createAt: new Date(),
            updateAt: new Date()
        }

        account.status = true

        Account
            .findOne({ $or: [{ 'info.username': req.body.username }, { 'info.email': req.body.email }] })
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else if (validate.isNullorEmpty(data)) {
                    account.save((error) => {
                        if (error) return msg.msgReturn(res, 3);
                        return msg.msgReturn(res, 0);
                    })
                } else {
                    return msg.msgReturn(res, 2);
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});


module.exports = router;