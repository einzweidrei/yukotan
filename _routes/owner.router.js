var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var messageService = require('../_services/message.service');
var msg = messageService.Message;
var msgRep = new messageService.Message();

var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();

var languageService = require('../_services/language.service');
var lnService = new languageService.Language();

var Owner = require('../_model/owner');
var Session = require('../_model/session');

router.use(function (req, res, next) {
    console.log('owner_router is connecting');

    try {
        var baseUrl = req.baseUrl;
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            next();
        }
        else {
            return res.status(200).send(msgRep.msgData(false, msg.msg_language_not_support));
        }
    } catch (error) {
        return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
    }
});

router.route('/getById').get((req, res) => {
    var id = req.query.id;

    Owner.findOne({ _id: id }, { 'info.password': 0, '__v': 0 }).exec((error, data) => {
        if (validate.isNullorEmpty(data)) {
            return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
        } else {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                return res.status(200).send(msgRep.msgData(true, msg.msg_success, data));
            }
        }
    })
});

router.route('/getAround').get((req, res) => {
    var id = req.query.id;
    var minDistance = req.query.minDistance;
    var maxDistance = req.query.maxDistance;
    var limit = req.query.limit;
    var page = req.query.page;
    var skip = 0;

    if (!minDistance) minDistance = 1;
    if (!maxDistance) maxDistance = 2000;
    if (!limit) limit = 20;
    if (!page) page = 1;

    skip = (page - 1) * limit;

    Owner.findOne({ _id: id }).exec((error, data) => {
        if (validate.isNullorEmpty(data)) {
            return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
        } else {
            if (error) {
                return res.status(500).send(msgRep.msgData(false, msg.msg_failed));
            } else {
                var userLoc = data.info.address.location;

                Owner.aggregate([
                    {
                        $geoNear: {
                            near: userLoc,
                            distanceField: 'dist.calculated',
                            minDistance: minDistance,
                            maxDistance: maxDistance,
                            num: limit,
                            spherical: true
                        }
                    },
                    {
                        $sort: {
                            'dist.calculated': 1
                        }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $project: {
                            info: {
                                password: 0,
                                address: {
                                    location: 0
                                }
                            },
                            __v: 0
                        }
                    }
                ], (error, places) => {
                    if (validate.isNullorEmpty(places)) {
                        return res.status(200).send(msgRep.msgData(false, msg.msg_data_not_exist));
                    } else {
                        return res.status(200).send(msgRep.msgData(true, msg.msg_success, places));
                    }
                })
            }
        }
    })
});

module.exports = router;