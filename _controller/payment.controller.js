var mBill = require('../_model/bill');
var mOwner = require('../_model/owner');
var mMaid = require('../_model/maid');
var mTask = require('../_model/task');
var mBillCharge = require('../_model/bill_charge');
var async = require('promise-async');
var as = require('../_services/app.service');
var AppService = new as.App();
var FCM = require('../_services/fcm.service');
var FCMService = new FCM.FCMService();
var validationService = require('../_services/validation.service');
var validate = new validationService.Validation();
var messStatus = require('../_services/mess-status.service');
var ms = messStatus.MessageStatus;
var pushStatus = require('../_services/push-status.service');
var ps = pushStatus.PushStatus;

var Payment = (function () {
    function Payment() { }

    Payment.prototype.payByNGV247 = (userId, billId, callback) => {
        async.parallel({
            bill: function (callback) {
                mBill.findOne({ _id: billId, owner: userId, isSolved: false, status: true }).exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
            },
            owner: function (callback) {
                mOwner.findOne({ _id: userId, status: true }).exec((error, data) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else return callback(null, data);
                });
            },
        }, (error, result) => {
            if (error) return callback(error);
            else {
                var bill = result.bill;
                var owner = result.owner;
                var ownerWallet = owner.wallet;
                var billWallet = bill.price;
                if (ownerWallet < billWallet) return callback(ms.PAYMENT_FAILED);
                else {
                    mBill.findOneAndUpdate({
                        _id: billId,
                        owner: userId,
                        isSolved: false,
                        status: true
                    }, {
                            $set: {
                                method: 1,
                                isSolved: true,
                                date: new Date()
                            }
                        },
                        (error) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else {
                                var newWallet = ownerWallet - billWallet;
                                mOwner.findOneAndUpdate({
                                    _id: userId,
                                    status: true
                                }, {
                                        $set: {
                                            wallet: newWallet
                                        }
                                    },
                                    (error) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        else return callback(null, result);
                                    }
                                );
                            }
                        });
                }
            }
        });
    };

    Payment.prototype.payDirectly = (userId, billId, language, callback) => {
        mBill.findOne({ _id: billId, owner: userId, isSolved: false, status: true }).exec((error, data) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
            else {
                mMaid.findOne({ _id: data.maid, status: true }).select('info auth').exec((error, maid) => {
                    if (error) return callback(ms.EXCEPTION_FAILED);
                    else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                    else {
                        mBill.findOneAndUpdate({
                            _id: billId,
                            owner: userId,
                            isSolved: false,
                            status: true
                        }, {
                                $set: {
                                    method: 3,
                                    date: new Date()
                                }
                            }, (error, data) => {
                                if (error) return callback(ms.EXCEPTION_FAILED);
                                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                                else {
                                    FCMService.pushNotify(maid, language, ps.PAY_DIRECTLY, billId, (error, data) => {
                                        if (error) return callback(error);
                                        else return callback(null, data);
                                    });
                                }
                            });
                    }
                });
            }
        });
    };

    Payment.prototype.getDirectlyBill = (id, userId, callback) => {
        mBill
            .findOne({
                task: id,
                maid: userId,
                method: 3,
                isSolved: false,
                status: true
            })
            .select('_id')
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    Payment.prototype.payDirectConfirm = (userId, billId, language, callback) => {
        mBill.findOneAndUpdate({
            _id: billId,
            maid: userId,
            method: 3,
            isSolved: false,
            status: true
        }, {
                $set: {
                    isSolved: true,
                    date: new Date()
                }
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    mOwner.findOne({ _id: data.owner, status: true }, (error, owner) => {
                        if (error || validate.isNullorEmpty(owner)) return callback(ms.PUSH_NOTIFY_FAILED);
                        else {
                            FCMService.pushNotify(owner, language, ps.CONFIRM_DIRECT, '', (error, data) => {
                                if (error) return callback(error);
                                else return callback(null, data);
                            });
                        }
                    });
                }
            });
    };

    Payment.prototype.cancelDirectConfirm = (userId, billId, language, callback) => {
        mBill.findOne({
            _id: billId,
            maid: userId,
            method: 3,
            isSolved: false,
            status: true
        })
            .exec((error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    mOwner.findOne({ _id: data.owner, status: true }, (error, owner) => {
                        if (error || validate.isNullorEmpty(owner)) return callback(ms.PUSH_NOTIFY_FAILED);
                        else {
                            FCMService.pushNotify(owner, language, ps.CANCEL_DIRECT, '', (error, data) => {
                                if (error) return callback(error);
                                else return callback(null, data);
                            });
                        }
                    });
                }
            });
    };

    Payment.prototype.payOnlineConfirm = (userId, billId, callback) => {
        mBill.findOneAndUpdate({
            _id: billId,
            owner: userId,
            isSolved: false,
            status: true
        }, {
                $set: {
                    method: 2
                }
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    Payment.prototype.payOnline = (userId, billId, callback) => {
        mBill.findOneAndUpdate({
            _id: billId,
            owner: userId,
            method: 2,
            isSolved: false,
            status: true
        }, {
                $set: {
                    isSolved: true,
                    date: new Date()
                }
            },
            (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else return callback(null, data);
            });
    };

    Payment.prototype.chargeOnlineFirst = (ownerId, price, callback) => {
        var newKey = AppService.getToken();

        var billCharge = new mBillCharge();
        billCharge.price = price;
        billCharge.owner = ownerId;
        billCharge.isSolved = false;
        billCharge.date = new Date();
        billCharge.createAt = new Date();
        billCharge.verify = {
            key: newKey,
            date: new Date()
        };
        billCharge.status = true;

        var data = {
            bill: billCharge._id,
            key: newKey
        }

        billCharge.save((error) => {
            if (error) return callback(ms.EXCEPTION_FAILED);
            else return callback(null, data);
        });
    };

    Payment.prototype.chargeOnlineSecond = (ownerId, billId, key, callback) => {
        var newKey = AppService.getToken();
        mBillCharge.findOneAndUpdate({
            _id: billId,
            owner: ownerId,
            'verify.key': key,
            isSolved: false,
            status: true
        }, {
                $set: {
                    verify: {
                        key: newKey,
                        date: new Date()
                    }
                }
            }, (error, data) => {
                if (error) return callback(ms.EXCEPTION_FAILED);
                else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                else {
                    var d = {
                        key: newKey
                    }
                    return callback(null, d);
                }
            });
    };

    Payment.prototype.chargeOnlineThird = (ownerId, billId, key, callback) => {
        async.parallel({
            owner: function (callback) {
                mOwner
                    .findOne({ _id: ownerId, status: true })
                    .select('wallet')
                    .exec((error, ow) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(ow)) return callback(ms.DATA_NOT_EXIST);
                        else return callback(null, ow);
                    });
            },
            bill: function (callback) {
                mBillCharge
                    .findOne({
                        _id: billId,
                        owner: ownerId,
                        'verify.key': key,
                        isSolved: false,
                        status: true
                    }).exec((error, data) => {
                        if (error) return callback(ms.EXCEPTION_FAILED);
                        else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                        else return callback(null, data);
                    });
            }
        }, (error, result) => {
            if (error) return callback(error);
            else {
                var bill = result.bill;
                var owner = result.owner;

                var now = new Date();
                var time = new Date(bill.verify.date);
                var diff = now - time;
                var second = ~~(diff / 1e3);

                if (second > 60) {
                    return callback(ms.INVALID_KEY);
                } else {
                    mBillCharge.findOneAndUpdate({
                        owner: ownerId,
                        'verify.key': key,
                        isSolved: false,
                        status: true
                    }, {
                            $set: {
                                isSolved: true
                            }
                        }, (error, data) => {
                            if (error) return callback(ms.EXCEPTION_FAILED);
                            else if (validate.isNullorEmpty(data)) return callback(ms.DATA_NOT_EXIST);
                            else {
                                var p = owner.wallet + bill.price;
                                mOwner.findOneAndUpdate({
                                    _id: ownerId,
                                    status: true
                                }, {
                                        $set: {
                                            wallet: p
                                        }
                                    }, (error) => {
                                        if (error) return callback(ms.EXCEPTION_FAILED);
                                        else return callback(null, bill);
                                    });
                            }
                        });
                }
            }
        });
    };

    return Payment;
}());

exports.Payment = Payment;