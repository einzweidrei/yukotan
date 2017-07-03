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

var as = require('../_services/app.service');
var AppService = new as.App();

var Owner = require('../_model/owner');
var Session = require('../_model/session');
var Package = require('../_model/package');
var Work = require('../_model/work');
var Task = require('../_model/task');
var Process = require('../_model/process');
var Maid = require('../_model/maid');
var Bill = require('../_model/bill');
var Comment = require('../_model/comment');
var BillCharge = require('../_model/bill_charge');
var cloudinary = require('cloudinary');
var ObjectId = require('mongoose').Types.ObjectId;

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
                var token = req.headers.hbbgvauth;
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
        var userId2 = req.cookies.userId;
        var billId = req.body.billId;

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
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOne({ _id: billId, owner: userId, isSolved: false, status: true }).exec((error, data) => {
            if (error) {
                return msg.msgReturn(res, 3);
            }
            else {
                if (validate.isNullorEmpty(data)) {
                    return msg.msgReturn(res, 4);
                } else {
                    Maid.findOne({ _id: data.maid, status: true }).select('info auth').exec((error, maid) => {
                        if (error) return msg.msgReturn(res, 3);
                        else {
                            if (validate.isNullorEmpty(maid)) {
                                return msg.msgReturn(res, 4);
                            } else {
                                Bill.findOneAndUpdate(
                                    { _id: billId, owner: userId, isSolved: false, status: true },
                                    {
                                        $set: {
                                            method: 3,
                                            date: new Date()
                                        }
                                    },
                                    (error) => {
                                        if (error) return msg.msgReturn(res, 3);
                                        else {
                                            return maid.auth.device_token == '' ?
                                                msg.msgReturn(res, 17) :
                                                FCMService.pushNotification(res, maid, req.cookies.language, 9, [], billId)
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

router.route('/getDirectlyBill').get((req, res) => {
    try {
        var id = req.query.id;
        var userId = req.cookies.userId;

        Bill.findOne({ _id: id, owner: userId, method: 3, isSolved: false, status: true })
            .select('task price')
            .exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3, {});
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4, {});
                    } else {
                        return msg.msgReturn(res, 0, data);
                    }
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3, {});
    }
})

router.route('/payDirectConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOneAndUpdate(
            { _id: billId, maid: userId, method: 3, isSolved: false, status: true },
            {
                $set: {
                    isSolved: true,
                    date: new Date()
                }
            },
            (error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Owner.findOne({ _id: data.owner, status: true }, (error, owner) => {
                            if (error) {
                                return msg.msgReturn(res, 17);
                            } else {
                                if (validate.isNullorEmpty(owner)) {
                                    return msg.msgReturn(res, 17);
                                } else {
                                    return owner.auth.device_token == '' ?
                                        msg.msgReturn(res, 17) :
                                        FCMService.pushNotification(res, owner, req.cookies.language, 10, [], '')
                                }
                            }
                        })
                    }
                }
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/cancelDirectConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOne({ _id: billId, maid: userId, method: 3, isSolved: false, status: true })
            .exec((error, data) => {
                if (error) return msg.msgReturn(res, 3);
                else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        Owner.findOne({ _id: data.owner, status: true }, (error, owner) => {
                            if (error) {
                                return msg.msgReturn(res, 17);
                            } else {
                                if (validate.isNullorEmpty(owner)) {
                                    return msg.msgReturn(res, 17);
                                } else {
                                    return owner.auth.device_token == '' ?
                                        msg.msgReturn(res, 17) :
                                        FCMService.pushNotification(res, owner, req.cookies.language, 11, [], '')
                                }
                            }
                        })
                    }
                }
            })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/payOnlineConfirm').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOneAndUpdate(
            { _id: billId, owner: userId, isSolved: false, status: true },
            {
                $set: {
                    method: 2
                }
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

router.route('/payOnline').post((req, res) => {
    try {
        var userId = req.cookies.userId;
        var billId = req.body.billId;

        Bill.findOneAndUpdate(
            { _id: billId, owner: userId, method: 2, isSolved: false, status: true },
            {
                $set: {
                    isSolved: true,
                    date: new Date()
                }
            },
            (error) => {
                if (error) return msg.msgReturn(res, 3);
                return msg.msgReturn(res, 0);
            }
        )
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
});

router.route('/chargeOnlineFiConfirm').post((req, res) => {
    try {
        var price = req.body.price || 0;
        var owner = req.cookies.userId;
        var newKey = AppService.getToken();

        var billCharge = new BillCharge();
        billCharge.price = price;
        billCharge.owner = owner;
        billCharge.isSolved = false;
        billCharge.date = new Date();
        billCharge.createAt = new Date();
        billCharge.verify = {
            key: newKey,
            date: new Date()
        }
        billCharge.status = true;

        var d = {
            bill: billCharge._id,
            key: newKey
        }

        billCharge.save((error) => {
            if (error) return msg.msgReturn(res, 3);
            return msg.msgReturn(res, 0, d);
        })
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/chargeOnlineSecConfirm').post((req, res) => {
    try {
        if (req.headers.hbbgv_accesskey) {
            var key = req.headers.hbbgv_accesskey;
            var owner = req.cookies.userId;
            var billId = req.body.billId;
            var newKey = AppService.getToken();

            var d = {
                key: newKey
            }

            BillCharge.findOne({ _id: billId, owner: owner, 'verify.key': key, isSolved: false, status: true }).exec((error, data) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    if (validate.isNullorEmpty(data)) {
                        return msg.msgReturn(res, 4);
                    } else {
                        BillCharge.findOneAndUpdate(
                            {
                                _id: billId,
                                owner: owner,
                                'verify.key': key,
                                isSolved: false,
                                status: true
                            },
                            {
                                $set: {
                                    verify: {
                                        key: newKey,
                                        date: new Date()
                                    }
                                }
                            },
                            {
                                upsert: true
                            },
                            (error) => {
                                if (error) return msg.msgReturn(res, 3);
                                return msg.msgReturn(res, 0, d);
                            }
                        )
                    }
                }
            })
        } else {
            return msg.msgReturn(res, 3);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

router.route('/chargeOnlineThiConfirm').post((req, res) => {
    try {
        if (req.headers.hbbgv_accesskey) {
            var key = req.headers.hbbgv_accesskey;
            var owner = req.cookies.userId;
            var billId = req.body.billId;

            Owner.findOne({ _id: owner, status: true }).select('wallet').exec((error, ow) => {
                if (error) {
                    return msg.msgReturn(res, 3);
                } else {
                    BillCharge.findOne({ _id: billId, owner: owner, 'verify.key': key, isSolved: false, status: true }).exec((error, data) => {
                        if (error) {
                            return msg.msgReturn(res, 3);
                        } else {
                            if (validate.isNullorEmpty(data)) {
                                return msg.msgReturn(res, 3);
                            } else {
                                var now = new Date();
                                var time = new Date(data.verify.date);
                                var diff = now - time;
                                var second = ~~(diff / 1e3)

                                if (second > 60) {
                                    return msg.msgReturn(res, 3);
                                } else {
                                    BillCharge.findOneAndUpdate(
                                        {
                                            owner: owner,
                                            'verify.key': key,
                                            isSolved: false,
                                            status: true
                                        },
                                        {
                                            $set: {
                                                isSolved: true
                                            }
                                        },
                                        {
                                            upsert: true
                                        },
                                        (error) => {
                                            if (error) return msg.msgReturn(res, 3);
                                            else {
                                                var p = ow.wallet + data.price;
                                                Owner.findOneAndUpdate(
                                                    {
                                                        _id: owner,
                                                        status: true
                                                    },
                                                    {
                                                        $set: {
                                                            wallet: p
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
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    })
                }
            })
        } else {
            return msg.msgReturn(res, 3);
        }
    } catch (error) {
        return msg.msgReturn(res, 3);
    }
})

module.exports = router;
