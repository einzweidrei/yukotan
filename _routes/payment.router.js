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
        var language = baseUrl.substring(baseUrl.indexOf('/') + 1, baseUrl.lastIndexOf('/'));

        if (lnService.isValidLanguage(language)) {
            req.cookies['language'] = language;
            Package.setDefaultLanguage(language);
            Work.setDefaultLanguage(language);
            Process.setDefaultLanguage(language);

            if (req.headers.hbbgvauth) {
                let token = req.headers.hbbgvauth;
                Session.findOne({ 'auth.token': token }).exec((error, data) => {
                    if (error) {
                        return msg.msgReturn(res, 3);
                    } else {
                        if (validate.isNullorEmpty(data)) {
                            return msg.msgReturn(res, 14);
                        } else {
                            req.cookies['userId'] = data.auth.userId;
                            next();
                        }
                    }
                });
            } else {
                return msg.msgReturn(res, 14);
            }
            // next();
        }
        else {
            return msg.msgReturn(res, 6);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/payBillGV').post((req, res) => {
    try {
        // var userId1 = req.body.userId;
        var userId2 = req.cookies.userId;
        var billId = req.body.billId;

        // if (userId1 != userId2) return msg.msgReturn(res, 3);

        async.parallel({
            bill: function (callback) {
                Bill.findOne({ _id: billId, owner: userId2, isSolved: false, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, { value: 2 });
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, { value: 1 });
                        } else {
                            callback(null, { value: 0, data: data });
                        }
                    }
                });
            },
            owner: function (callback) {
                Owner.findOne({ _id: userId2, status: true }).exec((error, data) => {
                    if (error) {
                        callback(null, { value: 2 });
                    }
                    else {
                        if (validate.isNullorEmpty(data)) {
                            callback(null, { value: 1 });
                        } else {
                            callback(null, { value: 0, data: data });
                        }
                    }
                });
            },
        }, (error, result) => {
            console.log(result)
            if (error) return msg.msgReturn(res, 3);
            else {
                if (result.bill.value == 0 && result.owner.value == 0) {
                    var bill = result.bill.data;
                    var owner = result.owner.data;

                    var ownerWallet = owner.wallet;
                    var billWallet = bill.price;

                    if (ownerWallet < billWallet) return msg.msgReturn(res, 18);
                    else {
                        Bill.findOneAndUpdate(
                            { _id: billId, owner: userId2, isSolved: false, status: true },
                            {
                                $set: {
                                    method: 1,
                                    isSolved: true,
                                    date: new Date()
                                }
                            },
                            {
                                upsert: true
                            },
                            (error) => {
                                if (error) return msg.msgReturn(res, 3);
                                else {
                                    var newWallet = ownerWallet - billWallet;
                                    Owner.findOneAndUpdate(
                                        { _id: userId2, status: true },
                                        { $set: { wallet: newWallet } },
                                        (error, m) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            return msg.msgReturn(res, 0);
                                        }
                                    )
                                }
                            }
                        )
                    }
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/payDirectly').post((req, res) => {
    try {
        var userId2 = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOne({ _id: billId, owner: userId2, isSolved: false, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            }
            else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Maid.findOne({ _id: data.maidId, status: true }).select('auth').exec((error, maid) => {
                        if (error) return msg.msgReturn(res, 3);
                        else {
                            if (validate.isNullorEmpty(maid)) {
                                return msg.msgReturn(res, 4);
                            } else {
                                Bill.findOneAndUpdate(
                                    { _id: billId, owner: userId2, isSolved: false, status: true },
                                    {
                                        $set: {
                                            method: 3
                                        }
                                    },
                                    {
                                        upsert: true
                                    },
                                    (error) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        else {
                                            return maid.auth.device_token == '' ?
                                                msg.msgReturn(res, 17) :
                                                FCMService.pushNotification(res, maid, req.cookies.language, 9, [])
                                        }
                                    }
                                )
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

module.exports = router;
